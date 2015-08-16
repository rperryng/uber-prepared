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
      login: './client/src/login/login.less'
    },
    scripts: {
      login: './client/src/login/login.js',
    }
  },
  build: {
    styles: {
      theme: './client/dist/theme?(.min).css',
      login: './client/dist/login(.min).css'
    },
    scripts: {
      login: './client/dist/login(.min).js',
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

gulp.task('styles-build', [
  'styles-build-theme',
  'styles-build-login'
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

gulp.task('scripts-build', ['scripts-build-login']);

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

  gulp.watch(paths.source.scripts.login, ['scripts-build-login']);
});
