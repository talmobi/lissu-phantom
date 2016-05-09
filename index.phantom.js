/*
 * Hello! Run with phantomjs! (npm start)
 *
 * Specify channel name by passing in environment variable to channel.
 * Specify polling interval (default 1000 ms) to env variable interval.
 *
 * About:
 *  Connects to twitch chat through phantomjs and polls for
 *  updates to the chat. Alternatively you could get a twitch oauth
 *  token and login in through IRC. This way doesn't require a login
 *  but is probably a lot slower and unreliable.
 *
 */

var system = require('system');
var page = require('webpage').create();
var $ = require('jquery');

page.viewportSize = { width: 1, height: 1 };

var url = "http://lissu.tampere.fi";

var address_template = "https://www.twitch.tv/<channel>/chat?popout";
var channel = system.env.channel;

channel = "blah";

var interval = system.env.interval || 5000; // polling interval
if (!channel) throw new Error("No channel name specified. Specifiy one in ENV.channel");

//var address = address_template.replace('<channel>', channel);
var address = url;

function print (o) {
  if (typeof o === 'object') {
    o.channel = channel;
    console.log(JSON.stringify( o ).trim());
  }
};

print({
  type: "status",
  message: "starting",
  interval: interval
});

page.open(address, function (status) {
  page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function () {
    print({
      type: "status",
      message: "page opened"
    });

    print({
      type: "connection",
      success: status === 'success',
      message: "connection: " + status,
      address: address
    });

    if (status !== 'success') {
       throw new Error("Failed to open channel.");
    }

    // start polling the DOM for changes
    var ticker = function () {
      console.log("interval tick");

      var data = page.evaluate(function () {
        //var messages = $(".chat-messages .tse-content div .message")
        var messages = $("svg g image").slice(0);

        // filter duplicates
        //messages = messages.filter(function (val, ind, arr) {
        //})

        var list = [];

        for (var i = 0; i < messages.length; i++) {
          var attr = messages[i].attributes;
          var obj = {
            id: attr[0].value,
            cx: attr[1].value,
            cy: attr[2].value,
          };
          list.push( obj );
        };

        return JSON.stringify(list);
      });

      console.log(typeof data);
      data = JSON.parse(data);

      // spit out the data
      if (data && data.length > 0) {
        var nodes = data;

        var np = /\d+/g; // number pattern

        console.log("nodes.length: " + nodes.length);

        var list = [];
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          if (!node) {
            console.log("node was: " + node);
            continue;
          };
          var item = {
            id: node.id.match(np)[0],
            cx: node.cx,
            cy: node.cy,
          };
          list.push(item);
        }

        // filter duplicates
        var seen = {};
        var ulist = list.filter(function (item) {
          var id = item.id;
          return seen[id] ? false : (seen[id] = true);
        });

        var bucket = {
          type: 'nodes',
          typeof: typeof data,
          nodes: ulist,
        };
        print( bucket );
      }

      setTimeout(ticker, interval);
    }
    setTimeout(ticker, interval);
  });

});
