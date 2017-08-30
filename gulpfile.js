const gulp = require('gulp');
const processManager = require('electron-connect').server.create({
  useGlobalElectron: true,
  logLevel: 1
});

gulp.task('default', () => {
  processManager.start()
  // Restart browser process
  gulp.watch([
    './src/main.js',
    './src/main-process/**/*.js'
  ], () => {
    processManager.broadcast('close')
    processManager.restart()
  })
  // Reload renderer process
  gulp.watch([
    './src/renderer-process/**/*.js',
    './src/windows/**/*.html',
    './src/**/*.{css,js}'
  ], processManager.reload)
});