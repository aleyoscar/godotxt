
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { AndroidFs, isAndroid } from 'tauri-plugin-android-fs-api';
import { KEYS } from './constants.js';
import { STATE, saveStore } from './state.js';
import { stdout, stderr, debug } from './utils.js';
import * as render from './render.js';
import { TodoTxt } from './todotxt.js';

export async function saveFile(path=STATE.todoPath, content=STATE.todos.toString()) {
	debug('saveFile', path, content);
	try {
		await writeTextFile(path, content);
		debug(`Saved ${path}`);
	} catch (err) {
		stderr(`Unable to save file ${path}`, err);
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
				debug('Picked android file', todoPath);
			}
			else {
				debug('No file picked');
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
		stderr('Failed to open dialog: ', err);
	}
}

async function createFile() {
	try {
		let todoPath;
		if (await isAndroid()) {
			const todoFile = await AndroidFs.showSaveFilePicker('todo.txt');
			if (todoFile) {
				todoPath = await AndroidFs.getFsPath(todoFile);
				await AndroidFs.persistPickerUriPermission(todoFile);
				debug('Created android file', todoPath);
			} else {
				debug('No file picked');
				return;
			}
		} else {
			todoPath = await save({
				filters: [ { name: 'Text File', extensions: ['txt', 'md'] } ],
				title: 'Create a new Todo.txt file',
			});
		}
		await saveFile(todoPath, '\n');
		return todoPath || null;
	} catch (err) {
		stderr('Failed to create file', err);
	}
}

export async function closeFile(e) {
	try {
		const currentFile = STATE.todoPath;
		STATE.todos = null;
		STATE.todoPath = '';
		await saveStore('todoPath');
		await render.populateRefine();
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
		debug(`Read file: ${path}`);
		return content || '';
	} catch (err) {
		stderr(`Failed to read file ${path}: `, err);
	}
}

export async function chooseFile(e) {
	try {
		const todoPath = e.target.dataset.choose === 'open' ? await openFile() : await createFile();
		if (todoPath) {
			STATE.todoPath = todoPath;
			debug('Selected file:', todoPath);
			await saveStore('todoPath');
			await loadFile();
			render.populateRefine();
			render.renderTasks();
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
