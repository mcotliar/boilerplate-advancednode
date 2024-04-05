'use strict';
require('dotenv').config();

const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const routes = require('./routes.js');
const auth = require('./auth');
const passportSocketIo = require('passport.socketio');
const MongoStore = require('connect-mongo')(session);
const cookieParser = require('cookie-parser');

const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

const app = express();
fccTesting(app); //For FCC testing purposes
app.set('view engine', 'pug');
app.set('views', './views/pug');
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store
}));

const http = require('http').createServer(app);
const io = require('socket.io')(http);

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  }));

let currentUsers = 0;

myDB(async client => {
  const myDataBase = await client.db('fcc-mongodb-and-mongoose').collection('people');
  auth(app, myDataBase);
  routes(app, myDataBase);
  io.on('connection', socket => {
    const {user:{username}} = socket.request;
    console.log('user ' + username + ' connected');
    ++currentUsers;
    io.emit('user', {currentUsers, username:username,connected:true});
    socket.on('disconnect', () => {
      io.emit('user', {currentUsers, username:username,connected:false});
    });
    socket.on('chat message',(message)=>{
      console.log('chat message',message);
      io.emit('chat message',{username:username,message});
    });
  });



}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}