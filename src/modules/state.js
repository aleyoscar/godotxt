import { getVersion } from '@tauri-apps/api/app';
import { DOM } from './dom.js';
import { load } from '@tauri-apps/plugin-store';
import { KEYS } from './constants.js';
import * as render from './render.js';

export async function saveStore(key=null) {
	try {
		console.log(`Saving key '${KEYS[key]}' as '${STATE[key]}'`);
		if (key) {
			await STATE.store.set(KEYS[key], STATE[key]);
		} else {
			await STATE.store.set(KEYS.filterContexts, STATE.filterContexts);
			await STATE.store.set(KEYS.filterList, STATE.filterList);
			await STATE.store.set(KEYS.filterPriorities, STATE.filterPriorities);
			await STATE.store.set(KEYS.filterProjects, STATE.filterProjects);
			await STATE.store.set(KEYS.showComplete, STATE.showComplete);
			await STATE.store.set(KEYS.sortAscending, STATE.sortAscending);
			await STATE.store.set(KEYS.sortGroup, STATE.sortGroup);
			await STATE.store.set(KEYS.sortType, STATE.sortType);
			await STATE.store.set(KEYS.theme, STATE.theme);
			await STATE.store.set(KEYS.todoPath, STATE.todoPath);
		}
		console.log(`Successfully saved store '${key ? key : "all"}'`);
	} catch (err) {
		console.error('Unable to save store', err);
	}
}

async function loadState() {
	try {
		STATE.filterContexts = await STATE.store.get(KEYS.filterContexts);
		STATE.filterList = await STATE.store.get(KEYS.filterList);
		STATE.filterPriorities = await STATE.store.get(KEYS.filterPriorities);
		STATE.filterProjects = STATE.filterList ? [STATE.filterList] : await STATE.store.get(KEYS.filterProjects);
		STATE.showComplete = await STATE.store.get(KEYS.showComplete);
		STATE.sortAscending = await STATE.store.get(KEYS.sortAscending);
		STATE.sortGroup = await STATE.store.get(KEYS.sortGroup);
		STATE.sortType = await STATE.store.get(KEYS.sortType);
		STATE.theme = await STATE.store.get(KEYS.theme);
		STATE.todoPath = await STATE.store.get(KEYS.todoPath);
		console.log('Loaded store into state');
	} catch (err) {
		console.error('Unable to load store into state');
	}
}

export async function loadStore() {
	try {
		STATE.store = await load(KEYS.storeFile, { defaults: {
			filterContexts: [],
			filterList: '',
			filterPriorities: [],
			filterProjects: [],
			showComplete: false,
			sortAscending: true,
			sortGroup: 'none',
			sortType: 'default',
			theme: 'auto',
			todoPath: '',
		}});
		await loadState();
		console.log(`Loaded store`);
	} catch (err) {
		console.error(`Unable to load store`, err);
	}
}

export async function loadVersion() {
	try {
		const version = await getVersion();
		DOM.versionInfo.textContent = `v${version}`;
		console.log(`App version: ${version}`);
	} catch (err) {
		console.error(`Unable to get app version info`, err);
	}
}

export const STATE = {
	animationDuration: 400, // ms
	closingClass: 'modal-is-closing',
	filterContexts: [],
	filterList: '',
	filterPriorities: [],
	filterProjects: [],
	filterSearch: '',
	isOpenClass: 'modal-is-open',
	openingClass: 'modal-is-opening',
	scrollbarWidthCssVar: '--pico-scrollbar-width',
	search: '',
	showComplete: false,
	sortAscending: true,
	sortGroup: 'none',
	sortType: 'default',
	store: null,
	theme: 'auto',
	todoPath: '',
	todos: null,
	visibleModal: null,
}
