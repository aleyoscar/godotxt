
import { openFile, readFile } from './file.js';
import { toggleModal, openModal, closeModal } from './modal.js';
import { Task, TodoTxt } from './todotxt.js';
import { load } from '@tauri-apps/plugin-store';
import { DOM, KEYS, REGEX, STATE } from './globals.js';
import { clearBtn, getDateString, toggleLoading, cleanString, stdout, stderr, capitalize } from './helpers.js';
import {
	selectAttribute,
	setAttributeFilters,
	setAttributeFiltersChecked,
	setAttributeFiltersDOM,
	clearFilters,
	clearSearch,
	sortBy,
	setSortBy
} from './refine.js';
import { renderTasks, toggleAside,togglePickFile } from './render.js';
import { submitForm, addTask, populateTags, filterTags, deleteTask, deleteConfirm } from './manage.js';
import { getVersion } from '@tauri-apps/api/app';

// PROJECT LIST ---------------------------------------------------------------

if (DOM.aside) {
	DOM.aside.addEventListener('click', e => {
		if (DOM.aside.classList.contains('open') && e.target === DOM.aside) toggleAside();
	});
}

DOM.listAll.addEventListener('click', async (e) => {
	await STATE.store.set(KEYS.filterList, '');
	await STATE.store.save();
	await renderTasks();
	toggleAside();
});

DOM.asideClosers.forEach((b) => {
	b.addEventListener('click', toggleAside);
});

// EVENT LISTENERS ------------------------------------------------------------

DOM.showAll.addEventListener('click', clearFilters);

DOM.toggleModals.forEach((m) => { m.addEventListener('click', toggleModal) });

// Refine

DOM.clearAttributesBtns.forEach((b) => {
	b.addEventListener('click', (e) => {
		e.currentTarget.parentNode.parentNode.querySelectorAll('input')
			.forEach(i => i.checked = false);
		setAttributeFilters(e);
	});
});

DOM.sortBtns.querySelectorAll('button').forEach((b) => {
	b.addEventListener('click', (e) => {
		sortBy(e.currentTarget.dataset.sort);
		toggleModal(e);
	});
});

DOM.filterAttributeBtns.forEach((b) => {
	b.addEventListener('click', setAttributeFilters);
});

DOM.completeToggle.addEventListener('click', async (e) => {
	const showComplete = !await STATE.store.get(KEYS.showComplete);
	setShowComplete(showComplete);
	await STATE.store.set(KEYS.showComplete, showComplete);
	await STATE.store.save();
	await renderTasks();
});

function setShowComplete(showComplete) {
	const newIcon = showComplete ? '#icon-eye-fill' : '#icon-eye';
	DOM.completeToggle.classList.toggle('outline', !showComplete);
	DOM.completeToggle.querySelector('use').setAttribute('xlink:href', newIcon);
}

DOM.search.addEventListener('input', (e) => {
	STATE.search = e.target.value.trim();
	if (STATE.search) DOM.search.parentElement.appendChild(clearBtn);
	else clearSearch();
	renderTasks();
});

DOM.sortToggle.addEventListener('click', async (e) => {
	const sortAscending = !await STATE.store.get(KEYS.sortAscending);
	setSort(sortAscending);
	await STATE.store.set(KEYS.sortAscending, sortAscending);
	await STATE.store.save();
	await renderTasks();
});

function setSort(sortAscending) {
	const newIcon = sortAscending ? '#icon-caret-down' : '#icon-caret-up-fill';
	DOM.sortToggle.classList.toggle('outline', sortAscending);
	DOM.sortToggle.querySelector('use').setAttribute('xlink:href', newIcon);
}

DOM.groupSortBtns.forEach((b) => {
	b.addEventListener('click', async (e) => {
		const currentTarget = e.currentTarget;
		const type = currentTarget.dataset.group;
		let group = await STATE.store.get(KEYS.sortGroup);
		group = group === type ? 'none' : type;
		setGroup(group);
		await STATE.store.set(KEYS.sortGroup, group);
		await STATE.store.save();
		await renderTasks();
		toggleModal(e, currentTarget);
	});
});

function setGroup(group) {
	const newIcon = group === 'none' ? '#icon-group' : '#icon-group-fill';
	DOM.groupBtn.classList.toggle('outline', group === 'none');
	DOM.groupBtn.querySelector('use').setAttribute('xlink:href', newIcon);
	Array.from(DOM.groupBtns.children).forEach((btn) => {
		btn.classList.toggle('outline', !btn.id.includes(group));
	});
	DOM.groupClearBtn.classList.toggle('hide', group === 'none');
}

// Menu

DOM.menuCloseFile.addEventListener('click', async (e) => {
	try {
		const currentFile = await STATE.store.get(KEYS.todoPath);
		STATE.todos = [];
		await STATE.store.set(KEYS.todoPath, null);
		await STATE.store.save();
		await renderTasks();
		stdout(`Closed file ${currentFile}`);
	} catch (err) {
		stderr(`Unable to close file`, err);
	} finally {
		togglePickFile();
	}
});

DOM.pickFileOpen.addEventListener('click', chooseFile);
DOM.menuOpenFile.addEventListener("click", chooseFile);

async function chooseFile(e) {
	try {
		const todoPath = await openFile();
		if (todoPath) {
			await STATE.store.set(KEYS.todoPath, todoPath);
			console.log('Selected file:', todoPath);
			await STATE.store.save();
			await setContent(todoPath);
		} else {
			stdout('No file selected');
		}
	} catch (err) {
		stderr('Unable to choose a file to open', err);
	}
}

function setTheme(theme) {
	DOM.menuTheme.dataset.theme = theme;
	DOM.menuTheme.querySelector('use').setAttribute('xlink:href', `#icon-${theme}`);
	if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
	else document.documentElement.setAttribute('data-theme', theme);
}

DOM.menuTheme.addEventListener('click', async (e) => {
	const currentTheme = e.currentTarget.dataset.theme;
	let newTheme = '';
	if (currentTheme === 'auto') newTheme = 'light';
	else if (currentTheme === 'light') newTheme = 'dark';
	else newTheme = 'auto';
	setTheme(newTheme);
	await STATE.store.set(KEYS.theme, newTheme);
	await STATE.store.save();
});

// Add/edit

DOM.addTaskBtn.addEventListener('click', (e) => {
	addTask();
	toggleModal(e);
});

DOM.editDescription.addEventListener('input', (e) => {
	populateTags();
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
		populateTags();
	}
});

DOM.editDelete.addEventListener('click', deleteConfirm);
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
	populateTags();
});

document.addEventListener('click', e => {
	if (!DOM.editDescription.contains(e.target) && !DOM.autocomplete.contains(e.target)) {
		DOM.autocomplete.classList.add('hide');
	}
});

DOM.forms.forEach(f => f.addEventListener('submit', submitForm));

function resizeScrollLists() {
	const taskRect = DOM.taskListUl.getBoundingClientRect();
	const listRect = DOM.projectList.getBoundingClientRect();
	const footerRect = DOM.status.getBoundingClientRect();
	const availableTaskHeight = window.innerHeight - taskRect.top - footerRect.height;
	const availableListHeight = window.innerHeight - listRect.top - footerRect.height;

	if (availableTaskHeight > 0) {
		DOM.taskListUl.style.height = `calc(${availableTaskHeight}px - var(--pico-spacing))`;
	}

	if (availableListHeight > 0) {
		DOM.projectList.style.height = `calc(${availableListHeight}px - var(--pico-spacing))`;
	}
}

window.addEventListener('load', resizeScrollLists);
window.addEventListener('resize', resizeScrollLists);

// MAIN -----------------------------------------------------------------------

async function setContent(path) {
	toggleLoading(true);
	try {
		const content = await readFile(path);
		STATE.todos = new TodoTxt(content);
		stdout(`Opened file ${path}`);
		await renderTasks();
	} catch (err) {
		stderr('Failed to set content', err);
	} finally {
		toggleLoading(false);
		await togglePickFile();
	}
}

async function loadPersistedTodo() {
	try {
		const todoPath = await STATE.store.get(KEYS.todoPath);
		if (todoPath) {
			stdout(`Loaded persisted file: ${todoPath}`);
			await setContent(todoPath);
		} else {
			toggleLoading(false);
			stdout(`No todo.txt file set. Please open a todo.txt file`);
		}
		await togglePickFile();
	} catch (err) {
		stderr(`Unable to load persisted todo file`, err);
	}
}

async function loadStore() {
	try {
		STATE.store = await load(KEYS.storeFile, { autosave: false });
		if (!await STATE.store.has(KEYS.sortAscending)) await STATE.store.set(KEYS.sortAscending, true);
		setSort(await STATE.store.get(KEYS.sortAscending));
		if (!await STATE.store.has(KEYS.sortGroup)) await STATE.store.set(KEYS.sortGroup, 'none');
		setGroup(await STATE.store.get(KEYS.sortGroup));
		if (!await STATE.store.has(KEYS.sortType)) await STATE.store.set(KEYS.sortType, 'priority');
		setSortBy(await STATE.store.get(KEYS.sortType));
		if (!await STATE.store.has(KEYS.showComplete)) await STATE.store.set(KEYS.showComplete, false);
		setShowComplete(await STATE.store.get(KEYS.showComplete));
		if (!await STATE.store.has(KEYS.filterContexts)) await STATE.store.set(KEYS.filterContexts, []);
		if (!await STATE.store.has(KEYS.filterList)) await STATE.store.set(KEYS.filterList, '');
		if (!await STATE.store.has(KEYS.filterProjects)) await STATE.store.set(KEYS.filterProjects, []);
		if (!await STATE.store.has(KEYS.theme)) await STATE.store.set(KEYS.theme, 'auto');
		await STATE.store.save();
		console.log(`Loaded store`);
	} catch (err) {
		console.error(`Unable to load store`, err);
	}
}

async function loadVersion() {
	try {
		const version = await getVersion();
		DOM.versionInfo.textContent = `v${version}`;
		console.log(`App version: ${version}`);
	} catch (err) {
		console.error(`Unable to get app version info`, err);
	}
}

async function startup() {
	await loadVersion();
	await loadStore();
	await loadPersistedTodo();
	setTheme(await STATE.store.get(KEYS.theme));
	setAttributeFiltersChecked('projects', await STATE.store.get(KEYS.filterProjects));
	setAttributeFiltersDOM('projects');
	setAttributeFiltersChecked('contexts', await STATE.store.get(KEYS.filterContexts));
	setAttributeFiltersDOM('contexts');
	renderTasks();
}

startup();
