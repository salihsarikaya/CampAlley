# gulp-hydra [![Build Status](https://img.shields.io/travis/MasterOfMalt/gulp-hydra.svg?style=flat-square)](https://travis-ci.org/MasterOfMalt/gulp-hydra/) [![Build Status](https://img.shields.io/npm/v/gulp-hydra.svg?style=flat-square)](https://www.npmjs.com/package/gulp-hydra)


> Cut off one head, two more will take its place. Heil Hydra

Hydra takes your vinyl file stream and splits them into many streams based on filters
while preserving the core stream.

This was written because we had an issue using our other gulp-plugin
[gulp-spritesmash](https://github.com/MasterOfMalt/gulp-spritesmash) with the internally
split streams that gulp.spritesmith provides `img` and `css`.

Hydra will take our stream and split it based on default or custom filter functions allowing
for as much finegrained control as we like.

## Install
```
$ npm install --save-dev gulp-hydra
```

## Usage
```js
var gulp = require('gulp');
var hydra = require('gulp-hydra');

gulp.task('default', function() {
  var stream = gulp.src(files)
    .pipe(hydra({
      text: function() {
        var ext = path.extname(file.path);
        return ['.txt', '.md'].indexOf(ext) !== -1;
      },
    }));
  return stream.text
    .pipe(gulp.dest('dist'));
});
```
However we do provide a nicer syntax for this
```js
gulp.task('default', function() {
  var stream = gulp.src(files)
    .pipe(hydra({
      text: { type: 'ext', filters: ['.txt', '.md'] }
    }));
  return stream.text
    .pipe(gulp.dest('dist'));
});
```

The main stream returned directly by hydra is an unaltered stream of all files passed in.

## API
### hydra(options)
#### options
The options object is a associative array of key value pairs. The name of the value will be
the name of your return stream and the value should be either:

#### Filter function
A function which takes a vinyl file and returns true or false if it should be filtered into
your stream.

#### Default filters
Their are currently two default filters:

##### Extension → `ext`
Filters on the file extension, useful for outputing different file types in to different
directories.

This filter will add a dot to the front of the extension if you forget to do so.

```js
{
  type: 'ext',
  filters: '.css' or ['.css', '.md']
}
```

##### Filename → `filename`
Filters on the files base name (including extension), useful for direct targeting of files.

```js
{
  type: 'filename',
  filters: 'myfile.txt' or ['sprite.png', 'sprite.css']
}
```