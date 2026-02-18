import { DOM } from './dom.js';
import { capitalize, stderr, stdout, getDateString } from './utils.js';
import { STATE } from './state.js';
import { KEYS, REGEX } from './constants.js';
import { readFile } from './file.js';
import { TodoTxt } from './todotxt.js';
import { completeTask, deleteTag } from './manage.js';
import { toggleModal } from './modal.js';

export function populateTags() {
	const taskTags = {
		projects: { regex: REGEX.project, container: DOM.editProjects, classes: 'background-primary mr-xs mb-xs' },
		contexts: { regex: REGEX.context, container: DOM.editContexts, classes: 'mr-xs mb-xs' },
	};

	Object.values(taskTags).forEach(({ regex, container, classes }) => {
		const span = container.querySelector('span');
		const icon = container.querySelector('i');
		span.innerHTML = '';
		icon.classList.toggle('hide', !!DOM.editDescription.value.match(regex));
		(DOM.editDescription.value.match(regex) || []).forEach(tag => {
			const kbd = document.createElement('kbd');
			const b = document.createElement('b');
			kbd.className = classes;
			kbd.textContent = `${tag} `;
			b.classList.add('pointer');
			b.addEventListener('click', deleteTag);
			b.innerHTML = '<svg width="1em" height="1em"><use xlink:href="#icon-x"/></svg>';
			kbd.appendChild(b);
			span.appendChild(kbd);
		});
	});
}

export async function addTask() {
	const currentProject = await STATE.store.get(KEYS.filterList);
	DOM.editForm.reset();
	DOM.editTitle.textContent = 'Add task';
	DOM.editId.value = '';
	DOM.editDescription.value = currentProject ? ` +${currentProject}` : '';
	DOM.editDescription.setSelectionRange(0, 0);
	DOM.editDelete.classList.add('hide');
	DOM.editDeleteConfirm.classList.add('hide');
	DOM.editSubmit.textContent = 'Add';
	populateTags();
}

function editTask(id) {
	const task = STATE.todos.tasks.find(t => t.id === id);
	if (!task) return;
	DOM.autocomplete.classList.add('hide');
	DOM.editForm.reset();
	DOM.editTitle.textContent = `Edit task #${task.lineNum}`;
	DOM.editId.value = task.id;
	DOM.editDescription.value = task.rawDescription;
	DOM.editPriority.value = task.priority || '--';
	DOM.editComplete.checked = task.completed;
	DOM.editDelete.dataset.id = task.id;
	DOM.editDelete.classList.remove('hide');
	DOM.editDeleteConfirm.classList.add('hide');
	DOM.editSubmit.textContent = 'Save';
	DOM.editDescription.focus();
	DOM.editDescription.setSelectionRange(DOM.editDescription.value.length, DOM.editDescription.value.length);
	populateTags();
}

export function deleteConfirm(event) {
	DOM.editDeleteConfirm.classList.remove('hide');
	DOM.editDeleteConfirm.dataset.id = event.currentTarget.dataset.id;
}

function openDelete() {
	DOM.deleteLists.innerHTML = (STATE.todos.projects?.length ? ['All Tasks', ...STATE.todos.projects] : [])
		.map(project => `
			<label>
				<input class="delete-switch" type="checkbox" role="switch" data-project="${project}" />
				${project}
			</label>
		`).join('');
	openModal(DOM.deleteModal);
}

export function toggleAside() {
	DOM.aside?.classList.toggle('open');
}

export async function togglePickFile() {
	const todoPath = await STATE.store.get(KEYS.todoPath);
	DOM.pickFile.classList.toggle('hide', todoPath);
	DOM.taskList.classList.toggle('hide', !todoPath);
}

function parseTask(task) {
	const taskSub = task.priority ? `<a class="task-priority-filter" data-priority="${task.priority}">(${task.priority})</a>` : '';
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
	input.checked = task.completed;
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
		<h5 class="flex space-between ${task.completed ? 'muted-color strike' : ''}">
			<span>${taskSub} ${taskDesc}</span>
		</h5>
		<p class="flex gap-xs align-center">${taskDates}</p>
	`;
	li.appendChild(hgroup);

	return li;
}

export async function renderTasks() {
	const filterPriorities = await STATE.store.get(KEYS.filterPriorities);
	const filterProjects = await STATE.store.get(KEYS.filterProjects);
	const filterContexts = await STATE.store.get(KEYS.filterContexts);
	const filterList = await STATE.store.get(KEYS.filterList);
	const showComplete = await STATE.store.get(KEYS.showComplete);
	const sortAscending = await STATE.store.get(KEYS.sortAscending);
	const sortType = await STATE.store.get(KEYS.sortType);
	const group = await STATE.store.get(KEYS.sortGroup);

	// Update aside menu
	DOM.listProjects.innerHTML = '';
	DOM.logo.classList.toggle('hide-sm', STATE.todos?.projects.length);
	DOM.logo.nextElementSibling.classList.toggle('hide', !STATE.todos?.projects.length);
	DOM.aside.classList.toggle('hide', !STATE.todos?.projects.length);
	STATE.todos?.projects.forEach(project => {
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

	// Populate priority filter
	if (STATE.todos && STATE.todos.priorities.length) {
		DOM.prioritiesBtn.classList.remove('secondary');
		DOM.prioritiesBtn.removeAttribute('disabled');
	} else {
		DOM.prioritiesBtn.classList.add('secondary');
		DOM.prioritiesBtn.setAttribute('disabled', true);
	}
	DOM.priorityGrid.querySelectorAll('button').forEach((b) => {
		const hasPriority = STATE.todos !== null && STATE.todos.priorities.includes(b.textContent);
		if (hasPriority) b.removeAttribute('disabled');
		else b.setAttribute('disabled', true);
		b.classList.toggle('secondary', !hasPriority)
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
	updateModal(DOM.projectsModal, DOM.projectsBtn, STATE.todos?.projects, 'projects', filterProjects);
	updateModal(DOM.contextsModal, DOM.contextsBtn, STATE.todos?.contexts, 'contexts', filterContexts);

	// Update list title
	DOM.listTitle.textContent = filterList === '' ? 'Tasks' : capitalize(filterList);

	// Filter todos
	let filteredTasks = STATE.todos?.tasks ? STATE.todos.tasks
		.filter(task => (
			(!STATE.search || task.raw.toLowerCase().includes(STATE.search.toLowerCase())) &&
			(showComplete ? true : !task.completed) &&
			(!filterPriorities.length || filterPriorities.includes(task.priority)) &&
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
		DOM.showAll.classList.toggle('hide', !(STATE.search || filterProjects.length || filterContexts.length || filterPriorities.length));
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

	// Select priorty filter by clicking on priority
	document.querySelectorAll('.task-priority-filter').forEach((link) => {
		link.addEventListener('click', async (e) => {
			e.stopPropagation();
			const priorityList = [e.currentTarget.dataset.priority];
			await STATE.store.set(KEYS.filterPriorities, priorityList);
			setFilterPriorities(priorityList);
			await renderTasks();
		});
	})
}

export function setShowComplete(showComplete) {
	const newIcon = showComplete ? '#icon-eye-fill' : '#icon-eye';
	DOM.completeToggle.classList.toggle('outline', !showComplete);
	DOM.completeToggle.querySelector('use').setAttribute('xlink:href', newIcon);
}

export function setSort(sortAscending) {
	const newIcon = sortAscending ? '#icon-caret-down' : '#icon-caret-up-fill';
	DOM.sortToggle.classList.toggle('outline', sortAscending);
	DOM.sortToggle.querySelector('use').setAttribute('xlink:href', newIcon);
}

export function setGroup(group) {
	const newIcon = group === 'none' ? '#icon-group' : '#icon-group-fill';
	DOM.groupBtn.classList.toggle('outline', group === 'none');
	DOM.groupBtn.querySelector('use').setAttribute('xlink:href', newIcon);
	Array.from(DOM.groupBtns.children).forEach((btn) => {
		btn.classList.toggle('outline', !btn.id.includes(group));
	});
	DOM.groupClearBtn.classList.toggle('hide', group === 'none');
}

export function setTheme(theme) {
	DOM.menuTheme.dataset.theme = theme;
	DOM.menuTheme.querySelector('use').setAttribute('xlink:href', `#icon-${theme}`);
	if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
	else document.documentElement.setAttribute('data-theme', theme);
}

export function resizeScrollLists() {
	const taskRect = DOM.taskListUl.getBoundingClientRect();
	const listRect = DOM.projectList.getBoundingClientRect();
	const footerRect = DOM.status.getBoundingClientRect();
	const availableTaskHeight = window.innerHeight - taskRect.top - footerRect.height;
	const availableListHeight = window.innerHeight - listRect.top - footerRect.height;

	if (availableTaskHeight > 0) {
		DOM.taskListUl.style.height = `calc(${availableTaskHeight}px - var(--pico-spacing))`;
	}

	if (availableListHeight > 0) {
		DOM.projectList.style.height = `calc(${availableListHeight}px - var(--pico-spacing))`;
	}
}

export function setSortBy(type) {
	Array.from(DOM.sortBtns.children).forEach((btn) => {
		btn.classList.toggle('outline', !btn.id.includes(type));
	});
	DOM.sortByToggle.classList.toggle('outline', !DOM.sortDefaultBtn.classList.contains('outline'));
	DOM.sortByText.textContent = capitalize(type);
}

export function setFilterPriorities(priorities) {
	DOM.priorityGrid.querySelectorAll('button').forEach((b) => {
		b.classList.toggle('outline', !priorities.includes(b.textContent));
	});
	DOM.prioritiesBtn.classList.toggle('outline', !priorities.length);
	if (priorities.length) DOM.prioritiesBtn.querySelector('use').setAttribute('xlink:href', '#icon-flag-fill');
	else DOM.prioritiesBtn.querySelector('use').setAttribute('xlink:href', '#icon-flag');
}

export const toggleLoading = (show) => {
	document.querySelectorAll('.loading').forEach(el => el.classList.toggle('hide', !show));
};

export function setAttributeFiltersDOM(attribute) {
	const checked = [];
	DOM[`${attribute}Btn`].classList.add('outline');
	document.querySelectorAll('.attribute-filter').forEach(input => {
		if (input.checked && input.dataset.attribute === attribute) {
			checked.push(input.name);
			DOM[`${attribute}Btn`].classList.remove('outline');
		}
	});
	return checked;
}

export async function setContent(path) {
	toggleLoading(true);
	try {
		const content = await readFile(path);
		STATE.todos = new TodoTxt(content);
		stdout(`Opened file ${path}`);
		await renderTasks();
	} catch (err) {
		stderr('Failed to set content', err);
	} finally {
		toggleLoading(false);
		await togglePickFile();
	}
}
