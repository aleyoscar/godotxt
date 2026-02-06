
import { DOM, KEYS, STATE } from './globals.js';
import { clearBtn, capitalize } from './helpers.js';
import { renderTasks } from './render.js';
import { toggleModal } from './modal.js';

function selectAttribute(event) {
	event.stopPropagation();
	event.preventDefault();
	const { attribute, name } = event.target.dataset;
	document.querySelectorAll('.attribute-filter').forEach(input => {
		input.checked = input.dataset.attribute === attribute && input.name === name;
	});
	setAttributeFilters();
}

function setAttributeFiltersChecked(attribute, checked) {
	document.querySelectorAll('.attribute-filter').forEach(input => {
		input.checked = input.dataset.attribute === attribute && checked.includes(input.name);
	});
}

async function setAttributeFilters(e) {
	const currentTarget = e ? e.currentTarget : null;
	const filterProjects = setAttributeFiltersDOM('projects');
	const filterContexts = setAttributeFiltersDOM('contexts');
	await STATE.store.set(KEYS.filterProjects, filterProjects);
	await STATE.store.set(KEYS.filterContexts, filterContexts);
	await STATE.store.save();
	await renderTasks();
	if (e) toggleModal(e, currentTarget);
}

function setAttributeFiltersDOM(attribute) {
	const checked = [];
	DOM[`${attribute}Btn`].classList.add('outline');
	document.querySelectorAll('.attribute-filter').forEach(input => {
		if (input.checked && input.dataset.attribute === attribute) {
			checked.push(input.name);
			DOM[`${attribute}Btn`].classList.remove('outline');
		}
	});
	return checked;
}

function clearFilters() {
	clearSearch();
	[DOM.projectsModal, DOM.contextsModal].forEach(modal => modal.querySelectorAll('input').forEach(i => i.checked = false));
	setAttributeFilters();
}

function clearSearch() {
	DOM.search.value = '';
	STATE.search = '';
	clearBtn.remove();
	renderTasks();
}

async function sortBy(type) {
	setSortBy(type);
	await STATE.store.set(KEYS.sortType, type);
	await STATE.store.save();
	await renderTasks();
}

function setSortBy(type) {
	Array.from(DOM.sortBtns.children).forEach((btn) => {
		btn.classList.toggle('outline', !btn.id.includes(type));
	});
	DOM.sortByToggle.classList.toggle('outline', !DOM.sortDefaultBtn.classList.contains('outline'));
	DOM.sortByText.textContent = capitalize(type);
}

export {
	selectAttribute,
	setAttributeFilters,
	setAttributeFiltersChecked,
	setAttributeFiltersDOM,
	clearFilters,
	clearSearch,
	sortBy,
	setSortBy
}
