'use strict';

var through2 = require('through2');
var gutil = require('gulp-util');
var Readable = require('stream').Readable;
var path = require('path');
var _ = require('lodash');

var defaultFilters = {
  ext: function(extensions) {
    var extensionArray = extensions.map(function(str) {
      return str.startsWith('.') ? str : '.' + str;
    });

    return function(file) {
      var ext = path.extname(file.path);
      return extensionArray.indexOf(ext) !== -1;
    };
  },
  filename: function(fileNames) {
    return function(file) {
      var parsedFile = path.parse(file.path);
      var i;
      for (i = 0; i < fileNames.length; i++) {
        if (parsedFile.base === fileNames[i]) {
          return true;
        }
      }
      return false;
    };
  },
};

function getFilterFromObject(obj) {
  var filterValues;
  if (obj.type && defaultFilters[obj.type]) {
    filterValues = _.isArray(obj.filter) ? obj.filter : [ obj.filter ];
    return defaultFilters[obj.type](filterValues);
  }
  return null;
}

function hydra(options) {
  var filterNames = [];
  var outputs = {};
  var keys = Object.keys(options);
  var key;
  var val;
  var i;
  var stream;
  var onData;
  var onEnd;
  var retStream;
  var addFilter;
  var filterFunc;

  for (i = 0; i < keys.length; i++) {
    addFilter = false;
    filterFunc = null;
    key = keys[i];
    val = options[key];

    if (_.isFunction(val)) {
      addFilter = true;
      filterFunc = val;
    } else if (_.isObject(val)) {
      addFilter = true;
      filterFunc = getFilterFromObject(val);
    }

    if (addFilter) {
      filterNames.push(key);
      stream = new Readable({objectMode: true});
      stream._read = function read() {};
      outputs[key] = {
        func: filterFunc,
        stream: stream,
        files: [],
        type: val.type,
      };
    }
  }

  onData = function(file, encoding, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error',
                new gutil.PluginError('gulp-hydra', 'Streaming not supported'));
      return cb();
    }

    filterNames.forEach(function(filter) {
      var output = outputs[filter];
      var result;

      if (output.func === null) {
        if (output.type) {
          this.emit('error',
                new gutil.PluginError('gulp-hydra', 'Invalid default filter '
                  + '`' + output.type + '` for '
                  + '`' + filter + '` stream'));
        } else {
          this.emit('error',
                new gutil.PluginError('gulp-hydra', 'Invalid filter function for '
                  + '`' + filter + '` stream'));
        }
      }

      result = output.func(file);
      if (result) {
        output.files.push(file);
      }
    }, this);

    this.push(file);
    return cb();
  };

  onEnd = function(cb) {
    filterNames.forEach(function(filter) {
      var output = outputs[filter];
      output.files.forEach(function(file) {
        output.stream.push(file);
      });
      output.stream.push(null);
    });

    return cb();
  };

  retStream = through2.obj(onData, onEnd);

  filterNames.forEach(function(filter) {
    retStream[filter] = outputs[filter].stream;
  });

  retStream.resume();

  return retStream;
}

module.exports = hydra;
