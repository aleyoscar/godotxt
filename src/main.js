
import { openFile, readFile, saveFile } from './file.js';
import { visibleModal, toggleModal, openModal, closeModal } from './modal.js';
import { Task, TodoTxt } from './todotxt.js';
import { load } from '@tauri-apps/plugin-store';

// CONSTANTS ------------------------------------------------------------------

const DOM = {
	aside: document.querySelector('aside'),
	autocomplete: document.getElementById('autocomplete'),
	clearAttributesBtns: document.querySelectorAll('.clear-attributes-btn'),
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
	filterAttributeBtns: document.querySelectorAll('.filter-attribute-btn'),
	groupBtn: document.getElementById('group-btn'),
	groupBtns: document.getElementById('group-btns'),
	groupClearBtn: document.getElementById('group-clear-btn'),
	groupSortBtns: document.querySelectorAll('.group-sort-btn'),
	listTitle: document.getElementById('list-title'),
	logo: document.getElementById('logo'),
	menuOpenFile: document.getElementById('menu-open-file'),
	noList: document.getElementById('no-list'),
	pickFile: document.getElementById('pick-file'),
	projectsBtn: document.getElementById('projects-btn'),
	projectsModal: document.getElementById('projects-modal'),
	search: document.getElementById('search'),
	searchBtn: document.getElementById('search-btn'),
	showAll: document.getElementById('show-all'),
	sortBtns: document.getElementById('sort-btns'),
	sortByText: document.getElementById('sortby-text'),
	sortByToggle: document.getElementById('sortby-toggle'),
	sortDefaultBtn: document.getElementById('sort-priority'),
	sortToggle: document.getElementById('sort-toggle'),
	status: document.getElementById('status'),
	taskList: document.getElementById('tasks'),
	toggleModals: document.querySelectorAll('.toggle-modal'),
}

const STORE_FILE = 'store.json';
const KEY_TODO_PATH = 'todo-path';
const KEY_SORT_ASCENDING = 'sort-ascending'; // Boolean
const KEY_SORT_GROUP = 'sort-group'; // String
const KEY_SORT_TYPE = 'sort-type'; // String
const KEY_SHOW_COMPLETE = 'show-complete'; // Boolean
const KEY_FILTER_CONTEXTS = 'filter-contexts'; // Array
const KEY_FILTER_LIST = 'filter-list'; // String
const KEY_FILTER_PROJECTS = 'filter-projects'; // Array

let store = null;
let todos = [];
let filterSearch = '';

const regex = {
	project: /\+[A-Za-z0-9_-]+/g,
	context: /@[A-Za-z0-9_-]+/g,
	projectSingle: /^\+[A-Za-z0-9_-]+$/,
	contextSingle: /^@[A-Za-z0-9_-]+$/,
	url: /(https?:\/\/|ftp:\/\/|www\.)[\w\-%.]+\.[a-z]{2,}(?:[\/\w\-.$?=&%#:]*)?/gi,
};

// HELPERS --------------------------------------------------------------------

const clearBtn = Object.assign(document.createElement('button'), {
	className: 'secondary',
	textContent: 'Clear',
	onclick: clearSearch,
});

const getDateString = (date) => {
	const d = new Date(date ? date : Date.now());
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

const toggleLoading = (show) => {
	document.querySelectorAll('.loading').forEach(el => el.classList.toggle('hide', !show));
};

const cleanString = (text) => text.trim().replace(/\s+/g, ' ');

function stdout(message, ...args) {
	console.log(message, ...args);
	DOM.status.textContent(message);
	DOM.status.classList.remove('error');
}

function stderr(message, ...args) {
	console.error(message, ...args);
	DOM.status.textContent(message);
	DOM.status.classList.add('error');
}

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// DOM.todosForm.addEventListener("submit", async (e) => {
// 	e.preventDefault();
// 	const formData = new FormData(e.currentTarget);
// 	const content = formData.get('todos-textarea');
// 	const todoPath = await store.get(KEY_TODO_PATH);
// 	if (todoPath) {
// 		await saveFile(todoPath, content);
// 	} else {
// 		console.error(`No todo.txt path set`);
// 		return;
// 	}
// });

// RENDER ---------------------------------------------------------------------

function parseTask(task) {
	const taskSub = task.priority ? `<a>(${task.priority})</a>` : '';
	const taskDates = [
		task.creationDate ? `<small><svg width="1em" height="1em"><use xlink:href="#icon-calendar"/></svg> ${getDateString(task.creationDate)}</small>` : '',
		task.completionDate ? `<small><ins><svg width="1em" height="1em"><use xlink:href="#icon-calendar-check"/></svg> ${getDateString(task.completionDate)}</ins></small>` : '',
	].join('');

	let taskDesc = task.raw.replace(regex.project, match =>
		task.projects.includes(match.slice(1))
			? `<a data-attribute="projects" data-name="${match.slice(1)}" onclick="selectAttribute(event)">${match}</a>`
			: match
	).replace(regex.context, match =>
		task.contexts.includes(match.slice(1))
			? `<a class="contrast" data-attribute="contexts" data-name="${match.slice(1)}" onclick="selectAttribute(event)">${match}</a>`
			: match
	).replace(regex.url, (match) => {
		const href = match.startsWith('http') ? match : 'https://' + match;
		const label = new URL(href).hostname.replace(/^www\./i, '').split('.').slice(-2, -1)[0];
		return `<a class="task-link secondary" href=${href} target="_blank" rel="noopener noreferrer">
			<svg width="1em" height="1em"><use xlink:href="#icon-link"/></svg>${label}</a>`;
	});

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

async function renderTasks() {
	const filterProjects = await store.get(KEY_FILTER_PROJECTS);
	const filterContexts = await store.get(KEY_FILTER_CONTEXTS);
	const showComplete = await store.get(KEY_SHOW_COMPLETE);
	const sortAscending = await store.get(KEY_SORT_ASCENDING);
	const sortType = await store.get(KEY_SORT_TYPE);
	const group = await store.get(KEY_SORT_GROUP);

	// Update aside menu
	const listUl = DOM.aside?.querySelector('ul');
	if (listUl) {
		DOM.logo.classList.toggle('hide-sm', todos.projects?.length);
		DOM.logo.nextElementSibling.classList.toggle('hide', !todos.projects?.length);
		DOM.aside.classList.toggle('hide', !todos.projects?.length);
		while (listUl.children.length > 1) listUl.lastElementChild.remove();
		todos.projects?.forEach(project => {
			listUl.insertAdjacentHTML('beforeend', `
				<li><a id="list-${project}" class="contrast" href="#${project}" onclick="toggleAside()" data-title="${project}">${project}</a></li>
			`);
		});
	}

	// Populate project & context dropdowns
	const updateModal = (modal, btn, items, attribute, checkedItems) => {
		if (!items) {
			modal.querySelector('ul').innerHTML = '';
			btn.toggleAttribute('disabled', !items);
			btn.classList.toggle('secondary', !items);
		} else {
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
		}
	};
	updateModal(DOM.projectsModal, DOM.projectsBtn, todos.projects, 'projects', filterProjects);
	updateModal(DOM.contextsModal, DOM.contextsBtn, todos.contexts, 'contexts', filterContexts);

	// Get list hash
	const hash = location.hash.slice(1) || '';
	let filterList = '';
	let listTitle = 'Tasks';
	DOM.noList.classList.add('hide');
	if (hash && hash !== 'tasks' && document.getElementById(`list-${hash}`)) {
		filterList = hash;
		listTitle = document.getElementById(`list-${hash}`).dataset.title
	} else if (hash && hash !== 'tasks' && !document.getElementById(`list-${hash}`)) {
		DOM.noList.querySelector('span').textContent = hash;
		DOM.noList.classList.remove('hide');
	}
	DOM.listTitle.textContent = listTitle;

	// Filter todos
	let filteredTasks = todos.tasks ? todos.tasks
		.filter(task => (
			(!filterSearch || task.raw.toLowerCase().includes(filterSearch.toLowerCase())) &&
			(showComplete ? true : !task.isCompleted) &&
			(!filterProjects.length || task.projects.some(p => filterProjects.includes(p))) &&
			(!filterContexts.length || task.contexts.some(c => filterContexts.includes(c))) &&
			(!filterList || task.projects.includes(filterList))
		)) : [];

	// Sort todos
	const dir = sortAscending ? 1 : -1;
	const sortByDefault = (a, b) => {
		const valA = a.toString().toLowerCase();
		const valB = b.toString().toLowerCase();
		return valA < valB ? -1 * dir : valA > valB ? 1 * dir : 0;
	}
	const sortByDescription = (a, b) => {
		const valA = a.description.toLowerCase();
		const valB = b.description.toLowerCase();
		return valA < valB ? -1 * dir : valA > valB ? 1 * dir : 0;
	}
	const sortByPriority = (a, b) => {
		const valA = a.priority;
		const valB = b.priority;
		return valA < valB ? -1 * dir : valA > valB ? 1 * dir : 0;
	}
	const sortByDate = (a, b) => {
		const valA = a.creationDate ? a.creationDate : '';
		const valB = b.creationDate ? b.creationDate : '';
		return valA < valB ? -1 * dir : valA > valB ? 1 * dir : 0;
	}
	switch(sortType) {
		case 'description':
			filteredTasks = filteredTasks.sort(sortByDefault).sort(sortByDescription);
			break;
		case 'date':
			filteredTasks = filteredTasks.sort(sortByDefault).sort(sortByDate);
			break;
		default:
			filteredTasks = filteredTasks.sort(sortByDefault);
	}

	for (let i = 0; i < filteredTasks.length; i++) {
		filteredTasks[i].html = `
			<li id="task-${filteredTasks[i].id}" class="flex align-center hover-background padding-xs show-hover-parent ${filteredTasks[i].projects.map(p => `project-${p}`).join(' ')} ${filteredTasks[i].contexts.map(c => `context-${c}`).join(' ')}">
				${parseTask(filteredTasks[i])}
			</li>
		`;
	}

	// Group todos
	DOM.taskList.querySelector('ul').innerHTML = '';
	switch(group) {
		case 'project':
			todos.projects.forEach(tag => {
				if (filteredTasks.filter(task => task.projects.includes(tag)).length) {
					DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>+${tag}</h5></li><li class="group"><hr></li>`;
					DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => task.projects.includes(tag) ? task.html : '').join('');
				}
			});
			if (filteredTasks.filter(task => !task.projects.length)) {
				DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>No project</h5></li><li class="group"><hr></li>`;
				DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => !task.projects.length ? task.html : '').join('');
			}
			break;
		case 'context':
			todos.contexts.forEach(tag => {
				if (filteredTasks.filter(task => task.contexts.includes(tag)).length) {
					DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>@${tag}</h5></li><li class="group"><hr></li>`;
					DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => task.contexts.includes(tag) ? task.html : '').join('');
				}
			});
			if (filteredTasks.filter(task => !task.contexts.length)) {
				DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>No context</h5></li><li class="group"><hr></li>`;
				DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => !task.contexts.length ? task.html : '').join('');
			}
			break;
		case 'priority':
			todos.priorities.forEach(priority => {
				if (priority && filteredTasks.filter(task => task.priority === priority).length) {
					DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>Priority '${priority}'</h5></li><li class="group"><hr></li>`;
					DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => task.priority === priority ? task.html : '').join('');
				}
			});
			if (filteredTasks.filter(task => !task.priority)) {
				DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>No priority</h5></li><li class="group"><hr></li>`;
				DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => !task.priority ? task.html : '').join('');
			}
			break;
		default:
			// Render todos
			DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => task.html).join('');
	}

	// Update showAll button visibility
	if (DOM.showAll) {
		DOM.showAll.classList.toggle('hide', !(filterSearch || filterProjects.length || filterContexts.length));
	}

	// Update task links to stop propagation
	document.querySelectorAll('.task-link').forEach((link) => {
		link.addEventListener('click', (e) => {
			e.stopPropagation();
		});
	});
}

// FILTER/SORT ----------------------------------------------------------------

async function clearAttributeFilters() {
	await store.set(KEY_FILTER_PROJECTS, []);
	await store.set(KEY_FILTER_CONTEXTS, []);
	await store.save();
	DOM.projectsBtn.classList.add('outline');
	DOM.contextsBtn.classList.add('outline');
}

DOM.clearAttributesBtns.forEach((b) => {
	b.addEventListener('click', (e) => {
		e.currentTarget.parentNode.parentNode.querySelectorAll('input')
			.forEach(i => i.checked = false);
		setAttributeFilters(e);
	});
});

function selectAttribute(event) {
	event.stopPropagation();
	event.preventDefault();
	const { attribute, name } = event.target.dataset;
	document.querySelectorAll('.attribute-filter').forEach(input => {
		input.checked = input.dataset.attribute === attribute && input.name === name;
	});
	filterAttribute();
}

async function setAttributeFilters(e) {
	const currentTarget = e.currentTarget;
	const filterProjects = [];
	const filterContexts = [];
	// await clearAttributeFilters();
	DOM.projectsBtn.classList.add('outline');
	DOM.contextsBtn.classList.add('outline');
	document.querySelectorAll('.attribute-filter').forEach(input => {
		if (input.checked) {
			const target = input.dataset.attribute === 'projects' ? filterProjects : filterContexts;
			target.push(input.name);
			DOM[input.dataset.attribute === 'projects' ? 'projectsBtn' : 'contextsBtn'].classList.remove('outline');
		}
	});
	await store.set(KEY_FILTER_PROJECTS, filterProjects);
	await store.set(KEY_FILTER_CONTEXTS, filterContexts);
	await store.save();
	await renderTasks();
	toggleModal(e, currentTarget);
}

DOM.filterAttributeBtns.forEach((b) => {
	b.addEventListener('click', setAttributeFilters);
});

function clearFilters() {
	clearSearch();
	[DOM.projectsModal, DOM.contextsModal].forEach(modal => modal.querySelectorAll('input').forEach(i => i.checked = false));
	filterAttribute();
}

DOM.completeToggle.addEventListener('click', async (e) => {
	const showComplete = !await store.get(KEY_SHOW_COMPLETE);
	const newIcon = showComplete ? '#icon-eye-fill' : '#icon-eye';
	DOM.completeToggle.classList.toggle('outline', !showComplete);
	DOM.completeToggle.querySelector('use').setAttribute('xlink:href', newIcon);
	await store.set(KEY_SHOW_COMPLETE, showComplete);
	await store.save();
	await renderTasks();
});

DOM.search.addEventListener('input', (e) => {
	filterSearch = e.target.value.trim();
	if (filterSearch) DOM.search.parentElement.appendChild(clearBtn);
	else clearSearch();
	renderTasks();
});

function clearSearch() {
	DOM.search.value = '';
	filterSearch = '';
	clearBtn.remove();
	renderTasks();
}

DOM.sortToggle.addEventListener('click', async (e) => {
	const sortAscending = !await store.get(KEY_SORT_ASCENDING);
	const newIcon = sortAscending ? '#icon-caret-down' : '#icon-caret-up-fill';
	DOM.sortToggle.classList.toggle('outline', sortAscending);
	DOM.sortToggle.querySelector('use').setAttribute('xlink:href', newIcon);
	await store.set(KEY_SORT_ASCENDING, sortAscending);
	await store.save();
	await renderTasks();
});

async function sortBy(type) {
	Array.from(DOM.sortBtns.children).forEach((btn) => {
		btn.classList.toggle('outline', !btn.id.includes(type));
	});
	DOM.sortByToggle.classList.toggle('outline', !DOM.sortDefaultBtn.classList.contains('outline'));
	DOM.sortByText.textContent = capitalize(type);
	await store.set(KEY_SORT_TYPE, type);
	await store.save();
	await renderTasks();
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

// GROUP ----------------------------------------------------------------------

DOM.groupSortBtns.forEach((b) => {
	b.addEventListener('click', async (e) => {
		const currentTarget = e.currentTarget;
		const type = currentTarget.dataset.group;
		let group = await store.get(KEY_SORT_GROUP);
		group = group === type ? 'none' : type;
		const newIcon = group === 'none' ? '#icon-group' : '#icon-group-fill';
		DOM.groupBtn.classList.toggle('outline', group === 'none');
		DOM.groupBtn.querySelector('use').setAttribute('xlink:href', newIcon);
		Array.from(DOM.groupBtns.children).forEach((btn) => {
			btn.classList.toggle('outline', !btn.id.includes(group));
		});
		await store.set(KEY_SORT_GROUP, group);
		await store.save();
		await renderTasks();
		toggleModal(e, currentTarget);
		DOM.groupClearBtn.classList.toggle('hide', group === 'none');
	});
});

// EVENT LISTENERS ------------------------------------------------------------

DOM.toggleModals.forEach((m) => { m.addEventListener('click', toggleModal) });
DOM.sortBtns.querySelectorAll('button').forEach((b) => {
	b.addEventListener('click', (e) => {
		sortBy(e.currentTarget.dataset.sort);
		toggleModal(e);
	});
});

DOM.menuOpenFile.addEventListener("click", async (e) => {
	e.preventDefault();
	const todoPath = await openFile();
	if (todoPath) {
		await store.set(KEY_TODO_PATH, todoPath);
		console.log('Selected file:', todoPath);
		await store.save();
		await setContent(todoPath);
	} else {
		console.log('No file selected');
	}
});

async function setContent(path) {
	toggleLoading(true);
	try {
		const content = await readFile(path);
		todos = new TodoTxt(content);
		console.log('Set content successfully');
		await renderTasks();
	} catch (err) {
		console.error('Failed to set content', err);
	} finally {
		toggleLoading(false);
	}
}

async function loadPersistedTodo() {
	try {
		const todoPath = await store.get(KEY_TODO_PATH);
		if (todoPath) {
			console.log(`Loaded persisted file: ${todoPath}`);
			await setContent(todoPath);
		} else {
			console.log(`No todo.txt file set. Please open a todo.txt file`);
		}
	} catch (err) {
		console.error(`Unable to load persisted todo file`, err);
	}
}

async function loadStore() {
	try {
		store = await load(STORE_FILE, { autosave: false });
		if (!await store.has(KEY_SORT_ASCENDING)) await store.set(KEY_SORT_ASCENDING, true);
		if (!await store.has(KEY_SORT_GROUP)) await store.set(KEY_SORT_GROUP, 'none');
		if (!await store.has(KEY_SORT_TYPE)) await store.set(KEY_SORT_TYPE, 'priority');
		if (!await store.has(KEY_SHOW_COMPLETE)) await store.set(KEY_SHOW_COMPLETE, false);
		if (!await store.has(KEY_FILTER_CONTEXTS)) await store.set(KEY_FILTER_CONTEXTS, []);
		if (!await store.has(KEY_FILTER_LIST)) await store.set(KEY_FILTER_LIST, '');
		if (!await store.has(KEY_FILTER_PROJECTS)) await store.set(KEY_FILTER_PROJECTS, []);
		await store.save();
		console.log(`Loaded store`);
	} catch (err) {
		console.error(`Unable to load store`, err);
	}
}

async function startup() {
	await loadStore();
	await loadPersistedTodo();
}

startup();
