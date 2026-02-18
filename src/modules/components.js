import { clearSearch } from './refine.js';

export const clearBtn = Object.assign(document.createElement('button'), {
	className: 'secondary',
	textContent: 'Clear',
	onclick: clearSearch,
});
