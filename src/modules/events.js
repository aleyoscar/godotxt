import { DOM } from './dom.js';
import * as manage from './manage.js';
import * as refine from './refine.js';
import * as render from './render.js';
import * as autocomplete from './autocomplete.js';
import { toggleModal, closeModal, closeModalOutside } from './modal.js';
import { chooseFile, closeFile } from './file.js';
import { cleanString, stdout, stderr } from './utils.js';
import { REGEX, KEYS } from './constants.js';
import { STATE } from './state.js';
import { clearBtn } from './components.js';

export function attachListeners() {
	DOM.aside.addEventListener('click', e => {
		if (DOM.aside.classList.contains('open') && e.target === DOM.aside) render.toggleAside();
	});

	DOM.asideClosers.forEach((b) => b.addEventListener('click', render.toggleAside));
	DOM.chooseFileBtns.forEach((b) => b.addEventListener('click', chooseFile));
	DOM.closeFileBtn.addEventListener('click', closeFile);
	DOM.deleteTaskBtn.addEventListener('click', manage.deleteTask);
	DOM.editDescription.addEventListener('input', autocomplete.updateDescription);
	DOM.editDescription.addEventListener('keydown', autocomplete.handleKeypress);
	DOM.editForm.addEventListener('submit', manage.submitEditForm);
	DOM.filterContextsClearBtn.addEventListener('click', refine.setFilterContexts);
	DOM.filterListAllBtn.addEventListener('click', refine.setFilterList);
	DOM.filterPrioritiesBtns.querySelectorAll('button').forEach((b) => b.addEventListener('click', refine.setFilterPriorities));
	DOM.filterPrioritiesClearBtn.addEventListener('click', refine.setFilterPriorities);
	DOM.filterProjectsClearBtn.addEventListener('click', refine.setFilterProjects);
	DOM.filterSearchInput.addEventListener('input', refine.setFilterSearch);
	DOM.openAddTaskBtn.addEventListener('click', manage.openAddTask);
	DOM.openDeleteTaskBtn.addEventListener('click', render.toggleDeleteTask);
	DOM.showAllBtn.addEventListener('click', refine.clearFilters);
	DOM.showCompleteBtn.addEventListener('click', refine.setShowComplete);
	DOM.sortAscendingBtn.addEventListener('click', refine.setSortAscending);
	DOM.sortGroupBtns.forEach((b) => b.addEventListener('click', refine.setSortGroup));
	DOM.sortTypeBtns.forEach((b) => b.addEventListener('click', refine.setSortType));
	DOM.themeBtn.addEventListener('click', refine.setTheme);
	DOM.toggleModals.forEach((m) => m.addEventListener('click', toggleModal));

	DOM.autocomplete.addEventListener('click', (e) => {
		const autocompleteEditTask = e.target.closest('.autocomplete-edit-task');
		if (autocompleteEditTask) { manage.openEditTask(autocompleteEditTask.dataset.id); return; }

		const autocompletePopulate = e.target.closest('.autocomplete-populate-task');
		if (autocompletePopulate) { autocomplete.populateDescription(autocompletePopulate); }

		const autocompleteTag = e.target.closest('.autocomplete-inject-tag');
		if (autocompleteTag) { autocomplete.injectTag(autocompleteTag); }
	});

	DOM.taskListUl.addEventListener('click', (e) => {
		const taskLink = e.target.closest('.task-link');
		if (taskLink) return;

		const taskProject = e.target.closest('.task-filter-projects-btn');
		if (taskProject) { refine.setFilterProjects(taskProject); return; }

		const taskContext = e.target.closest('.task-filter-contexts-btn')
		if (taskContext) { refine.setFilterContexts(taskContext); return; }

		const taskPriority = e.target.closest('.task-filter-priorities-btn');
		if (taskPriority) { refine.setFilterPriorities(taskPriority); return; }

		const taskComplete = e.target.closest('.task-complete-task-btn');
		if (taskComplete) { manage.completeTask(taskComplete); return; }

		const taskLi = e.target.closest('.task');
		if (taskLi) { manage.openEditTask(taskLi.dataset.id); toggleModal(e, taskLi); }
	});

	DOM.editProjects.addEventListener('click', (e) => {
		const tagClose = e.target.closest('b');
		if (tagClose) manage.deleteTag(tagClose);
	});

	DOM.editContexts.addEventListener('click', (e) => {
		const tagClose = e.target.closest('b');
		if (tagClose) manage.deleteTag(tagClose);
	});

	document.addEventListener('click', (e) => {
		if (!DOM.editDescription.contains(e.target) && !DOM.autocomplete.contains(e.target)) {
			DOM.autocomplete.classList.add('hide');
		}
	});

	document.addEventListener('click', closeModalOutside);

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && STATE.visibleModal) closeModal(STATE.visibleModal);
	});

	window.addEventListener('load', render.resizeScrollLists);
	window.addEventListener('resize', render.resizeScrollLists);
}
