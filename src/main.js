'use strict'

const electron = require('electron')
const client = require('electron-connect').client
const glob = require('glob')
const path = require('path')

// Module to control application life.
const app = electron.app

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const isDev = process.env.DEV ? (process.env.DEV.trim() == "true") : false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

const initialize = () => {
  loadScripts()

  function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 1000, height: 800 })

    mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadURL(path.join('file://', __dirname, '/windows/index.html'))

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null
    })

    // Livereload 
    client.create(mainWindow)
    // Open the DevTools.
    mainWindow.webContents.openDevTools()
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow)

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow()
    }
  })
}

module.exports = function() {
  if(mainWindow !== null) return mainWindow.id;
} 

// Require each JS file in the main-process dir
function loadScripts() {
  const files = glob.sync(path.join(__dirname, 'main-process/**/*.js'))
  files.forEach((file) => {
    require(file)
  })
}

initialize();