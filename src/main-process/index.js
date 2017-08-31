const path = require('path');
const fs = require('fs');
const express = require('express');
const https = require('https');
const privateKey = fs.readFileSync(path.join(__dirname, '../server/sslcert/key.key'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, '../server/sslcert/cert.cert'), 'utf8');
const app = express();
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);
const HTTPS_PORT = 8443;
const { BrowserWindow, ipcMain } = require('electron');
const getMainWindowId = require('../main');

app.set('views', path.join(__dirname, '../server/views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, '../server/public')));
app.get('/', function (req, res) {
  res.render('index');
});

httpsServer.listen(HTTPS_PORT);

const io = require('socket.io')(httpsServer);

io.on('connection', (socket) => {
  const currentWindow = BrowserWindow.fromId(getMainWindowId());

  currentWindow.webContents.send('connection', null);

  socket.on('message', (data) => {
    currentWindow.webContents.send('message', data)
  });

  ipcMain.on('iceCandidate', (event, message) => {
    socket.emit('message', message);
  });

  ipcMain.on('localDescription', (event, message) => {
    socket.emit('message', message);
  });
});