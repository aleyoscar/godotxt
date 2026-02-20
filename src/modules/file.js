
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { AndroidFs, isAndroid } from 'tauri-plugin-android-fs-api';
import { KEYS } from './constants.js';
import { STATE, saveStore } from './state.js';
import { stdout, stderr } from './utils.js';
import * as render from './render.js';
import { TodoTxt } from './todotxt.js';

export async function saveFile() {
	try {
		const path = await STATE.store.get(KEYS.todoPath);
		await writeTextFile(path, STATE.todos.toString());
		console.log(`Saved ${path}`);
	} catch (err) {
		console.error(`Unable to save file ${path}`, err);
	}
}

async function openFile() {
	try {
		let todoPath;
		if (await isAndroid()) {
			const todoPathArr = await AndroidFs.showOpenFilePicker({
				needWritePermission: true,
			});
			if (todoPathArr.length) {
				todoPath = await AndroidFs.getFsPath(todoPathArr[0]);
				await AndroidFs.persistPickerUriPermission(todoPathArr[0]);
				console.log('Picked android file', todoPath);
			}
			else {
				console.log('No file picked');
				return;
			}
		} else {
			todoPath = await open({
				multiple: false,
				directory: false,
				filters: [
					{ name: 'Text', extensions: ['txt', 'md'] },
					{ name: 'All Files', extensions: ['*'] },
				],
				title: 'Select your Todo.txt file',
			});
		}
		return todoPath || null;
	} catch (err) {
		console.error('Failed to open dialog: ', err);
	}
}

export async function closeFile(e) {
	try {
		const currentFile = STATE.todoPath;
		STATE.todos = null;
		STATE.todoPath = '';
		await saveStore('todoPath');
		await render.renderTasks();
		stdout(`Closed file ${currentFile}`);
	} catch (err) {
		stderr(`Unable to close file`, err);
	} finally {
		render.togglePickFile();
	}
}

export async function readFile(path) {
	try {
		const content = await readTextFile(path);
		console.log(`Read file: ${path}`);
		return content || '';
	} catch (err) {
		console.error(`Failed to read file ${path}: `, err);
	}
}

export async function chooseFile(e) {
	try {
		const todoPath = await openFile();
		if (todoPath) {
			STATE.todoPath = todoPath;
			console.log('Selected file:', todoPath);
			await saveStore('todoPath');
			await render.setContent(todoPath);
		} else {
			stdout('No file selected');
		}
	} catch (err) {
		stderr('Unable to choose a file to open', err);
	}
}

export async function loadFile() {
	render.toggleLoading(true);
	try {
		const content = await readFile(STATE.todoPath);
		STATE.todos = new TodoTxt(content);
		stdout(`Loaded file ${STATE.todoPath}`);
	} catch (err) {
		stderr('Failed to load file', err);
	} finally {
		render.toggleLoading(false);
		await render.togglePickFile();
	}
}

export async function loadPersistedTodo() {
	try {
		const todoPath = STATE.todoPath;
		if (todoPath) {
			stdout(`Loaded persisted file: ${todoPath}`);
			await loadFile();
		} else {
			stdout(`No todo.txt file set. Please open a todo.txt file`);
		}
		await render.togglePickFile();
	} catch (err) {
		stderr(`Unable to load persisted todo file`, err);
	}
}
