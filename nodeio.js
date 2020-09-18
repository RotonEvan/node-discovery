var mosq = new Mosquitto();
var url;
var name = prompt('Enter your name: ', '');
var uuid = create_UUID();

peers = {};

function beginConnection() {
    
    url = "ws://broker.hivemq.com:8000/mqtt";
    mosq.connect(url);

    setupPeer(name);

    //connect with other nodes in the network using 3-way handshake
    //subscribe to topic : `connection-protocol`
    mosq.subscribe("connection-protocol", 0);

    mosq.publish("connection-protocol", JSON.stringify({'packet': "SYNC", 'name': name, 'uuid': uuid}), 0);
}

mosq.onmessage = function(topic, payload, qos) {
    var msg = JSON.parse(payload);
    var pckt = msg.packet;
    var peername = msg.name;
    var peeruuid = msg.uuid;
    if (topic == "connection-protocol" && peeruuid != uuid) {
        if (pckt == "SYNC") {
            mosq.publish("connection-protocol", JSON.stringify({'packet': "SYCK", 'name': name, 'uuid': uuid}), 0);
        } else if (pckt == "ACKN") {
            peers[peeruuid] = {'uuid': peeruuid, 'name': peername};
            setupPeer(peername);
        } else if (pckt == "SYCK") {
            mosq.publish("connection-protocol", JSON.stringify({'packet': "ACKN", 'name': name, 'uuid': uuid}), 0);
            peers[peeruuid] = {'uuid': peeruuid, 'name': peername};
            setupPeer(peername);
        }
    }
}

function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function setupPeer(name) {
    graph.addNode(name);
    graph.addLink('Broker', name, '10');
    keepNodesOnTop();
}