// CONSTANTS ------------------------------------------------------------------

const DOM = {
	taskList: document.getElementById('tasks'),
	editForm: document.getElementById('edit-form'),
	editError: document.getElementById('edit-error'),
	editTitle: document.getElementById('edit-title'),
	editId: document.getElementById('edit-id'),
	editDescription: document.getElementById('edit-description'),
	editProjects: document.getElementById('edit-projects'),
	editContexts: document.getElementById('edit-contexts'),
	editPriority: document.getElementById('edit-priority'),
	editPriorityDefault: document.getElementById('edit-priority-default'),
	editComplete: document.getElementById('edit-complete'),
	editSubmit: document.getElementById('edit-submit'),
	editDelete: document.getElementById('edit-delete'),
	search: document.getElementById('search'),
	searchBtn: document.getElementById('search-btn'),
	completeToggle: document.getElementById('complete-toggle'),
	showAll: document.getElementById('show-all'),
	projectsModal: document.getElementById('projects-modal'),
	projectsBtn: document.getElementById('projects-btn'),
	contextsModal: document.getElementById('contexts-modal'),
	contextsBtn: document.getElementById('contexts-btn'),
	aside: document.querySelector('aside'),
	settingsForm: document.getElementById('settings-form'),
	settingsError: document.getElementById('settings-error'),
	settingsSortComplete: document.getElementById('settings-sort-complete'),
	settingsListsAdd: document.getElementById('settings-lists-add'),
	settingsLists: document.getElementById('settings-lists'),
	deleteForm: document.getElementById('delete-form'),
	deleteError: document.getElementById('delete-error'),
	deleteLists: document.getElementById('delete-lists'),
	noList: document.getElementById('no-list'),
	listTitle: document.getElementById('list-title'),
	logo: document.getElementById('logo'),
	autocomplete: document.getElementById('autocomplete'),
};

const clearBtn = Object.assign(document.createElement('button'), {
	className: 'secondary',
	textContent: 'Clear',
	onclick: clearSearch,
});

// GLOBALS --------------------------------------------------------------------

const regex = {
	project: /\+[A-Za-z0-9_-]+/g,
	context: /@[A-Za-z0-9_-]+/g,
	projectSingle: /^\+[A-Za-z0-9_-]+$/,
	contextSingle: /^@[A-Za-z0-9_-]+$/,
};

let tasks = [];
let projects = [];
let contexts = [];
let sortBy = 'description';
let sortAscending = true;
let filterSearch = '';
let filterComplete = true;
let filterProjects = [];
let filterContexts = [];
let settings = {};

// HELPERS --------------------------------------------------------------------

const getDateString = (date) => {
	const d = new Date(date);
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

const toggleLoading = (show) => {
	document.querySelectorAll('.loading').forEach(el => el.classList.toggle('hide', !show));
};

const cleanString = (text) => text.trim().replace(/\s+/g, ' ');

// LIST -----------------------------------------------------------------------

async function fetchTasks() {
	toggleLoading(true);
	try {
		const response = await fetch('/list');
		if (!response.ok) throw new Error('Failed to fetch tasks');
		tasks = (await response.json()).tasks;
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
		task.created ? `<small><svg width="1em" height="1em"><use xlink:href="#icon-calendar"/></svg> ${getDateString(task.created)}</small>` : '',
		task.completed ? `<small><ins><svg width="1em" height="1em"><use xlink:href="#icon-calendar-check"/></svg> ${getDateString(task.completed)}</ins></small>` : '',
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
		<input type="checkbox" ${task.complete ? 'checked' : ''} data-id="${task.id}" onclick="completeTask(event)" />
		<hgroup class="pointer flex-grow" data-target="edit-modal" onclick="editTask(${task.id}); toggleModal(event);">
			<h5 class="flex space-between ${task.complete ? 'muted-color strike' : ''}">
				<span>${taskSub} ${taskDesc}</span>
			</h5>
			<p class="flex gap-xs align-center">${taskDates}</p>
		</hgroup>
		<svg class="show-hover" width="1em" height="1em"><use xlink:href="#icon-edit"/></svg>
	`;
}

function renderTasks() {
	// Update aside menu
	const listUl = DOM.aside?.querySelector('ul');
	if (listUl) {
		DOM.logo.classList.toggle('hide-sm', settings.lists?.length > 0);
		DOM.logo.nextElementSibling.classList.toggle('hide', settings.lists?.length > 0);
		DOM.aside.classList.toggle('hide', !settings.lists?.length);
		while (listUl.children.length > 1) listUl.lastElementChild.remove();
		settings.lists?.forEach(list => {
			listUl.insertAdjacentHTML('beforeend', `
				<li><a id="list-${list.project}" class="contrast" href="#${list.project}" onclick="toggleAside()" data-title="${list.name}">${list.name}</a></li>
			`);
		});
	}

	// Populate project & context dropdowns
	projects = [...new Set(tasks.flatMap(task => task.projects))];
	contexts = [...new Set(tasks.flatMap(task => task.contexts))];
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
	updateModal(DOM.projectsModal, DOM.projectsBtn, projects, 'projects', filterProjects);
	updateModal(DOM.contextsModal, DOM.contextsBtn, contexts, 'contexts', filterContexts);

	// Filter and sort tasks
	const filteredTasks = tasks
		.filter(task => (
			(!filterSearch || task.raw_description.toLowerCase().includes(filterSearch.toLowerCase())) &&
			(filterComplete ? !task.complete : true) &&
			(!filterProjects.length || task.projects.some(p => filterProjects.includes(p))) &&
			(!filterContexts.length || task.contexts.some(c => filterContexts.includes(c)))
		))
		.sort((a, b) => {
			const valA = sortBy === 'description' ? a.description : a[sortBy] || (sortBy === 'priority' ? 'ZZ' : '');
			const valB = sortBy === 'description' ? b.description : b[sortBy] || (sortBy === 'priority' ? 'ZZ' : '');
			return sortAscending ? (valA < valB ? -1 : valA > valB ? 1 : 0) : (valA > valB ? -1 : valA < valB ? 1 : 0);
		})
		.sort((a, b) => settings.sort_complete ? (a.complete && !b.complete ? 1 : -1) : 0);

	// Render tasks
	DOM.taskList.querySelector('ul').innerHTML = filteredTasks.map(task => `
		<li id="task-${task.id}" class="flex align-center hover-background padding-xs show-hover-parent ${task.projects.map(p => `project-${p}`).join(' ')} ${task.contexts.map(c => `context-${c}`).join(' ')}">
			${parseTask(task)}
		</li>
	`).join('');

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

function toggleComplete(setComplete) {
	filterComplete = setComplete;
	const newIcon = filterComplete ? '#icon-eye' : '#icon-eye-fill';
	DOM.completeToggle.classList.toggle('outline', filterComplete);
	DOM.completeToggle.querySelector('use').setAttribute('xlink:href', newIcon);
	renderTasks();
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
	sortAscending = sortBy === event.target.dataset.sort ? !sortAscending : true;
	sortBy = event.target.dataset.sort;
	const newIcon = sortAscending ? '#icon-caret-down-fill' : '#icon-caret-up-fill';
	document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.add('outline'));
	document.querySelectorAll('.sort-btn use').forEach(icon => icon.setAttribute('xlink:href', newIcon.replace('-fill', '')));
	event.target.classList.remove('outline');
	event.target.querySelector('use').setAttribute('xlink:href', newIcon);
	renderTasks();
}

// ADD/EDIT TASK --------------------------------------------------------------

function populateTags() {
	const tags = {
		projects: { regex: regex.project, container: DOM.editProjects, classes: 'background-primary mr-xs mb-xs' },
		contexts: { regex: regex.context, container: DOM.editContexts, classes: 'mr-xs mb-xs' },
	};

	Object.values(tags).forEach(({ regex, container, classes }) => {
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
	const task = tasks.find(t => t.id === parseInt(id));
 if (!task) return;
	DOM.editForm.reset();
	DOM.editTitle.textContent = `Edit task #${task.id}`;
	DOM.editId.value = task.id;
	DOM.editDescription.value = task.raw_description;
	DOM.editPriority.value = task.priority || '--';
	DOM.editComplete.checked = task.complete;
	DOM.editDelete.dataset.id = task.id;
	DOM.editDelete.classList.remove('hide');
	DOM.editSubmit.textContent = 'Save';
	populateTags();
}

if (DOM.editForm) {
	DOM.editForm.addEventListener('submit', async e => {
		e.preventDefault();
		DOM.editError.classList.add('hide');
		const id = parseInt(DOM.editId.value || 0);
		try {
			const description = DOM.editDescription.value.trim();
			const priority = DOM.editPriority.value === '--' ? null : DOM.editPriority.value;
			const complete = DOM.editComplete.checked;
			const endpoint = id ? `/edit/${id}` : '/add';
			const method = id ? 'PUT' : 'POST';
			const response = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ description, priority, complete }),
			});
			if (!response.ok) throw new Error((await response.json()).description || `Failed to ${id ? 'update' : 'add'} task`);
			await fetchTasks();
			if (visibleModal) closeModal(visibleModal);
		} catch (error) {
			DOM.editError.textContent = error.message;
			DOM.editError.classList.remove('hide');
		}
	});
}

async function completeTask(event) {
	const id = parseInt(event.target.dataset.id);
	const task = tasks.find(t => t.id === id);
	if (!task) return;
	try {
		const response = await fetch(`/complete/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ complete: event.target.checked }),
		});
		if (!response.ok) throw new Error((await response.json()).description || 'Failed to complete task');
		tasks[tasks.findIndex(t => t.id === id)] = (await response.json()).task;
		renderTasks();
	} catch (error) {
		alert('Error: ' + error.message);
		renderTasks();
	}
}

async function deleteTask(event) {
	if (!confirm('Are you sure you want to delete this task?')) return;
	try {
		const response = await fetch(`/delete/${event.target.dataset.id}`, { method: 'DELETE' });
		if (!response.ok) throw new Error('Failed to delete task');
		await fetchTasks();
		if (visibleModal) closeModal(visibleModal);
	} catch (error) {
		alert('Error: ' + error.message);
	}
}

// AUTOCOMPLETE ---------------------------------------------------------------

function filterTags(text, char, reg, tags) {
	const cursor = DOM.editDescription.selectionStart;
	const cursorText = text.slice(0, cursor);
	const index = cursorText.lastIndexOf(char);
	const lastTag = index >= 0 ? cursorText.slice(index) : '';
	return (reg.test(lastTag) ? tags.filter(t => t.toLowerCase().startsWith(lastTag.slice(1).toLowerCase())) : lastTag === char ? tags : [])
		.map(t => ({ tag: `${char}${t}`, start: index, end: cursor }));
}

if (DOM.editDescription) {
	DOM.editDescription.addEventListener('input', e => {
		populateTags();
		const query = e.currentTarget.value.toLowerCase().trim();
		const filteredTags = [
			...filterTags(e.currentTarget.value, '+', regex.projectSingle, projects),
			...filterTags(e.currentTarget.value, '@', regex.contextSingle, contexts),
		].sort((a, b) => a.tag.localeCompare(b.tag));
		const filteredTasks = query ? tasks.filter(task => task.description.toLowerCase().includes(query)).sort((a, b) => a.description.localeCompare(b.description)) : [];

		DOM.autocomplete.innerHTML = (filteredTags.length || filteredTasks.length)
			? [...filteredTags.map(t => `<li class="auto-tag" data-tag="${t.tag}" data-start="${t.start}" data-end="${t.end}">${t.tag}</li>`),
				 ...filteredTasks.map(t => `<li class="auto-tag" data-id="${t.id}">${t.raw_description}</li>`)].join('')
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
			} else {
				DOM.editDescription.value = DOM.editDescription.value.slice(0, item.dataset.start) + item.dataset.tag + DOM.editDescription.value.slice(item.dataset.end);
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
			editTask(e.target.dataset.id);
		} else {
			DOM.editDescription.value = DOM.editDescription.value.slice(0, e.target.dataset.start) + e.target.dataset.tag + DOM.editDescription.value.slice(e.target.dataset.end);
			DOM.editDescription.setSelectionRange(parseInt(e.target.dataset.start) + e.target.dataset.tag.length, parseInt(e.target.dataset.start) + e.target.dataset.tag.length);
			populateTags();
		}
	});

	document.addEventListener('click', e => {
		if (!DOM.editDescription.contains(e.target) && !DOM.autocomplete.contains(e.target)) {
			DOM.autocomplete.classList.add('hide');
		}
	});
}

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
	DOM.noList.classList.toggle('hide', !hash || document.getElementById(`list-${hash}`));
	DOM.taskList.querySelectorAll('li').forEach(t => t.classList.remove('hide'));
	DOM.listTitle.textContent = hash && document.getElementById(`list-${hash}`)
		? document.getElementById(`list-${hash}`).dataset.title
		: 'Tasks';
	if (hash && hash !== 'tasks' && !document.getElementById(`list-${hash}`)) {
		DOM.noList.querySelector('span').textContent = hash;
		DOM.noList.classList.remove('hide');
	} else if (hash) {
		DOM.taskList.querySelectorAll('li').forEach(t => {
			if (!t.classList.contains(`project-${hash}`)) t.classList.add('hide');
		});
	}
}

window.addEventListener('hashchange', openList);

// SETTINGS -------------------------------------------------------------------

async function fetchSettings() {
	try {
		const response = await fetch('/settings');
		if (!response.ok) throw new Error('Failed to fetch settings');
		settings = await response.json();
		await fetchTasks();
	} catch (error) {
		console.error('Error loading settings:', error);
	}
}

function openSettings() {
	DOM.settingsSortComplete.checked = settings.sort_complete || false;
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

if (DOM.settingsForm) {
	DOM.settingsForm.addEventListener('submit', async e => {
		e.preventDefault();
		const lists = Array.from(DOM.settingsForm.querySelectorAll('.settings-list')).map(fieldset => ({
			name: fieldset.querySelector('.settings-list-name').value,
			project: fieldset.querySelector('.settings-list-project').value,
		}));
		DOM.settingsError.style.display = 'none';
		try {
			const response = await fetch('/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lists, sort_complete: DOM.settingsSortComplete.checked }),
			});
			if (!response.ok) throw new Error((await response.json()).description || 'Failed to update settings');
			settings = await response.json();
			renderTasks();
			if (visibleModal) closeModal(visibleModal);
		} catch (error) {
			DOM.settingsError.textContent = error.message;
			DOM.settingsError.style.display = 'block';
		}
	});
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

if (DOM.deleteForm) {
	DOM.deleteForm.addEventListener('submit', async e => {
		e.preventDefault();
		const deleteList = Array.from(DOM.deleteForm.querySelectorAll('.delete-switch:checked'))
			.flatMap(input => tasks.filter(task => task.complete && task.projects.includes(input.dataset.project)).map(task => task.id));
		if (!deleteList.length) return;
		DOM.deleteError.style.display = 'none';
		try {
			const response = await fetch('/delete-multiple', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(deleteList),
			});
			if (!response.ok) throw new Error((await response.json()).description || 'Failed to delete tasks');
			await fetchTasks();
			if (visibleModal) closeModal(visibleModal);
		} catch (error) {
			DOM.deleteError.textContent = error.message;
			DOM.deleteError.style.display = 'block';
		}
	});
}

// MAIN -----------------------------------------------------------------------

if (DOM.taskList) fetchSettings();
