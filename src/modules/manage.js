import { stdout, stderr, getDateString, cleanString } from './utils.js';
import { Task } from './todotxt.js';
import { STATE } from './state.js';
import { saveFile } from './file.js';
import { renderTasks, populateTags } from './render.js';
import { closeModal } from './modal.js';
import { DOM } from './dom.js';

export function deleteTag(event) {
	const target = event.currentTarget.parentNode;
	DOM.editDescription.value = cleanString(DOM.editDescription.value.replace(target.textContent.trim(), ''));
	populateTags();
	target.remove();
}

export function completeTask(event) {
	const id = event.currentTarget.dataset.id;
	const task = STATE.todos.tasks.find(t => t.id === id);
	if (!task) return;
	event.currentTarget.checked ? task.complete() : task.uncomplete();
	STATE.todos.replace(task);
	stdout(`Completed task #${task.id}`);
	saveFile();
	renderTasks();
}

export function deleteTask(event) {
	const id = event.currentTarget.dataset.id;
	const task = STATE.todos.tasks.find(t => t.id === id);
	if (!task) return;
	STATE.todos.delete(task);
	stdout(`Deleted task #${task.id}`);
	saveFile();
	renderTasks();
	if (STATE.visibleModal) closeModal(STATE.visibleModal);
}

export async function submitForm(e) {
	e.preventDefault();
	const form = e.target;
	e.currentTarget.querySelector('.error').classList.add('hide');

	const formData = new FormData(form);
	form.parentNode.querySelector(".form-submit").setAttribute('aria-busy', 'true');
	try {
		switch(form.id) {
			case 'edit-form':
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
				break;
		}
		renderTasks();
		if (STATE.visibleModal) closeModal(STATE.visibleModal);
		form.parentNode.querySelector(".form-submit").setAttribute('aria-busy', 'false');
	} catch (error) {
		stderr(`Unable to update tasks`, error);
		form.querySelector('.error').textContent = error.message;
		form.querySelector('.error').classList.remove('hide');
		form.parentNode.querySelector(".form-submit").setAttribute('aria-busy', 'false');
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
