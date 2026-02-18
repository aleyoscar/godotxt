export const KEYS = {
	storeFile: 'store.json',
	todoPath: 'todo-path',
	sortAscending: 'sort-ascending',
	sortGroup: 'sort-group',
	sortType: 'sort-type',
	showComplete: 'show-complete',
	filterContexts: 'filter-contexts',
	filterList: 'filter-list',
	filterPriorities: 'filter-priorities',
	filterProjects: 'filter-projects',
	theme: 'theme',
}

export const REGEX = {
	project: /\+[A-Za-z0-9_-]+/g,
	context: /@[A-Za-z0-9_-]+/g,
	projectSingle: /^\+[A-Za-z0-9_-]+$/,
	contextSingle: /^@[A-Za-z0-9_-]+$/,
	url: /(https?:\/\/|ftp:\/\/|www\.)[\w\-%.]+\.[a-z]{2,}(?:[\/\w\-.$?=&%#:]*)?/gi,
};
