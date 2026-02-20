import { stdout, stderr, getDateString, cleanString } from './utils.js';
import { Task } from './todotxt.js';
import { STATE } from './state.js';
import { saveFile } from './file.js';
import { renderTasks, populateTags, populateRefine } from './render.js';
import { closeModal } from './modal.js';
import { DOM } from './dom.js';

export function openAddTask(e) {
	const currentProject = STATE.filterList;
	DOM.editForm.reset();
	DOM.editTitle.textContent = 'Add task';
	DOM.editId.value = '';
	DOM.editDescription.value = currentProject ? ` +${currentProject}` : '';
	DOM.editDescription.setSelectionRange(0, 0);
	DOM.openDeleteTaskBtn.classList.add('hide');
	DOM.deleteTaskBtn.classList.add('hide');
	DOM.editSubmitBtn.textContent = 'Add';
	populateTags();
}

export function openEditTask(id) {
	const task = STATE.todos.tasks.find(t => t.id === id);
	if (!task) return;
	DOM.autocomplete.classList.add('hide');
	DOM.editForm.reset();
	DOM.editTitle.textContent = `Edit task #${task.lineNum}`;
	DOM.editId.value = task.id;
	DOM.editDescription.value = task.rawDescription;
	DOM.editPriority.value = task.priority || '--';
	DOM.editComplete.checked = task.completed;
	DOM.openDeleteTaskBtn.classList.remove('hide');
	DOM.openDeleteTaskBtn.querySelector('use').setAttribute('xlink:href', '#icon-trash');
	DOM.deleteTaskBtn.dataset.id = task.id;
	DOM.deleteTaskBtn.classList.add('hide');
	DOM.editSubmitBtn.textContent = 'Save';
	DOM.editDescription.focus();
	DOM.editDescription.setSelectionRange(DOM.editDescription.value.length, DOM.editDescription.value.length);
	populateTags();
}

export function deleteTag(target) {
	DOM.editDescription.value = cleanString(DOM.editDescription.value.replace(target.parentNode.textContent.trim(), ''));
	populateTags();
	target.parentNode.remove();
}

export function completeTask(target) {
	const id = target.dataset.id;
	const task = STATE.todos.tasks.find(t => t.id === id);
	if (!task) return;
	target.checked ? task.complete() : task.uncomplete();
	STATE.todos.replace(task);
	stdout(`Completed task #${task.id}`);
	saveFile();
	renderTasks();
}

export function deleteTask(e) {
	const id = e.currentTarget.dataset.id;
	const task = STATE.todos.tasks.find(t => t.id === id);
	if (!task) return;
	STATE.todos.delete(task);
	stdout(`Deleted task #${task.id}`);
	saveFile();
	renderTasks();
	if (STATE.visibleModal) closeModal(STATE.visibleModal);
}

export async function submitEditForm(e) {
	e.preventDefault();
	DOM.editError.classList.add('hide');

	const formData = new FormData(DOM.editForm);
	DOM.editSubmitBtn.setAttribute('aria-busy', 'true');
	try {
		const newTask = new Task(`${getDateString()} ${formData.get('edit-description')}`);
		formData.get('edit-complete') ? newTask.complete() : newTask.uncomplete();
		newTask.setPriority(formData.get('edit-priority') === '--' ? '' : formData.get('edit-priority'));
		if (formData.get('edit-id')) { // Edit
			const task = STATE.todos.tasks.find(t => t.id === formData.get('edit-id'));
			if (!task) throw new Error(`Could not find task with id ${formData.get('edit-id')}`);
			newTask.creationDate = task.creationDate;
			newTask.id = task.id;
			newTask.lineNum = task.lineNum;
			STATE.todos.replace(newTask);
			stdout(`Edited task #${task.id}`);
		} else { // Add
			STATE.todos.addTask(newTask);
			stdout(`Added task`);
		}
		saveFile();
		populateRefine();
		renderTasks();
		if (STATE.visibleModal) closeModal(STATE.visibleModal);
	} catch (error) {
		stderr(`Unable to update tasks`, error);
		DOM.editError.textContent = error.message;
		DOM.editError.classList.remove('hide');
	} finally {
		DOM.editSubmitBtn.setAttribute('aria-busy', 'false');
	}
}

export function filterTags(text, char, reg, taskTags) {
	const cursor = DOM.editDescription.selectionStart;
	const cursorText = text.slice(0, cursor);
	const index = cursorText.lastIndexOf(char);
	const lastTag = index >= 0 ? cursorText.slice(index) : '';
	return (reg.test(lastTag) ? taskTags.filter(t => t.toLowerCase().startsWith(lastTag.slice(1).toLowerCase())) : lastTag === char ? taskTags : [])
		.map(t => ({ tag: `${char}${t}`, start: index, end: cursor }));
}
