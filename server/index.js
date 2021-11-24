const { time } = require('console');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const SocketServer = new Server(server);

// app.get('/', (req, res) => {  
//     res.send('<h1>Hello world</h1>');
// });

app.get('/*', (req, res) => {
      res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {  
    console.log('listening on *:3000');
});

serverUsers = []

//create namespaces
const adminNamespace = SocketServer.of("/admin");

//all namespaces
let nsps = SocketServer._nsps
let all_namespaces = Array.from(nsps, ([namespace]) => ({ type: 'namespace', namespace}));
// console.log(SocketServer._nsps)
// console.log(all_namespaces)

SocketServer.of("/admin").on("connection", (socket) => {
    // console.log(socket.nsp.name)

    // const newNamespace = socket.nsp; // newNamespace.name === "/dynamic-101"
    // broadcast to all clients in the given sub-namespace  
    // newNamespace.emit("hello");
});

SocketServer.of("/").on('connection', (client) => {
    var socketId = client.id
    var clientIp = client.client.conn.remoteAddress
    var clientNsp = client.nsp.name
    // var totalClients = client.server.httpServer._connections
    
    function updateInfo(client)
    {
        console.log("update info")

        let rooms = client.adapter.rooms
        let clients = client.adapter.sids
        let allClients = Array.from(clients, ([client]) => ({ type: 'client', client }));
        // let allRooms = Array.from(rooms, ([room, clients]) => ({ type: 'room', room, clients: Array.from(clients)})); // array = Array.from(map, ([name, value]) => ({ name, value }));
        let allRooms = Array.from(rooms, ([room, clients]) => ({type: 'room', room, clients: Array.from(clients) }))
        let allRoomsFormatted = []
        let yourRooms = Array.from(client.rooms)
        let clientNames = serverUsers
        // console.log("your rooms")
        // console.log(yourRooms)
        // console.log(clients)
        // console.log(allRooms)
        let clientsAllJSON = []
        let clientsAll = (Array.from(clients))

        console.log("all clients " + "(" + allClients.length.toString() + ")")
        console.log(allClients)

        for(c in clientsAll)
        {
            count = (parseInt(c) + 1).toString()
            type = "type=client"
            // console.log(count)
            let clientFormatted = Array.from(clientsAll[c][1])
            let clientStringified = clientFormatted.toString()
            let clientStringifiedSplit = clientStringified.split(",")
            let clientId = clientStringifiedSplit[0]
            let clientName = ""

            for(u in serverUsers)
            {
                if(serverUsers[u].socketId == clientId)
                {
                    // console.log(clientId)
                    // console.log(serverUsers[u].socketId)
                    clientName = serverUsers[u].username
                    // console.log("clientName: " + c   lientName)
                    // console.log("new username: " + clientName)
                }
            }
            // clientRooms = clientStringifiedSplit.slice(1, 2)
            // clientRoomsCount = clientRooms.length
            clientRoom = clientStringifiedSplit[1]
            if(clientRoom == null){clientRoom = ""}
            // clientJSON = "{" + "\"type\"" + ":" + "\"client\"" + "," + "\"namespace\"" + ":" + "\"" + clientNsp + "\"" + "," + "\"id\"" + ":" + "\"" + clientId + "\"" + "," + "\"roomsCount\""  + ":" + "\"" + clientRoomsCount + "\"" + "," + "\"rooms\"" + ":" + "\"" + clientRooms + "\"" + "}"
            clientJSON = "{" + "\"type\"" + ":" + "\"client\"" + "," + "\"namespace\"" + ":" + "\"" + clientNsp + "\"" + "," + "\"id\"" + ":" + "\"" + clientId + "\"" + "," + "\"room\"" + ":" + "\"" + clientRoom + "\"" + "," + "\"name\""+ ":" + "\"" + clientName + "\"" + "}"
            clientJSON = JSON.parse(clientJSON)
            // clientFormatted.unshift(type)
            // clientFormatted.unshift(count)
            // console.log(clientFormatted)
            // console.log("client namespace: " + clientNsp)
            // console.log("client id: " + clientId)
            // console.log("client rooms: " + clientRooms)
            // console.log(clientJSON)
            clientsAllJSON.push(clientJSON)
            // console.log(clientsAllJSON)
        }
        // console.log(Array.from(clients))
        // console.log(Array.from(clients)[0][1])
        // console.log(Array.from(Array.from(clients)[0][1]))

        //remove client rooms from rooms list
        for(r in allRooms)
        {
            if(allRooms[r].room != allRooms[r].clients)
            {
                
                // console.log(allRooms[r])
                allRoomsFormatted.push(allRooms[r])
            }
        }

        SocketServer.emit('info', allRoomsFormatted, allClients, all_namespaces, clientsAllJSON);
    }

    let clientName = "anon" + client.id.substring(0, 4).toUpperCase()
    let clientId = client.id
    
    client.join("general")
    SocketServer.sockets.in("general").emit('join room', clientName + " joined the room")
    // console.log(client.rooms)
    // client.join("gaming")
    // console.log(client.rooms)

    console.log('user connected' + " / " + socketId + " / " + clientIp + " / " + clientNsp);
    // console.log('total clients: ' + totalClients)
    // console.log("rooms")
    // console.log(client.adapter.rooms)
    // console.log("sids")
    // console.log(client.adapter.sids)
    // console.log("nsp")
    // console.log(client.adapter.nsp.name)

    client.on('chat message', (msgObj) => {
        console.log("\nchat message")
    //   console.log(msgObj);

        for (user in serverUsers)
        {
        //   console.log(serverUsers[user])

            if(serverUsers[user].socketId == msgObj.userId)
            {
                msgObj.userName = serverUsers[user].username
                break
            }
        }

        console.log("message content: " +  msgObj.content);
        console.log("message room: " + msgObj.room);
        console.log("message userId: " + msgObj.userId);
        console.log("message userName: " + msgObj.userName);
        console.log("total saved users (serverUsers) "  + serverUsers.length)
        console.log(serverUsers)
        
    //   console.log(client.id)
    //   console.log(client.adapter.rooms)
    //   console.log(client.adapter.sids)
        // SocketServer.emit('some event', { someProperty: 'some value', otherProperty: 'other value' }); // This will emit the event to all connected sockets
        // client.broadcast.emit('hi'); //to all except self
    //   SocketServer.emit('chat message', msgObj.msg);
        SocketServer.sockets.in(msgObj.room).emit('chat message', msgObj)
    });
        
    client.on('leave room', (msg) => {
        console.log("\nleave room")

        // let clientId = client.id
        // let clientName = "anon" + client.id.substring(0, 4).toUpperCase()

        // console.log(client.adapter.rooms)
        client.leave(msg)
        // console.log(client.adapter.rooms)

        updateInfo(client)

        for(u in serverUsers)
        {
            if(serverUsers[u].socketId == clientId)
            {
                // console.log(clientId)
                // console.log(serverUsers[u].socketId)
                clientName = serverUsers[u].username
                // console.log("clientName: " + c   lientName)
                // console.log("new username: " + clientName)
                break
            }
        }

        SocketServer.sockets.in(msg).emit('leave room', clientName + " left the room")
    });

    client.on('join room', (msg) => {
        // console.log(msg)

        let newRoom = msg[0]
        let oldRoom = msg[1]
        // let clientId = client.id
        // let clientName = "anon" + client.id.substring(0, 4).toUpperCase()

        console.log("\njoin room")

        // console.log(client.adapter.rooms)
        client.leave(oldRoom)
        client.join(newRoom)
        // console.log(client.adapter.rooms);

        updateInfo(client)

        for(u in serverUsers)
        {
            if(serverUsers[u].socketId == clientId)
            {
                // console.log(clientId)
                // console.log(serverUsers[u].socketId)
                clientName = serverUsers[u].username
                // console.log("clientName: " + c   lientName)
                // console.log("new username: " + clientName)
                break
            }
        }

        SocketServer.sockets.in(newRoom).emit('join room', clientName + " joined the room")
    });

    client.on('create room', (msg) => {
        // console.log(msg)

        let newRoom = msg[0]
        newRoom = newRoom.replace(",", "") //forbidden characters = ,
        let oldRoom = msg[1]
        // let clientId = client.id
        // let clientName = "anon" + client.id.substring(0, 4).toUpperCase()
        
        console.log("\ncreate room")
        console.log("newRoom: " + newRoom)
        console.log("oldRoom: " + oldRoom)
        
        // console.log(client.adapter.rooms)
        client.leave(oldRoom)
        client.join(newRoom)
        // console.log(client.adapter.rooms)
        
        updateInfo(client)

        for(u in serverUsers)
        {
            if(serverUsers[u].socketId == clientId)
            {
                // console.log(clientId)
                // console.log(serverUsers[u].socketId)
                clientName = serverUsers[u].username
                // console.log("clientName: " + c   lientName)
                // console.log("new username: " + clientName)
                break
            }
        }
        
        SocketServer.sockets.in(oldRoom).emit('leave room', clientName + " left the room")
        SocketServer.sockets.in(newRoom).emit('create room', newRoom + " room created")
        SocketServer.sockets.in(newRoom).emit('join room', clientName + " joined the room")
    });
    
    client.on('disconnect', () => {
        console.log('user disconnected');
        updateInfo(client)
    });

    client.on('add user', (userObj) => {
        console.log("\nadd username")
        // console.log(userObj)
        let userId = userObj.socketId
        let userName = userObj.username
        let userIp = client.client.conn.remoteAddress
        // console.log("user id: " + userId)
        // console.log("username: " + userName)
        // console.log("userIp: " + userIp)

        //check if client have saved username
        for(user in serverUsers)
        {
            if(userId == serverUsers[user].socketId)
            {
                serverUsers[user].username = userName
                updateInfo(client)
                // console.log(serverUsers)
                return
            }
        }
        
        userObj = JSON.stringify(userObj)
        userObj = userObj.replace("}", "")
        userObj = userObj.replace("{", "")
        userObj += "," + "\"ipAddress\"" + ":" + "\"" + userIp + "\""
        userObj = JSON.parse("{" + userObj + "}")
        // console.log(userObj)
        // console.log(serverUsers)
        
        serverUsers.push(userObj)
        // console.log(serverUsers)
        updateInfo(client)
    })
    
    // const rooms = SocketServer.of("/").adapter.rooms;
    updateInfo(client)
    // console.log(allClients)
    // console.log(allRooms)
});
