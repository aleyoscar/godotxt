
import { DOM, KEYS, REGEX, STATE } from './globals.js';
import { capitalize, getDateString } from './helpers.js';
import { completeTask, editTask } from './manage.js';
import { toggleModal } from './modal.js';
import { selectAttribute } from './refine.js';

function toggleAside() {
	DOM.aside?.classList.toggle('open');
}

function parseTask(task) {
	const taskSub = task.priority ? `<a>(${task.priority})</a>` : '';
	const taskDates = [
		task.creationDate ? `<small><svg width="1em" height="1em"><use xlink:href="#icon-calendar"/></svg> ${getDateString(task.creationDate)}</small>` : '',
		task.completionDate ? `<small><ins><svg width="1em" height="1em"><use xlink:href="#icon-calendar-check"/></svg> ${getDateString(task.completionDate)}</ins></small>` : '',
	].join('');

	let taskDesc = task.raw.replace(REGEX.project, match =>
		task.projects.includes(match.slice(1))
			? `<a class="task-attribute-filter" data-attribute="projects" data-name="${match.slice(1)}">${match}</a>`
			: match
	).replace(REGEX.context, match =>
		task.contexts.includes(match.slice(1))
			? `<a class="contrast task-attribute-filter" data-attribute="contexts" data-name="${match.slice(1)}">${match}</a>`
			: match
	).replace(REGEX.url, (match) => {
		const href = match.startsWith('http') ? match : 'https://' + match;
		const label = new URL(href).hostname.replace(/^www\./i, '').split('.').slice(-2, -1)[0];
		return `<a class="task-link secondary" href=${href} target="_blank" rel="noopener noreferrer">
			<svg width="1em" height="1em"><use xlink:href="#icon-link"/></svg>${label}</a>`;
	});

	const li = document.createElement('li');
	li.id = `task-${task.id}`;
	li.classList.add('flex', 'align-center', 'hover-background', 'padding-xs', 'show-hover-parent');
	task.projects.forEach((p) => li.classList.add(p));
	task.contexts.forEach((c) => li.classList.add(c));

	const input = document.createElement('input');
	input.type = 'checkbox';
	input.checked = task.isCompleted;
	input.dataset.id = task.id;
	input.addEventListener('click', completeTask);
	li.appendChild(input);

	const hgroup = document.createElement('hgroup');
	hgroup.classList.add('pointer', 'flex-grow');
	hgroup.dataset.target = 'edit-modal';
	hgroup.addEventListener('click', (e) => {
		editTask(task.id);
		toggleModal(e);
	});
	hgroup.innerHTML = `
		<h5 class="flex space-between ${task.isCompleted ? 'muted-color strike' : ''}">
			<span>${taskSub} ${taskDesc}</span>
		</h5>
		<p class="flex gap-xs align-center">${taskDates}</p>
	`;
	li.appendChild(hgroup);

	return li;
}

async function renderTasks() {
	const filterProjects = await STATE.store.get(KEYS.filterProjects);
	const filterContexts = await STATE.store.get(KEYS.filterContexts);
	const filterList = await STATE.store.get(KEYS.filterList);
	const showComplete = await STATE.store.get(KEYS.showComplete);
	const sortAscending = await STATE.store.get(KEYS.sortAscending);
	const sortType = await STATE.store.get(KEYS.sortType);
	const group = await STATE.store.get(KEYS.sortGroup);

	// Update aside menu
	DOM.listProjects.innerHTML = '';
	DOM.logo.classList.toggle('hide-sm', STATE.todos.projects?.length);
	DOM.logo.nextElementSibling.classList.toggle('hide', !STATE.todos.projects?.length);
	DOM.aside.classList.toggle('hide', !STATE.todos.projects?.length);
	STATE.todos.projects?.forEach(project => {
		const li = document.createElement('li');
		li.innerHTML = `<a id="list-${project}" class="contrast pointer">${project}</a>`;
		li.addEventListener('click', async (e) => {
			await STATE.store.set(KEYS.filterList, project);
			await STATE.store.save();
			await renderTasks();
			toggleAside();
		});
		DOM.listProjects.append(li);
	});

	// Populate project & context dropdowns
	const updateModal = (modal, btn, items, attribute, checkedItems) => {
		if (!items) {
			modal.querySelector('ul').innerHTML = '';
			btn.toggleAttribute('disabled', !items);
			btn.classList.toggle('secondary', !items);
		} else {
			modal.querySelector('ul').innerHTML = items.length
				? items.map(item => `
					<li><label>
						<input type="checkbox" class="attribute-filter" data-attribute="${attribute}" name="${item}" ${checkedItems.includes(item) ? 'checked' : ''}/>
						${item}
					</label></li>
				`).join('')
				: '';
			btn.toggleAttribute('disabled', !items.length);
			btn.classList.toggle('secondary', !items.length);
		}
	};
	updateModal(DOM.projectsModal, DOM.projectsBtn, STATE.todos.projects, 'projects', filterProjects);
	updateModal(DOM.contextsModal, DOM.contextsBtn, STATE.todos.contexts, 'contexts', filterContexts);

	// Update list title
	DOM.listTitle.textContent = filterList === '' ? 'Tasks' : capitalize(filterList);

	// Filter todos
	let filteredTasks = STATE.todos.tasks ? STATE.todos.tasks
		.filter(task => (
			(!STATE.search || task.raw.toLowerCase().includes(STATE.search.toLowerCase())) &&
			(showComplete ? true : !task.isCompleted) &&
			(!filterProjects.length || task.projects.some(p => filterProjects.includes(p))) &&
			(!filterContexts.length || task.contexts.some(c => filterContexts.includes(c))) &&
			(!filterList || task.projects.includes(filterList))
		)) : [];

	// Sort todos
	const dir = sortAscending ? 1 : -1;
	const sortByDefault = (a, b) => {
		const valA = a.toString().toLowerCase();
		const valB = b.toString().toLowerCase();
		return valA < valB ? -1 * dir : valA > valB ? 1 * dir : 0;
	}
	const sortByDescription = (a, b) => {
		const valA = a.description.toLowerCase();
		const valB = b.description.toLowerCase();
		return valA < valB ? -1 * dir : valA > valB ? 1 * dir : 0;
	}
	const sortByPriority = (a, b) => {
		const valA = a.priority;
		const valB = b.priority;
		return valA < valB ? -1 * dir : valA > valB ? 1 * dir : 0;
	}
	const sortByDate = (a, b) => {
		const valA = a.creationDate ? a.creationDate : '';
		const valB = b.creationDate ? b.creationDate : '';
		return valA < valB ? -1 * dir : valA > valB ? 1 * dir : 0;
	}
	switch(sortType) {
		case 'description':
			filteredTasks = filteredTasks.sort(sortByDefault).sort(sortByDescription);
			break;
		case 'date':
			filteredTasks = filteredTasks.sort(sortByDefault).sort(sortByDate);
			break;
		default:
			filteredTasks = filteredTasks.sort(sortByDefault);
	}

	for (let i = 0; i < filteredTasks.length; i++) {
		filteredTasks[i].element = parseTask(filteredTasks[i]);
	}

	// Group todos
	DOM.taskList.querySelector('ul').innerHTML = '';
	switch(group) {
		case 'project':
			STATE.todos.projects.forEach(tag => {
				if (filteredTasks.filter(task => task.projects.includes(tag)).length) {
					DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>+${tag}</h5></li><li class="group"><hr></li>`;
					filteredTasks.forEach((t) => {
						if (t.projects.includes(tag))
							DOM.taskList.querySelector('ul').appendChild(t.element);
					});
				}
			});
			if (filteredTasks.filter(task => !task.projects.length)) {
				DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>No project</h5></li><li class="group"><hr></li>`;
				filteredTasks.forEach((t) => {
					if (!t.projects.length)
						DOM.taskList.querySelector('ul').appendChild(t.element);
				});
			}
			break;
		case 'context':
			STATE.todos.contexts.forEach(tag => {
				if (filteredTasks.filter(task => task.contexts.includes(tag)).length) {
					DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>@${tag}</h5></li><li class="group"><hr></li>`;
					filteredTasks.forEach((t) => {
						if (t.contexts.includes(tag))
							DOM.taskList.querySelector('ul').appendChild(t.element);
					});
				}
			});
			if (filteredTasks.filter(task => !task.contexts.length)) {
				DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>No context</h5></li><li class="group"><hr></li>`;
				filteredTasks.forEach((t) => {
					if (!t.contexts.length)
						DOM.taskList.querySelector('ul').appendChild(t.element);
				});
			}
			break;
		case 'priority':
			STATE.todos.priorities.forEach(priority => {
				if (priority && filteredTasks.filter(task => task.priority === priority).length) {
					DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>Priority '${priority}'</h5></li><li class="group"><hr></li>`;
					filteredTasks.forEach((t) => {
						if (t.priority === priority)
							DOM.taskList.querySelector('ul').appendChild(t.element);
					});
				}
			});
			if (filteredTasks.filter(task => !task.priority)) {
				DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>No priority</h5></li><li class="group"><hr></li>`;
				filteredTasks.forEach((t) => {
					if (!t.priority)
						DOM.taskList.querySelector('ul').appendChild(t.element);
				});
			}
			break;
		default:
			// Render todos
			filteredTasks.forEach((t) => {
				DOM.taskList.querySelector('ul').appendChild(t.element);
			});
	}

	// Update showAll button visibility
	if (DOM.showAll) {
		DOM.showAll.classList.toggle('hide', !(STATE.search || filterProjects.length || filterContexts.length));
	}

	// Update task links to stop propagation
	document.querySelectorAll('.task-link').forEach((link) => {
		link.addEventListener('click', (e) => {
			e.stopPropagation();
		});
	});

	// Select attribute filters by clicking on task projects or contexts
	document.querySelectorAll('.task-attribute-filter').forEach((link) => {
		link.addEventListener('click', (e) => {
			e.stopPropagation();
			selectAttribute(e);
		});
	});
}

export { renderTasks, toggleAside }
