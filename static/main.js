
// CONSTANTS ------------------------------------------------------------------

const taskList = document.getElementById('tasks');
const addForm = document.getElementById('add-task-form');
const addError = document.getElementById('add-error');
const addDescription = document.getElementById('add-description');
const editForm = document.getElementById('edit-task-form');
const editError = document.getElementById('edit-error');
const search = document.getElementById('search');
const searchBtn = document.getElementById('search-btn');
const filterPriority = document.getElementById('filter-priority');
const sortBtns = document.querySelectorAll('.sort-btn');
const sortIcons = document.querySelectorAll('.sort-btn svg');
const completeToggle = document.getElementById('complete-toggle');
const showAll = document.getElementById('show-all');
const projectsModal = document.getElementById('projects-modal');
const projectsBtn = document.getElementById('projects-btn');
const contextsModal = document.getElementById('contexts-modal');
const contextsBtn = document.getElementById('contexts-btn');
const aside = document.querySelector('aside');
const settingsForm = document.getElementById('settings-form');
const settingsError = document.getElementById('settings-error');
const settingsSortComplete = document.getElementById('settings-sort-complete');
const settingsListsAdd = document.getElementById('settings-lists-add');
const settingsLists = document.getElementById('settings-lists');
const deleteForm = document.getElementById('delete-form');
const deleteError = document.getElementById('delete-error');
const deleteLists = document.getElementById('delete-lists');
const noList = document.getElementById('no-list');

const clearBtn = document.createElement('button');
clearBtn.classList.add('secondary');
clearBtn.addEventListener('click', clearSearch);
clearBtn.textContent = 'Clear';

// GLOBALS --------------------------------------------------------------------

let tasks = [];
let projects = [];
let contexts = [];
let sortBy = 'description';
let sortAscending = true;
let filterSearch = '';
// let filterPrio = '';
let filterComplete = true;
let filterProjects = [];
let filterContexts = [];
let settings = {};

// HELPERS --------------------------------------------------------------------

// Get date in YYYY-MM-DD format
function getDateString(date) {
	const yyyy = date.getUTCFullYear();
	const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(date.getUTCDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function showLoading() {
	document.querySelectorAll('.loading').forEach((load) => load.classList.remove('hide'));
}

function hideLoading(name) {
	document.querySelectorAll('.loading').forEach((load) => load.classList.add('hide'));
}

// LIST -----------------------------------------------------------------------

// Fetch tasks from API
async function fetchTasks() {
	showLoading();
	try {
		const response = await fetch("/list");
		if (!response.ok) throw new Error('Failed to fetch tasks');
		const data = await response.json();
		tasks = data.tasks;
		renderTasks();
		hideLoading();
	} catch (error) {
		console.error('Error loading tasks:', error);
		hideLoading();
	}
}

// Parse task into html
function parseTask(task) {
	const projectRegex = /\+[A-Za-z0-9_-]+/g;
	const contextRegex = /@[A-Za-z0-9_-]+/g;
	let taskSub = '';
	if (task.priority) taskSub = `<a>(${task.priority})</a>`;
	let taskDates = '';
	if (task.created)
		taskDates += `
			<small>
				<svg width="1em" height="1em">
					<use xlink:href="#icon-calendar"/>
				</svg>
				${getDateString(new Date(task.created))}
			</small>
		`;
	if (task.completed)
		taskDates += `
			<small><ins>
				<svg width="1em" height="1em">
					<use xlink:href="#icon-calendar-check"/>
				</svg>
				${getDateString(new Date(task.completed))}
			</ins></small>
		`;
	let taskDesc = task.raw_description.replace(
		projectRegex, (match) =>
		task.projects.includes(match.slice(1)) ?
			`<a data-attribute="projects" data-name="${match.slice(1)}"
				onclick="selectAttribute(event)">${match}</a>` : match
	);
	taskDesc = taskDesc.replace(
		contextRegex, (match) =>
		task.contexts.includes(match.slice(1)) ?
			`<a class="contrast" data-attribute="contexts"
				data-name="${match.slice(1)}"
				onclick="selectAttribute(event)">${match}</a>` : match
	);
	return `
		<input
			type="checkbox"
			${task.complete ? 'checked' : ''}
			data-id="${task.id}"
			onclick="completeTask(event)" />
		<hgroup class="pointer flex-grow"
			onclick="editTask(${task.id})">
			<h5 class="flex space-between ${task.complete ? 'muted-color strike' : ''}">
				<span>${taskSub} ${taskDesc}</span>
			</h5>
			<p class="flex gap-xs align-center">${taskDates}</p>
		</hgroup>
		<svg class="show-hover" width="1em" height="1em">
			<use xlink:href="#icon-edit"/>
		</svg>
	`;
}

// Render tasks with sorting & filtering
function renderTasks() {
	// Update view with settings
	const logo = document.getElementById("logo");
	const listUl = aside.querySelector('ul');
	logo.classList.remove('hide-sm');
	logo.nextElementSibling.classList.add('hide');
	aside.classList.add('hide');
	while (listUl.children.length > 1) listUl.removeChild(listUl.lastElementChild);
	if (settings["lists"] && settings["lists"].length > 0) {
		logo.classList.add('hide-sm');
		logo.nextElementSibling.classList.remove('hide');
		aside.classList.remove('hide');
		settings["lists"].forEach((list) => {
			const li = document.createElement('li');
			li.innerHTML = `
				<a class="contrast"
					href="#${list['project']}"
					onclick="toggleAside()">
					${list['name']}
				</a>`;
			listUl.appendChild(li);

			const div = document.createElement('div');
			div.id = list['project'];
			div.classList.add('list', 'hide');
			div.innerHTML = `
				<section class="flex align-center">
					<h3 class="mb-0">${list['name']}</h3>
					<button id="add-task-btn"
						class="border-round"
						onclick="setProject('${list['project']}'); toggleModal(event);"
						data-target="add-task-modal">
						<svg width="1em" height="1em"><use xlink:href="#icon-add"/></svg>
					</button>
				</section>
				<section>
					<div class="loading" aria-busy="true"></div>
					<ul></ul>
				</section>`;
			taskList.parentNode.appendChild(div);
		});
	}

	openList();

	// Populate project & context dropdowns
	projects = [];
	contexts = [];
	projectsModal.querySelector('ul').innerHTML = '';
	contextsModal.querySelector('ul').innerHTML = '';
	projectsBtn.setAttribute("disabled", "disabled");
	projectsBtn.classList.add('secondary');
	contextsBtn.setAttribute("disabled", "disabled");
	contextsBtn.classList.add('secondary');
	tasks.forEach((task) => {
		task.projects.forEach((p) => {if (!projects.includes(p)) projects.push(p)});
		task.contexts.forEach((c) => {if (!contexts.includes(c)) contexts.push(c)});
	});
	if (projects.length > 0) {
		projectsBtn.removeAttribute('disabled');
		projectsBtn.classList.remove('secondary');
		projects.forEach((p) => {
			const li = document.createElement('li');
			li.innerHTML = `<label>
				<input type="checkbox"
					class="attribute-filter"
					data-attribute="projects"
					name="${p}"
					${filterProjects.includes(p) ? 'checked' : ''}/>
				${p}</label>`;
			projectsModal.querySelector('ul').appendChild(li);
		});
	}
	if (contexts.length > 0) {
		contextsBtn.removeAttribute('disabled');
		contextsBtn.classList.remove('secondary');
		contexts.forEach((c) => {
			const li = document.createElement('li');
			li.innerHTML = `<label>
				<input type="checkbox"
					class="attribute-filter"
					data-attribute="contexts"
					name="${c}"
					${filterContexts.includes(c) ? 'checked' : ''}/>
				${c}</label>`;
			contextsModal.querySelector('ul').appendChild(li);
		});
	}

	// Filter tasks
	let filteredTasks = tasks.filter(task => {
		const matchesSearch = filterSearch ?
			task.raw_description.toLowerCase().includes(filterSearch.toLowerCase()) : true;
		const matchesComplete = filterComplete ?
			task.complete === false : true;
		const matchesProjects = filterProjects.length > 0 ?
			task.projects.some(t => filterProjects.includes(t)) : true;
		const matchesContexts = filterContexts.length > 0 ?
			task.contexts.some(t => filterContexts.includes(t)) : true;
		return matchesSearch && matchesComplete && matchesProjects && matchesContexts;
	});

	// Sort tasks by description first
	filteredTasks.sort((a, b) => {
		if (a.description < b.description) return sortAscending ? -1 : 1;
		if (a.description > b.description) return sortAscending ? 1 : -1;
	});

	// Then by sortBy if not description
	if (sortBy !== 'description') {
		filteredTasks.sort((a, b) => {
			let valA = a[sortBy] || '';
			let valB = b[sortBy] || '';
			if (sortBy === 'priority' && (!valA || !valB)) {
				valA = valA || 'ZZ'; // Null priorities sort last
				valB = valB || 'ZZ';
			}
			if (valA < valB) return sortAscending ? -1 : 1;
			if (valA > valB) return sortAscending ? 1 : -1;
			return 0;
		});
	}

	// Then move completed to bottom if setting is set
	if (settings && settings["sort_complete"]) {
		filteredTasks.sort((a, b) => a.complete && !b.complete ? 1 : -1);
	}

	// Render tasks
	taskList.querySelector('ul').innerHTML = '';
	const lists = document.querySelectorAll('.list');
	lists.forEach((list) => list.querySelector('ul').innerHTML = '');
	filteredTasks.forEach(task => {
		let addToList = taskList;
		let found = false;
		const row = document.createElement('li');
		row.id = `task-${task.id}`;
		row.classList.add('flex', 'align-center', 'hover-background', 'padding-xs', 'show-hover-parent');
		row.innerHTML = parseTask(task);
		lists.forEach((list) => {
			if (task.projects.includes(list.id) && !found) {
				addToList = list;
				found = true;
			}
		});
		addToList.querySelector('ul').appendChild(row);
	});

	// Show 'Show All' button if filters in place
	if (showAll) {
		if (filterSearch || filterProjects.length || filterContexts.length)
			showAll.classList.remove('hide');
		else showAll.classList.add('hide');
	}
}

// FILTER ---------------------------------------------------------------------

// Clear filter attributes
function clearAttributeFilters() {
	filterProjects = [];
	filterContexts = [];
	projectsBtn.classList.add('outline');
	contextsBtn.classList.add('outline');
}

// Clear attribute inputs
function clearAttributeInputs(event) {
	if (event.target.dataset.attribute == 'projects')
		projectsModal.querySelectorAll('input').forEach(i => i.checked = false);
	if (event.target.dataset.attribute == 'contexts')
		contextsModal.querySelectorAll('input').forEach(i => i.checked = false);
}

// Single attribute
function selectAttribute(event) {
	event.stopPropagation();
	event.preventDefault();
	const inputs = document.querySelectorAll('.attribute-filter');
	inputs.forEach(i => i.checked = false);
	inputs.forEach(input => {
		if (event.target.dataset.attribute == input.dataset.attribute &&
			event.target.dataset.name == input.name) input.checked = true;
	});
	filterAttribute(event);
}

// Filter attributes
function filterAttribute(event) {
	clearAttributeFilters();
	document.querySelectorAll('.attribute-filter').forEach((input) => {
		if (input.checked) {
			if (input.dataset.attribute == 'projects') {
				filterProjects.push(input.name);
				projectsBtn.classList.remove('outline');
			}
			if (input.dataset.attribute == 'contexts') {
				filterContexts.push(input.name);
				contextsBtn.classList.remove('outline');
			}
		}
	});
	renderTasks();
}

// Search filter
if (search) {
	search.addEventListener('input', async (e) => {
		if (search.value) {
			filterSearch = search.value.trim();
			search.parentElement.appendChild(clearBtn);
			renderTasks();
		} else clearSearch();
	});
}

// Toggle complete filter
function toggleComplete(setComplete) {
	filterComplete = setComplete;
	newIcon = '#icon-eye';
	if (filterComplete) completeToggle.classList.add('outline');
	else {
		newIcon += '-fill';
		completeToggle.classList.remove('outline');
	}
	completeToggle.querySelector('use').setAttribute('xlink:href', newIcon);
	renderTasks();
}

// Clear search only
function clearSearch() {
	search.value = '';
	filterSearch = '';
	clearBtn.remove();
	renderTasks();
}

// Clear filters
function clearFilters() {
	clearSearch();
	projectsModal.querySelectorAll('input').forEach(i => i.checked = false);
	contextsModal.querySelectorAll('input').forEach(i => i.checked = false);
	filterAttribute(null);
}

// SORTING --------------------------------------------------------------------

// Toggle sort
function sortTasks(event) {
	if (sortBy === event.target.dataset.sort) sortAscending = !sortAscending;
	const newIcon = sortAscending ? '#icon-caret-down' : '#icon-caret-up';
	sortBy = event.target.dataset.sort;
	sortBtns.forEach((btn) => btn.classList.add('outline'));
	sortIcons.forEach((icon) =>
		icon.querySelector('use').setAttribute('xlink:href', newIcon));
	event.target.querySelector('use').setAttribute('xlink:href', `${newIcon}-fill`);
	event.target.classList.remove('outline');
	renderTasks();
}

// ADD TASK -------------------------------------------------------------------

// Add task
if (addForm) {
	addForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const description = document.getElementById('add-description').value.trim();
		let priority = document.getElementById('add-priority').value;
		if (priority === '--') priority = null;
		const complete = false;
		addError.style.display = 'none';

		try {
			const response = await fetch("/add", {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					description,
					priority: priority || null,
					complete
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.description || 'Failed to add task');
			}
			addForm.reset();
			await fetchTasks();
			if (visibleModal) closeModal(visibleModal);
		} catch (error) {
			addError.textContent = error.message;
			addError.style.display = 'block';
		}
	});
}

function setProject(project) {
	addDescription.value = `+${project}`;
}

// EDIT TASK ------------------------------------------------------------------

// Edit task
function editTask(id) {
	const task = tasks.find(t => t.id === parseInt(id));
	if (!task) return;

	const modal = document.getElementById(`edit-task-modal`);
	const modalForm = document.getElementById('edit-task-form');
	const deleteBtn = document.getElementById('delete-task-btn');

	let options = '';
	for (let letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
		options += `
			<option value="${letter}"
				${letter == task.priority ? 'selected' : ''}>
				${letter}
			</option>
		`;
	}

	modalForm.innerHTML = `
		<fieldset>
			<input type="hidden" id="edit-id" value="${task.id}" />
			<label>Task
				<input class="modal-focus"
					type="text"
					id="edit-description"
					placeholder="Task description (e.g., Milk)"
					value="${task.raw_description}"
					autocomplete="off"
					required />
			</label>
			<label>Priority</label>
			<select id="edit-priority" aria-label="Priority">
				<option ${!task.priority ? 'selected' : ''} value="--">--</option>
				${options}
			</select>
			<label>
				<input type="checkbox" id="edit-complete"
					role="switch" ${task.complete ? 'checked' : ''} />
				Completed
			</label>
		</fieldset>
	`;
	deleteBtn.dataset.id = task.id;
	openModal(modal);
}

// Save edited task
if (editForm) {
	editForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const id = parseInt(document.getElementById('edit-id').value);
		const task = tasks.find(t => t.id === id);
		if (!task) return;

		const description = document.getElementById('edit-description').value.trim();
		let priority = document.getElementById('edit-priority').value;
		if (priority === '--') priority = null;
		const complete = document.getElementById('edit-complete').checked;
		editError.style.display = 'none';

		try {
			const response = await fetch(`/edit/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ description, priority: priority || null, complete })
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.description || 'Failed to edit task');
			}
			// Update the local tasks array with the response data
			const data = await response.json();
			const updatedTask = data.task;
			const taskIndex = tasks.findIndex(t => t.id === id);
			if (taskIndex !== -1) {
				tasks[taskIndex] = updatedTask;
			}
			if (visibleModal) closeModal(visibleModal);
			renderTasks();
		} catch (error) {
			editError.textContent = error.message;
			editError.style.display = 'block';
		}
	});
}

// Complete task
async function completeTask(event) {
	const id = parseInt(event.target.dataset.id);
	const task = tasks.find(t => t.id === id);
	if (!task) return;

	const complete = event.target.checked;

	try {
		const response = await fetch(`/complete/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ complete })
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.description || 'Failed to complete task');
		}
		// Update the local tasks array with the response data
		const data = await response.json();
		const updatedTask = data.task;
		const taskIndex = tasks.findIndex(t => t.id === id);
		if (taskIndex !== -1) {
			tasks[taskIndex] = updatedTask;
		}
		renderTasks();
	} catch (error) {
		alert('Error: ' + error.message);
		renderTasks();
	}
}

// Delete task
async function deleteTask(event) {
	const id = event.target.dataset.id;
	if (!confirm('Are you sure you want to delete this task?')) return;
	try {
		const response = await fetch(`/delete/${id}`, {
			method: 'DELETE'
		});
		if (!response.ok) throw new Error('Failed to delete task');
		await fetchTasks();
		if (visibleModal) closeModal(visibleModal);
	} catch (error) {
		alert('Error: ' + error.message);
	}
}

// AUTOCOMPLETE ---------------------------------------------------------------

if (addDescription) addDescription.addEventListener('input', (e) => {
	const autocomplete = document.getElementById('autocomplete');
	const query = e.target.value.toLowerCase().trim();
	if (query) {
		const filteredTasks = tasks.filter(task =>
			task.raw_description.toLowerCase().includes(query)
		);
		if (filteredTasks.length) {
			autocomplete.innerHTML = '';
			filteredTasks.sort((a, b) => a.description < b.description ? -1 : 1);
			filteredTasks.forEach(task => {
				const li = document.createElement('li');
				li.textContent = task.raw_description;
				li.dataset.id = task.id;
				li.addEventListener('click', (e) => {
					closeModal(visibleModal);
					autocomplete.classList.add('hide');
					autocomplete.innerHTML = '';
					setTimeout(() => {
						editTask(e.target.dataset.id);
					}, animationDuration);
				});
				autocomplete.appendChild(li);
			});
			autocomplete.classList.remove('hide');
		} else autocomplete.classList.add('hide');
	} else autocomplete.classList.add('hide');

	addDescription.addEventListener('keydown', (e) => {
		const items = autocomplete.querySelectorAll('li');
		if (items.length === 0) return;

		let index = Array.from(items).findIndex(
			item =>item.classList.contains('selected')
		);

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (index < items.length - 1) {
				items[index]?.classList.remove('selected');
				items[index + 1].classList.add('selected');
				items[index + 1].scrollIntoView({ block: 'nearest' });
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (index > 0) {
				items[index].classList.remove('selected');
				items[index - 1].classList.add('selected');
				items[index - 1].scrollIntoView({ block: 'nearest' });
			}
		} else if (e.key === 'Enter' && index >= 0) {
			e.preventDefault();
			closeModal(visibleModal);
			autocomplete.classList.add('hide');
			autocomplete.innerHTML = '';
			setTimeout(() => {
				editTask(items[index].dataset.id);
			}, animationDuration);
		} else if (e.key === 'Tab' && index >= 0) {
			e.preventDefault();
			addDescription.value = items[index].textContent;
			autocomplete.classList.add('hide');
			autocomplete.innerHTML = '';
		}
	});

	autocomplete.addEventListener('mouseover', (e) => {
		if (e.target.tagName === 'LI') {
			autocomplete.querySelectorAll('li').forEach(
				item => item.classList.remove('selected')
			);
			e.target.classList.add('selected');
		}
	});

	document.addEventListener('click', (e) => {
		if (!addDescription.contains(e.target) && !autocomplete.contains(e.target)) {
			autocomplete.classList.add('hide');
		}
	});
});

// ASIDE MENU -----------------------------------------------------------------

function toggleAside() {
	if (!aside) return;
	aside.classList.toggle('open');
}

// Close with a click outside
if (aside) {
	aside.addEventListener("click", (event) => {
		if (aside.classList.contains('open') && event.target == aside)
			toggleAside();
	});
}

window.addEventListener('hashchange', openList);

function closeLists() {
	taskList.classList.add('hide');
	const lists = document.querySelectorAll('.list');
	lists.forEach(list => list.classList.add('hide'));
}

function openList() {
	const hash = location.hash;
	closeLists();
	if (hash && hash.substr(1)) {
		const list = document.getElementById(hash.substr(1));
		if (list) {
			noList.classList.add('hide');
			list.classList.remove('hide');
		} else {
			noList.querySelector('span').textContent = `'${hash.substr(1)}'`;
			noList.classList.remove('hide');
		}
	} else {
		taskList.classList.remove('hide');
		noList.classList.add('hide');
	}
}

// SETTINGS -------------------------------------------------------------------

function openSettings() {
	settingsSortComplete.checked = settings["sort_complete"];
	settingsLists.innerHTML = '';
	if (settings["lists"]) for (let i = 0; i < settings["lists"].length; i++) {
		settingsLists.appendChild(
			createFieldset(
				i + 1,
				settings["lists"][i]["name"],
				settings["lists"][i]["project"]
			)
		);
	}
	openModal(document.getElementById('settings-modal'));
}

// Fetch settings
async function fetchSettings() {
	try {
		const response = await fetch("/settings");
		if (!response.ok) throw new Error('Failed to fetch settings');
		settings = await response.json();
		fetchTasks();
	} catch (error) {
		console.error('Error loading settings:', error);
	}
}

// Update settings
if (settingsForm) {
	settingsForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		let lists = [];
		const sortComplete = settingsSortComplete.checked;
		settingsForm.querySelectorAll('.settings-list').forEach((fieldset) => {
			lists.push({
				name: fieldset.querySelector('.settings-list-name').value,
				project: fieldset.querySelector('.settings-list-project').value
			});
		});
		settingsError.style.display = 'none';

		try {
			const response = await fetch("/settings", {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lists: lists,
					sort_complete: sortComplete
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.description || 'Failed to update settings');
			}
			settings = await response.json();
			renderTasks();
			if (visibleModal) closeModal(visibleModal);
		} catch (error) {
			settingsError.textContent = error.message;
			settingsError.style.display = 'block';
		}
	});
}

function createFieldset(fieldsetId, fieldsetName='', fieldsetProject='') {
	const fieldset = document.createElement('fieldset');
	fieldset.id = `settings-list-${fieldsetId}`;
	fieldset.classList.add('grid', 'settings-list');
	fieldset.innerHTML = `
		<input class="settings-list-name"
			name="settings-list-${fieldsetId}-name"
			placeholder="List Name"
			value="${fieldsetName}"
			required />
		<input class="settings-list-project"
			name="settings-list-${fieldsetId}-project"
			placeholder="Project"
			value="${fieldsetProject}"
			required />
		<button class="contrast"
			data-id="${fieldsetId}"
			type="button"
			onclick="deleteSettingsList(event)">
			<svg width="1em" height="1em"><use xlink:href="#icon-trash"/></svg>
		</button>
	`;
	return fieldset;
}

function addSettingsList(event) {
	event.preventDefault();
	settingsLists.appendChild(createFieldset(settingsLists.children.length + 1));
}

function deleteSettingsList(event) {
	event.preventDefault();
	const fieldset =
		document.getElementById(`settings-list-${event.target.dataset.id}`);
	fieldset.classList.add('hide');
	setTimeout(() => {
		fieldset.remove();
		const fieldsets = document.querySelectorAll('settings-list');
		for (let i = 0; i < fieldsets.length; i++) {
			fieldsets[i].id = `settings-list-${i + 1}`;
			fieldsets[i].querySelector('settings-list-name').id = `settings-list-${i + 1}-name`;
			fieldsets[i].querySelector('settings-list-project').id = `settings-list-${i + 1}-project`;
		}
	}, 100);
}

// DELETE DONE ----------------------------------------------------------------

function createLabel(inputName, inputProject) {
	const label = document.createElement('label');
	label.innerHTML = `
		<input class="delete-switch"
			type="checkbox"
			role="switch"
			data-project="${inputProject}" />
		${inputName}
	`;
	return label;
}

function openDelete() {
	deleteLists.innerHTML = '';
	if (settings["lists"] && settings["lists"].length > 0) {
		deleteLists.appendChild(createLabel("Tasks", "tasks"));
		for (let i = 0; i < settings["lists"].length; i++) {
			deleteLists.appendChild(createLabel(
				settings["lists"][i]['name'],
				settings["lists"][i]['project']
			));
		}
	}
	openModal(document.getElementById('delete-modal'));
}

if (deleteForm) deleteForm.addEventListener('submit', async (e) => {
	e.preventDefault();
	let deleteList = [];
	const deleteSwitches = deleteForm.querySelectorAll('.delete-switch');
	if (deleteSwitches.length > 0) deleteSwitches.forEach((input) => {
		if (input.checked) tasks.forEach((task) => {
			if (task.projects.includes(input.dataset.project) && task.complete)
				deleteList.push(task.id);
		});
	});
	else tasks.forEach((task) => task.complete && deleteList.push(task.id));
	deleteError.style.display = 'none';

	if (deleteList.length < 1) return;

	try {
		const response = await fetch("/delete-multiple", {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(deleteList)
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.description || 'Failed to delete tasks');
		}
		await fetchTasks();
		if (visibleModal) closeModal(visibleModal);
	} catch (error) {
		deleteError.textContent = error.message;
		deleteError.style.display = 'block';
	}
});

// MAIN -----------------------------------------------------------------------

if (taskList) {
	fetchSettings();
}
