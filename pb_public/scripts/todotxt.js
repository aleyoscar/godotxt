class Task {
	constructor(line = '', id = '') {
		this.id = id;
		this.description = '';
		this.raw_description = '';
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

		// Store raw_description (everything after completion, priority, and dates)
		this.raw_description = remaining;

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
		if (this.raw_description) {
			parts.push(this.raw_description);
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

	get rawDescription() {
		return this.raw_description;
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
			this.raw_description = this.raw_description ? `${this.raw_description} +${project}` : `+${project}`;
		}
	}

	addContext(context) {
		if (!this.contexts.includes(context)) {
			this.contexts.push(context);
			this.raw_description = this.raw_description ? `${this.raw_description} @${context}` : `@${context}`;
		}
	}

	setAttribute(key, value) {
		if (value) {
			this.attributes[key] = value;
			this.raw_description = this.raw_description ? `${this.raw_description} ${key}:${value}` : `${key}:${value}`;
		} else {
			delete this.attributes[key];
			// Rebuild raw_description to remove the attribute
			const words = this.raw_description.split(/\s+/).filter(word => !word.startsWith(`${key}:`));
			this.raw_description = words.join(' ');
		}
	}
}

class TodoTxt {
	constructor() {
		this.tasks = [];
	}

	addTask(task) {
		if (typeof task === 'string') {
			task = new Task(task);
		}
		this.tasks.push(task);
	}

	parse(text) {
		this.tasks = text
			.split('\n')
			.map(line => line.trim())
			.filter(line => line)
			.map(line => new Task(line));
	}

	toString() {
		return this.tasks.map(task => task.toString()).join('\n') + '\n';
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
