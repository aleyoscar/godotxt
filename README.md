# GoDo.txt

> v1.0.1

Self-hosted web app for todo.txt lists

## Description

A self-hosted, responsive and mobile-friendly web application to manage a [todo.txt](http://todotxt.org/) file with "custom" lists. The app is a static site with a [pocketbase](https://pocketbase.io/) backend. Todo.txt gives you the flexibility to take your task list with you wherever you go and does not lock you into a proprietary service. All task data is stored in a text file that you can write to using any other application or text editor, and pocketbase gives you the flexibility to have single user or multiple user authentication.

## Features

- Non-proprietary storage system of your tasks utilizing todo.txt's text file format
- Add tasks with `+projects` and `@contexts`
- Edit and delete tasks
- Quickly Delete all completed tasks
- Quickly mark tasks as completed
- Filter and order tasks
- Specify special lists that automatically tag tasks with a `+project` and display in a separate tab
- Manage your already established todo.txt file by using docker's volumes
- Single or multi-user authentication for privacy and protection of your and anyone else's task data
- Responsive and mobile-friendly

**Planned Features**

- Progressive Web App functionality using an 'offline-first' approach
- Custom attributes such as `due:date`

## Installation

### Manual

1. Clone this repository into a folder or download from [releases](https://github.com/aleyoscar/groctxt/releases)
2. Navigate into the folder and start the pocketbase server using the command `./pocketbase serve`
3. Open the link provided in the prompt to create a new superuser account
4. Access your GoDo web app at [localhost:8090](http://localhost:8090)

### Docker

1. An example compose file is provided in the repository
2. Install [docker and docker-compose](https://docs.docker.com/compose/install/)
3. Clone this repository into a folder or download from [releases](https://github.com/aleyoscar/groctxt/releases)
4. (Optional) Change the external port to your desired port in `compose.yml`
5. Run the container using `docker compose up -d`
6. Access your app at [localhost:8090](http://localhost:8090) or whichever port you specified

## Authentication

By using Pocketbase as a backend, GoDo.txt has the ability to allow single or multiple users. Currently you must create each user manually through the pocketbase admin dashboard at [localhost:8090/_](http://localhost:8090/_). Open the `users` collection and

## Settings

Settings are configurable within the app or you can edit the rows of the `settings` collection directly in pocketbase.

| Setting Key	| Description						| Default/Example		|
| ---			| ---								| ---					|
| showComplete	| Show completed tasks by default	| false					|
| lists			| JSON array of custom lists		| empty array []		|
|   - name		| Name of the list displayed		| EX: "Shopping List"	|
|   - project	| Project to be added automatically	| EX: "shopping"		|

## Sources

References and sources used in the project. The Pytodotxt library was ported over to javascript using [Grok](https://grok.com).

- [Todo.txt](http://todotxt.org/)
- [Pocketbase](https://pocketbase.io)
- [Pytodotxt](https://vonshednob.cc/pytodotxt/doc/)
- [Pico CSS](https://picocss.com/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
