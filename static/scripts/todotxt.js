class Task {
	constructor(line = '', id = '', lineNum = 0) {
		this.id = id;
		this.lineNum = lineNum;
		this.description = '';
		this.rawDescription = '';
		this.isCompleted = false;
		this.completionDate = null;
		this.creationDate = null;
		this.priority = null;
		this.projects = [];
		this.contexts = [];
		this.attributes = {};
		if (line) {
			this.parse(line);
		}
	}

	parse(line) {
		let remaining = line.trim();

		// Parse completion status and date
		if (remaining.startsWith('x ')) {
			this.isCompleted = true;
			remaining = remaining.slice(2).trim();
			const dateMatch = remaining.match(/^(\d{4}-\d{2}-\d{2})\s+/);
			if (dateMatch) {
				this.completionDate = dateMatch[1];
				remaining = remaining.slice(dateMatch[0].length).trim();
			}
		}

		// Parse priority
		const priorityMatch = remaining.match(/^\(([A-Z])\)\s+/);
		if (priorityMatch) {
			this.priority = priorityMatch[1];
			remaining = remaining.slice(priorityMatch[0].length).trim();
		}

		// Parse creation date
		const dateMatch = remaining.match(/^(\d{4}-\d{2}-\d{2})\s+/);
		if (dateMatch) {
			this.creationDate = dateMatch[1];
			remaining = remaining.slice(dateMatch[0].length).trim();
		}

		// Store rawDescription (everything after completion, priority, and dates)
		this.rawDescription = remaining;

		// Extract projects, contexts, and attributes
		const words = remaining.split(/\s+/);
		this.description = [];
		for (const word of words) {
			if (word.startsWith('+')) {
				this.projects.push(word.slice(1));
			} else if (word.startsWith('@')) {
				this.contexts.push(word.slice(1));
			} else if (word.includes(':')) {
				const [key, value] = word.split(':', 2);
				this.attributes[key] = value;
			} else {
				this.description.push(word);
			}
		}
		this.description = this.description.join(' ');
	}

	toString() {
		let parts = [];
		if (this.isCompleted) {
			parts.push('x');
			if (this.completionDate) {
				parts.push(this.completionDate);
			}
		}
		if (this.priority) {
			parts.push(`(${this.priority})`);
		}
		if (this.creationDate) {
			parts.push(this.creationDate);
		}
		if (this.rawDescription) {
			parts.push(this.rawDescription);
		} else if (this.description) {
			parts.push(this.description);
			for (const project of this.projects) {
				parts.push(`+${project}`);
			}
			for (const context of this.contexts) {
				parts.push(`@${context}`);
			}
			for (const [key, value] of Object.entries(this.attributes)) {
				parts.push(`${key}:${value}`);
			}
		}
		return parts.join(' ');
	}

	get raw() {
		return this.rawDescription;
	}

	setPriority(priority) {
		if (priority && !/^[A-Z]$/.test(priority)) {
			throw new Error('Priority must be a single uppercase letter or null');
		}
		this.priority = priority || null;
	}

	complete(completionDate = null) {
		this.isCompleted = true;
		this.completionDate = completionDate || new Date().toISOString().split('T')[0];
	}

	uncomplete() {
		this.isCompleted = false;
		this.completionDate = null;
	}

	addProject(project) {
		if (!this.projects.includes(project)) {
			this.projects.push(project);
			this.rawDescription = this.rawDescription ? `${this.rawDescription} +${project}` : `+${project}`;
		}
	}

	addContext(context) {
		if (!this.contexts.includes(context)) {
			this.contexts.push(context);
			this.rawDescription = this.rawDescription ? `${this.rawDescription} @${context}` : `@${context}`;
		}
	}

	setAttribute(key, value) {
		if (value) {
			this.attributes[key] = value;
			this.rawDescription = this.rawDescription ? `${this.rawDescription} ${key}:${value}` : `${key}:${value}`;
		} else {
			delete this.attributes[key];
			// Rebuild rawDescription to remove the attribute
			const words = this.rawDescription.split(/\s+/).filter(word => !word.startsWith(`${key}:`));
			this.rawDescription = words.join(' ');
		}
	}
}

class TodoTxt {
	constructor(text = '') {
		this.tasks = [];
		this.count = 0;
		this.projects = [];
		this.contexts = [];
		this.priorities = [];
		if (text) this.parse(text);
	}

	addTask(task) {
		if (typeof task === 'string') {
			task = new Task(task);
		}
		this.tasks.push(task);
		this.update();
	}

	parse(text, append=false) {
		let newTasks = [];
		let linenr = 0;
		text.split('\n').forEach(line => {
			if (line.trim()) {
				newTasks.push(new Task(line.trim(), linenr.toString(), linenr));
			}
			linenr += 1;
		});
		this.tasks = append ? this.tasks.concat(newTasks) : newTasks;
		this.update();
	}

	toString() {
		return this.tasks.map(task => task.toString()).join('\n') + '\n';
	}

	replace(task) {
		let taskIndex = this.tasks.findIndex(t => t.id === task.id);
		if (taskIndex < 0) throw new Error(`No task with id ${id} exists`);
		this.tasks[taskIndex] = task;
		this.update();
	}

	delete(task) {
		let taskIndex = this.tasks.findIndex(t => t.id === task.id);
		if (taskIndex < 0) throw new Error(`No task with id ${id} exists`);
		this.tasks.splice(taskIndex, 1);
		this.update();
	}

	update() {
		this.count = this.tasks.length;
		this.projects = [];
		this.contexts = [];
		this.priorities = [];
		this.tasks.forEach(task => {
			task.projects.forEach(project => {
				if (!this.projects.includes(project)) this.projects.push(project);
			});
			task.contexts.forEach(context => {
				if (!this.contexts.includes(context)) this.contexts.push(context);
			});
			if (task.priority && !this.priorities.includes(task.priority)) this.priorities.push(task.priority);
		});
		this.projects.sort();
		this.contexts.sort();
		this.priorities.sort();
	}

	async loadFromFile(filePath) {
		if (typeof require !== 'undefined') {
			const fs = require('fs').promises;
			const text = await fs.readFile(filePath, 'utf8');
			this.parse(text);
		} else {
			throw new Error('File operations are only supported in Node.js');
		}
	}

	async saveToFile(filePath) {
		if (typeof require !== 'undefined') {
			const fs = require('fs').promises;
			await fs.writeFile(filePath, this.toString(), 'utf8');
		} else {
			throw new Error('File operations are only supported in Node.js');
		}
	}
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = { Task, TodoTxt };
} else {
	window.TodoTxt = { Task, TodoTxt };
}
