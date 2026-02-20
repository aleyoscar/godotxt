import { setFilterSearch } from './refine.js';
import { getDateString } from './utils.js';
import { REGEX } from './constants.js';

export const clearBtn = document.createElement('button');
clearBtn.classList.add('secondary');
clearBtn.textContent = 'Clear';
clearBtn.dataset.clear = 'true';
clearBtn.addEventListener('click', setFilterSearch);

export function createIcon(id, width='1em', height='1em') {
	const svg = createElement('svg', {
		attributes: [ { width: width }, { height: height } ],
		children: [
			createElement('use', {
				attributes: [ { 'xlink:href': `#${id}` } ],
			}),
		],
	});
	return svg;
}

export function createElement(tag, options = {}) {
	const el = document.createElement(tag);

	if (options.id) el.id = options.id;
	if (options.class) el.className = options.class;
	if (options.textContent) el.textContent = options.textContent;
	if (options.type) el.type = options.type;
	if (options.checked) el.checked = options.checked;

	if (options.dataset) {
		Object.entries(options.dataset).forEach(([key, value]) => {
			el.dataset[key] = value;
		});
	}

	if (options.attributes) {
		Object.entries(options.attributes).forEach(([key, value]) => {
			el.setAttribute(key, value);
		});
	}

	if (options.children) {
		options.children.forEach(child => {
			if (child instanceof Element) {
				el.appendChild(child);
			} else {
				el.appendChild(document.createTextNode(child));
			}
		});
	}

	if (options.innerHTML) el.innerHTML = options.innerHTML;
	return el;
}

export function getTaskHtml(task) {
	const taskSub = task.priority ? `<a class="task-filter-priorities-btn" data-priority="${task.priority}">(${task.priority})</a>` : '';
	const taskDates = [
		task.creationDate ? `<small><svg width="1em" height="1em"><use xlink:href="#icon-calendar"/></svg> ${getDateString(task.creationDate)}</small>` : '',
		task.completionDate ? `<small><ins><svg width="1em" height="1em"><use xlink:href="#icon-calendar-check"/></svg> ${getDateString(task.completionDate)}</ins></small>` : '',
	].join('');

	let taskDesc = task.raw.replace(REGEX.project, match =>
		task.projects.includes(match.slice(1))
			? `<a class="task-filter-projects-btn" data-project="${match.slice(1)}">${match}</a>`
			: match
	).replace(REGEX.context, match =>
		task.contexts.includes(match.slice(1))
			? `<a class="contrast task-filter-contexts-btn" data-context="${match.slice(1)}">${match}</a>`
			: match
	).replace(REGEX.url, (match) => {
		const href = match.startsWith('http') ? match : 'https://' + match;
		const label = new URL(href).hostname.replace(/^www\./i, '').split('.').slice(-2, -1)[0];
		return `<a class="task-link secondary" href=${href} target="_blank" rel="noopener noreferrer">
			<svg width="1em" height="1em"><use xlink:href="#icon-link"/></svg>${label}</a>`;
	});

	const li = createElement('li', {
		id: `task-${task.id}`,
		class: `task flex align-center hover-background padding-xs show-hover-parent ${task.projects.join(' ')} ${task.contexts.join(' ')}`,
		dataset: { target: 'edit-modal', id: task.id },
		children: [
			createElement('input', {
				class: 'task-complete-task-btn',
				type: 'checkbox',
				checked: task.completed,
				dataset: { id: task.id },
			}),
			createElement('hgroup', {
				class: 'pointer flex-grow',
				dataset: { target: 'edit-modal' },
				innerHTML: `
					<h5 class="flex space-between ${task.completed ? 'muted-color strike' : ''}">
						<span>${taskSub} ${taskDesc}</span>
					</h5>
					<p class="flex gap-xs align-center">${taskDates}</p>`,
			}),
		],
	});

	return li;
}
