// CONSTANTS ------------------------------------------------------------------

const DOM = {
	aside: document.querySelector('aside'),
	autocomplete: document.getElementById('autocomplete'),
	completeToggle: document.getElementById('complete-toggle'),
	contextsBtn: document.getElementById('contexts-btn'),
	contextsModal: document.getElementById('contexts-modal'),
	deleteError: document.getElementById('delete-error'),
	deleteForm: document.getElementById('delete-form'),
	deleteLists: document.getElementById('delete-lists'),
	deleteModal: document.getElementById('delete-modal'),
	editComplete: document.getElementById('edit-complete'),
	editContexts: document.getElementById('edit-contexts'),
	editDelete: document.getElementById('edit-delete'),
	editDescription: document.getElementById('edit-description'),
	editError: document.getElementById('edit-error'),
	editForm: document.getElementById('edit-form'),
	editId: document.getElementById('edit-id'),
	editPriority: document.getElementById('edit-priority'),
	editPriorityDefault: document.getElementById('edit-priority-default'),
	editProjects: document.getElementById('edit-projects'),
	editSubmit: document.getElementById('edit-submit'),
	editTitle: document.getElementById('edit-title'),
	groupBtn: document.getElementById('group-btn'),
	groupBtns: document.getElementById('group-btns'),
	groupClearBtn: document.getElementById('group-clear-btn'),
	listTitle: document.getElementById('list-title'),
	logo: document.getElementById('logo'),
	noList: document.getElementById('no-list'),
	projectsBtn: document.getElementById('projects-btn'),
	projectsModal: document.getElementById('projects-modal'),
	search: document.getElementById('search'),
	searchBtn: document.getElementById('search-btn'),
	settingsError: document.getElementById('settings-error'),
	settingsForm: document.getElementById('settings-form'),
	settingsLists: document.getElementById('settings-lists'),
	settingsListsAdd: document.getElementById('settings-lists-add'),
	settingsModal: document.getElementById('settings-modal'),
	settingsShowComplete: document.getElementById('settings-show-complete'),
	showAll: document.getElementById('show-all'),
	sortToggle: document.getElementById('sort-toggle'),
	taskList: document.getElementById('tasks')
};

const clearBtn = Object.assign(document.createElement('button'), {
	className: 'secondary',
	textContent: 'Clear',
	onclick: clearSearch,
});

const pb = new PocketBase();

// GLOBALS --------------------------------------------------------------------

const regex = {
	project: /\+[A-Za-z0-9_-]+/g,
	context: /@[A-Za-z0-9_-]+/g,
	projectSingle: /^\+[A-Za-z0-9_-]+$/,
	contextSingle: /^@[A-Za-z0-9_-]+$/,
};

let tasks = [];
let tags = { projects: [], contexts: [] };
let priorities = [];
let sortAscending = true;
let filterSearch = '';
let showComplete = false;
let filterProjects = [];
let filterContexts = [];
let group = 'none';
let settings = {};
let state = {
	authenticated: false,
	debug: false,
	loggedIn: false,
	newSettings: false
}

// HELPERS --------------------------------------------------------------------

const getDateString = (date) => {
	const d = new Date(date ? date : Date.now());
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

const toggleLoading = (show) => {
	document.querySelectorAll('.loading').forEach(el => el.classList.toggle('hide', !show));
};

const cleanString = (text) => text.trim().replace(/\s+/g, ' ');

function debug(name, message, ...args) {
	if (state.debug) console.log(`<<DEBUG>> [${name}]: ${message}`, ...args);
}

// LIST -----------------------------------------------------------------------

async function fetchTasks() {
	toggleLoading(true);
	try {
		const tasksResponse = await pb.collection('tasks').getFullList();
		tasks = tasksResponse.map(task => new Task(task.text, task.id));
		debug("fetchTasks", "Fetched tasks", tasks);
		renderTasks();
	} catch (error) {
		console.error('Error loading tasks:', error);
	} finally {
		toggleLoading(false);
	}
}

function parseTask(task) {
	const taskSub = task.priority ? `<a>(${task.priority})</a>` : '';
	const taskDates = [
		task.creationDate ? `<small><svg width="1em" height="1em"><use xlink:href="#icon-calendar"/></svg> ${getDateString(task.creationDate)}</small>` : '',
		task.completionDate ? `<small><ins><svg width="1em" height="1em"><use xlink:href="#icon-calendar-check"/></svg> ${getDateString(task.completionDate)}</ins></small>` : '',
	].join('');

	let taskDesc = task.raw_description.replace(regex.project, match =>
		task.projects.includes(match.slice(1))
			? `<a data-attribute="projects" data-name="${match.slice(1)}" onclick="selectAttribute(event)">${match}</a>`
			: match
	).replace(regex.context, match =>
		task.contexts.includes(match.slice(1))
			? `<a class="contrast" data-attribute="contexts" data-name="${match.slice(1)}" onclick="selectAttribute(event)">${match}</a>`
			: match
	);

	return `
		<input type="checkbox" ${task.isCompleted ? 'checked' : ''} data-id="${task.id}" onclick="completeTask(event)" />
		<hgroup class="pointer flex-grow" data-target="edit-modal" onclick="editTask('${task.id}'); toggleModal(event);">
			<h5 class="flex space-between ${task.isCompleted ? 'muted-color strike' : ''}">
				<span>${taskSub} ${taskDesc}</span>
			</h5>
			<p class="flex gap-xs align-center">${taskDates}</p>
		</hgroup>
		<svg class="show-hover" width="1em" height="1em"><use xlink:href="#icon-edit"/></svg>
	`;
}

function renderTasks() {
	debug("renderTasks", "Rendering tasks", tasks);
	// Update aside menu
	const listUl = DOM.aside?.querySelector('ul');
	if (listUl) {
		DOM.logo.classList.toggle('hide-sm', settings.lists?.length);
		DOM.logo.nextElementSibling.classList.toggle('hide', !settings.lists?.length);
		DOM.aside.classList.toggle('hide', !settings.lists?.length);
		while (listUl.children.length > 1) listUl.lastElementChild.remove();
		settings.lists?.forEach(list => {
			listUl.insertAdjacentHTML('beforeend', `
				<li><a id="list-${list.project}" class="contrast" href="#${list.project}" onclick="toggleAside()" data-title="${list.name}">${list.name}</a></li>
			`);
		});
	}

	// Populate project & context dropdowns
	tags.projects = [...new Set(tasks.flatMap(task => task.projects))].sort();
	tags.contexts = [...new Set(tasks.flatMap(task => task.contexts))].sort();
	priorities = [...new Set(tasks.flatMap(task => task.priority))].sort();
	const updateModal = (modal, btn, items, attribute, checkedItems) => {
		modal.querySelector('ul').innerHTML = items.length
			? items.map(item => `
				<li><label>
					<input type="checkbox" class="attribute-filter" data-attribute="${attribute}" name="${item}" ${checkedItems.includes(item) ? 'checked' : ''}/>
					${item}
				</label></li>
			`).join('')
			: '';
		btn.toggleAttribute('disabled', !items.length);
		btn.classList.toggle('secondary', !items.length);
	};
	updateModal(DOM.projectsModal, DOM.projectsBtn, tags.projects, 'projects', filterProjects);
	updateModal(DOM.contextsModal, DOM.contextsBtn, tags.contexts, 'contexts', filterContexts);

	// Filter and sort tasks
	const filteredTasks = tasks
		.filter(task => (
			(!filterSearch || task.raw_description.toLowerCase().includes(filterSearch.toLowerCase())) &&
			(showComplete ? true : !task.isCompleted) &&
			(!filterProjects.length || task.projects.some(p => filterProjects.includes(p))) &&
			(!filterContexts.length || task.contexts.some(c => filterContexts.includes(c)))
		))
		.sort((a, b) => {
			const valA = a.toString().toLowerCase();
			const valB = b.toString().toLowerCase();
			const dir = sortAscending ? 1 : -1
			return valA < valB ? -1 * dir : valA > valB ? 1 * dir : 0;
		})

	debug("renderTasks", "Filtered tasks", filteredTasks);
	for (let i = 0; i < filteredTasks.length; i++) {
		filteredTasks[i].html = `
			<li id="task-${filteredTasks[i].id}" class="flex align-center hover-background padding-xs show-hover-parent ${filteredTasks[i].projects.map(p => `project-${p}`).join(' ')} ${filteredTasks[i].contexts.map(c => `context-${c}`).join(' ')}">
				${parseTask(filteredTasks[i])}
			</li>
		`;
	}

	DOM.taskList.querySelector('ul').innerHTML = '';
	switch(group) {
		case 'project':
		case 'context':
			const prefix = group === 'project' ? '+' : '@';
			tags[group + 's'].forEach(tag => {
				DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>${prefix}${tag}</h5></li><li class="group"><hr></li>`;
				DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => task[group + 's'].includes(tag) ? task.html : '').join('');
			});
			break;
		case 'priority':
			priorities.forEach(priority => {
				if (priority) {
					DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>Priority '${priority}'</h5></li><li class="group"><hr></li>`;
					DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => task.priority === priority ? task.html : '').join('');
				}
			});
			break;
		default:
			// Render tasks
			DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => task.html).join('');
	}

	// Update showAll button visibility
	if (DOM.showAll) {
		DOM.showAll.classList.toggle('hide', !(filterSearch || filterProjects.length || filterContexts.length));
	}

	openList();
}

// FILTER ---------------------------------------------------------------------

function clearAttributeFilters() {
	filterProjects = [];
	filterContexts = [];
	DOM.projectsBtn.classList.add('outline');
	DOM.contextsBtn.classList.add('outline');
}

function clearAttributeInputs(event) {
	event.currentTarget.parentNode.parentNode.querySelectorAll('input')
		.forEach(i => i.checked = false);
}

function selectAttribute(event) {
	event.stopPropagation();
	event.preventDefault();
	const { attribute, name } = event.target.dataset;
	document.querySelectorAll('.attribute-filter').forEach(input => {
		input.checked = input.dataset.attribute === attribute && input.name === name;
	});
	filterAttribute();
}

function filterAttribute() {
	clearAttributeFilters();
	document.querySelectorAll('.attribute-filter').forEach(input => {
		if (input.checked) {
			const target = input.dataset.attribute === 'projects' ? filterProjects : filterContexts;
			target.push(input.name);
			DOM[input.dataset.attribute === 'projects' ? 'projectsBtn' : 'contextsBtn'].classList.remove('outline');
		}
	});
	renderTasks();
}

function clearSearch() {
	DOM.search.value = '';
	filterSearch = '';
	clearBtn.remove();
	renderTasks();
}

function clearFilters() {
	clearSearch();
	[DOM.projectsModal, DOM.contextsModal].forEach(modal => modal.querySelectorAll('input').forEach(i => i.checked = false));
	filterAttribute();
}

function toggleComplete(setComplete, render=true) {
	showComplete = setComplete;
	const newIcon = showComplete ? '#icon-eye-fill' : '#icon-eye';
	DOM.completeToggle.classList.toggle('outline', !showComplete);
	DOM.completeToggle.querySelector('use').setAttribute('xlink:href', newIcon);
	if (render) renderTasks();
}

if (DOM.search) {
	DOM.search.addEventListener('input', e => {
		filterSearch = e.target.value.trim();
		if (filterSearch) DOM.search.parentElement.appendChild(clearBtn);
		else clearSearch();
		renderTasks();
	});
}

// SORTING --------------------------------------------------------------------

function sortTasks(event) {
	sortAscending = !sortAscending;
	const newIcon = sortAscending ? '#icon-caret-down' : '#icon-caret-up-fill';
	DOM.sortToggle.classList.toggle('outline', sortAscending);
	DOM.sortToggle.querySelector('use').setAttribute('xlink:href', newIcon);
	renderTasks();
}

// ADD/EDIT TASK --------------------------------------------------------------

function populateTags() {
	const taskTags = {
		projects: { regex: regex.project, container: DOM.editProjects, classes: 'background-primary mr-xs mb-xs' },
		contexts: { regex: regex.context, container: DOM.editContexts, classes: 'mr-xs mb-xs' },
	};

	Object.values(taskTags).forEach(({ regex, container, classes }) => {
		const span = container.querySelector('span');
		const icon = container.querySelector('i');
		span.innerHTML = '';
		icon.classList.toggle('hide', !!DOM.editDescription.value.match(regex));
		(DOM.editDescription.value.match(regex) || []).forEach(tag => {
			span.insertAdjacentHTML('beforeend', `
				<kbd class="${classes}">${tag}<b class="pointer" onclick="deleteTag(event)">
					<svg width="1em" height="1em"><use xlink:href="#icon-x"/></svg>
				</b></kbd>
			`);
		});
	});
}

function deleteTag(event) {
	const target = event.currentTarget.parentNode;
	DOM.editDescription.value = cleanString(DOM.editDescription.value.replace(target.textContent.trim(), ''));
	populateTags();
	target.remove();
}

function addTask() {
	const hash = location.hash.slice(1) || '';
	DOM.editForm.reset();
	DOM.editTitle.textContent = 'Add task';
	DOM.editId.value = '';
	DOM.editDescription.value = hash && hash !== 'tasks' ? ` +${hash}` : '';
	DOM.editDescription.setSelectionRange(0, 0);
	DOM.editDelete.classList.add('hide');
	DOM.editSubmit.textContent = 'Add';
	populateTags();
}

function editTask(id) {
	const task = tasks.find(t => t.id === id);
	if (!task) return;
	DOM.autocomplete.classList.add('hide');
	DOM.editForm.reset();
	DOM.editTitle.textContent = `Edit task #${task.id}`;
	DOM.editId.value = task.id;
	DOM.editDescription.value = task.raw_description;
	DOM.editPriority.value = task.priority || '--';
	DOM.editComplete.checked = task.isCompleted;
	DOM.editDelete.dataset.id = task.id;
	DOM.editDelete.classList.remove('hide');
	DOM.editSubmit.textContent = 'Save';
	DOM.editDescription.focus();
	DOM.editDescription.setSelectionRange(DOM.editDescription.value.length, DOM.editDescription.value.length);
	populateTags();
}

async function completeTask(event) {
	const id = event.currentTarget.dataset.id;
	const task = tasks.find(t => t.id === id);
	if (!task) return;
	try {
		event.currentTarget.checked ? task.complete() : task.uncomplete();
		const userId = pb.authStore.isValid ? pb.authStore.record.id : '';
		const completeResponse = await pb.collection('tasks').update(id, { userId: userId, text: task.toString() });
		fetchTasks();
	} catch (error) {
		alert('Error: ' + error.message);
		fetchTasks();
	}
}

async function deleteTask(event) {
	if (!confirm('Are you sure you want to delete this task?')) return;
	try {
		const deleteResponse = await pb.collection('tasks').delete(event.currentTarget.dataset.id);
		fetchTasks();
		if (visibleModal) closeModal(visibleModal);
	} catch (error) {
		alert('Error: ' + error.message);
	}
}

// AUTOCOMPLETE ---------------------------------------------------------------

function filterTags(text, char, reg, taskTags) {
	const cursor = DOM.editDescription.selectionStart;
	const cursorText = text.slice(0, cursor);
	const index = cursorText.lastIndexOf(char);
	const lastTag = index >= 0 ? cursorText.slice(index) : '';
	return (reg.test(lastTag) ? taskTags.filter(t => t.toLowerCase().startsWith(lastTag.slice(1).toLowerCase())) : lastTag === char ? taskTags : [])
		.map(t => ({ tag: `${char}${t}`, start: index, end: cursor }));
}

DOM.editDescription.addEventListener('input', e => {
	populateTags();
	const query = cleanString(e.currentTarget.value.toLowerCase()).replace(regex.project, '').replace(regex.context, '').trim();
	const filteredTags = [
		...filterTags(e.currentTarget.value, '+', regex.projectSingle, tags.projects),
		...filterTags(e.currentTarget.value, '@', regex.contextSingle, tags.contexts),
	].sort((a, b) => a.tag.localeCompare(b.tag));
	const currentTaskId = parseInt(DOM.editId.value) || 0;
	const filteredTasks = query ? tasks.filter(task => task.id !== currentTaskId && task.description.toLowerCase().includes(query)).sort((a, b) => a.description.localeCompare(b.description)) : [];

	DOM.autocomplete.innerHTML = (filteredTags.length || filteredTasks.length)
		? [...filteredTags.map(t => `<li class="auto-tag" data-tag="${t.tag}" data-start="${t.start}" data-end="${t.end}">${t.tag}</li>`),
			 ...filteredTasks.map(t => `<li class="auto-tag flex space-between" data-id="${t.id}">${t.rawDescription}<b onclick="editTask('${t.id}')"><svg width="1em" height="1em"><use xlink:href="#icon-edit"/></svg></b></li>`)].join('')
		: '';
	DOM.autocomplete.classList.toggle('hide', !filteredTags.length && !filteredTasks.length);
});

DOM.editDescription.addEventListener('keydown', e => {
	const items = DOM.autocomplete.querySelectorAll('li');
	if (!items.length) return;
	const index = Array.from(items).findIndex(item => item.classList.contains('selected'));
	if (e.key === 'ArrowDown' && index < items.length - 1) {
		e.preventDefault();
		items[index]?.classList.remove('selected');
		items[index + 1].classList.add('selected');
		items[index + 1].scrollIntoView({ block: 'nearest' });
	} else if (e.key === 'ArrowUp' && index > 0) {
		e.preventDefault();
		items[index].classList.remove('selected');
		items[index - 1].classList.add('selected');
		items[index - 1].scrollIntoView({ block: 'nearest' });
	} else if ((e.key === 'Enter' || e.key === 'Tab') && index >= 0) {
		e.preventDefault();
		const item = items[index];
		DOM.autocomplete.classList.add('hide');
		DOM.autocomplete.innerHTML = '';
		if (item.dataset.id) {
			if (e.key === 'Enter') editTask(item.dataset.id);
			else DOM.editDescription.value = items[index].textContent;
			DOM.editDescription.focus();
			DOM.editDescription.setSelectionRange(DOM.editDescription.value.length, DOM.editDescription.value.length);
		} else {
			DOM.editDescription.value = DOM.editDescription.value.slice(0, item.dataset.start) + item.dataset.tag + DOM.editDescription.value.slice(item.dataset.end);
			DOM.editDescription.focus();
			DOM.editDescription.setSelectionRange(parseInt(item.dataset.start) + item.dataset.tag.length, parseInt(item.dataset.start) + item.dataset.tag.length);
		}
		populateTags();
	}
});

DOM.autocomplete.addEventListener('click', e => {
	if (e.target.tagName !== 'LI') return;
	DOM.autocomplete.classList.add('hide');
	DOM.autocomplete.innerHTML = '';
	if (e.target.dataset.id) {
		DOM.editDescription.value = e.target.textContent;
		DOM.editDescription.focus();
		DOM.editDescription.setSelectionRange(DOM.editDescription.value.length, DOM.editDescription.value.length);
	} else {
		DOM.editDescription.value = DOM.editDescription.value.slice(0, e.target.dataset.start) + e.target.dataset.tag + DOM.editDescription.value.slice(e.target.dataset.end);
		DOM.editDescription.focus();
		DOM.editDescription.setSelectionRange(parseInt(e.target.dataset.start) + e.target.dataset.tag.length, parseInt(e.target.dataset.start) + e.target.dataset.tag.length);
	}
	populateTags();
});

document.addEventListener('click', e => {
	if (!DOM.editDescription.contains(e.target) && !DOM.autocomplete.contains(e.target)) {
		DOM.autocomplete.classList.add('hide');
	}
});

// ASIDE MENU -----------------------------------------------------------------

function toggleAside() {
	DOM.aside?.classList.toggle('open');
}

if (DOM.aside) {
	DOM.aside.addEventListener('click', e => {
		if (DOM.aside.classList.contains('open') && e.target === DOM.aside) toggleAside();
	});
}

function openList() {
	const hash = location.hash.slice(1) || '';
	DOM.noList.classList.toggle('hide', !hash || document.getElementById(`list-${hash}`) || hash === 'tasks');
	DOM.taskList.querySelectorAll('li').forEach(t => t.classList.remove('hide'));
	DOM.listTitle.textContent = hash && document.getElementById(`list-${hash}`)
		? document.getElementById(`list-${hash}`).dataset.title
		: 'Tasks';
	if (hash && hash !== 'tasks' && !document.getElementById(`list-${hash}`)) {
		DOM.noList.querySelector('span').textContent = hash;
		DOM.noList.classList.remove('hide');
	} else if (hash && hash !== 'tasks') {
		DOM.taskList.querySelectorAll('li').forEach(t => t.classList.toggle('hide', !t.classList.contains(`project-${hash}`) && !t.classList.contains('group')));
	}
}

window.addEventListener('hashchange', openList);

// SETTINGS -------------------------------------------------------------------

async function fetchSettings() {
	try {
		const recordId = pb.authStore.isValid ? pb.authStore.record.id : '';
		const settingsResponse = await pb.collection('settings').getFullList();
		const settingsRecord = settingsResponse.filter(r => r.userId === recordId);
		settings = settingsRecord.length ? settingsRecord[0] : {
			userId: recordId,
			lists:[],
			showComplete: true
		};
		debug("fetchSettings", settingsRecord.length ? "Fetched settings" : "Created settings", settings);
		state.newSettings = settingsRecord.length ? false : true;
		toggleComplete(settings.showComplete, false);
		fetchTasks();
	} catch (error) {
		console.error('Error loading settings:', error);
	}
}

function openSettings() {
	console.log(DOM.settingsShowComplete, settings.showComplete);
	DOM.settingsShowComplete.checked = settings.showComplete || false;
	DOM.settingsLists.innerHTML = settings.lists?.map((list, i) => `
		<fieldset id="settings-list-${i + 1}" class="grid settings-list">
			<input class="settings-list-name" name="settings-list-${i + 1}-name" placeholder="List Name" value="${list.name}" required />
			<input class="settings-list-project" name="settings-list-${i + 1}-project" placeholder="Project" value="${list.project}" required />
			<button class="contrast" data-id="${i + 1}" type="button" onclick="deleteSettingsList(event)">
				<svg width="1em" height="1em"><use xlink:href="#icon-trash"/></svg>
			</button>
		</fieldset>
	`).join('') || '';
	openModal(DOM.settingsModal);
}

function addSettingsList(event) {
	event.preventDefault();
	DOM.settingsLists.insertAdjacentHTML('beforeend', `
		<fieldset id="settings-list-${DOM.settingsLists.children.length + 1}" class="grid settings-list">
			<input class="settings-list-name" name="settings-list-${DOM.settingsLists.children.length + 1}-name" placeholder="List Name" required />
			<input class="settings-list-project" name="settings-list-${DOM.settingsLists.children.length + 1}-project" placeholder="Project" required />
			<button class="contrast" data-id="${DOM.settingsLists.children.length + 1}" type="button" onclick="deleteSettingsList(event)">
				<svg width="1em" height="1em"><use xlink:href="#icon-trash"/></svg>
			</button>
		</fieldset>
	`);
}

function deleteSettingsList(event) {
	event.preventDefault();
	const fieldset = document.getElementById(`settings-list-${event.target.dataset.id}`);
	fieldset.classList.add('hide');
	setTimeout(() => {
		fieldset.remove();
		Array.from(document.querySelectorAll('.settings-list')).forEach((fs, i) => {
			fs.id = `settings-list-${i + 1}`;
			fs.querySelector('.settings-list-name').name = `settings-list-${i + 1}-name`;
			fs.querySelector('.settings-list-project').name = `settings-list-${i + 1}-project`;
			fs.querySelector('button').dataset.id = i + 1;
		});
	}, 100);
}

// DELETE DONE ----------------------------------------------------------------

function openDelete() {
	DOM.deleteLists.innerHTML = (settings.lists?.length ? [{ name: 'Tasks', project: 'tasks' }, ...settings.lists] : [])
		.map(list => `
			<label>
				<input class="delete-switch" type="checkbox" role="switch" data-project="${list.project}" />
				${list.name}
			</label>
		`).join('');
	openModal(DOM.deleteModal);
}

// GROUP ----------------------------------------------------------------------

function groupBy(type) {
	group = group === type ? 'none' : type;
	const newIcon = group === 'none' ? '#icon-group' : '#icon-group-fill';
	DOM.groupClearBtn.classList.toggle('hide', group === 'none');
	DOM.groupBtn.classList.toggle('outline', group === 'none');
	DOM.groupBtn.querySelector('use').setAttribute('xlink:href', newIcon);
	Array.from(DOM.groupBtns.children).forEach((btn) => {
		btn.classList.toggle('outline', !btn.id.includes(group));
	});
	renderTasks();
}

// FORMS ----------------------------------------------------------------------

document.querySelectorAll('.form').forEach(f => f.addEventListener('submit', submitForm));

async function submitForm(e) {
	e.preventDefault();
	const form = e.target;
	e.currentTarget.querySelector('.error').classList.add('hide');

	const formData = new FormData(form);
	form.parentNode.querySelector(".form-submit").setAttribute('aria-busy', 'true');
	try {
		switch(form.id) {
			case 'login-form':
				const loginResponse = await pb.collection('users').authWithPassword(
					formData.get('email'),
					formData.get('password')
				);
				checkAuth();
				break;
			case 'settings-form':
				settings.showComplete = form.querySelector('#settings-show-complete').checked;
				settings.lists = [];
				form.querySelectorAll('.settings-list').forEach(l => {
					settings.lists.push({
						name: l.querySelector('.settings-list-name').value,
						project: l.querySelector('.settings-list-project').value
					});
				});
				if (state.newSettings) {
					const newSettings = await pb.collection('settings').create(settings);
					settings = newSettings;
					state.newSettings = false;
				} else {
					const settingsResponse = await pb.collection('settings').update(settings.id, settings);
				}
				renderTasks();
				break;
			case 'edit-form':
				debug("submitForm", "Adding/editing task", formData);
				const userId = pb.authStore.isValid ? pb.authStore.record.id : '';
				const newTask = new Task(`${getDateString()} ${formData.get('edit-description')}`);
				formData.get('edit-complete') ? newTask.complete() : newTask.uncomplete();
				newTask.setPriority(formData.get('edit-priority') === '--' ? '' : formData.get('edit-priority'));
				if (formData.get('edit-id')) { // Edit
					const task = tasks.find(t => t.id === formData.get('edit-id'));
					if (!task) throw new Error(`Could not find task with id ${formData.get('edit-id')}`);
					newTask.creationDate = task.creationDate;
					const editResponse = await pb.collection('tasks').update(formData.get('edit-id'), { userId: userId, text: newTask.toString() });
				} else { // Add
					const addResponse = await pb.collection('tasks').create({ userId: userId, text: newTask.toString() });
				}
				fetchTasks();
				break;
			case 'delete-form':
				const deleteList = Array.from(form.querySelectorAll('.delete-switch:checked'))
					.flatMap(input => tasks.filter(task => task.isCompleted && task.projects.includes(input.dataset.project)).map(task => task.id));
				if (!deleteList.length) return;
				const batch = pb.createBatch();
				deleteList.forEach(d => { batch.collection('tasks').delete(d); });
				const deleteMulResponse = await batch.send();
				fetchTasks();
				break;
			default:
				throw new Error(`Invalid form ${form.id}`);
		}
		if (visibleModal) closeModal(visibleModal);
		form.parentNode.querySelector(".form-submit").setAttribute('aria-busy', 'false');
	} catch (error) {
		form.querySelector('.error').textContent = error.message;
		form.querySelector('.error').classList.remove('hide');
		form.parentNode.querySelector(".form-submit").setAttribute('aria-busy', 'false');
	}
}

// AUTHENTICATION -------------------------------------------------------------

// Check if logged in
async function checkAuth() {
	const users = await pb.collection('usersCount').getOne(1);
	if (users.total === 0 || pb.authStore.isValid) {
		login(users.total > 0);
		fetchSettings();
	} else logout();
	debug("checkAuth", "State: ", state);
}

function login(auth=true) {
	debug("login", "Logging in, authenticated: ", auth);
	state.authenticated = auth;
	state.loggedIn = true;
	if (!state.authenticated) pb.authStore.clear();
	document.querySelectorAll('.logged-in').forEach(e => e.classList.remove('hide'));
	document.querySelectorAll('.logged-out').forEach(e => e.classList.add('hide'));
	document.querySelectorAll('.auth-required').forEach(e => e.classList.toggle('hide', !state.authenticated));
	// document.querySelectorAll('.no-auth-required').forEach(e => e.classList.toggle('hide', authenticated));
}

function logout() {
	debug("logout", "Logging out");
	pb.authStore.clear();
	state.authenticated = false;
	state.loggedIn = false;
	document.querySelectorAll('.logged-in').forEach(e => e.classList.add('hide'));
	document.querySelectorAll('.logged-out').forEach(e => e.classList.remove('hide'));
}

// MAIN -----------------------------------------------------------------------

checkAuth();
