var rChat = document.querySelector('#r-chat');
var chatList = document.querySelector('#chat-list');
var socket = io.connect('http://localhost:8001/chat', {
  path: '/socket.io'
});

function systemMessage(data) {
  var div = document.createElement('div');
  div.classList.add('system');
  var chat = document.createElement('div');
  chat.textContent = data.chat;
  div.appendChild(chat);
  chatList.appendChild(div);
}

socket.on('join', function (data) {
  systemMessage(data);
});
socket.on('exit', function (data) {
  systemMessage(data);
});

socket.on('chat', function(data) {
  var div = document.createElement('div');
  if(data.user === `${user}`) {
    div.classList.add('mine');
  } else {
    div.classList.add('other');
  }
  var name = document.createElement('div');
  name.textContent = data.user;
  div.appendChild(name);
  if(data.chat) {
    var chat = document.createElement('div');
    chat.textContent = data.chat;
    div.appendChild(chat);
  } else {
    var img = document.createElement('img');
    img.src = '/img/' + data.img;
    div.appendChild(img);
  }
  div.style.color = data.user;
  chatList.appendChild(div);
  rChat.scrollTop = rChat.scrollHeight;
});

document.querySelector('#chat-form').addEventListener('submit', function (e) {
  e.preventDefault();
  if (e.target.chat.value) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status === 200) {
        e.target.chat.value = '';
      } else {
        console.error(xhr.responseText);
      }
    };
    xhr.open('POST', `/room/${roomId}/chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      chat: this.chat.value
    }));
  }
});

document.querySelector('#form-img').addEventListener('change', function(e) {
  var formData = new FormData();
  var xhr = new XMLHttpRequest();
  console.log(e.target.files);
  formData.append('img', e.target.files[0]);
  // 이미지 파일 확장자가 .png, .gif, .jpg, .jpeg 가 아닌것은 에러메시지
  console.log(formData);
  xhr.onload = function() {
    if(xhr.status === 200) {
      e.target.file = null;
    } else {
      console.error(xhr.responseText);
    }
  };
  xhr.open('POST', `/room/${roomId}/img`);
  xhr.send(formData);
})