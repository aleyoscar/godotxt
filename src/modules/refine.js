import * as render from './render.js';
import { STATE, saveStore } from './state.js';
import { KEYS } from './constants.js';
import { toggleModal } from './modal.js';
import { DOM } from './dom.js';
import { clearBtn } from './components.js';
import { toggleArrayElement } from './utils.js';

export function setFilterSearch(e) {
	if (!e || e.target.dataset.clear) DOM.filterSearchInput.value = '';
	STATE.filterSearch = DOM.filterSearchInput.value.trim();
	if (STATE.filterSearch) DOM.filterSearchInput.parentElement.appendChild(clearBtn);
	else clearBtn.remove();
	render.renderTasks();
}

export async function setSortType(e) {
	STATE.sortType = e.currentTarget.dataset.type;
	render.toggleSortType();
	await saveStore('sortType');
	await render.renderTasks();
}

export async function setSortAscending(e) {
	STATE.sortAscending = !STATE.sortAscending;
	render.toggleSortAscending();
	await saveStore('sortAscending');
	await render.renderTasks();
}

export async function setSortGroup(e) {
	STATE.sortGroup = e.currentTarget.dataset.group;
	render.toggleSortGroup();
	await saveStore('sortGroup');
	await render.renderTasks();
}

export async function setShowComplete(e) {
	STATE.showComplete = !STATE.showComplete;
	render.toggleShowComplete();
	await saveStore('showComplete');
	await render.renderTasks();
}

export async function setFilterPriorities(e) {
	let target = e.currentTarget ? e.currentTarget : e;
	const priority = target.textContent.trim().replace('(', '').replace(')', '');
	if (priority === 'Clear') STATE.filterPriorities = [];
	else if (!e.currentTarget) STATE.filterPriorities = [priority]
	else STATE.filterPriorities = toggleArrayElement(STATE.filterPriorities, priority);
	render.toggleFilterPriorities();
	await saveStore('filterPriorities');
	await render.renderTasks();
}

export async function setFilterProjects(e) {
	let target = e.currentTarget ? e.currentTarget : e;
	const project = target.dataset.project;
	if (!project) STATE.filterProjects = [];
	else if (!e.currentTarget) STATE.filterProjects = [project];
	else STATE.filterProjects = toggleArrayElement(STATE.filterProjects, project);
	render.toggleFilterProjects();
	await saveStore('filterProjects');
	await render.renderTasks();
}

export async function setFilterContexts(e) {
	let target = e.currentTarget ? e.currentTarget : e;
	const context = target.dataset.context;
	if (!context) STATE.filterContexts = [];
	else if (!e.currentTarget) STATE.filterContexts = [context];
	else STATE.filterContexts = toggleArrayElement(STATE.filterContexts, context);
	render.toggleFilterContexts();
	await saveStore('filterContexts');
	await render.renderTasks();
}

export async function setFilterList(e) {
	const list = e.currentTarget.dataset.list;
	STATE.filterList = list;
	STATE.filterProjects = list ? [list] : [];
	render.toggleFilterList();
	render.toggleFilterProjects();
	await saveStore('filterList');
	await render.renderTasks();
	render.toggleAside();
}

export async function setTheme(e) {
	const currentTheme = e.currentTarget.dataset.theme;
	if (currentTheme === 'auto') STATE.theme = 'light';
	else if (currentTheme === 'light') STATE.theme = 'dark';
	else STATE.theme = 'auto';
	render.toggleTheme();
	await saveStore('theme');
}

export function clearFilters() {
	STATE.filterContexts = [];
	STATE.filterList = '';
	STATE.filterPriorities = [];
	STATE.filterProjects = [];
	render.toggleFilterContexts();
	render.toggleFilterList();
	render.toggleFilterPriorities();
	render.toggleFilterProjects();
	setFilterSearch(null);
	saveStore();
}
