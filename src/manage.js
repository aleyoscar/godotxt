
import { DOM, REGEX, STATE, KEYS } from './globals.js';
import { Task } from './todotxt.js';
import { getDateString, stdout, stderr } from './helpers.js';
import { saveFile } from './file.js';
import { closeModal } from './modal.js';
import { renderTasks } from './render.js';

// ADD/EDIT TASK --------------------------------------------------------------

function populateTags() {
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
			span.insertAdjacentHTML('beforeend', `
				<kbd class="${classes}">${tag}<b class="pointer" onclick="deleteTag(event)">
					<svg width="1em" height="1em"><use xlink:href="#icon-x"/></svg>
				</b></kbd>
			`);
		});
	});
}

function deleteTag(event) {
	const target = event.currentTarget.parentNode;
	DOM.editDescription.value = cleanString(DOM.editDescription.value.replace(target.textContent.trim(), ''));
	populateTags();
	target.remove();
}

async function addTask() {
	const currentProject = await STATE.store.get(KEYS.filterList);
	DOM.editForm.reset();
	DOM.editTitle.textContent = 'Add task';
	DOM.editId.value = '';
	DOM.editDescription.value = currentProject ? ` +${currentProject}` : '';
	DOM.editDescription.setSelectionRange(0, 0);
	DOM.editDelete.classList.add('hide');
	DOM.editDeleteConfirm.classList.add('hide');
	DOM.editSubmit.textContent = 'Add';
	populateTags();
}

function editTask(id) {
	const task = STATE.todos.tasks.find(t => t.id === id);
	if (!task) return;
	DOM.autocomplete.classList.add('hide');
	DOM.editForm.reset();
	DOM.editTitle.textContent = `Edit task #${task.lineNum}`;
	DOM.editId.value = task.id;
	DOM.editDescription.value = task.rawDescription;
	DOM.editPriority.value = task.priority || '--';
	DOM.editComplete.checked = task.completed;
	DOM.editDelete.dataset.id = task.id;
	DOM.editDelete.classList.remove('hide');
	DOM.editDeleteConfirm.classList.add('hide');
	DOM.editSubmit.textContent = 'Save';
	DOM.editDescription.focus();
	DOM.editDescription.setSelectionRange(DOM.editDescription.value.length, DOM.editDescription.value.length);
	populateTags();
}

function completeTask(event) {
	const id = event.currentTarget.dataset.id;
	const task = STATE.todos.tasks.find(t => t.id === id);
	if (!task) return;
	event.currentTarget.checked ? task.complete() : task.uncomplete();
	STATE.todos.replace(task);
	stdout(`Completed task #${task.id}`);
	saveFile();
	renderTasks();
}

function deleteConfirm(event) {
	DOM.editDeleteConfirm.classList.remove('hide');
	DOM.editDeleteConfirm.dataset.id = event.currentTarget.dataset.id;
}

function deleteTask(event) {
	const id = event.currentTarget.dataset.id;
	const task = STATE.todos.tasks.find(t => t.id === id);
	if (!task) return;
	STATE.todos.delete(task);
	stdout(`Deleted task #${task.id}`);
	saveFile();
	renderTasks();
	if (STATE.visibleModal) closeModal(STATE.visibleModal);
}

// AUTOCOMPLETE ---------------------------------------------------------------

function filterTags(text, char, reg, taskTags) {
	const cursor = DOM.editDescription.selectionStart;
	const cursorText = text.slice(0, cursor);
	const index = cursorText.lastIndexOf(char);
	const lastTag = index >= 0 ? cursorText.slice(index) : '';
	return (reg.test(lastTag) ? taskTags.filter(t => t.toLowerCase().startsWith(lastTag.slice(1).toLowerCase())) : lastTag === char ? taskTags : [])
		.map(t => ({ tag: `${char}${t}`, start: index, end: cursor }));
}

// DELETE DONE ----------------------------------------------------------------

function openDelete() {
	DOM.deleteLists.innerHTML = (STATE.todos.projects?.length ? ['All Tasks', ...STATE.todos.projects] : [])
		.map(project => `
			<label>
				<input class="delete-switch" type="checkbox" role="switch" data-project="${project}" />
				${project}
			</label>
		`).join('');
	openModal(DOM.deleteModal);
}

// FORMS ----------------------------------------------------------------------

async function submitForm(e) {
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

export { submitForm, addTask, populateTags, filterTags, completeTask, editTask, deleteTask, deleteConfirm }
