var wId = document.querySelector('#w_id');
var wUsers = document.querySelector('#w_users');
var wCreate = document.querySelector('#w_create');
wId.addEventListener('mouseover', function () {
  wUsers.style.display = 'block';
});
wUsers.addEventListener('mouseleave', function () {
  wUsers.style.display = 'none';
})

// 방생성 콜백 함수
function cbCreateRoom() {
  wCreate.innerHTML = '';
  var div = document.createElement('div');
  var form = document.createElement('form');
  form.className = 'w_form';
  form.action = '/room';
  form.method = 'post';
  var rowDiv = document.createElement('div');
  var label = document.createElement('label');
  rowDiv.appendChild(label);
  label.textContent = 'Title';
  var input = document.createElement('input');
  input.required = 'true';
  input.name = 'title';
  input.placeholder = '방 제목';
  rowDiv.appendChild(input);
  form.appendChild(rowDiv);
  rowDiv = document.createElement('div');
  label = document.createElement('label');
  label.textContent = 'Password';
  rowDiv.appendChild(label);
  input = document.createElement('input');
  input.name = 'password';
  input.placeholder = '비밀번호(없으면 공개방)';
  rowDiv.appendChild(input);
  form.appendChild(rowDiv);
  rowDiv = document.createElement('div');
  label = document.createElement('label');
  label.textContent = 'Limit';
  rowDiv.appendChild(label);
  input = document.createElement('input');
  input.defaultValue = 10;
  input.type = 'number';
  input.name = 'max';
  rowDiv.appendChild(input);
  form.appendChild(rowDiv);
  rowDiv = document.createElement('div');
  var button = document.createElement('button');
  button.textContent = 'Create Room';
  rowDiv.appendChild(button);
  button = document.createElement('button');
  button.type = 'button';
  button.className = 'cancel_btn'
  button.textContent = 'Cancel';
  button.addEventListener('click', function () {
    wCreate.innerHTML = '';
    div = document.createElement('div');
    var innerDiv = document.createElement('div');
    innerDiv.classList.add('w_create_inner');
    var icon = document.createElement('i');
    icon.classList.add('fas');
    icon.classList.add('fa-plus-circle');
    icon.addEventListener('click', cbCreateRoom);
    innerDiv.appendChild(icon);
    div.appendChild(innerDiv);
    wCreate.appendChild(div);
  })
  rowDiv.appendChild(button);
  form.appendChild(rowDiv);
  div.appendChild(form);

  wCreate.appendChild(div);
}

// 방생성 뷰
document.querySelector('#w_create i').addEventListener('click', cbCreateRoom);

// 소켓 연결
var host = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
var socket = io.connect(host+'/room', { path: '/socket.io' });
var rooms = document.querySelector('#w_rooms');
socket.on('newRoom', function(data) {
  var wRoom = document.createElement('div');
  wRoom.classList.add('w_room');
  var div = document.createElement('div');
  div.textContent = data.title;
  wRoom.appendChild(div);
  div = document.createElement('div');
  div.textContent = data.password ? '비밀방': '공개방';
  wRoom.appendChild(div);
  div = document.createElement('div');
  div.innerHTML += '(';
  // 현재 인원
  var span = document.createElement('span');
  span.classList.add('w_people');
  span.textContent = '1';
  div.appendChild(span);
  div.innerHTML += `/${data.max})`;
  wRoom.appendChild(div);
  wRoom.dataset.password = data.password ? 'true': 'false';
  wRoom.dataset.id = data._id;
  wRoom.addEventListener('click', enterHandler);
  rooms.appendChild(wRoom);
});
socket.on('removeRoom', function(data) {
  var room = document.querySelector(`.w_room[data-id="${data}"]`);
  if(room) {
    room.parentNode.removeChild(room);
  }
});

socket.on('user', function(users) {
  console.log(users);
  wUsers.innerHTML = '';
  users.forEach((user) => {
    const div = document.createElement('div');
    div.textContent = user.nick;
    div.dataset.id = user.socketId;
    wUsers.appendChild(div);
  });
});

socket.on('roomNum', function(data) {
  var room = document.querySelector(`.w_room[data-id="${data.roomId}"]`);
  room.querySelector('.w_people').textContent = data.userCount;
})

function enterHandler(e) {
  if(e.currentTarget.dataset.password === 'true') {
    const password = prompt('비밀번호를 입력하세요');
    location.href = '/room/' + e.currentTarget.dataset.id + '?password=' + password;
  } else {
    location.href = '/room/' + e.currentTarget.dataset.id;
  }
}

[].forEach.call(document.querySelectorAll('.w_room'), function(div) {
  div.addEventListener('click', enterHandler);
});
