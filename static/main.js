const taskList = document.getElementById('task-list');
const addForm = document.getElementById('add-task-form');
const addError = document.getElementById('add-error');
const editForm = document.getElementById('edit-task-form');
const editError = document.getElementById('edit-error');
const searchBtn = document.getElementById('search');
const filterPriority = document.getElementById('filter-priority');
const sortBtns = document.querySelectorAll('.sort-btn');
const sortIcons = document.querySelectorAll('.sort-btn svg');
const completeToggle = document.getElementById('complete-toggle');
const showAll = document.getElementById('show-all');

let tasks = [];
let sortBy = 'description';
let sortAscending = true;
let filterSearch = '';
// let filterPrio = '';
let filterComp = false;

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

// Render tasks with sorting & filtering
function renderTasks() {
	// Filter tasks
	let filteredTasks = tasks.filter(task => {
		const matchesSearch = filterSearch ? task.description.toLowerCase().includes(filterSearch.toLowerCase()) : true;
		const matchesComp = filterComp ? task.complete === false : true;
		return matchesSearch && matchesComp;
	});

	//Sort tasks
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

	// Render tasks
	taskList.innerHTML = '';
	filteredTasks.forEach(task => {
		const row = document.createElement('li');
		row.id = `task-${task.id}`;
		row.classList.add('flex');
		row.innerHTML = `
			<input type="checkbox" ${task.complete ? 'checked' : ''} data-id="${task.id}" onclick="completeTask(event)"/>
			<hgroup class="pointer flex-grow hover-background" onclick="editTask(${task.id})">
				<h6 class="flex space-between show-hover-parent">${task.description}<svg class="show-hover" width="1em" height="1em"><use xlink:href="#icon-edit"/></svg></h6>
				<p>${task.priority || ''}</p>
			</hgroup>
		`;
		taskList.appendChild(row);
	});

	// Show 'Show All' button if filters in place
	if (filteredTasks.length < tasks.length) showAll.classList.remove('hide');
	else showAll.classList.add('hide');
}

// Apply filters
function search() {
	filterSearch = searchBtn.value.trim();
	// filterPrio = filterPriority.value.trim().toUpperCase();
	// if (filterPrio && !/^[A-Z]$/.test(filterPrio)) {
	// 	alert('Priority filter must be a single uppercase letter (A-Z).');
	// 	filterPriority.value = '';
	// 	filterPrio = '';
	// }
	renderTasks();
}

// Toggle complete filter
function toggleComplete(setComplete) {
	filterComp = setComplete;
	newIcon = '#icon-eye';
	if (!filterComp) {
		newIcon += '-fill';
		completeToggle.classList.add('outline');
	} else completeToggle.classList.remove('outline');
	completeToggle.querySelector('use').setAttribute('xlink:href', newIcon);
	renderTasks();
}

// Clear filters
function clearFilters() {
	searchBtn.value = '';
	// filterPriority.value = '';
	filterSearch = '';
	// filterPrio = '';
	toggleComplete(false);
	showAll.classList.add('hide');
	renderTasks();
}

// Toggle sort
function sortTasks(event) {
	if (sortBy === event.target.dataset.sort) sortAscending = !sortAscending;
	const newIcon = sortAscending ? '#icon-caret-down' : '#icon-caret-up';
	sortBy = event.target.dataset.sort;
	sortBtns.forEach((btn) => btn.classList.add('outline'));
	sortIcons.forEach((icon) => icon.querySelector('use').setAttribute('xlink:href', newIcon));
	event.target.querySelector('use').setAttribute('xlink:href', `${newIcon}-fill`);
	event.target.classList.remove('outline');
	renderTasks();
}

// Add task
addForm.addEventListener('submit', async (e) => {
	e.preventDefault();
	const description = document.getElementById('add-description').value.trim();
	const priority = document.getElementById('add-priority').value.trim().toUpperCase();
	const complete = false;
	addError.style.display = 'none';

	try {
		const response = await fetch("/add", {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ description, priority: priority || null , complete})
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

// Edit task
function editTask(id) {
	const task = tasks.find(t => t.id === id);
	if (!task) return;

	const modal = document.getElementById(`edit-task-modal`);
	const modalForm = document.getElementById('edit-task-form');
	const deleteBtn = document.getElementById('delete-task-btn');

	modalForm.innerHTML = `
		<fieldset>
			<input type="hidden" id="edit-id" value="${task.id}" />
			<label>Priority
				<input type="text" id="edit-priority" placeholder="Priority (A-Z, optional)" value="${task.priority || ''}" maxlength="1" />
			</label>
			<label>Task
				<input type="text" id="edit-description" placeholder="Task description (e.g., Milk)" value="${task.description}" required>
			</label>
			<label>
				<input type="checkbox" id="edit-complete" role="switch" ${task.complete ? 'checked' : ''} />
				Completed
			</label>
		</fieldset>
	`;
	deleteBtn.dataset.id = task.id;

	openModal(modal);
}

// Save edited task
editForm.addEventListener('submit', async (e) => {
	e.preventDefault();
	const id = parseInt(document.getElementById('edit-id').value);
	const task = tasks.find(t => t.id === id);
	if (!task) return;

	const description = document.getElementById('edit-description').value.trim();
	const priority = document.getElementById('edit-priority').value.trim().toUpperCase();
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
	console.log(event.target);
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

fetchTasks();
