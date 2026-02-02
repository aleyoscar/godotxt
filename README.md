# GoDo.txt

> v2.1.1

[godo.aleyoscar.com](https://godo.aleyoscar.com)

![Widescreen Screenshot of GoDo.txt app](static/images/screenshot-wide-1280x720.png)

## Description

A privacy-friendly and responsive PWA (Progressive Web App) to manage a [todo.txt](http://todotxt.org/) file. Uses the File System Access API to read/write to your todo.txt file on your own device. No databases, no backend server and no communication to any external services or APIs. Todo.txt gives you the flexibility to take your task list with you wherever you go and does not lock you into a proprietary service. All task data is stored in a text file that you can write to using any other application or text editor. GoDo your tasks and worry less about how to maintain it!

## Features

- Non-proprietary management and storage of your tasks utilizing todo.txt's text file format on your own device
- Add, edit and delete tasks
- Manage, filter, sort and group tasks based on `+projects`, `@contexts`, `(A) priorities` or `date created`
- Quickly mark tasks as completed
- Quickly delete all completed tasks
- Side menu with all `+projects` present in your task list for quick filtering
- Responsive and mobile-friendly
- Privacy-friendly, does not use a server backend or communicates with external APIs or services, everything stays on your own device


**Planned Features**

- Custom attributes such as `due:date`

## Installation / Use

No install is necessary! You can simply go to [godo.aleyoscar.com](https://godo.aleyoscar.com) and access your own text file on your device by selecting 'select a file'

> Note: Uses the File System Access API which has only been tested to work on Chromium based browsers

> Note: Works best if the app is 'installed' on your system using your browsers PWA 'install' button.

You can also host the web app on your own server and with your own domain:

1. Clone this repository into a folder or download from [releases](https://github.com/aleyoscar/godotxt/releases)
2. Copy/upload/ftp the 'static' folder into your server's web directory

Or if you have cPanel on your server, you can use cPanel's git version control

1. Open cPanel Tools > Git Version Control
2. Create a new repository
3. Set the 'Clone URL' to the repo's https url: https://github.com/aleyoscar/godotxt.git
4. Set the repository path to `<username>/git/godotxt`

> Note: The default cPanel repo path uses `repository` instead of `git` which I have changed. This must be set to `git` to deploy correctly

5. Set the name to whatever you would like, for example `godotxt`
6. After it's created go back into the repository and open the `Pull or Deploy` tab
7. Select `Update from Remote` and then `Deploy HEAD Commit`

## Sources

References and sources used in the project.

- [Todo.txt](http://todotxt.org/)
- [Pico CSS](https://picocss.com/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)



> Changelog script

```
python gen-chglog.py {version} -r static/index.html -r static/sw.js -r README.md -r static/site.webmanifest
```
