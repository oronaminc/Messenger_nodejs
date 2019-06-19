/* node.js 기본 내장 모듈 불러오기 */
const path = require('path');
const http = require('http');
/* 설치한 express, socket.io 모듈 불러오기 */
const express = require('express');
const socketIO = require('socket.io');

const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/isRealString');
const {Users} = require('./utils/users');

const publicPath = path.join(__dirname, '/../public');
/* node.js 에서 제공하는 process.env를 사용하면 시스템에서 설정한 값을 가져울 수 있음 */
const port = process.env.PORT || 3000

/* express 객체 생성 */
let app = express();
/* express http 서버 생성 */
let server = http.createServer(app);
/* 생성된 서버를 socket.io에 바인딩 */
// 바인딩이란 함수 호출과 실제 함수를 연결하는 방법
let io = socketIO(server);
let users = new Users();

/* publicPath에 있는 파일들을 불러오기 */
/* 정적 파일을 제공하기 위해 미들웨어(MiddleWare)를 사용하는 코드입니다. */
// app.use()를 사용하여 원하는 미들웨어를 추가하여 조합할 수 있음.
app.use(express.static(publicPath));

//모든 소켓을 의미함
io.on('connection', (socket) => {
  console.log("A new user just connected");

  //해당 이벤트를 받으면 이렇게 실행이 됩니다.
  socket.on('join', (params, callback) => {
    if(!isRealString(params.name) || !isRealString(params.room)){
      return callback('Name and room are required');
    }

    socket.join(params.room);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.room);

    io.to(params.room).emit('updateUsersList', users.getUserList(params.room));
    socket.emit('newMessage', generateMessage('Admin', `Welocome to ${params.room}!`));

    socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', "New User Joined!"));

    callback();
  })

  socket.on('createMessage', (message, callback) => {
    let user = users.getUser(socket.id);

    if(user && isRealString(message.text)){
      socket.broadcast.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
      //io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
    }
    callback('This is the server:');
  })

  socket.on('createLocationMessage', (coords) => {
    let user = users.getUser(socket.id);

    if(user){
      io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.name, coords.lat, coords.lng))
    }
  })

  socket.on('disconnect', () => {
    let user = users.removeUser(socket.id);

    if(user){
      io.to(user.room).emit('updateUsersList', users.getUserList(user.room));
      io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.name} has left ${user.room} chat room.`))
    }
  });
});


server.listen(port, ()=> {
  console.log(`Server is up on port ${port}`);
})