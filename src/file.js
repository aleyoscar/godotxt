
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { AndroidFs, isAndroid } from 'tauri-plugin-android-fs-api';

async function saveFile(path, content) {
	try {
		await writeTextFile(path, content);
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

async function readFile(path) {
	try {
		const content = await readTextFile(path);
		console.log(`Read file: ${path}`);
		return content || '';
	} catch (err) {
		console.error(`Failed to read file ${path}: `, err);
	}
}

export { openFile, readFile, saveFile };
