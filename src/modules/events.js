import { DOM } from './dom.js';
import * as render from './render.js';
import * as refine from './refine.js';
import { toggleModal, closeModal } from './modal.js';
import { chooseFile } from './file.js';
import { deleteTask, submitForm, filterTags } from './manage.js';
import { cleanString, stdout, stderr } from './utils.js';
import { REGEX, KEYS } from './constants.js';
import { STATE } from './state.js';
import { clearBtn } from './components.js';

export function attachListeners() {
	DOM.aside.addEventListener('click', e => {
		if (DOM.aside.classList.contains('open') && e.target === DOM.aside) render.toggleAside();
	});

	DOM.listAll.addEventListener('click', async (e) => {
		await STATE.store.set(KEYS.filterList, '');
		await STATE.store.save();
		await render.renderTasks();
		render.toggleAside();
	});

	DOM.asideClosers.forEach((b) => {
		b.addEventListener('click', render.toggleAside);
	});

	DOM.showAll.addEventListener('click', refine.clearFilters);

	DOM.toggleModals.forEach((m) => { m.addEventListener('click', toggleModal) });

	DOM.clearAttributesBtns.forEach((b) => {
		b.addEventListener('click', (e) => {
			e.currentTarget.parentNode.parentNode.querySelectorAll('input')
				.forEach(i => i.checked = false);
			refine.setAttributeFilters(e);
		});
	});

	DOM.sortBtns.querySelectorAll('button').forEach((b) => {
		b.addEventListener('click', (e) => {
			refine.sortBy(e.currentTarget.dataset.sort);
			toggleModal(e);
		});
	});

	DOM.priorityGrid.querySelectorAll('button').forEach((b) => {
		b.addEventListener('click', refine.filterPriority);
	});

	DOM.clearPrioritiesBtn.addEventListener('click', async (e) => {
		await STATE.store.set(KEYS.filterPriorities, []);
		await STATE.store.save();
		render.setFilterPriorities([]);
		await render.renderTasks();
		if (STATE.visibleModal) closeModal(STATE.visibleModal);
	});

	DOM.filterAttributeBtns.forEach((b) => {
		b.addEventListener('click', refine.setAttributeFilters);
	});

	DOM.completeToggle.addEventListener('click', async (e) => {
		const showComplete = !await STATE.store.get(KEYS.showComplete);
		render.setShowComplete(showComplete);
		await STATE.store.set(KEYS.showComplete, showComplete);
		await STATE.store.save();
		await render.renderTasks();
	});

	DOM.search.addEventListener('input', (e) => {
		STATE.search = e.target.value.trim();
		if (STATE.search) DOM.search.parentElement.appendChild(clearBtn);
		else refine.clearSearch();
		render.renderTasks();
	});

	DOM.sortToggle.addEventListener('click', async (e) => {
		const sortAscending = !await STATE.store.get(KEYS.sortAscending);
		render.setSort(sortAscending);
		await STATE.store.set(KEYS.sortAscending, sortAscending);
		await STATE.store.save();
		await render.renderTasks();
	});

	DOM.groupSortBtns.forEach((b) => {
		b.addEventListener('click', async (e) => {
			const currentTarget = e.currentTarget;
			const type = currentTarget.dataset.group;
			let group = await STATE.store.get(KEYS.sortGroup);
			group = group === type ? 'none' : type;
			render.setGroup(group);
			await STATE.store.set(KEYS.sortGroup, group);
			await STATE.store.save();
			await render.renderTasks();
			toggleModal(e, currentTarget);
		});
	});

	DOM.menuCloseFile.addEventListener('click', async (e) => {
		try {
			const currentFile = await STATE.store.get(KEYS.todoPath);
			STATE.todos = null;
			await STATE.store.set(KEYS.todoPath, null);
			await STATE.store.save();
			await render.renderTasks();
			stdout(`Closed file ${currentFile}`);
		} catch (err) {
			stderr(`Unable to close file`, err);
		} finally {
			render.togglePickFile();
		}
	});

	DOM.pickFileOpen.addEventListener('click', chooseFile);
	DOM.menuOpenFile.addEventListener("click", chooseFile);

	DOM.menuTheme.addEventListener('click', async (e) => {
		const currentTheme = e.currentTarget.dataset.theme;
		let newTheme = '';
		if (currentTheme === 'auto') newTheme = 'light';
		else if (currentTheme === 'light') newTheme = 'dark';
		else newTheme = 'auto';
		render.setTheme(newTheme);
		await STATE.store.set(KEYS.theme, newTheme);
		await STATE.store.save();
	});

	DOM.addTaskBtn.addEventListener('click', (e) => {
		render.addTask();
		toggleModal(e);
	});

	DOM.editDescription.addEventListener('input', (e) => {
		render.populateTags();
		const query = cleanString(e.currentTarget.value.toLowerCase()).replace(REGEX.project, '').replace(REGEX.context, '').trim();
		const filteredTags = [
			...filterTags(e.currentTarget.value, '+', REGEX.projectSingle, STATE.todos.projects),
			...filterTags(e.currentTarget.value, '@', REGEX.contextSingle, STATE.todos.contexts),
		].sort((a, b) => a.tag.localeCompare(b.tag));
		const currentTaskId = parseInt(DOM.editId.value) || 0;
		const filteredTasks = query ? STATE.todos.tasks.filter(task => task.id !== currentTaskId && task.description.toLowerCase().includes(query)).sort((a, b) => a.description.localeCompare(b.description)) : [];

		DOM.autocomplete.innerHTML = (filteredTags.length || filteredTasks.length)
			? [...filteredTags.map(t => `<li class="auto-tag" data-tag="${t.tag}" data-start="${t.start}" data-end="${t.end}">${t.tag}</li>`),
				 ...filteredTasks.map(t => `<li class="auto-tag flex space-between" data-id="${t.id}">${t.rawDescription}<b onclick="editTask('${t.id}')"><svg width="1em" height="1em"><use xlink:href="#icon-edit"/></svg></b></li>`)].join('')
			: '';
		DOM.autocomplete.classList.toggle('hide', !filteredTags.length && !filteredTasks.length);
	});

	DOM.editDescription.addEventListener('keydown', e => {
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
				if (e.key === 'Enter') editTask(item.dataset.id);
				else DOM.editDescription.value = items[index].textContent;
				DOM.editDescription.focus();
				DOM.editDescription.setSelectionRange(DOM.editDescription.value.length, DOM.editDescription.value.length);
			} else {
				DOM.editDescription.value = DOM.editDescription.value.slice(0, item.dataset.start) + item.dataset.tag + DOM.editDescription.value.slice(item.dataset.end);
				DOM.editDescription.focus();
				DOM.editDescription.setSelectionRange(parseInt(item.dataset.start) + item.dataset.tag.length, parseInt(item.dataset.start) + item.dataset.tag.length);
			}
			render.populateTags();
		}
	});

	DOM.editDelete.addEventListener('click', render.deleteConfirm);
	DOM.editDeleteConfirm.addEventListener('click', deleteTask);

	DOM.autocomplete.addEventListener('click', e => {
		if (e.target.tagName !== 'LI') return;
		DOM.autocomplete.classList.add('hide');
		DOM.autocomplete.innerHTML = '';
		if (e.target.dataset.id) {
			DOM.editDescription.value = e.target.textContent;
			DOM.editDescription.focus();
			DOM.editDescription.setSelectionRange(DOM.editDescription.value.length, DOM.editDescription.value.length);
		} else {
			DOM.editDescription.value = DOM.editDescription.value.slice(0, e.target.dataset.start) + e.target.dataset.tag + DOM.editDescription.value.slice(e.target.dataset.end);
			DOM.editDescription.focus();
			DOM.editDescription.setSelectionRange(parseInt(e.target.dataset.start) + e.target.dataset.tag.length, parseInt(e.target.dataset.start) + e.target.dataset.tag.length);
		}
		render.populateTags();
	});

	document.addEventListener('click', e => {
		if (!DOM.editDescription.contains(e.target) && !DOM.autocomplete.contains(e.target)) {
			DOM.autocomplete.classList.add('hide');
		}
	});

	DOM.forms.forEach(f => f.addEventListener('submit', submitForm));

	window.addEventListener('load', render.resizeScrollLists);
	window.addEventListener('resize', render.resizeScrollLists);
}
