const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const processManager = require('electron-connect').server.create({
  useGlobalElectron: true,
  logLevel: 1
});

gulp.task('babelify', () => {
  return browserify('./src/server/public/js/main.js')
    .transform(babelify, { presets: ['es2015'] })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./src/server/public/js/'));
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

  gulp.watch([
    './src/server/public/js/**/*.js',
    '!./src/server/public/js/bundle.js'
  ], ['babelify'])
});