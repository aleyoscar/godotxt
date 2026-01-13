const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('trust proxy', true);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir);
}

const TODO_FILE = path.join(dataDir, 'todo.txt');

app.use(express.raw({type: '*/*', limit: '10mb'}));

app.get('/todo.txt', (req, res) => {
	if (fs.existsSync(TODO_FILE)) {
		res.sendFile(TODO_FILE);
	} else {
		res.status(200).send('');
	}
});

app.put('/todo.txt', (req, res) => {
	fs.writeFileSync(TODO_FILE, req.body);
	console.log('todo.txt updated');
	res.status(200).send('OK');
});

app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'UP',
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
		message: 'GoDo.txt is healthy'
	});
});

app.use(express.static('static'));

app.get('/*splat', (req, res) => {
	res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
