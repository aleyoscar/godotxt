from flask import Flask, jsonify, request, abort, render_template, session, redirect, url_for, flash
from functools import wraps
from dotenv import load_dotenv
import pytodotxt, hashlib, os

if os.getenv('FLASK_ENV') == 'development':
	load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
USERNAME = os.getenv('USERNAME')
PASSWORD_HASH = os.getenv('PASSWORD_HASH')
TODO_FILE = 'data/todo.txt'

if not all([SECRET_KEY, USERNAME, PASSWORD_HASH]):
	raise ValueError('Missing required environment variables: SECRET_KEY, USERNAME or PASSWORD_HASH')

app = Flask(__name__)
app.secret_key = SECRET_KEY

def login_required(f):
	@wraps(f)
	def decorated_function(*args, **kwargs):
		if 'logged_in' not in session:
			return redirect(url_for('login', next=request.url))
		return f(*args, **kwargs)
	return decorated_function

def get_todotxt():
	todotxt = pytodotxt.TodoTxt(TODO_FILE)
	todotxt.parse()
	return todotxt

@app.route('/login', methods=['GET', 'POST'])
def login():
	if request.method == 'POST':
		username = request.form.get('username')
		password = request.form.get('password')
		password_hash = hashlib.sha256(password.encode()).hexdigest()
		if username == USERNAME and password_hash == PASSWORD_HASH:
			session['logged_in'] = True
			next_url = request.form.get('next') or url_for('index')
			return redirect(next_url)
		else:
			flash('Invalid username or password', 'error')
	next_url = request.args.get('next') or url_for('index')
	return render_template('login.html', next=next_url)

@app.route('/logout')
@login_required
def logout():
	session.pop('logged_in', None)
	return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
	return render_template('index.html')

@app.route('/list', methods=['GET'])
@login_required
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
@login_required
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
@login_required
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

@app.route('/complete/<int:id>', methods=['PUT'])
@login_required
def complete_item(id):
	data = request.get_json()

	todotxt = get_todotxt()
	if id < 1 or id > len(todotxt.tasks):
		abort(404, description="Task not found")

	task = todotxt.tasks[id - 1]
	task.is_completed = data['complete']

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
@login_required
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
