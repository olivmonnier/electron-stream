const gulp = require('gulp');
const processManager = require('electron-connect').server.create({
  useGlobalElectron: true,
  logLevel: 1
});

gulp.task('move:js', () => {
  return gulp.src(['../utils/**/*'])
    .pipe(gulp.dest('./utils/'));
});

gulp.task('default', ['move:js'], () => {
  processManager.start()

  // Restart browser process
  gulp.watch([
    './main.js',
    './main-process/**/*.js'
  ], () => {
    processManager.broadcast('close')
    processManager.restart()
  })
  // Reload renderer process
  gulp.watch([
    './renderer-process/**/*.js',
    './windows/**/*.html',
    './**/*.{css,js}'
  ], processManager.reload)
});