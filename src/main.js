
import { openFile, readFile, saveFile } from './file.js';
import { visibleModal, toggleModal, openModal, closeModal } from './modal.js';
import { Task, TodoTxt } from './todotxt.js';
import { load } from '@tauri-apps/plugin-store';

const DOM = {
	status: document.getElementById('status'),
	todosForm: document.getElementById('todos-form'),
	menuOpenFile: document.getElementById('menu-open-file'),
	todosTextarea: document.getElementById('todos-textarea'),
}

const STORE_FILE = 'store.json';
const KEY_DEBUG = 'debug';
const KEY_FILE = 'todo-path';

let store = null;

DOM.todosForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	const formData = new FormData(e.currentTarget);
	const content = formData.get('todos-textarea');
	const todoPath = await store.get(KEY_FILE);
	if (todoPath) {
		await saveFile(todoPath, content);
	} else {
		console.error(`No todo.txt path set`);
		return;
	}
});

DOM.menuOpenFile.addEventListener("click", async (e) => {
	e.preventDefault();
	const todoPath = await openFile();
	if (todoPath) {
		await store.set(KEY_FILE, todoPath);
		console.log('Selected file:', todoPath);
		await store.save();
		await setContent(todoPath);
	} else {
		console.log('No file selected');
	}
});

async function setContent(path) {
	try {
		const content = await readFile(path);
		console.log('Set content successfully');
		DOM.todosTextarea.textContent = content;
	} catch (err) {
		console.error('Failed to set content', err);
	}
}

async function loadPersistedTodo() {
	try {
		const todoPath = await store.get(KEY_FILE);
		if (todoPath) {
			console.log(`Loaded persisted file: ${todoPath}`);
			await setContent(todoPath);
		} else {
			console.log(`No todo.txt file set. Please open a todo.txt file`);
		}
	} catch (err) {
		console.error(`Unable to load persisted todo file`, err);
	}
}

async function loadStore() {
	try {
		store = await load(STORE_FILE, { autosave: false });
		if (!await store.has(KEY_DEBUG)) await store.set(KEY_DEBUG, false);
		await store.save();
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
