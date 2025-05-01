from flask import Flask, jsonify, request, abort, render_template
import pytodotxt

app = Flask(__name__)
TODO_FILE = 'todo.txt'

def get_todotxt():
	todotxt = pytodotxt.TodoTxt(TODO_FILE)
	todotxt.parse()
	return todotxt

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/list', methods=['GET'])
def list_items():
	todotxt = get_todotxt()
	tasks = [
		{
			'id': i + 1,
			'priority': task.priority,
			'description': task.description,
			'complete': task.is_completed
		}
		for i, task in enumerate(todotxt.tasks)
	]
	return jsonify({'tasks': tasks})

@app.route('/add', methods=['POST'])
def add_item():
	data = request.get_json()
	if not data or 'description' not in data:
		abort(400, description="Missing description")

	description = data['description']
	priority = data.get('priority')
	complete = data.get('complete', False)

	if priority is not None:
		if not isinstance(priority, str) or len(priority) != 1 or not priority.isupper():
			abort(400, description="Invalid priority. Must be a single uppercase letter or null.")

	todotxt = get_todotxt()
	task = pytodotxt.Task()
	task.description = description
	if priority:
		task.priority = priority
	task.is_completed = complete

	todotxt.tasks.append(task)
	todotxt.save()

	return jsonify({
		'task': {
			'id': len(todotxt.tasks),
			'priority': task.priority,
			'description': task.description,
			'complete': task.is_completed
		}
	}), 201

@app.route('/edit/<int:id>', methods=['PUT'])
def edit_item(id):
	data = request.get_json()
	if not data or 'description' not in data:
		abort(400, description="Missing description")

	description = data['description']
	priority = data.get('priority')  # Optional priority
	complete = data['complete']

	# Validate priority if provided
	if priority is not None:
		if not isinstance(priority, str) or len(priority) != 1 or not priority.isupper():
			abort(400, description="Invalid priority. Must be a single uppercase letter or null.")

	todotxt = get_todotxt()
	if id < 1 or id > len(todotxt.tasks):
		abort(404, description="Task not found")

	task = todotxt.tasks[id - 1]
	task.description = description
	task.priority = priority if priority else None
	task.is_completed = complete

	todotxt.save()

	return jsonify({
		'task': {
			'id': id,
			'priority': task.priority,
			'description': task.description,
			'complete': task.is_completed
		}
	})

@app.route('/delete/<int:id>', methods=['DELETE'])
def delete_item(id):
	todotxt = get_todotxt()
	if id < 1 or id > len(todotxt.tasks):
		abort(404, description="Task not found")

	deleted_task = todotxt.tasks.pop(id - 1)
	todotxt.save()

	return jsonify({
		'task': {
			'id': id,
			'priority': deleted_task.priority,
			'description': deleted_task.description,
			'complete': deleted_task.is_completed
		}
	})

if __name__ == '__main__':
	app.run(debug=True)
