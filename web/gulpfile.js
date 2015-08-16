'use strict';

var gulp = require('gulp'),
  del = require('del');

var plugins = require('gulp-load-plugins')({
  rename: {
    'gulp-minify-css': 'minifyCss'
  }
});

var paths = {
  source: {
    styles: {
      theme: './client/src/common/*.less',
      login: './client/src/login/login.less',
      registrationComplete: './client/src/registration-complete/registration-complete.less'
    },
    scripts: {
      login: './client/src/login/login.js',
      home: './client/src/home/home.js',
    }
  },
  build: {
    styles: {
      theme: './client/dist/theme?(.min).css',
      login: './client/dist/login(.min).css',
      registrationComplete: './client/src/registration-complete/registration-complete(.min).css',
      home: './client/dist/home(.min).css'
    },
    scripts: {
      login: './client/dist/login(.min).js',
      home: './client/dist/home(.min).js'
    },
    root: './client/dist'
  }
};

//
// Styles
//

gulp.task('styles-build-theme', function () {
  return buildStylesStream(paths.source.styles.theme, paths.build.styles.theme, 'theme.css');
});

gulp.task('styles-build-login', function () {
  return buildStylesStream(paths.source.styles.login, paths.build.styles.login, 'login.css');
});

gulp.task('styles-build-registrationComplete', function () {
  return buildStylesStream(paths.source.styles.registrationComplete, paths.build.styles.registrationComplete, 'registration-complete.css');
});

gulp.task('styles-build-home', function () {
  return buildStylesStream(paths.source.styles.home, paths.build.styles.home, 'home.css');
});

gulp.task('styles-build', [
  'styles-build-theme',
  'styles-build-login',
  'styles-build-registrationComplete',
  'styles-build-home'
]);

function buildStylesStream(sourceFilePaths, staleFilePaths, buildFileName) {
  del(staleFilePaths, {}, function () {
    return gulp.src(sourceFilePaths)
      .pipe(plugins.less())
      .pipe(plugins.concat(buildFileName))
      .pipe(plugins.autoprefixer({
        browsers: ['last 2 versions']
      }))
      .pipe(gulp.dest(paths.build.root))
      .pipe(plugins.minifyCss())
      .pipe(plugins.rename({
        extname: '.min.css'
      }))
      .pipe(gulp.dest(paths.build.root));
  });
}

gulp.task('styles', ['styles-build']);

//
// Scripts
//

gulp.task('scripts-build-login', function () {
  return buildScriptsStream(paths.source.scripts.login, paths.build.scripts.login);
});

gulp.task('scripts-build-home', function () {
  return buildScriptsStream(paths.source.scripts.home, paths.build.scripts.home);
});

gulp.task('scripts-build', ['scripts-build-login', 'scripts-build-home']);

function buildScriptsStream(sourceFilePaths, staleFilePaths) {
  del(staleFilePaths, {}, function () {
    return gulp.src(sourceFilePaths)
      .pipe(gulp.dest(paths.build.root))
      .pipe(plugins.uglify({
        mangle: true
      }))
      .pipe(plugins.rename({
        extname: '.min.js'
      }))
      .pipe(gulp.dest(paths.build.root));
  });
}

gulp.task('scripts', ['scripts-build']);

//
// Watches
//

gulp.task('default', ['styles', 'scripts'], function () {
  gulp.watch(paths.source.styles.theme, ['styles-build-theme']);
  gulp.watch(paths.source.styles.login, ['styles-build-login']);
  gulp.watch(paths.source.styles.registrationComplete, ['styles-build-registrationComplete']);
  gulp.watch(paths.source.styles.home, ['styles-build-home']);

  gulp.watch(paths.source.scripts.login, ['scripts-build-login']);
  gulp.watch(paths.source.scripts.home, ['scripts-build-home']);
});
