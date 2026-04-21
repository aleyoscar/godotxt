import { DOM } from './dom.js';
import { capitalize, stderr, stdout, getDateString, debug } from './utils.js';
import { STATE } from './state.js';
import { KEYS, REGEX } from './constants.js';
import { readFile } from './file.js';
import { TodoTxt } from './todotxt.js';
import { completeTask, deleteTag } from './manage.js';
import { toggleModal } from './modal.js';
import * as refine from './refine.js';
import { getTaskHtml, createGroupHeader } from './components.js';

export function populateTags() {
	debug('populateTags');
	const taskTags = {
		projects: { regex: REGEX.project, container: DOM.editProjects, classes: 'background-primary mr-xs mb-xs' },
		contexts: { regex: REGEX.context, container: DOM.editContexts, classes: 'mr-xs mb-xs' },
	};

	Object.values(taskTags).forEach(({ regex, container, classes }) => {
		const span = container.querySelector('span');
		const icon = container.querySelector('i');
		span.innerHTML = '';
		icon.classList.toggle('hide', !!DOM.editDescription.value.match(regex));
		(DOM.editDescription.value.match(regex) || []).forEach(tag => {
			const kbd = document.createElement('kbd');
			const b = document.createElement('b');
			kbd.className = classes;
			kbd.textContent = `${tag} `;
			b.classList.add('pointer');
			b.innerHTML = '<svg width="1em" height="1em"><use xlink:href="#icon-x"/></svg>';
			kbd.appendChild(b);
			span.appendChild(kbd);
		});
	});
}

export function toggleDeleteTask(e) {
	DOM.deleteTaskBtn.classList.toggle('hide');
	const newIcon = DOM.deleteTaskBtn.classList.contains('hide') ? '#icon-trash' : '#icon-cancel';
	DOM.openDeleteTaskBtn.querySelector('use').setAttribute('xlink:href', newIcon);
}

export function toggleAside() {
	DOM.aside?.classList.toggle('open');
}

export async function togglePickFile() {
	const todoPath = STATE.todoPath;
	DOM.pickFile.classList.toggle('hide', todoPath);
	DOM.taskList.classList.toggle('hide', !todoPath);
	DOM.closeFileBtnWrapper.classList.toggle('hide', !todoPath);
	DOM.aside.classList.toggle('hide', !todoPath);
}

export async function renderTasks() {
	debug('renderTasks');
	// Filter todos
	let filteredTasks = STATE.todos?.tasks ? STATE.todos.tasks
		.filter(task => (
			(!STATE.filterSearch || task.raw.toLowerCase().includes(STATE.filterSearch.toLowerCase())) &&
			(STATE.showComplete ? true : !task.completed) &&
			(!STATE.filterPriorities.length || STATE.filterPriorities.includes(task.priority)) &&
			(!STATE.filterProjects.length || task.projects.some(p => STATE.filterProjects.includes(p))) &&
			(!STATE.filterContexts.length || task.contexts.some(c => STATE.filterContexts.includes(c))) &&
			(!STATE.filterList || task.projects.includes(STATE.filterList))
		)) : [];

	// Sort todos
	const dir = STATE.sortAscending ? 1 : -1;
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
	switch(STATE.sortType) {
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
		filteredTasks[i].element = getTaskHtml(filteredTasks[i]);
	}

	// Group todos
	DOM.taskListUl.innerHTML = '';

	const fragment = document.createDocumentFragment();

	const { prefix = '', emptyLabel, getKey, formatLabel } = {
		project:  { prefix: '+',    getKey: t => t.projects?.[0] || '', emptyLabel: 'No project' },
		context:  { prefix: '@',    getKey: t => t.contexts?.[0] || '', emptyLabel: 'No context' },
		priority: { prefix: '',     getKey: t => t.priority || '',      emptyLabel: 'No priority', label: p => `Priority '${p}'` },
	}[STATE.sortGroup] || {};

	if (!prefix && !emptyLabel) filteredTasks.forEach(t => fragment.appendChild(t.element));
	else {
		const grouped = filteredTasks.reduce((acc, t) => {
			const key = getKey(t);
			acc[key] = acc[key] || [];
			acc[key].push(t);
			return acc;
		}, {});

		const namedGroups = Object.entries(grouped)
			.filter(([key]) => key !== '')
			.sort(([a], [b]) => dir * a.toLowerCase().localeCompare(b.toLowerCase()));
		const noGroups = grouped[''];

		namedGroups.forEach(([key, tasks]) => {
			const title = formatLabel ? formatLabel(key) : `${prefix}${key}`;
			fragment.appendChild(createGroupHeader(title));
			tasks.forEach(t => fragment.appendChild(t.element));
		});

		if (noGroups?.length) {
			fragment.appendChild(createGroupHeader(emptyLabel));
			noGroups.forEach(t => fragment.appendChild(t.element));
		}
	}

	DOM.taskListUl.appendChild(fragment);

	// Update showAll button visibility
	DOM.showAllBtn.classList.toggle('hide',
		!(STATE.filterSearch ||
		STATE.filterProjects.length ||
		STATE.filterContexts.length ||
		STATE.filterList ||
		STATE.filterPriorities.length));

	resizeScrollLists();
}

export function populateRefine() {
	debug('populateRefine');
	populateFilterContexts();
	populateFilterList();
	populateFilterPriorities();
	populateFilterProjects();

	toggleFilterContexts();
	toggleFilterList();
	toggleFilterPriorities();
	toggleFilterProjects();
	toggleShowComplete();
	toggleSortAscending();
	toggleSortGroup();
	toggleSortType();
}

function populateFilterPriorities() {
	if (STATE.todos && STATE.todos.priorities.length) {
		DOM.filterPrioritiesBtn.classList.remove('secondary');
		DOM.filterPrioritiesBtn.removeAttribute('disabled');
	} else {
		DOM.filterPrioritiesBtn.classList.add('secondary');
		DOM.filterPrioritiesBtn.setAttribute('disabled', true);
	}
	DOM.filterPrioritiesBtns.querySelectorAll('button').forEach((b) => {
		const hasPriority = STATE.todos !== null && STATE.todos.priorities.includes(b.textContent.trim());
		if (hasPriority) b.removeAttribute('disabled');
		else b.setAttribute('disabled', true);
		b.classList.toggle('secondary', !hasPriority)
	});
}

function populateFilterProjects() {
	DOM.filterProjectsList.innerHTML = '';
	STATE.todos?.projects.forEach((p) => {
		const button = document.createElement('button');
		button.classList.add('filter-projects-btn', 'outline');
		button.dataset.project = p;
		button.addEventListener('click', refine.setFilterProjects);
		button.textContent = p;
		DOM.filterProjectsList.appendChild(button);
	});
	if (!STATE.todos?.projects.length) DOM.filterProjectsBtn.setAttribute('disabled', true);
	else DOM.filterProjectsBtn.removeAttribute('disabled');
	DOM.filterProjectsBtn.classList.toggle('secondary', !STATE.todos?.projects.length);
}

function populateFilterContexts() {
	DOM.filterContextsList.innerHTML = '';
	STATE.todos?.contexts.forEach((c) => {
		const button = document.createElement('button');
		button.classList.add('filter-contexts-btn', 'outline');
		button.dataset.context = c;
		button.addEventListener('click', refine.setFilterContexts);
		button.textContent = c;
		DOM.filterContextsList.appendChild(button);
	});
	if (!STATE.todos?.contexts.length) DOM.filterContextsBtn.setAttribute('disabled', true);
	else DOM.filterContextsBtn.removeAttribute('disabled');
	DOM.filterContextsBtn.classList.toggle('secondary', !STATE.todos?.contexts.length);
}

function populateFilterList() {
	DOM.filterList.innerHTML = '';
	DOM.logo.classList.toggle('hide-sm', STATE.todos?.projects.length);
	DOM.logo.nextElementSibling.classList.toggle('hide', !STATE.todos?.projects.length);
	DOM.aside.classList.toggle('hide', !STATE.todos?.projects.length);
	STATE.todos?.projects.forEach(project => {
		const li = document.createElement('li');
		li.innerHTML = `<a id="list-${project}" class="contrast pointer">${project}</a>`;
		li.dataset.list = project;
		li.addEventListener('click', refine.setFilterList);
		DOM.filterList.append(li);
	});
}

export function toggleShowComplete() {
	const newIcon = STATE.showComplete ? '#icon-eye-fill' : '#icon-eye';
	DOM.showCompleteBtn.classList.toggle('outline', !STATE.showComplete);
	DOM.showCompleteBtn.querySelector('use').setAttribute('xlink:href', newIcon);
}

export function toggleSortAscending() {
	const newIcon = STATE.sortAscending ? '#icon-caret-down' : '#icon-caret-up-fill';
	DOM.sortAscendingBtn.classList.toggle('outline', STATE.sortAscending);
	DOM.sortAscendingBtn.querySelector('use').setAttribute('xlink:href', newIcon);
}

export function toggleSortGroup() {
	const newIcon = STATE.sortGroup === 'none' ? '#icon-group' : '#icon-group-fill';
	DOM.sortGroupBtn.classList.toggle('outline', STATE.sortGroup === 'none');
	DOM.sortGroupBtn.querySelector('use').setAttribute('xlink:href', newIcon);
	DOM.sortGroupBtns.forEach((b) => {
		b.classList.toggle('outline', b.dataset.group !== STATE.sortGroup);
		b.classList.toggle('hide', b.dataset.group === 'none' && STATE.sortGroup === 'none');
	});
}

export function resizeScrollLists() {
	const taskRect = DOM.taskListUl.getBoundingClientRect();
	const listRect = DOM.filterListWrapper.getBoundingClientRect();
	const footerRect = DOM.status.getBoundingClientRect();
	const availableTaskHeight = window.innerHeight - taskRect.top - footerRect.height;
	const availableListHeight = window.innerWidth < 1024 ? window.innerHeight :
		window.innerHeight - listRect.top - footerRect.height;

	if (availableTaskHeight > 0) {
		DOM.taskListUl.style.height = `calc(${availableTaskHeight}px - var(--pico-spacing))`;
	}

	if (availableListHeight > 0) {
		DOM.filterListWrapper.style.height = window.innerWidth < 1024 ? `${availableListHeight}px` :
			`calc(${availableListHeight}px - var(--pico-spacing))`;
	}
}

export function toggleSortType() {
	DOM.sortTypeBtns.forEach((b) =>
		b.classList.toggle('outline', b.dataset.type !== STATE.sortType)
	);
	DOM.sortTypeBtn.classList.toggle('outline', STATE.sortType === 'default');
	DOM.sortTypeBtn.querySelector('span').textContent = capitalize(STATE.sortType);
}

export function toggleFilterPriorities() {
	DOM.filterPrioritiesBtns.querySelectorAll('button').forEach((b) => {
		b.classList.toggle('outline', !STATE.filterPriorities.includes(b.textContent.trim()));
	});
	DOM.filterPrioritiesBtn.classList.toggle('outline', !STATE.filterPriorities.length);
	if (STATE.filterPriorities.length) DOM.filterPrioritiesBtn.querySelector('use').setAttribute('xlink:href', '#icon-flag-fill');
	else DOM.filterPrioritiesBtn.querySelector('use').setAttribute('xlink:href', '#icon-flag');
}

export const toggleLoading = (show) => {
	document.querySelectorAll('.loading').forEach(el => el.classList.toggle('hide', !show));
};

export function toggleFilterProjects() {
	document.querySelectorAll('.filter-projects-btn').forEach((b) => {
		b.classList.toggle('outline', !STATE.filterProjects.includes(b.dataset.project) && b.dataset.project);
	});
	DOM.filterProjectsBtn.classList.toggle('outline', !STATE.filterProjects.length);
}

export function toggleFilterContexts() {
	document.querySelectorAll('.filter-contexts-btn').forEach((b) => {
		b.classList.toggle('outline', !STATE.filterContexts.includes(b.dataset.context) && b.dataset.context);
	});
	DOM.filterContextsBtn.classList.toggle('outline', !STATE.filterContexts.length);
}

export function toggleFilterList() {
	DOM.filterListTitle.textContent = STATE.filterList ? STATE.filterList : 'Tasks';
}

export function toggleTheme() {
	DOM.themeBtn.dataset.theme = STATE.theme;
	DOM.themeName.textContent = `Theme|${capitalize(STATE.theme)}`;
	DOM.themeBtn.querySelector('use').setAttribute('xlink:href', `#icon-${STATE.theme}`);
	if (STATE.theme === 'auto') document.documentElement.removeAttribute('data-theme');
	else document.documentElement.setAttribute('data-theme', STATE.theme);
}
