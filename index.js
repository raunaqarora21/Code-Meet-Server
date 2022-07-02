const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
// const server = createServer(app);
// const bodyParser = require('body-parser');
// const cors = require('cors');
const io = require('socket.io')(server);
const PORT = process.env.PORT || 5000;
const userSocketMap = {};
// console.log("called");

const getAllConnectedClients = (roomId) => {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(socketId => {
        return {
            socketId,
            username: userSocketMap[socketId]
        }
    });
}

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    // socket.on('disconnect', () => {
    //     console.log('user disconnected');
    // });
    socket.on('join', ({roomId, username}) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        console.log("Server side", clients);
        clients.forEach(({socketId}) => {
            io.to(socketId).emit('joined', {
                clients,
                username,
                socketID: socket.id
            });
        });

    })

    socket.on('code-change', ({roomId, code}) => {
        // console.log(roomId);
        socket.in(roomId).emit('code-change', {
            code
        });
    });
    socket.on('sync-code', ({socketID, code}) => {
        // console.log(roomId);
        console.log("sync-code", socketID, code);
        io.to(socketID).emit('code-change', {
            code
        });
    });


    socket.on('disconnecting', ()=>{
        console.log('user disconnected');
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit('disconnected', {
                username: userSocketMap[socket.id],
                socketID: socket.id
            })
            
            socket.leave(roomId);
        })
        delete userSocketMap[socket.id];
        
    })
});

server.listen(PORT,
    () => console.log(`Server listening on port ${PORT}`));

app.get('/', (req, res) => {
    res.send('Hello World!');
});
