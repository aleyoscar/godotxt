import { getVersion } from '@tauri-apps/api/app';
import { DOM } from './dom.js';
import { load } from '@tauri-apps/plugin-store';
import { KEYS } from './constants.js';
import * as render from './render.js';
import { stdout, stderr, debug} from './utils.js';

export async function saveStore(key=null) {
	try {
		debug(`Saving key '${KEYS[key]}' as '${STATE[key]}'`);
		if (key) {
			await STATE.store.set(KEYS[key], STATE[key]);
		} else {
			await STATE.store.set(KEYS.debug, STATE.debug);
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
		debug(`Successfully saved store '${key ? key : "all"}'`);
	} catch (err) {
		stderr('Unable to save store', err);
	}
}

async function loadState() {
	try {
		STATE.debug = await STATE.store.get(KEYS.debug) || DEFAULTS.debug;
		STATE.filterContexts = await STATE.store.get(KEYS.filterContexts) || DEFAULTS.filterContexts;
		STATE.filterList = await STATE.store.get(KEYS.filterList) || DEFAULTS.filterList;
		STATE.filterPriorities = await STATE.store.get(KEYS.filterPriorities) || DEFAULTS.filterPriorities;
		STATE.filterProjects = STATE.filterList ? [STATE.filterList] :
			await STATE.store.get(KEYS.filterProjects) || DEFAULTS.filterProjects;
		STATE.showComplete = await STATE.store.get(KEYS.showComplete) || DEFAULTS.showComplete;
		STATE.sortAscending = await STATE.store.get(KEYS.sortAscending) || DEFAULTS.sortAscending;
		STATE.sortGroup = await STATE.store.get(KEYS.sortGroup) || DEFAULTS.sortGroup;
		STATE.sortType = await STATE.store.get(KEYS.sortType) || DEFAULTS.sortType;
		STATE.theme = await STATE.store.get(KEYS.theme) || DEFAULTS.theme;
		STATE.todoPath = await STATE.store.get(KEYS.todoPath) || DEFAULTS.todoPath;
		debug('Loaded store into state', STATE);
	} catch (err) {
		stderr('Unable to load store into state');
	}
}

export async function loadStore() {
	try {
		STATE.store = await load(KEYS.storeFile, { defaults: {
			debug: DEFAULTS.debug,
			filterContexts: DEFAULTS.filterContexts,
			filterList: DEFAULTS.filterList,
			filterPriorities: DEFAULTS.filterPriorities,
			filterProjects: DEFAULTS.filterProjects,
			showComplete: DEFAULTS.showComplete,
			sortAscending: DEFAULTS.sortAscending,
			sortGroup: DEFAULTS.sortGroup,
			sortType: DEFAULTS.sortType,
			theme: DEFAULTS.theme,
			todoPath: DEFAULTS.todoPath,
		}});
		await loadState();
		debug(`Loaded store`);
	} catch (err) {
		stderr(`Unable to load store`, err);
	}
}

export async function loadVersion() {
	try {
		const version = await getVersion();
		DOM.versionInfo.textContent = `v${version}`;
		debug(`App version: ${version}`);
	} catch (err) {
		stderr(`Unable to get app version info`, err);
	}
}

const DEFAULTS = {
	animationDuration: 400,
	closingClass: 'modal-is-closing',
	debug: false,
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

export const STATE = DEFAULTS;
