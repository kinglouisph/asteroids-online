process.on('uncaughtException', function (exception) {
  console.log('error')
});




//vars
var express = require('express')();
var http = require('http').createServer(express);
var io = require('socket.io')(http);
const pi = Math.PI;
const port = process.env.PORT || 3000;

var pcount = 0;
var bcount = 0;
var acount = 0;

var sockets = {};
var bullets = {};
var asteroids = {};

//functions

////////////////////asteroids single-player library

//this function stolen off google
function isEmpty(myObject) {
  for(var key in myObject) {
    if (myObject.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

function spawnAsteroid(x,y,xspeed,yspeed,angle,aspeed,size) {
  acount += 1;
  asteroids[String(acount)] = {};
  asteroids[String(acount)].x = x;
  asteroids[String(acount)].y = y;
  asteroids[String(acount)].xspeed = xspeed;
  asteroids[String(acount)].yspeed = yspeed;
  asteroids[String(acount)].angle = angle;
  asteroids[String(acount)].aspeed = aspeed;
  asteroids[String(acount)].size = size;
}

spawnAsteroid(Math.floor(Math.random() * 2) * 700 - 700,Math.floor(Math.random() * 2) * 700 - 700,Math.random() * 4 - 2,Math.random() * 4 - 2,Math.floor(Math.random() * 360),Math.random() * 4,3);

function spawnBullet(x,y,xspeed,yspeed,owner) {
  bcount += 1;
  bullets[String(bcount)] = {};
  bullets[String(bcount)].x = x;
  bullets[String(bcount)].y = y;
  bullets[String(bcount)].xspeed = xspeed;
  bullets[String(bcount)].yspeed = yspeed;
}

//distance
function pythag(x,y,x2,y2) {
  return Math.sqrt(Math.abs(x - x2) * Math.abs(x - x2) + Math.abs(y - y2) * Math.abs(y - y2))
}

//degrees to radians
function rads(number) {
  number %= 360;
  return number * (pi/180);
}

////////////////////asteroids single-player library

//          /\
//         /  \
//        /    \
//       /  <|> \
//      /        \
//     /          \
//    /            \
//   /              \
//  /                \
//  \________________/

//socket.io
express.get('/', function(req, res) {
  res.statusCode = 200;
  res.sendFile(__dirname + '/index.html');
});

http.listen(port, function() {
  console.log('Hello World! Port 3000');
});








///////////////////SOCKET CONNECTION
io.on('connection', function(socket) {
  console.log('Socket Connect');
  pcount += 1;
  socket.id = pcount;
  
  socket.emit('sendid', socket.id);
  
  //socket vars
  socket.x = 350;
  socket.y = 350;
  socket.xspeed = 0;
  socket.yspeed = 0;
  socket.angle = 0;
  socket.dead = false;
  
  socket.wpressed = false;
  socket.apressed = false;
  socket.dpressed = false;
  socket.fired = false;
  
  socket.fire = function() {
    if (this.dead === false) {spawnBullet(this.x + 20 * Math.cos(rads(this.angle)),this.y + 20 * Math.sin(rads(this.angle)),this.xspeed + 3 * Math.cos(rads(this.angle)),this.yspeed + 3 * Math.sin(rads(this.angle)),this.id)
  }}
  
  
  
  socket.on('keypressed', function(data) {
    if (data === 'w') {socket.wpressed = true}
    if (data === 'a') {socket.apressed = true}
    if (data === 'd') {socket.dpressed = true}
    if (data === ' ') {if (socket.fired === false) {socket.fire()} socket.fired = true}
  });
  socket.on('keyunpressed', function(data) {
    if (data === 'w') {socket.wpressed = false}
    if (data === 'a') {socket.apressed = false}
    if (data === 'd') {socket.dpressed = false}
    if (data === ' ') {socket.fired = false}
  });
  
  socket.on('disconnect', function() {
    console.log('Socket Disconnect');
    delete sockets[String(socket.id)];
  });
  
  sockets[String(socket.id)] = socket;
});











////////////////////GAMELOOP
setInterval(function() {
  //logic
  for (var i in sockets) {
    if (sockets[i].dead) {continue}
    var socket = sockets[i];
    if (socket.apressed) {socket.angle -= 3}
    if (socket.dpressed) {socket.angle += 3}
    if (socket.wpressed) {socket.xspeed += Math.cos(rads(socket.angle)) / 40; socket.yspeed += Math.sin(rads(socket.angle)) / 40}
  
    socket.x += socket.xspeed;
    socket.y += socket.yspeed;
  
    if (socket.x > 700) {socket.x = 0}
    if (socket.x < 0) {socket.x = 700}
    if (socket.y > 700) {socket.y = 0}
    if (socket.y < 0) {socket.y = 700}
  }
  
  for (var i in bullets) {
    bullets[i].x += bullets[i].xspeed;
    bullets[i].y += bullets[i].yspeed;
    if (bullets[i].x > 700 || bullets[i].x < 0 || bullets[i].y > 700 || bullets[i].y < 0) {delete bullets[i]}
  }
  
  for (var i in asteroids) {
    asteroids[i].angle += asteroids[i].aspeed;
    asteroids[i].x += asteroids[i].xspeed;
    asteroids[i].y += asteroids[i].yspeed;
    
    if (asteroids[i].x >= 725) {asteroids[i].x = 0} else
    if (asteroids[i].x <= -25) {asteroids[i].x = 700}
    if (asteroids[i].y >= 725) {asteroids[i].y = 0} else
    if (asteroids[i].y <= -25) {asteroids[i].y = 700}
    
    
    if (asteroids[i].size === 1) {yeet = 15} else if (asteroids[i].size === 2) {yeet = 25} else {yeet = 50}
    
    for (var ii in bullets) {
      try {
      if (pythag(bullets[ii].x, bullets[ii].y, asteroids[i].x, asteroids[i].y) < yeet) {
        //bullet collision
        delete bullets[ii];
        if (asteroids[i].size !== 1) {
          spawnAsteroid(asteroids[i].x,asteroids[i].y,Math.random() * 4 - 2,Math.random() * 4 - 2,Math.floor(Math.random() * 360),Math.random() * 4,asteroids[i].size - 1);
          spawnAsteroid(asteroids[i].x,asteroids[i].y,Math.random() * 4 - 2,Math.random() * 4 - 2,Math.floor(Math.random() * 360),Math.random() * 4,asteroids[i].size - 1);
          spawnAsteroid(asteroids[i].x,asteroids[i].y,Math.random() * 4 - 2,Math.random() * 4 - 2,Math.floor(Math.random() * 360),Math.random() * 4,asteroids[i].size - 1);
        }
        delete asteroids[i];
      }} catch {console.log('error')}
    }
  }
  
  //player collision
  for (var i in sockets) {
    if (sockets[i].dead) {continue}
    for (var ii in asteroids) {
      var yeet;
      if (asteroids[ii].size === 1) {yeet = 10} else if (asteroids[ii].size === 2) {yeet = 25} else {yeet = 50}
      if (pythag(sockets[i].x + 20 * Math.cos(rads(0 + sockets[i].angle)), sockets[i].y + 20 * Math.sin(rads(0 + sockets[i].angle)),asteroids[ii].x, asteroids[ii].y) < yeet) {sockets[i].dead = true}
      if (pythag(sockets[i].x + 20 * Math.cos(rads(0 + sockets[i].angle)), sockets[i].y + 20 * Math.sin(rads(0 + sockets[i].angle)),asteroids[ii].x, asteroids[ii].y) < yeet) {sockets[i].dead = true}
      if (pythag(sockets[i].x + 20 * Math.cos(rads(0 + sockets[i].angle)), sockets[i].y + 20 * Math.sin(rads(0 + sockets[i].angle)),asteroids[ii].x, asteroids[ii].y) < yeet) {sockets[i].dead = true}
    }
  }
  
  if (isEmpty(asteroids)) {
    spawnAsteroid(Math.floor(Math.random() * 2) * 700 - 700,Math.floor(Math.random() * 2) * 700 - 700,Math.random() * 4 - 2,Math.random() * 4 - 2,Math.floor(Math.random() * 360),Math.random() * 4,3);
    spawnAsteroid(Math.floor(Math.random() * 2) * 700 - 700,Math.floor(Math.random() * 2) * 700 - 700,Math.random() * 4 - 2,Math.random() * 4 - 2,Math.floor(Math.random() * 360),Math.random() * 4,3);
  }
  
  //drawing
  var drawdata = {};
  drawdata.players = {};
  drawdata.bullets = {};
  drawdata.asteroids = {};
  
  for (var i in sockets) {
    if (sockets[i].dead) {continue}
    drawdata.players[String(sockets[i].id)] = {};
    drawdata.players[String(sockets[i].id)].x = sockets[i].x;
    drawdata.players[String(sockets[i].id)].y = sockets[i].y;
    drawdata.players[String(sockets[i].id)].angle = sockets[i].angle;
    drawdata.players[String(sockets[i].id)].id = sockets[i].id;
  }
  
  var count = 0;
  for (var i in bullets) {
    count += 1;
    drawdata.bullets[String(count)] = {};
    drawdata.bullets[String(count)].x = bullets[i].x;
    drawdata.bullets[String(count)].y = bullets[i].y;
  }
  
  for (var i in asteroids) {
    count += 1;
    drawdata.asteroids[String(count)] = {};
    drawdata.asteroids[String(count)].x = asteroids[i].x;
    drawdata.asteroids[String(count)].y = asteroids[i].y;
    drawdata.asteroids[String(count)].angle = asteroids[i].angle;
    drawdata.asteroids[String(count)].size = asteroids[i].size;
  }
  //console.log(drawdata);
  io.emit('drawdata', drawdata);
},10);
