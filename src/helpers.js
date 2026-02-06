
import { DOM } from './globals.js';
import { clearSearch } from './refine.js';

const clearBtn = Object.assign(document.createElement('button'), {
	className: 'secondary',
	textContent: 'Clear',
	onclick: clearSearch,
});

const getDateString = (date) => {
	const d = new Date(date ? date : Date.now());
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

const toggleLoading = (show) => {
	document.querySelectorAll('.loading').forEach(el => el.classList.toggle('hide', !show));
};

const cleanString = (text) => text.trim().replace(/\s+/g, ' ');

function stdout(message, ...args) {
	console.log(message, ...args);
	DOM.status.querySelector('small').textContent = message;
	DOM.status.classList.remove('error');
}

function stderr(message, ...args) {
	console.error(message, ...args);
	DOM.status.querySelector('small').textContent = message;
	DOM.status.classList.add('error');
}

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export { clearBtn, getDateString, toggleLoading, cleanString, stdout, stderr, capitalize }
