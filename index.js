var lissu = require('./lissu.js');

lissu.start({}, function (err, data) {
  if (err) {
    console.log(err);
  }

  if (data) {
    console.log(data);
  }
})
