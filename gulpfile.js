const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const rollup = require('gulp-better-rollup');
const babel = require('rollup-plugin-babel');
const uglify = require('gulp-uglify');

gulp.task('default', () =>
  gulp.src('src/index.js')
    .pipe(rollup({plugins: [babel({ exclude: 'node_modules/**' })]}, {
      format: 'umd',
      name: 'AutoProgress'
    }))
    .pipe(uglify())
    .pipe(gulp.dest('dist'))
);

gulp.task('dev', () =>
    gulp.src('src/index.js')
        .pipe(sourcemaps.init())
        .pipe(rollup({plugins: [babel({ exclude: 'node_modules/**' })]}, {
          format: 'umd',
          name: 'AutoProgress'
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'))
);

gulp.watch('src/*.js', ['dev']);
