import { populateTags } from './render.js';
import { cleanString } from './utils.js';
import { REGEX } from './constants.js';
import { filterTags, openEditTask } from './manage.js';
import { DOM } from './dom.js';
import { STATE } from './state.js';

export function updateDescription(e) {
	populateTags();
	const query = cleanString(e.currentTarget.value.toLowerCase()).replace(REGEX.project, '').replace(REGEX.context, '').trim();
	const filteredTags = [
		...filterTags(e.currentTarget.value, '+', REGEX.projectSingle, STATE.todos.projects),
		...filterTags(e.currentTarget.value, '@', REGEX.contextSingle, STATE.todos.contexts),
	].sort((a, b) => a.tag.localeCompare(b.tag));
	const currentTaskId = parseInt(DOM.editId.value) || 0;
	const filteredTasks = query ? STATE.todos.tasks.filter(task => task.id !== currentTaskId && task.description.toLowerCase().includes(query)).sort((a, b) => a.description.localeCompare(b.description)) : [];

	DOM.autocomplete.innerHTML = (filteredTags.length || filteredTasks.length)
		? [...filteredTags.map(t => `<li class="autocomplete-inject-tag auto-tag" data-tag="${t.tag}" data-start="${t.start}" data-end="${t.end}">${t.tag}</li>`),
			 ...filteredTasks.map(t => `<li class="autocomplete-populate-task auto-tag flex space-between" data-id="${t.id}">${t.rawDescription}<b class="autocomplete-edit-task" data-id="${t.id}"><svg width="1em" height="1em"><use xlink:href="#icon-edit"/></svg></b></li>`)].join('')
		: '';
	DOM.autocomplete.classList.toggle('hide', !filteredTags.length && !filteredTasks.length);
}

export function handleKeypress(e) {
	const items = DOM.autocomplete.querySelectorAll('li');
	if (!items.length) return;
	const index = Array.from(items).findIndex(item => item.classList.contains('selected'));
	if (e.key === 'ArrowDown' && index < items.length - 1) {
		e.preventDefault();
		items[index]?.classList.remove('selected');
		items[index + 1].classList.add('selected');
		items[index + 1].scrollIntoView({ block: 'nearest' });
	} else if (e.key === 'ArrowUp' && index > 0) {
		e.preventDefault();
		items[index].classList.remove('selected');
		items[index - 1].classList.add('selected');
		items[index - 1].scrollIntoView({ block: 'nearest' });
	} else if ((e.key === 'Enter' || e.key === 'Tab') && index >= 0) {
		e.preventDefault();
		const item = items[index];
		DOM.autocomplete.classList.add('hide');
		DOM.autocomplete.innerHTML = '';
		if (item.dataset.id) {
			if (e.key === 'Enter') openEditTask(item.dataset.id);
			else DOM.editDescription.value = items[index].textContent;
			DOM.editDescription.focus();
			DOM.editDescription.setSelectionRange(DOM.editDescription.value.length, DOM.editDescription.value.length);
			populateTags();
		} else {
			injectTag(item);
		}
	}
}

export function injectTag(target) {
	DOM.editDescription.value = DOM.editDescription.value.slice(0, target.dataset.start) + target.dataset.tag + DOM.editDescription.value.slice(target.dataset.end);
	DOM.editDescription.focus();
	DOM.editDescription.setSelectionRange(parseInt(target.dataset.start) + target.dataset.tag.length, parseInt(target.dataset.start) + target.dataset.tag.length);
	populateTags();
}

export function populateDescription(target) {
	if (!target.dataset.id) return;
	DOM.autocomplete.classList.add('hide');
	DOM.autocomplete.innerHTML = '';
	DOM.editDescription.value = target.textContent;
	DOM.editDescription.focus();
	DOM.editDescription.setSelectionRange(DOM.editDescription.value.length, DOM.editDescription.value.length);
	populateTags();
}
