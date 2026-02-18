import { loadVersion, loadStore } from './modules/state.js';
import { loadPersistedTodo } from './modules/file.js';
import { setTheme, setAttributeFiltersDOM, renderTasks } from './modules/render.js';
import { STATE } from './modules/state.js';
import { KEYS } from './modules/constants.js';
import { setAttributeFiltersChecked } from './modules/refine.js';
import { attachListeners } from './modules/events.js';

// import { openFile, readFile } from './file.js';
// import { toggleModal, openModal, closeModal } from './modal.js';
// import { Task, TodoTxt } from './todotxt.js';

// import { DOM, KEYS, REGEX, STATE } from './globals.js';
// import { clearBtn, getDateString, toggleLoading, cleanString, stdout, stderr, capitalize } from './helpers.js';
// import {
// 	selectAttribute,
// 	setAttributeFilters,
// 	setAttributeFiltersChecked,
// 	setAttributeFiltersDOM,
// 	setFilterPriorities,
// 	clearFilters,
// 	clearSearch,
// 	sortBy,
// 	setSortBy,
// 	filterPriority
// } from './refine.js';
// import { renderTasks, toggleAside,togglePickFile } from './render.js';
// import { submitForm, addTask, populateTags, filterTags, deleteTask, deleteConfirm } from './manage.js';

async function bootstrap() {
	await loadVersion();
	await loadStore();
	await loadPersistedTodo();
	setTheme(await STATE.store.get(KEYS.theme));
	setAttributeFiltersChecked('projects', await STATE.store.get(KEYS.filterProjects));
	setAttributeFiltersDOM('projects');
	setAttributeFiltersChecked('contexts', await STATE.store.get(KEYS.filterContexts));
	setAttributeFiltersDOM('contexts');
	renderTasks();
	attachListeners();
}

bootstrap();
