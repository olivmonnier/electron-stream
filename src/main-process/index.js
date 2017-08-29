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
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const { BrowserWindow, ipcMain } = require('electron');
const getMainWindowId = require('../main');

app.set('views', path.join(__dirname, '../server/views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, '../server/public')));
app.get('/', function (req, res) {
  res.render('index');
});

httpsServer.listen(HTTPS_PORT);

const wss = new WebSocketServer({ server: httpsServer });

wss.on('connection', function (ws) {
  const currentWindow = BrowserWindow.fromId(getMainWindowId());
  currentWindow.webContents.send('connection', null);

  ws.on('message', function (message) {
    const currentWindow = BrowserWindow.fromId(getMainWindowId());
    // Broadcast any received message to all clients
    console.log('received: %s', message);
    //wss.broadcast(message);
    currentWindow.webContents.send('message', message)
  });

  ipcMain.on('iceCandidate', (event, message) => {
    wss.broadcast(message);
  });

  ipcMain.on('localDescription', (event, message) => {
    wss.broadcast(message);
  });
});
 
wss.broadcast = function (data) {
  this.clients.forEach(function (client) {
    console.log(client)
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}; 