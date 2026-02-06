
import { openFile, readFile, saveFile } from './file.js';
import { visibleModal, toggleModal, openModal, closeModal } from './modal.js';
import { Task, TodoTxt } from './todotxt.js';
import { load } from '@tauri-apps/plugin-store';
import { DOM, KEYS, REGEX, STATE } from './globals.js';
import { clearBtn, getDateString, toggleLoading, cleanString, stdout, stderr, capitalize } from './helpers.js';
import { clearAttributeFilters, selectAttribute, setAttributeFilters, clearFilters, clearSearch, sortBy } from './refine.js';
import { renderTasks, toggleAside } from './render.js';

// DOM.todosForm.addEventListener("submit", async (e) => {
// 	e.preventDefault();
// 	const formData = new FormData(e.currentTarget);
// 	const content = formData.get('todos-textarea');
// 	const todoPath = await store.get(KEY_TODO_PATH);
// 	if (todoPath) {
// 		await saveFile(todoPath, content);
// 	} else {
// 		console.error(`No todo.txt path set`);
// 		return;
// 	}
// });

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
	const newIcon = showComplete ? '#icon-eye-fill' : '#icon-eye';
	DOM.completeToggle.classList.toggle('outline', !showComplete);
	DOM.completeToggle.querySelector('use').setAttribute('xlink:href', newIcon);
	await STATE.store.set(KEYS.showComplete, showComplete);
	await STATE.store.save();
	await renderTasks();
});

DOM.search.addEventListener('input', (e) => {
	STATE.search = e.target.value.trim();
	if (STATE.search) DOM.search.parentElement.appendChild(clearBtn);
	else clearSearch();
	renderTasks();
});

DOM.sortToggle.addEventListener('click', async (e) => {
	const sortAscending = !await STATE.store.get(KEYS.sortAscending);
	const newIcon = sortAscending ? '#icon-caret-down' : '#icon-caret-up-fill';
	DOM.sortToggle.classList.toggle('outline', sortAscending);
	DOM.sortToggle.querySelector('use').setAttribute('xlink:href', newIcon);
	await STATE.store.set(KEYS.sortAscending, sortAscending);
	await STATE.store.save();
	await renderTasks();
});

DOM.groupSortBtns.forEach((b) => {
	b.addEventListener('click', async (e) => {
		const currentTarget = e.currentTarget;
		const type = currentTarget.dataset.group;
		let group = await STATE.store.get(KEYS.sortGroup);
		group = group === type ? 'none' : type;
		const newIcon = group === 'none' ? '#icon-group' : '#icon-group-fill';
		DOM.groupBtn.classList.toggle('outline', group === 'none');
		DOM.groupBtn.querySelector('use').setAttribute('xlink:href', newIcon);
		Array.from(DOM.groupBtns.children).forEach((btn) => {
			btn.classList.toggle('outline', !btn.id.includes(group));
		});
		await STATE.store.set(KEYS.sortGroup, group);
		await STATE.store.save();
		await renderTasks();
		toggleModal(e, currentTarget);
		DOM.groupClearBtn.classList.toggle('hide', group === 'none');
	});
});

// Menu

DOM.menuOpenFile.addEventListener("click", async (e) => {
	e.preventDefault();
	const todoPath = await openFile();
	if (todoPath) {
		await STATE.store.set(KEYS.todoPath, todoPath);
		console.log('Selected file:', todoPath);
		await STATE.store.save();
		await setContent(todoPath);
	} else {
		console.log('No file selected');
	}
});

// MAIN -----------------------------------------------------------------------

async function setContent(path) {
	toggleLoading(true);
	try {
		const content = await readFile(path);
		STATE.todos = new TodoTxt(content);
		console.log('Set content successfully');
		await renderTasks();
	} catch (err) {
		console.error('Failed to set content', err);
	} finally {
		toggleLoading(false);
	}
}

async function loadPersistedTodo() {
	try {
		const todoPath = await STATE.store.get(KEYS.todoPath);
		if (todoPath) {
			stdout(`Loaded persisted file: ${todoPath}`);
			await setContent(todoPath);
		} else {
			stdout(`No todo.txt file set. Please open a todo.txt file`);
		}
	} catch (err) {
		stderr(`Unable to load persisted todo file`, err);
	}
}

async function loadStore() {
	try {
		STATE.store = await load(KEYS.storeFile, { autosave: false });
		if (!await STATE.store.has(KEYS.sortAscending)) await STATE.store.set(KEYS.sortAscending, true);
		if (!await STATE.store.has(KEYS.sortGroup)) await STATE.store.set(KEYS.sortGroup, 'none');
		if (!await STATE.store.has(KEYS.sortType)) await STATE.store.set(KEYS.sortType, 'priority');
		if (!await STATE.store.has(KEYS.showComplete)) await STATE.store.set(KEYS.showComplete, false);
		if (!await STATE.store.has(KEYS.filterContexts)) await STATE.store.set(KEYS.filterContexts, []);
		if (!await STATE.store.has(KEYS.filterList)) await STATE.store.set(KEYS.filterList, '');
		if (!await STATE.store.has(KEYS.filterProjects)) await STATE.store.set(KEYS.filterProjects, []);
		await STATE.store.save();
		console.log(`Loaded store`);
	} catch (err) {
		console.error(`Unable to load store`, err);
	}
}

async function startup() {
	await loadStore();
	await loadPersistedTodo();
}

startup();
