//imports
const express = require('express')
const http = require('http')
const { Server } = require("socket.io")
const path = require('path')
// const { time } = require('console')

//variables
const app = express()
const server = http.createServer(app)
const SocketServer = new Server(server)
const port = process.env.PORT || 3000
var serverUsers = []

//settings
app.use(express.static(path.join(__dirname, 'public'))) //set public folder

//routes
app.get('/about', (req, res) => { res.sendFile(__dirname + '/about.html'); })
app.get('/privacy', (req, res) => { res.sendFile(__dirname + '/about.html'); })
app.get('/*', (req, res) => { res.sendFile(__dirname + '/index.html'); })

//start server
server.listen(port, () => { console.log('listening on *:' + port); })

//namespaces
let nsps = SocketServer._nsps
let all_namespaces = Array.from(nsps, ([namespace]) => ({ type: 'namespace', namespace}))
// const adminNamespace = SocketServer.of("/admin");

//debugging
// console.log(SocketServer._nsps)
// console.log(all_namespaces)
// SocketServer.of("/admin").on("connection", (socket) => {
    // console.log(socket.nsp.name)

    // const newNamespace = socket.nsp; // newNamespace.name === "/dynamic-101"
    // broadcast to all clients in the given sub-namespace  
    // newNamespace.emit("hello")
// })

//functions
function updateInfo(client, socketId, clientIp, clientNsp, clientName)
{
    //variables
    let rooms = client.adapter.rooms
    let clients = client.adapter.sids
    let allClients = Array.from(clients, ([client]) => ({ type: 'client', client }))
    let allRooms = Array.from(rooms, ([room, clients]) => ({type: 'room', room, clients: Array.from(clients) }))
    let allRoomsFormatted = []
    let yourRooms = Array.from(client.rooms)
    let clientNames = serverUsers
    let clientsAllJSON = []
    let clientsAll = (Array.from(clients))

    //debugging
    // console.log("all clients " + "(" + allClients.length.toString() + ")")
    // console.log(allClients)

    //sort client names
    for(c in clientsAll)
    {
        let count = (parseInt(c) + 1).toString()
        let type = "type=client"
        let clientFormatted = Array.from(clientsAll[c][1])
        let clientStringified = clientFormatted.toString()
        let clientStringifiedSplit = clientStringified.split(",")
        let clientId = clientStringifiedSplit[0]
        let clientName = ""

        //handle client username
        for(u in serverUsers)
        {
            let user = serverUsers[u]
            // console.log(JSON.parse("{" + serverUsers[u] + "}"))
            // console.log(JSON.parse(serverUsers[u]))
            // console.log(JSON.parse(serverUsers[u]).username)
            if(user.socketId == clientId)
            {
                clientName = user.username

                //debugging
                // console.log("clientName: " + clientName)
                // console.log("new username: " + clientName)

                break
            }
        }

        //update client list
        clientRoom = clientStringifiedSplit[1]

        //null check
        if(clientRoom == null)
        {
            clientRoom = ""
        }

        //create client json obj
        clientJSON = "{" + "\"type\"" + ":" + "\"client\"" + "," + "\"namespace\"" + ":" + "\"" + clientNsp + "\"" + "," + "\"id\"" + ":" + "\"" + clientId + "\"" + "," + "\"room\"" + ":" + "\"" + clientRoom + "\"" + "," + "\"name\""+ ":" + "\"" + clientName + "\"" + "}"
        clientJSON = JSON.parse(clientJSON)

        //add client json obj to array
        clientsAllJSON.push(clientJSON)
    }

    //remove clients from rooms list
    for(r in allRooms)
    {
        if(allRooms[r].room != allRooms[r].clients) { allRoomsFormatted.push(allRooms[r]) }
    }

    //send socket info message
    SocketServer.emit('info', allRoomsFormatted, allClients, all_namespaces, clientsAllJSON)
}

//handle socket stream
SocketServer.of("/").on('connection', (client) => {
    //variables
    var socketId = client.id
    var clientIp = client.client.conn.remoteAddress
    var clientNsp = client.nsp.name
    let clientName = "anon" + client.id.substring(0, 4).toUpperCase()
    let clientId = client.id
    // var totalClients = client.server.httpServer._connections
    
    //join default room
    client.join("General")
    SocketServer.sockets.in("General").emit('join room', " " + clientName + " joined the room")

    //update elements
    updateInfo(client, socketId, clientIp, clientNsp, clientName)

    //debugging
    // console.log('user connected' + " / " + socketId + " / " + clientIp + " / " + clientNsp)
    // console.log('total clients: ' + totalClients)
    // console.log("rooms")
    // console.log(client.adapter.rooms)
    // console.log("sids")
    // console.log(client.adapter.sids)
    // console.log("nsp")
    // console.log(client.adapter.nsp.name)

    //handle socket stream
    client.on('chat message', (msgObj) => {
        //handle client username
        for (u in serverUsers)
        {
            let user = serverUsers[u]

            if(user.socketId == msgObj.userId)
            {
                msgObj.userName = user.username
                
                //debugging
                // console.log("clientName: " + clientName)
                // console.log("new username: " + clientName)

                break
            }
        }

        //debugging
        // console.log("message content: " +  msgObj.content)
        // console.log("message room: " + msgObj.room)
        // console.log("message userId: " + msgObj.userId)
        // console.log("message userName: " + msgObj.userName)
        // console.log("total saved users (serverUsers) "  + serverUsers.length)
        // console.log(serverUsers)

        //send socket message       
        SocketServer.sockets.in(msgObj.room).emit('chat message', msgObj)

        //log
        console.log(msgObj.room + " - <" + msgObj.userName + "> - " + msgObj.content)
    })
        
    client.on('leave room', (msg) => {
        //leave socket room
        client.leave(msg)

        //debugging
        // console.log(client.adapter.rooms)
        // console.log(client.adapter.rooms)

        //refresh info on
        updateInfo(client)

        //handle client username
        for(u in serverUsers)
        {
            let user = serverUsers[u]

            if(user.socketId == clientId)
            {
                clientName = user.username

                //debugging
                // console.log("clientName: " + clientName)
                // console.log("new username: " + clientName)

                break
            }
        }

        //send socket message
        SocketServer.sockets.in(msg).emit('leave room', " " + clientName + " left the room")

        //log
        console.log("<" + clientName + "> left the room")
    })

    client.on('join room', (msg) => {
        //debugging
        // console.log(msg)
        // console.log("\njoin room")

        //variables
        let newRoom = msg[0]
        let oldRoom = msg[1]

        //leave old socket room and join new socket room
        client.leave(oldRoom)
        client.join(newRoom)

        //debugging
        // console.log(client.adapter.rooms)
        // console.log(client.adapter.rooms)

        //refresh info on screen
        updateInfo(client)

        //handle client username
        for(u in serverUsers)
        {
            let user = serverUsers[u]

            if(user.socketId == clientId)
            {
                clientName = user.username

                //debugging
                // console.log("clientName: " + clientName)
                // console.log("new username: " + clientName)

                break
            }
        }

        //send socket messages
        SocketServer.sockets.in(oldRoom).emit('leave room', " " + clientName + " left the room")
        SocketServer.sockets.in(newRoom).emit('join room', " " + clientName + " joined the room")

        //log
        console.log(oldRoom + " - <" + clientName + "> - " + "left the room")
        console.log(newRoom + " - <" + clientName + "> - " + "joined the room")
    })

    client.on('create room', (msg) => {
        //debugging
        // console.log(msg)

        //variables
        let newRoom = msg[0]
        let oldRoom = msg[1]
        
        //check for forbidden characters
        newRoom = newRoom.replace(",", "")
        
        //leave old socket room and join new socket room
        client.leave(oldRoom)
        client.join(newRoom)
        
        //debugging
        // console.log("\ncreate room")
        // console.log("newRoom: " + newRoom)
        // console.log("oldRoom: " + oldRoom)
        // console.log(client.adapter.rooms)
        // console.log(client.adapter.rooms)
        
        //handle client username
        for(u in serverUsers)
        {
            let user = serverUsers[u]

            if(user.socketId == clientId)
            {
                clientName = user.username

                //debugging
                // console.log("clientName: " + c   lientName)
                // console.log("new username: " + clientName)

                break
            }
        }
        
        //update elements
        updateInfo(client)
        
        //send socket messages
        SocketServer.sockets.in(oldRoom).emit('leave room', " " + clientName + " left the room")
        SocketServer.sockets.in(newRoom).emit('create room', "room " + newRoom + " created")
        SocketServer.sockets.in(newRoom).emit('join room', " " + clientName + " joined the room")

        //log
        console.log(oldRoom + " - " + clientName + " - " + "left the room")
        console.log(newRoom + " - " + "room created")
        console.log(newRoom + " - " + clientName + " - " + "joined the room")
    })
    
    client.on('disconnect', () => {
        //debugging
        // console.log('user disconnected');

        //update elements
        updateInfo(client)

        //log
        console.log("client disconnected")
    })

    client.on('add user', (userObj) => {
        //debugging
        // console.log("\nadd username")
        // console.log(userObj)

        //variables
        let userId = userObj.socketId
        let userName = userObj.username
        let userIp = client.client.conn.remoteAddress

        //set userObj
        userObj = JSON.stringify(userObj)
        userObj = userObj.replace("}", "")
        userObj = userObj.replace("{", "")
        userObj += "," + "\"ipAddress\"" + ":" + "\"" + userIp + "\""
        userObj = "{" + userObj + "}"
        userObj = JSON.parse(userObj)
        
        //debugging
        // console.log("user id: " + userId)
        // console.log("username: " + userName)
        // console.log("userIp: " + userIp)

        //handle client username
        if(serverUsers.length == 0)
        {
            serverUsers.push(userObj) //update serverUsers
        }
        else if(serverUsers.length > 0)
        {
            for(u in serverUsers)
            {
                let user = serverUsers[u]
                
                //update user name if existing user
                if(userId == user.socketId)
                {
                    user.username = userName                    
                }
                //update serverUsers if new user
                else if(!JSON.stringify(serverUsers).includes(userObj.socketId))
                {           
                    serverUsers.push(userObj)
                }

            }
        }
            
        //update elements
        updateInfo(client)

        //log
        console.log(userId + " changed username to " + userName)
    })
    
    //update elements
    updateInfo(client)
})
