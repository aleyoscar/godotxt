const taskTable = document.getElementById('task-list');
const addForm = document.getElementById('add-task-form');
const addError = document.getElementById('add-error');
const filterDescription = document.getElementById('filter-description');
const filterPriority = document.getElementById('filter-priority');
const sortBtns = document.querySelectorAll('.sort-btn');
const sortIcons = document.querySelectorAll('.sort-btn svg');
const completeToggle = document.getElementById('complete-toggle');

let tasks = [];
let sortBy = 'description';
let sortAscending = true;
let filterDesc = '';
let filterPrio = '';
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
		const matchesDesc = filterDesc ? task.description.toLowerCase().includes(filterDesc.toLowerCase()) : true;
		const matchesPrio = filterPrio ? task.priority === filterPrio : true;
		const matchesComp = filterComp ? task.complete === false : true;
		return matchesDesc && matchesPrio && matchesComp;
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
	taskTable.innerHTML = '';
	filteredTasks.forEach(task => {
		const row = document.createElement('tr');
		row.id = `task-${task.id}`;
		row.innerHTML = `
			<td><input class="complete-checkbox" type="checkbox" ${task.complete ? 'checked' : ''} data-id="${task.id}"/></td>
			<td class="strike">${task.priority || ''}</td>
			<td class="strike">${task.description}</td>
			<td>
				<button onclick="editTask(${task.id})"><svg width="1em" height="1em"><use xlink:href="#icon-edit"/></svg></button>
				<button class="outline contrast" onclick="deleteTask(${task.id})"><svg width="1em" height="1em"><use xlink:href="#icon-x"/></svg></button>
			</td>
		`;
		taskTable.appendChild(row);
	});

	// Add event listeners for checkboxes
	document.querySelectorAll('.complete-checkbox').forEach(checkbox => {
		checkbox.addEventListener('change', async (e) => {
			const id = parseInt(e.target.dataset.id);
			const task = tasks.find(t => t.id === id);
			if (!task) return;
			const complete = e.target.checked;
			try {
				await saveTask(id, task.description, task.priority, complete);
			} catch (error) {
				e.target.checked = !complete; // Revert checkbox on error
				alert('Error: ' + error.message);
			}
		});
	});
}

// Apply filters
function applyFilters() {
	filterDesc = filterDescription.value.trim();
	filterPrio = filterPriority.value.trim().toUpperCase();
	if (filterPrio && !/^[A-Z]$/.test(filterPrio)) {
		alert('Priority filter must be a single uppercase letter (A-Z).');
		filterPriority.value = '';
		filterPrio = '';
	}
	renderTasks();
}

// Toggle complete filter
function toggleCompleteFilter(setComplete) {
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
	filterDescription.value = '';
	filterPriority.value = '';
	filterDesc = '';
	filterPrio = '';
	toggleCompleteFilter(false);
	renderTasks();
}

// Toggle sort
sortBtns.forEach((btn) => btn.addEventListener('click', (e) => {
	if (sortBy === e.target.dataset.sort) sortAscending = !sortAscending;
	const newIcon = sortAscending ? '#icon-caret-down' : '#icon-caret-up';
	sortBy = e.target.dataset.sort;
	sortIcons.forEach((icon) => icon.querySelector('use').setAttribute('xlink:href', newIcon));
	e.target.querySelector('use').setAttribute('xlink:href', `${newIcon}-fill`);
	renderTasks();
}));

// Add task
addForm.addEventListener('submit', async (e) => {
	e.preventDefault();
	const description = document.getElementById('description').value.trim();
	const priority = document.getElementById('priority').value.trim().toUpperCase();
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
	} catch (error) {
		addError.textContent = error.message;
		addError.style.display = 'block';
	}
});

// Edit task
async function editTask(id) {
	const task = tasks.find(t => t.id === id);
	if (!task) return;

	const row = taskTable.querySelector(`#task-${id}`);
	if (!row) return;

	row.innerHTML = `
		<td><input type="checkbox" class="edit-complete" ${task.complete ? 'checked' : ''} /></td>
		<td><input type="text" value="${task.priority || ''}" maxlength="1" class="edit-priority"></td>
		<td><input type="text" value="${task.description}" class="edit-description"></td>
		<td>
			<button onclick="saveTask(
				${id},
				document.querySelector('.edit-description').value.trim(),
				document.querySelector('.edit-priority').value.trim().toUpperCase(),
				document.querySelector('.edit-complete').checked)"><svg width="1em" height="1em"><use xlink:href="#icon-check"/></svg></button>
			<button class="secondary" onclick="renderTasks()"><svg width="1em" height="1em"><use xlink:href="#icon-cancel"/></svg></button>
		</td>
	`;
}

// Save edited task
async function saveTask(id, description, priority, complete) {
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
		renderTasks();
	} catch (error) {
		alert('Error: ' + error.message);
		renderTasks();
	}
}

// Delete task
async function deleteTask(id) {
	if (!confirm('Are you sure you want to delete this task?')) return;
	try {
		const response = await fetch(`/delete/${id}`, {
			method: 'DELETE'
		});
		if (!response.ok) throw new Error('Failed to delete task');
		await fetchTasks();
	} catch (error) {
		alert('Error: ' + error.message);
	}
}

fetchTasks();
