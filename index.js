var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);


var stations = [];
var stations_ID = [];
var ledInit = { led1: null, led2: null, led3: null };
var tempNull = { tempC: "", tempF: "" };

const MongoClient = require('mongodb').MongoClient;



// Replace the following with your Atlas connection string
const url =
    "mongodb+srv://vutrantienbao290699:vutrantienbao2906@project.murnk.mongodb.net/test?retryWrites=true&w=majority";

const client = new MongoClient(url);

const PORT = 3484;
http.listen(process.env.PORT || PORT, console.log("server running ", PORT));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/IOT_Server.html");
});

io.on("connection", (socket) => {
    console.log("a user connected, id: ", socket.id);
    io.emit("stations", stations);
    socket.on("disconnect", () => {
        if (stations_ID.includes(socket.id)) {
            stations_ID = stations_ID.filter((element) => element !== socket.id);
            stations = stations.filter((station) => station.id !== socket.id);
            io.to(socket.id).emit("ledStatus", ledInit);
            io.to(socket.id).emit("temp2web", tempNull);
            io.emit("stations", stations);
            console.log("Room ", socket.id, " disconnected");
            console.log("stations_ID[]: ", stations_ID);
        } else console.log("user ", socket.id, " disconnected");
    });

    socket.on("create-station", (station) => {
        let stationTemp = station;
        stationTemp.id = socket.id;
        console.log("new station info: ", stationTemp);
        stations.push(stationTemp);
        stations_ID.push(stationTemp.id);
        console.log("stations_ID[]: ", stations_ID);

        io.to(socket.id).emit("station-id", socket.id);
        io.emit("stations", stations);
    });

    socket.on("list-rooms", (msg) => {
        console.log(stations);
        io.emit("stations", stations);
    });

    socket.on("join-room", (msg) => {
        let stationID = msg;
        socket.leaveAll();
        socket.join(msg);
        io.to(stationID).emit("getLedStatus", "");
        console.log("join-room", msg);

        console.log("client in station: ", socket.adapter.rooms);
        console.log("Station list by id: ", socket.adapter.sids[socket.id]);
    });

    socket.on("temp", (msg) => {


        const dbName = "test";
        try {
            console.log(msg);
            io.to(socket.id).emit("temp2web", msg);
            client.connect();
            console.log("Connected correctly to server");
            const db = client.db(dbName);
            // Use the collection "people"
            const col = db.collection("dataRewes");
            const p = col.insertOne(msg);
        } catch (err) {
            console.log(err.stack);
        }
    });

});