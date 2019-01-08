const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

fs.readdir('uploads', (error) => {
  if(error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 만듭니다.');
    fs.mkdirSync('uploads');
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

router.get('/', async (req, res, next) => {
  res.render('index');
});

router.get('/waiting', async (req, res) => {
  // 세션 값에 따라 받는 값
  console.log(req.session.color);
  try {
    const rooms = await Room.find({});
    res.render('waiting', { rooms, error: req.flash('roomError')});
  } catch(error) {
    console.error(error);
    next(error);
  }
});

router.get('/room', (req, res) => {
  res.render('room');
});
router.post('/room', async (req, res, next) => {
  try {
    const room = new Room({
      title: req.body.title,
      max: req.body.max,
      owner: req.session.color,
      password: req.body.password,
      count: 1,
    });
    const newRoom = await room.save();
    const io = req.app.get('io');
    io.of('/room').emit('newRoom', newRoom);
    res.redirect(`/room/${newRoom._id}?password=${req.body.password}`)
  } catch(error) {
    console.error(error);
    next(error);
  }
});

router.get('/room/:id', async (req, res, next) => {
  try {
    const room = await Room.findOne({_id: req.params.id});
    const io = req.app.get('io');
    if(!room) {
      req.flash('roomError', '존재하지 않는 방입니다');
      return res.redirect('/waiting');
    }
    if(room.password && room.password !== req.query.password) {
      req.flash('roomError', '비밀번호가 틀렸습니다.');
      return res.redirect('/waiting');
    }
    const { rooms } = io.of('/chat').adapter;
    if(rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length) {
      req.flash('roomError', '허용 인원이 초과하였습니다.');
      return res.redirect('/waiting');
    }
    const chats = await Chat.find({room: room._id}).sort('createdAt');
    console.log(chats);
    return res.render('room', {
      room,
      title: room.title,
      chats,
      user: req.session.color,
    });
  } catch(error) {
    console.error(error);
    next(error);
  }
});

router.delete('/room/:id', async (req, res, next) => {
  try {
    await Room.remove({_id: req.params.id});
    await Chat.remove({room: req.params.id});
    res.send('ok');
    setTimeout(() => {
      req.app.get('io').of('/room').emit('removeRoom', req.params.id);
      console.log('방제거 호출');
    }, 2000);
  } catch(error) {
    console.error(error);
    next(error);
  }
});

router.post('/room/:id/chat', async (req, res, next) => {
  try {
    const chat = new Chat({
      room: req.params.id,
      user: req.session.color,
      chat: req.body.chat,
    });
    await chat.save();
    req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
    res.send('ok');
  } catch(error) {
    console.error(error);
    next(error);
  }
});

router.post('/room/:id/img', upload.single('img'), async (req, res, next) => {
  try {
    const chat = new Chat({
      room: req.params.id,
      user: req.session.color,
      img: req.file.filename,
    });
    await chat.save();
    req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
    res.send('ok');
  } catch(error) {
    console.error(error);
    next(error);
  }
});

router.get('/menu', (req, res) => {
  res.render('menu');
});

module.exports = router;