import { loadVersion, loadStore } from './modules/state.js';
import { loadPersistedTodo } from './modules/file.js';
import * as render from './modules/render.js';
import { STATE } from './modules/state.js';
import { KEYS } from './modules/constants.js';
import { attachListeners } from './modules/events.js';

async function bootstrap() {
	await loadVersion();
	await loadStore();
	await loadPersistedTodo();
	render.populateRefine();
	render.toggleTheme();
	render.renderTasks();
	attachListeners();
}

bootstrap();
