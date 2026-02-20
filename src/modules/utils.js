import { DOM } from './dom.js';

export const getDateString = (date) => {
	const d = new Date(date ? date : Date.now());
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

export const cleanString = (text) => text.trim().replace(/\s+/g, ' ');

export function stdout(message, ...args) {
	console.log(message, ...args);
	DOM.status.querySelector('small').textContent = message;
	DOM.status.classList.remove('error');
}

export function stderr(message, ...args) {
	console.error(message, ...args);
	DOM.status.querySelector('small').textContent = message;
	DOM.status.classList.add('error');
}

export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export function toggleArrayElement(arr, ele) {
	const newArr = arr;
	const i = newArr.indexOf(ele);
	if (i > -1) newArr.splice(i, 1);
	else newArr.push(ele);
	return newArr;
}

export const getScrollbarWidth = () => window.innerWidth - document.documentElement.clientWidth;
