//
// creates a child process spawn to run phantomjs with correct
// setup and env variables (see npm scripts) for easy consumption
// from nodejs by module.exporting a start function that takes a
// callback - triggered with updates (such as chat messages).
//
var path = require('path');
var childProcess = require('child_process');

// locate phantomjs prebuilt binary
var phantomjs = require('phantomjs-prebuilt');
var binPath = phantomjs.path;

var childArgs = [
  "--web-security=no", // enable xss (required for twitch chat)
  path.join(__dirname, "index.phantom.js")
];

function start (opts, callback) {
  var channel = opts;
  var interval = 1000;
  if (typeof opts === 'object') {
    channel = opts.channel;
    interval = opts.interval || 1000;
  }

  channel = "blah";

  var env = {
    channel: channel,
    interval: interval
  };

  if (typeof channel !== 'string') {
    throw new Error("Please specify a channel name (string) as the first argument.");
  }
  if (typeof callback !== 'function') {
    throw new Error("Please specify a callback function as the last argument.");
  }

  // create the child process spawn
  var spawn = childProcess.spawn(binPath, childArgs, {env: env});

  // configure consumers
  spawn.stdout.on('data', function (data) {
    //console.log("stdout: <\n%s\n>", data);
    var split = data.toString().split('\n');
    for (var i = 0; i < split.length; i++) {
      var trim = split[i].trim();
      if (trim && trim.length > 0) {
        try {
          callback(null, JSON.parse(trim));
        } catch (err) {
          callback(err, null);
        }
      }
    }
  });

  spawn.stderr.on('data', function (data) {
  });

  spawn.on('close', function (code) {
    callback(null, {
      type: 'status',
      message: 'closed'
    });
    callback("child process (spawn) closed with code: " + code, null);
    spawn.stdin.pause();
    spawn.kill();
  });

  spawn.on('error', function (err) {
    callback(err, null);
  });

  var exit = function exit () {
    spawn.stdin.pause();
    spawn.kill();
    callback(null, {
      type: 'status',
      message: "kill requested"
    });
  };

  process.on('exit', function () {
    exit();
  });
  process.on('SIGINT', function () {
    exit();
  });
  process.on('uncaughtException', function () {
    exit();
  });

  // return api
  return {
    // expose spawn
    spawn: spawn,

    // process shutdown fn
    kill: function () {
      callback(null, {
        type: 'status',
        message: "kill requested"
      });
      spawn.stdin.pause();
      spawn.kill();
    }
  };
};



if (module !== 'undefined' && module.exports) {
  module.exports = {
    spawn: start,
    start: start
  };
}
