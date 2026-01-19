const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const TOKEN = process.env.TOKEN || 'token';

const authToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];

	if (!authHeader) {
		return res.status(401).json({ error: 'Authorization header missing'});
	}

	const token = authHeader.split(' ')[1];
	if (!token || token !== TOKEN) {
		return res.status(401).json({
			error: 'Invalid or missing API token'
		});
	}

	next();
}

app.set('trust proxy', true);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir);
}

const TODO_FILE = path.join(dataDir, 'todo.txt');

app.use('/todo.txt', authToken);
app.use(express.raw({type: '*/*', limit: '10mb'}));

app.get('/todo.txt', (req, res) => {
	if (fs.existsSync(TODO_FILE)) {
		fs.stat(TODO_FILE, (err, stats) => {
			if (err) {
				return res.status(404).send(`Error sending file: ${err}`);
			}

			res.set('Last-Modified', stats.mtime.toUTCString());
			res.sendFile(TODO_FILE);
		})
	} else {
		res.status(200).send('');
	}
});

app.put('/todo.txt', (req, res) => {
	fs.writeFileSync(TODO_FILE, req.body);
	console.log(`[${new Date().toUTCString()}] todo.txt updated`);
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
	console.log(`[${new Date().toUTCString()}] Server running on http://localhost:${PORT}`);
});
