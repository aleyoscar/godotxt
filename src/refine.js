
import { DOM, KEYS, STATE } from './globals.js';
import { clearBtn, capitalize } from './helpers.js';
import { renderTasks } from './render.js';
import { toggleModal } from './modal.js';

async function clearAttributeFilters() {
	await STATE.store.set(KEYS.filterProjects, []);
	await STATE.store.set(KEYS.filterContexts, []);
	await STATE.store.save();
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
	await STATE.store.set(KEYS.filterProjects, filterProjects);
	await STATE.store.set(KEYS.filterContexts, filterContexts);
	await STATE.store.save();
	await renderTasks();
	toggleModal(e, currentTarget);
}

function clearFilters() {
	clearSearch();
	[DOM.projectsModal, DOM.contextsModal].forEach(modal => modal.querySelectorAll('input').forEach(i => i.checked = false));
	filterAttribute();
}

function clearSearch() {
	DOM.search.value = '';
	STATE.search = '';
	clearBtn.remove();
	renderTasks();
}

async function sortBy(type) {
	Array.from(DOM.sortBtns.children).forEach((btn) => {
		btn.classList.toggle('outline', !btn.id.includes(type));
	});
	DOM.sortByToggle.classList.toggle('outline', !DOM.sortDefaultBtn.classList.contains('outline'));
	DOM.sortByText.textContent = capitalize(type);
	await STATE.store.set(KEYS.sortType, type);
	await STATE.store.save();
	await renderTasks();
}

export {
	clearAttributeFilters,
	selectAttribute,
	setAttributeFilters,
	clearFilters,
	clearSearch,
	sortBy
}
