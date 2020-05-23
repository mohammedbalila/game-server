const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const {
  userJoin,
  userLeave,
  getCurrentUser,
  getRoomUsers,
} = require('./users');

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    console.log(username, room);
    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit('message', `${user.username} has joined the game`);

    // Send users and room info
    io.to(user.room).emit('roomInfo', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on('gameStart', (game) => {});

  socket.on('updateScore', (player) => {
    console.log('updateScore', player);
    io.to(player.room).emit('updateScore', player);
  });

  socket.on('gameOver', (player) => {
    const loser = getCurrentUser(socket.id);
    console.log('GameOver', loser);
    io.to(player.room).emit('gameOver', { loser });
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit('message', `${user.username} has left the chat`);

      // Send users and room info
      io.to(user.room).emit('roomInfo', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
