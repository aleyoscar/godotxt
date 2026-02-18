
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { AndroidFs, isAndroid } from 'tauri-plugin-android-fs-api';
import { KEYS } from './constants.js';
import { STATE } from './state.js';
import { stdout, stderr } from './utils.js';
import { toggleLoading, togglePickFile, setContent } from './render.js';

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
				filters: [{
					name: 'Text',
					extensions: ['txt', 'md'],
				}],
				title: 'Select your Todo.txt file',
			});
		}
		return todoPath || null;
	} catch (err) {
		console.error('Failed to open dialog: ', err);
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

export async function loadPersistedTodo() {
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
