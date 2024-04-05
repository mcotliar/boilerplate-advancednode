'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');

const routes = require('./routes.js');
const auth = require('./auth');
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
  cookie: { secure: false }
}));

const http = require('http').createServer(app);
const io = require('socket.io')(http);
let currentUsers = 0;

myDB(async client => {
  const myDataBase = await client.db('fcc-mongodb-and-mongoose').collection('people');
  auth(app, myDataBase);
  routes(app, myDataBase);
  io.on('connection', socket => {
    console.log('A user has connected');
    ++currentUsers;
    io.emit('user count', currentUsers);
    socket.on('disconnect', () => {
      io.emit('user count', --currentUsers);
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
