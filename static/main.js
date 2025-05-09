
// CONSTANTS ------------------------------------------------------------------

const taskList = document.getElementById('task-list');
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

// HELPERS --------------------------------------------------------------------

// Get date in YYYY-MM-DD format
function getDateString(date) {
	const yyyy = date.getUTCFullYear();
	const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(date.getUTCDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

// LIST -----------------------------------------------------------------------

// Fetch tasks from API
async function fetchTasks() {
	try {
		const response = await fetch("/list");
		if (!response.ok) throw new Error('Failed to fetch tasks');
		const data = await response.json();
		tasks = data.tasks;
		renderTasks();
	} catch (error) {
		console.error('Error loading tasks:', error);
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
		<hgroup class="pointer flex-grow hover-background show-hover-parent"
			onclick="editTask(${task.id})">
			<h5 class="flex space-between ${task.complete ? 'muted-color strike' : ''}">
				<span>${taskSub} ${taskDesc}</span>
				<svg class="show-hover" width="1em" height="1em">
					<use xlink:href="#icon-edit"/>
				</svg>
			</h5>
			<p class="flex gap-xs align-center">${taskDates}</p>
		</hgroup>
	`;
}

// Render tasks with sorting & filtering
function renderTasks() {
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
		const matchesSearch = filterSearch ? task.raw_description.toLowerCase().includes(filterSearch.toLowerCase()) : true;
		const matchesComplete = filterComplete ? task.complete === false : true;
		const matchesProjects = filterProjects.length > 0 ? task.projects.some(t => filterProjects.includes(t)) : true;
		const matchesContexts = filterContexts.length > 0 ? task.contexts.some(t => filterContexts.includes(t)) : true;
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

	// Render tasks
	taskList.innerHTML = '';
	filteredTasks.forEach(task => {
		const row = document.createElement('li');
		row.id = `task-${task.id}`;
		row.classList.add('flex');
		row.innerHTML = parseTask(task);
		taskList.appendChild(row);
	});

	// Show 'Show All' button if filters in place
	if (showAll) {
		if (filteredTasks.length < tasks.length) showAll.classList.remove('hide');
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
	toggleComplete(false);
	showAll.classList.add('hide');
	clearSearch();
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
});

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

if (addForm) fetchTasks();
