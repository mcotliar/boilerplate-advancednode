$(document).ready(function () {
  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();
    socket.emit('chat message', messageToSend);
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
  /*global io*/
  let socket = io();
  socket.on('chat message',({username,message})=> {
      $('#messages').append($('<li>').html( `${username}: ${message}` ));
  }
  );
  socket.on('user', function(data) {
    const {currentUsers, username,connected} = data;
    $('#num-users').text(currentUsers + ' users online');
    let message =
      username +
      (connected ? ' has joined the chat.' : ' has left the chat.');
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });
  
});
