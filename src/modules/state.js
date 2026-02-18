import { getVersion } from '@tauri-apps/api/app';
import { DOM } from './dom.js';
import { load } from '@tauri-apps/plugin-store';
import { KEYS } from './constants.js';
import * as render from './render.js';

async function loadStore() {
	try {
		STATE.store = await load(KEYS.storeFile, { autosave: false });
		if (!await STATE.store.has(KEYS.sortAscending)) await STATE.store.set(KEYS.sortAscending, true);
		render.setSort(await STATE.store.get(KEYS.sortAscending));
		if (!await STATE.store.has(KEYS.sortGroup)) await STATE.store.set(KEYS.sortGroup, 'none');
		render.setGroup(await STATE.store.get(KEYS.sortGroup));
		if (!await STATE.store.has(KEYS.sortType)) await STATE.store.set(KEYS.sortType, 'priority');
		render.setSortBy(await STATE.store.get(KEYS.sortType));
		if (!await STATE.store.has(KEYS.showComplete)) await STATE.store.set(KEYS.showComplete, false);
		render.setShowComplete(await STATE.store.get(KEYS.showComplete));
		if (!await STATE.store.has(KEYS.filterContexts)) await STATE.store.set(KEYS.filterContexts, []);
		if (!await STATE.store.has(KEYS.filterList)) await STATE.store.set(KEYS.filterList, '');
		if (!await STATE.store.has(KEYS.filterPriorities)) await STATE.store.set(KEYS.filterPriorities, []);
		render.setFilterPriorities(await STATE.store.get(KEYS.filterPriorities));
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

const STATE = {
	store: null,
	todos: null,
	search: '',
	visibleModal: null,
}

export { STATE, loadVersion, loadStore }
