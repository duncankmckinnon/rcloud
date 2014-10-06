((function() {

requirejs.config({
    paths: {
        "shiny": "../../shared/shiny"
    }
});

var sockets_ = [];
var ocaps_ = null;

function fakeWebSocket() {
    var fws = {
        readyState: false,
        send: function(msg) {
            console.log("client to Shiny: ", arguments);
            ocaps_.sendAsync(id, msg).then(function(response) {
                console.log("Shiny response: ", response);
            });
        }
    };
    var id = sockets_.length;
    sockets_.push(fws);
    fws.id = id;
    ocaps_.connectAsync(id).then(function() {
        fws.readyState = true;
        fws.onopen();
    });
    return fws;
}

return {
    init: function(ocaps, k) {
        ocaps_ = RCloud.promisify_paths(ocaps, [["connect"], ["send"]]);
        window.Shiny = {
            createSocket: function() {
                return fakeWebSocket();
            }
        };
        setTimeout(function() {
            // note: we intentionally continue before Shiny is loaded, because the DOM
            // needs to be constructed for Shiny to find elements to drive
            require(["shiny"], function() {});
        }, 3000);
        k();
    },
    on_message: function(id, msg, k) {
        console.log("Shiny to client: ", msg);
        sockets_[0].onmessage({data:msg});
        k();
    }
};
})()) /*jshint -W033 */ // this is an expression not a statement
