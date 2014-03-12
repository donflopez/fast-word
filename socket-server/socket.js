var io = require('socket.io').listen(8081)
  , Seed = require('seed');

//Seed in memory db
//No tiene documentación, por lo que me ha costado horrores
//y todavía hay cosas que no funcionan
// No la volveré a usar.
var Mem = {};

Mem.User = Seed.Model.extend('user', {
  schema: new Seed.Schema({
    id:Number,
    name: String,
    playing:Boolean,
    roomGame:String,
    points:String,
    gamesPlayed:String,
    online:Boolean
  })
});

Mem.Room = Seed.Model.extend('room', {
  schema: new Seed.Schema({
    id:Number,
    title:String,
    components: String,
    owner: String,
    p2: String,
    p3: String,
    p4: String
  })
});

Mem.Users = Seed.Graph.extend({
  initialize: function () {
    this.define(Mem.User);
  }
});

Mem.Rooms = Seed.Graph.extend({
  initialize: function () {
    this.define(Mem.Room);
  }
});

var db = {user:new Mem.Users(), room: new Mem.Rooms()}
  , guid = new Seed.ObjectId()
  , ruid = new Seed.ObjectId();


//###############
//    WORDS
//###############

var Words = [
  {
    word:'Aluana',
    id:guid.gen()
  },

  {
    word:'Semantica',
    id:guid.gen()
  },

  {
    word:'MongoDB',
    id:guid.gen()
  },

  {
    word:'Backbone',
    id:guid.gen()
  },

  {
    word:'Ruby',
    id:guid.gen()
  }
];

console.log('Starting words...');

for (var i = Words.length - 1; i >= 0; i--) {
  Words[i].answer = [];
  for (var j = Words[i].word.length - 1; j >= 0; j--) {
    Words[i].answer[j] = '_';
  };
};

console.log(Words);

function getWord(){
  //Random word
  var rand = Math.floor(Math.random()*5);
  return Words[rand];
}

function getChar(word){
  var rand = Math.floor(Math.random()*word.word.length);

  while(true){
    if(word.answer[rand]==='_'){
      return rand;
    }
    else
      rand = Math.floor(Math.random()*word.word.length);
  }
}


//Socket.io logic
//Sincronización de colecciones y modelos.
io.sockets.on('connection', function(socket) {

  socket.on('room:create', function(data, callback){
    console.log(data);
    var id = ruid.gen();
    data.id = id;
    var rom = db.room.set('room', id, data)
      , json = rom._attributes;
      console.log(rom._attributes);
      console.log(json);
    socket.emit('rooms:create', json);
    socket.broadcast.emit('rooms:create', json);
  });

  socket.on('rooms:read', function (data, callback){
    var list = [];
    db.room.each('room', function (room){
      console.log(room);
      list.push(room._attributes);
    });

    callback(null, list);
  });

  socket.on('room:update', function (data, callback){
    console.log('entra');
    var room = db.room.get('room', data.id);
    console.log('########## Obtenemos Room ##########');
    console.log(room);
    room.merge(data);

    var json = room._attributes;

    socket.emit('room/'+ data.id + ':update', json);
    socket.broadcast.emit('room/'+ data.id + ':update', json);
    callback(null, json);
  });

  socket.on('user:create', function(data){
    var user = db.user.get('user', data._id);
    console.log(data);
    if(!user){
      var id = guid.gen()
        , user = db.user.set('user', id, data)
        , json = user._attributes;
        console.log(json);
      socket.emit('users:create', json);
      socket.broadcast.emit('users:create', json);
    }
  });

  socket.on('users:read', function (data, callback){
    var list = [];
    console.log('This is called!');
    db.user.each('user', function (user){
      console.log(user);
      list.push(user._attributes);
    });

    callback(null, list);
  });

  socket.on('words:read', function (data, callback){
    var aWord = getWord();
        rWord = Object.create(aWord);

    rWord.word='No te lo digo!!';

    callback(null, aWord);
  });

  //Joining in a room
  socket.on('joinRoom', function (data){

    //Room subscribing
    socket.join(data.id);

    //If room completed, send the word and start the countdown.
    if(data.components=='3'){

      //Getting the word, To-Do: Clone object!
      var userWord = getWord();
      io.sockets.in(data.id).emit('words:create', userWord);

      var counter = 0;
      var intId = setInterval(function () {
        if(counter<userWord.word.length){
          var ch = getChar(userWord);
          userWord.answer[ch] = userWord.word.substr(ch, 1);
          io.sockets.in(data.id).emit('word/'+userWord.id+':update', {answer:userWord.answer});
          counter++;
        }
        else{
          //Stopping the counter if not solved
          clearInterval(intId);
          counter = 0;

          //This can be deleted if getWord clone the object.
          //bug with more than one room with the same word.
          for (var i =  userWord.word.length - 1; i >= 0; i--) {
            userWord.answer[i] = '_';
          }

          userWord = undefined;
          socket.leave(data.id);

          json = db.room.get('room', data.id)._attributes;

          db.room.del('room', data.id);

          socket.emit('room/'+ data.id + ':delete', json);
          socket.broadcast.emit('room/'+ data.id + ':delete', json);
        }
      }, 4000);
    }

    //Data have user
    //Room
    //Answer
    socket.on('try', function (data, callback){
      console.log('##############################');
      console.log('############ Data ############');
      console.log('##############################');
      console.log(data);
      console.log(userWord);

      //Getting userword if not present (concurrency)
      if(!userWord)
        userWord = Words.filter(function (element){
          if(element.id == data.word)
            return element;
        })[0];

      //Evaluating the answer
      if(userWord)
        if(userWord.word.toLowerCase()==data.answer.toLowerCase()){

          //Stopping interval
          clearInterval(intId);
          console.log('finished');

          //Setting user points updates
          var user = db.user.get('user', data.user);
          var points = userWord.word.length - counter + parseInt(user._attributes.points);
          user.merge({points:''+points});
          var json = user._attributes;

          //Sending winner updates
          socket.emit('user/'+ data.user + ':update', json);
          socket.broadcast.emit('user/'+ data.user + ':update', json);
          io.sockets.in(data.room.id).emit('finish', {id: json._id, state:true});
          //Leaving the room

          json = db.room.get('room', data.room.id)._attributes;

          db.room.del('room', data.room.id);

          socket.emit('room/'+ data.room.id + ':delete', json);
          socket.broadcast.emit('room/'+ data.room.id + ':delete', json);
          userWord=undefined;
        }
        else{

          //Sending false finish
          io.sockets.in(data.room.id).emit('finish', {id: userWord.id, state:false});
        }
    });

    socket.on('leave', function (data){
      console.log('Leaving');
      socket.leave(''+data.id);
    });
  });
});