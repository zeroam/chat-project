const SocketIO = require('socket.io');
const axios = require('axios');

const Room = require('./schemas/room');

// 방 접속자
const roomUser = [];

module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, {
    path: '/socket.io'
  });
  app.set('io', io);
  const room = io.of('/room');
  const chat = io.of('/chat');
  io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
  });
  room.on('connection', (socket) => {
    console.log('room 네임스페이스에 접속');
    const req = socket.request;
    //console.log('소켓 아이디:', socket.id);
    //console.log('게스트 아이디', req.session.color);
    // 유저 목록에 추가
    roomUser.push({
      nick: req.session.color,
      socketId: socket.id
    });
    io.of('/room').emit('user', roomUser);
    socket.on('disconnect', () => {
      // 유저 목록에서 제거
      roomUser.splice(roomUser.indexOf(roomUser.nick === req.session.color), 1);
      io.of('/room').emit('user', roomUser);
      console.log('room 네임스페이스 접속 해제');
    });
  });
  chat.on('connection', (socket, next) => {
    console.log('chat 네임스페이스에 접속');
    const req = socket.request;
    const {
      headers: {
        referer
      }
    } = req;
    const roomId = referer
      .split('/')[referer.split('/').length - 1]
      .replace(/\?.+/, '');
    socket.join(roomId);
    socket.to(roomId).emit('join', {
      user: 'system',
      chat: `${req.session.color}님이 입장하셨습니다.`,
    });
    // waiting 페이지 방 인원 증가
    const userCount = socket.adapter.rooms[roomId].length;
    Room.update({
        _id: roomId
      }, {
        count: userCount
      })
      .then((result) => console.log(result))
      .catch((error) => {
        console.error(error);
        next(error);
      });
    io.of('/room').emit('roomNum', {
      roomId,
      userCount,
    });
    socket.on('disconnect', () => {
      console.log('chat 네임스페이스 접속 해제');
      socket.leave(roomId);
      const currentRoom = socket.adapter.rooms[roomId];
      const userCount = currentRoom ? currentRoom.length : 0;
      if (userCount === 0) {
        axios.delete(`http://localhost:8001/room/${roomId}`)
          .then(() => {
            console.log('방 제거 요청 성공');
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        socket.to(roomId).emit('exit', {
          user: 'system',
          chat: `${req.session.color}님이 퇴장하셨습니다.`,
        });
        // waiting 페이지에 방 인원
        io.of('/room').emit('roomNum', {
          roomId,
          userCount,
        });
        Room.update({
            _id: roomId
          }, {
            count: userCount
          })
          .then((result) => console.log(result))
          .catch((error) => {
            console.error(error);
            next(error);
          });
      }
    });
  });
}