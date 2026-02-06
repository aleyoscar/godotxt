
import { DOM, KEYS, REGEX, STATE } from './globals.js';
import { getDateString } from './helpers.js';

function parseTask(task) {
	const taskSub = task.priority ? `<a>(${task.priority})</a>` : '';
	const taskDates = [
		task.creationDate ? `<small><svg width="1em" height="1em"><use xlink:href="#icon-calendar"/></svg> ${getDateString(task.creationDate)}</small>` : '',
		task.completionDate ? `<small><ins><svg width="1em" height="1em"><use xlink:href="#icon-calendar-check"/></svg> ${getDateString(task.completionDate)}</ins></small>` : '',
	].join('');

	let taskDesc = task.raw.replace(REGEX.project, match =>
		task.projects.includes(match.slice(1))
			? `<a data-attribute="projects" data-name="${match.slice(1)}" onclick="selectAttribute(event)">${match}</a>`
			: match
	).replace(REGEX.context, match =>
		task.contexts.includes(match.slice(1))
			? `<a class="contrast" data-attribute="contexts" data-name="${match.slice(1)}" onclick="selectAttribute(event)">${match}</a>`
			: match
	).replace(REGEX.url, (match) => {
		const href = match.startsWith('http') ? match : 'https://' + match;
		const label = new URL(href).hostname.replace(/^www\./i, '').split('.').slice(-2, -1)[0];
		return `<a class="task-link secondary" href=${href} target="_blank" rel="noopener noreferrer">
			<svg width="1em" height="1em"><use xlink:href="#icon-link"/></svg>${label}</a>`;
	});

	return `
		<input type="checkbox" ${task.isCompleted ? 'checked' : ''} data-id="${task.id}" onclick="completeTask(event)" />
		<hgroup class="pointer flex-grow" data-target="edit-modal" onclick="editTask('${task.id}'); toggleModal(event);">
			<h5 class="flex space-between ${task.isCompleted ? 'muted-color strike' : ''}">
				<span>${taskSub} ${taskDesc}</span>
			</h5>
			<p class="flex gap-xs align-center">${taskDates}</p>
		</hgroup>
		<svg class="show-hover" width="1em" height="1em"><use xlink:href="#icon-edit"/></svg>
	`;
}

async function renderTasks() {
	const filterProjects = await STATE.store.get(KEYS.filterProjects);
	const filterContexts = await STATE.store.get(KEYS.filterContexts);
	const showComplete = await STATE.store.get(KEYS.showComplete);
	const sortAscending = await STATE.store.get(KEYS.sortAscending);
	const sortType = await STATE.store.get(KEYS.sortType);
	const group = await STATE.store.get(KEYS.sortGroup);

	// Update aside menu
	const listUl = DOM.aside?.querySelector('ul');
	if (listUl) {
		DOM.logo.classList.toggle('hide-sm', STATE.todos.projects?.length);
		DOM.logo.nextElementSibling.classList.toggle('hide', !STATE.todos.projects?.length);
		DOM.aside.classList.toggle('hide', !STATE.todos.projects?.length);
		while (listUl.children.length > 1) listUl.lastElementChild.remove();
		STATE.todos.projects?.forEach(project => {
			listUl.insertAdjacentHTML('beforeend', `
				<li><a id="list-${project}" class="contrast" href="#${project}" onclick="toggleAside()" data-title="${project}">${project}</a></li>
			`);
		});
	}

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

	// Get list hash
	const hash = location.hash.slice(1) || '';
	let filterList = '';
	let listTitle = 'Tasks';
	DOM.noList.classList.add('hide');
	if (hash && hash !== 'tasks' && document.getElementById(`list-${hash}`)) {
		filterList = hash;
		listTitle = document.getElementById(`list-${hash}`).dataset.title
	} else if (hash && hash !== 'tasks' && !document.getElementById(`list-${hash}`)) {
		DOM.noList.querySelector('span').textContent = hash;
		DOM.noList.classList.remove('hide');
	}
	DOM.listTitle.textContent = listTitle;

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
		filteredTasks[i].html = `
			<li id="task-${filteredTasks[i].id}" class="flex align-center hover-background padding-xs show-hover-parent ${filteredTasks[i].projects.map(p => `project-${p}`).join(' ')} ${filteredTasks[i].contexts.map(c => `context-${c}`).join(' ')}">
				${parseTask(filteredTasks[i])}
			</li>
		`;
	}

	// Group todos
	DOM.taskList.querySelector('ul').innerHTML = '';
	switch(group) {
		case 'project':
			STATE.todos.projects.forEach(tag => {
				if (filteredTasks.filter(task => task.projects.includes(tag)).length) {
					DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>+${tag}</h5></li><li class="group"><hr></li>`;
					DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => task.projects.includes(tag) ? task.html : '').join('');
				}
			});
			if (filteredTasks.filter(task => !task.projects.length)) {
				DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>No project</h5></li><li class="group"><hr></li>`;
				DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => !task.projects.length ? task.html : '').join('');
			}
			break;
		case 'context':
			STATE.todos.contexts.forEach(tag => {
				if (filteredTasks.filter(task => task.contexts.includes(tag)).length) {
					DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>@${tag}</h5></li><li class="group"><hr></li>`;
					DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => task.contexts.includes(tag) ? task.html : '').join('');
				}
			});
			if (filteredTasks.filter(task => !task.contexts.length)) {
				DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>No context</h5></li><li class="group"><hr></li>`;
				DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => !task.contexts.length ? task.html : '').join('');
			}
			break;
		case 'priority':
			STATE.todos.priorities.forEach(priority => {
				if (priority && filteredTasks.filter(task => task.priority === priority).length) {
					DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>Priority '${priority}'</h5></li><li class="group"><hr></li>`;
					DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => task.priority === priority ? task.html : '').join('');
				}
			});
			if (filteredTasks.filter(task => !task.priority)) {
				DOM.taskList.querySelector('ul').innerHTML += `<li class="group"><h5>No priority</h5></li><li class="group"><hr></li>`;
				DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => !task.priority ? task.html : '').join('');
			}
			break;
		default:
			// Render todos
			DOM.taskList.querySelector('ul').innerHTML += filteredTasks.map(task => task.html).join('');
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
}

export { renderTasks }
