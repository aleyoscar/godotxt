from flask import Flask, jsonify, request, abort, render_template, session, redirect, url_for, flash
from functools import wraps
from dotenv import load_dotenv
from datetime import date, datetime, timedelta, timezone
import pytodotxt, hashlib, os, json, secrets

if os.getenv('FLASK_ENV') == 'development':
	load_dotenv()

VERSION = 'v0.3.1'
SECRET_KEY = os.getenv('SECRET_KEY')
USERNAME = os.getenv('USERNAME')
PASSWORD_HASH = os.getenv('PASSWORD_HASH')
TODO_FILE = 'data/todo.txt'
SETTINGS_FILE = 'data/settings.json'

if not all([SECRET_KEY, USERNAME, PASSWORD_HASH]):
	raise ValueError('Missing required environment variables: SECRET_KEY, USERNAME or PASSWORD_HASH')

if not os.path.exists(TODO_FILE):
	with open(TODO_FILE, 'w'): pass

if not os.path.exists(SETTINGS_FILE):
	with open(SETTINGS_FILE, 'w') as f:
		f.write('{}\n')

app = Flask(__name__)
app.secret_key = SECRET_KEY

def load_settings():
	with open(SETTINGS_FILE, 'r') as file:
		try:
			return json.load(file)
		except json.JSONDecodeError:
			print("Invalid settings file")
			return {}

def save_settings(settings):
	with open(SETTINGS_FILE, 'w') as file:
		json.dump(settings, file, indent=4)

def save_tokens(tokens):
	settings = load_settings()
	settings["tokens"] = tokens
	save_settings(settings)

def load_tokens():
	with open(SETTINGS_FILE, 'r') as f:
		try:
			settings = load_settings()
			if 'tokens' in settings:
				current_time = datetime.now(timezone.utc)
				return {k: v for k, v in settings["tokens"].items() if datetime.fromisoformat(v[1]).replace(tzinfo=timezone.utc) > current_time}
			else:
				return {}
		except json.JSONDecodeError:
			return {}

def gen_token():
	return secrets.token_hex(16)

def get_token_hash(token):
	return hashlib.sha256((token + SECRET_KEY).encode()).hexdigest()

def val_token(token):
	token_hash = get_token_hash(token)
	if token_hash in token_store:
		stored_hash, expiry = token_store[token_hash]
		expiry_dt = datetime.fromisoformat(expiry).replace(tzinfo=timezone.utc)
		if datetime.now(timezone.utc) < expiry_dt:
			return True
		else:
			del token_store[token_hash]
			save_tokens(token_store)
	return False

token_store = load_tokens()

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
		remember = 'remember' in request.form
		password_hash = hashlib.sha256(password.encode()).hexdigest()
		if username == USERNAME and password_hash == PASSWORD_HASH:
			session['logged_in'] = True
			if remember:
				token = secrets.token_hex(16)
				token_hash = get_token_hash(token)
				expiry = datetime.now(timezone.utc) + timedelta(days=30)
				token_store[token_hash] = (token_hash, expiry.isoformat())
				save_tokens(token_store)
				resp = redirect(url_for('index'))
				resp.set_cookie('auth_token', token, max_age=30*24*3600, httponly=True, secure=True, samesite='Lax')
				return resp
			return redirect(url_for('index'))
		else:
			flash('Invalid username or password', 'error')
	next_url = request.args.get('next') or url_for('index')
	return render_template('login.jinja', next=next_url, version=VERSION)

@app.route('/logout')
@login_required
def logout():
	session.pop('logged_in', None)
	token = request.cookies.get('auth_token')
	if token:
		token_hash = get_token_hash(token)
		if token_hash in token_store:
			del token_store[token_hash]
			save_tokens(token_store)
	resp = redirect(url_for('login'))
	resp.set_cookie('auth_token', '', expires=0)
	return resp

@app.route('/')
@login_required
def index():
	settings = load_settings()
	return render_template('index.jinja', settings=settings, version=VERSION)

@app.route('/list', methods=['GET'])
@login_required
def list_items():
	todotxt = get_todotxt()
	tasks = [
		{
			'id': i + 1,
			'priority': task.priority,
			'description': task.bare_description(),
			'raw_description': task.description,
			'complete': task.is_completed,
			'projects': task.projects,
			'contexts': task.contexts,
			'created': task.creation_date,
			'completed': task.completion_date
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
	task.creation_date = date.today()

	todotxt.tasks.append(task)
	todotxt.save()

	return jsonify({
		'task': {
			'id': len(todotxt.tasks),
			'priority': task.priority,
			'description': task.bare_description(),
			'raw_description': task.description,
			'complete': task.is_completed,
			'projects': task.projects,
			'contexts': task.contexts,
			'created': task.creation_date,
			'completed': task.completion_date
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
	was_complete = task.is_completed
	task.is_completed = complete
	if task.is_completed:
		task.priority = None
		if not was_complete: task.completion_date = date.today()
	else:
		task.priority = priority if priority else None
		task.completion_date = None
	if not task.creation_date: task.creation_date = date.today()

	todotxt.save()

	return jsonify({
		'task': {
			'id': id,
			'priority': task.priority,
			'description': task.bare_description(),
			'raw_description': task.description,
			'complete': task.is_completed,
			'projects': task.projects,
			'contexts': task.contexts,
			'created': task.creation_date,
			'completed': task.completion_date
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
	was_complete = task.is_completed
	task.is_completed = data['complete']

	if task.is_completed:
		task.priority = None
		if not was_complete: task.completion_date = date.today()
	else:
		task.completion_date = None
	if not task.creation_date: task.creation_date = date.today()

	todotxt.save()

	return jsonify({
		'task': {
			'id': id,
			'priority': task.priority,
			'description': task.bare_description(),
			'raw_description': task.description,
			'complete': task.is_completed,
			'projects': task.projects,
			'contexts': task.contexts,
			'created': task.creation_date,
			'completed': task.completion_date
		}
	})

@app.route('/delete/<int:id>', methods=['DELETE'])
@login_required
def delete_item(id):
	todotxt = get_todotxt()
	if id < 1 or id > len(todotxt.tasks):
		abort(404, description="Task not found")

	task = todotxt.tasks.pop(id - 1)
	todotxt.save()

	return jsonify({
		'task': {
			'id': id,
			'priority': task.priority,
			'description': task.bare_description(),
			'raw_description': task.description,
			'complete': task.is_completed,
			'projects': task.projects,
			'contexts': task.contexts,
			'created': task.creation_date,
			'completed': task.completion_date
		}
	})

@app.route('/delete-multiple', methods=['POST'])
@login_required
def delete_items():
	ids = request.get_json()
	if not ids or len(ids) < 1:
		abort(400, description="Empty id list")

	todotxt = get_todotxt()
	deleted = []
	for id in ids:
		if id < 1 or id > len(todotxt.tasks):
			abort(404, description="Task not found")
		task = todotxt.tasks[id - 1]
		deleted.append(task)

	todotxt.tasks = list(set(todotxt.tasks) - set(deleted))
	todotxt.save()

	deletedTasks = [
		{
			'id': i + 1,
			'priority': task.priority,
			'description': task.bare_description(),
			'raw_description': task.description,
			'complete': task.is_completed,
			'projects': task.projects,
			'contexts': task.contexts,
			'created': task.creation_date,
			'completed': task.completion_date
		}
		for i, task in enumerate(deleted)
	]
	return jsonify({'tasks': deletedTasks})

@app.route('/settings', methods=['GET', 'POST'])
@login_required
def getset_settings():
	if request.method == 'POST':
		data = request.get_json()
		if not data:
			abort(400, description="Missing settings")

		settings = data
		settings["tokens"] = token_store
		save_settings(settings)
	else:
		settings = load_settings()
	# print(jsonify(settings))
	return jsonify(settings)

if __name__ == '__main__':
	app.run(debug=True)
