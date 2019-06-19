let socket = io();



function scrollToBottom() {
  let messages = document.querySelector('#messages').lastElementChild;
  messages.scrollIntoView();
}

socket.on('connect', function() {
  let searchQuery = window.location.search.substring(1);
  let params = JSON.parse('{"' + decodeURI(searchQuery).replace(/&/g, '","').replace(/\+/g, ' ').replace(/=/g,'":"') + '"}');

  socket.emit('join', params, function(err) {
    if(err){
      alert(err);
      window.location.href = '/';
    }else {
      console.log('No Error');
    }
  })
});

socket.on('disconnect', function() {
  console.log('disconnected from server.');
});

socket.on('updateUsersList', function (users) {
  let ol = document.createElement('ol');

  users.forEach(function (user) {
    let li = document.createElement('li');
    li.innerHTML = user;
    ol.appendChild(li);
  });

  let usersList = document.querySelector('#users');
  usersList.innerHTML = "";
  usersList.appendChild(ol);
})

socket.on('newMessage', function(message) {
  const formattedTime = moment(message.createdAt).format('LT');
  const template = document.querySelector('#message-template').innerHTML;
  const html = Mustache.render(template, {
    from: message.from,
    text: message.text,
    createdAt: formattedTime
  });

  const div = document.createElement('div');
  div.classList.add('message__style__other')
  div.innerHTML = html

  document.querySelector('#messages').appendChild(div);
  scrollToBottom();
});


socket.on('newLocationMessage', function(message) {
  const formattedTime = moment(message.createdAt).format('LT');
  console.log("newLocationMessage", message);
  const template = document.querySelector('#location-message-template').innerHTML;
  const html = Mustache.render(template, {
    from: message.from,
    url: message.url,
    createdAt: formattedTime
  });

  const div = document.createElement('div');
  div.classList.add('message__style__other')
  div.innerHTML = html

  document.querySelector('#messages').appendChild(div);
  scrollToBottom();
});


document.querySelector('#submit-btn').addEventListener('click', function(e) {
  e.preventDefault(); // 링크 이동을 막아준다(디폴트를 삭제한다)

  //this.users.filter((user) => user.id === id)[0];
  var message = document.querySelector('input[name="message"]').value;
  var searchQuery = window.location.search.substring(1);
  var params = JSON.parse('{"' + decodeURI(searchQuery).replace(/&/g, '","').replace(/\+/g, ' ').replace(/=/g,'":"') + '"}');
  //var user = users.getUser(message);
  const formattedTime = moment(message.createdAt).format('LT');
  const template = document.querySelector('#message-template').innerHTML;
  const html = Mustache.render(template, {
    from: params.name,
    text: message,
    createdAt: formattedTime
  });
  
  const div = document.createElement('div');
  div.classList.add('message__style')
  div.innerHTML = html;
  document.querySelector('#messages').appendChild(div);
  scrollToBottom();

  // createMessage
  socket.emit("createMessage", {
    text: document.querySelector('input[name="message"]').value
  }, function() {
    document.querySelector('input[name="message"]').value = '';
  })

  
})


document.querySelector('#send-location').addEventListener('click', function(e) {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.')
  }

  navigator.geolocation.getCurrentPosition(function(position) {
    socket.emit('createLocationMessage', {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    })
  }, function() {
    alert('Unable to fetch location.')
  })
});
