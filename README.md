# Groc.txt

> v0.3.1

Self-hosted web app for todo.txt lists

## Description

A self-hosted, responsive and mobile-friendly web application to manage a [todo.txt](http://todotxt.org/) file with configurable lists. The app is run using [python flask](https://flask.palletsprojects.com/en/stable/) and packaged as a docker container for self-hosting on any web server. Todo.txt gives you the flexibility to take your task list with you wherever you go and does not lock you into a proprietary service. All task data is stored in a text file that you can write to using any other application or text editor.

## Features

- Non-proprietary storage system of your tasks utilizing todo.txt's text file format
- Add tasks with `+projects` and `@contexts`
- Edit and delete tasks
- Quickly Delete all completed tasks
- Quickly mark tasks as completed
- Filter and order tasks
- Specify special lists that automatically tag tasks with a `+project` and display in a separate tab
- Manage your already established todo.txt file by using docker's volumes
- Single-user authentication for privacy and protection of your task data
- Responsive and mobile-friendly

**Planned Features**

- Progressive Web App functionality using an 'offline-first' approach
- Custom attributes such as `due:date`

## Installation

1. Install [docker and docker-compose](https://docs.docker.com/compose/install/)
2. Clone this repository into a folder or download from [releases](https://github.com/aleyoscar/groctxt/releases)

```
git clone https://github.com/aleyoscar/groctxt
```

3. Navigate into the folder and copy `env.example` to `.env`

```
cd groctxt
cp env.example .env
```

4. Change `SECRET_KEY`, `USERNAME` and `PASSWORD_HASH` to your own values

```
# Generate a secret key
python -c "import os; print(os.urandom(24).hex())"

# Generate a password hash, replace `PASSWORD` with your own secure password
python -c "import hashlib; print(hashlib.sha256('PASSWORD'.encode()).hexdigest())"
```

> **NOTE:** If you don't have python on your system, you can also go to [online-python](https://www.online-python.com/) and paste in the following script to generate a secret and your password hash. Remember to replace `PASSWORD` with your own strong and secure password.

```
import os, hashlib
print(os.urandom(24).hex())
print(hashlib.sha256('PASSWORD'.encode()).hexdigest())
```

5. (Optional) Change the `APP_PORT` to your desired port
6. (Optional) Change the volume in `compose.yml` to point to your own todo.txt folder

```
volumes:
  - ~/Documents/TodoFolder:/app/data
```

6. Build the docker container

```
docker compose build
```

7. Run the container

```
docker compose up -d
```

8. Access your app at `http://localhost:APP_PORT` where `APP_PORT` is the port you specified in your .env file, default is `5050`

## Update

1. Stop the container
2. Fetch and pull from the main branch
3. Re-build the container
4. Start the container

```
docker compose down
git fetch && git pull
docker compose build
docker compose up -d
```

## Settings

Settings are configurable within the app, but there is also a `settings.json` file that allows you to manually edit the configuration file. Current settings include:

| Setting Key	| Description						| Default/Example		|
| ---			| ---								| ---					|
| sort_complete	| Sort completed tasks to bottom	| false					|
| lists			| Object array of custom lists		| empty array []		|
|   - name		| Name of the list displayed		| EX: "Shopping List"	|
|   - project	| Project to be added automatically	| EX: "shopping"		|

An example settings file is included in the repository as `settings.json`.

## Sources

References and sources used in the project

- [Todo.txt](http://todotxt.org/)
- [Flask](https://flask.palletsprojects.com/)
- [Pytodotxt](https://vonshednob.cc/pytodotxt/doc/)
- [Docker](https://docker.com/)
- [Pico CSS](https://picocss.com/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
