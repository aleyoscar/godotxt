import { setSortBy } from './render.js';
import { STATE } from './state.js';
import { KEYS } from './constants.js';
import { renderTasks, setFilterPriorities, setAttributeFiltersDOM } from './render.js';
import { toggleModal } from './modal.js';
import { DOM } from './dom.js';
import { clearBtn } from './components.js';

export async function filterPriority(e) {
	let next = [];
	if (!STATE.todos.priorities.length) {
		await STATE.store.set(KEYS.filterPriorities, next);
	} else {
		const priority = e.currentTarget.textContent.trim();
		const current = (await STATE.store.get(KEYS.filterPriorities)) ?? [];
		next = current.includes(priority)
			? current.filter(p => p !== priority)
			: [...current, priority].sort();
		await STATE.store.set(KEYS.filterPriorities, next);
	}
	setFilterPriorities(next);
	await renderTasks();
}

function selectAttribute(event) {
	event.stopPropagation();
	event.preventDefault();
	const { attribute, name } = event.target.dataset;
	document.querySelectorAll('.attribute-filter').forEach(input => {
		input.checked = input.dataset.attribute === attribute && input.name === name;
	});
	setAttributeFilters();
}

export function setAttributeFiltersChecked(attribute, checked) {
	document.querySelectorAll('.attribute-filter').forEach(input => {
		input.checked = input.dataset.attribute === attribute && checked.includes(input.name);
	});
}

export async function setAttributeFilters(e) {
	const currentTarget = e ? e.currentTarget : null;
	const filterProjects = setAttributeFiltersDOM('projects');
	const filterContexts = setAttributeFiltersDOM('contexts');
	await STATE.store.set(KEYS.filterProjects, filterProjects);
	await STATE.store.set(KEYS.filterContexts, filterContexts);
	await STATE.store.save();
	await renderTasks();
	if (e) toggleModal(e, currentTarget);
}

export async function clearFilters() {
	clearSearch();
	[DOM.projectsModal, DOM.contextsModal].forEach(modal => modal.querySelectorAll('input').forEach(i => i.checked = false));
	setAttributeFilters();
	await STATE.store.set(KEYS.filterPriorities, []);
	setFilterPriorities([]);
}

export function clearSearch() {
	DOM.search.value = '';
	STATE.search = '';
	clearBtn.remove();
	renderTasks();
}

export async function sortBy(type) {
	setSortBy(type);
	await STATE.store.set(KEYS.sortType, type);
	await STATE.store.save();
	await renderTasks();
}
