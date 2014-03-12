var app = app || {};

(function ($){
  'user strict';
  /*
    Entramos en una room y esperamos al resto de jugadores
    una vez entren, el servidor manda el mensaje de ready.
    Comienza la cuenta atrás y van a pareciendo la palabra 
    y las letras.
  */
  app.RoomGameView = Backbone.View.extend({
    el: '#wordapp',

    wordTemplate: _.template($('#word').html()),

    events: {
      'keypress #answer' : 'sendAnswer'
    },

    initialize: function (from){
      //Listen collection, and trigger necesary functions
      this.listenTo(app.rooms, 'change:p2', this.addUser2);
      this.listenTo(app.rooms, 'change:p3', this.addUser3);
      this.listenTo(app.rooms, 'destroy', this.goHome);
      this.listenTo(app.users, 'change', this.changeUserInfo);
      this.listenTo(app.words, 'change', this.update);
      this.listenTo(app.words, 'create', this.setWord);

      //Render passing if the room has been created or not
      this.render(from.created);

      //Adding to this some necesary dom objects.
      this.p2 = $('#p2');
      this.p3 = $('#p3');
      this.theword = $('#theword');
      this.room = from.room;

      //Adding users
      if(!from.created){
        this.addOwner(from.room);
        if(from.p==2)
          this.addUser2(from.room);
        else if (from.p==3){
          this.addUser2(from.room);
          this.addUser3(from.room);
        }
      }

      //Joining in a socket room, and if is the third user start the game
      app.socket.emit('joinRoom', from.room);
    },

    // Add owner user
    addOwner: function (room){
      var userInfo = _.template($('#user-info').html());
      var owner = app.users.findWhere({_id: parseInt(room.attributes.owner)});
      if(owner)
        $('#you').html( userInfo( owner.toJSON() ) );
    },

    //Esto renderiza un usuario que se une a la room
    addUser2: function (model){
      console.log(model.attributes);
      var oponentInfo = _.template($('#user-info').html());
      var p2 = app.users.findWhere({_id: parseInt(model.attributes.p2)});
      if(p2)
        this.p2.html( oponentInfo( p2.toJSON() ) );
    },

    addUser3: function (model){
      console.log(model.attributes);
      var oponentInfo = _.template($('#user-info').html());
      var p3 = app.users.findWhere({_id: parseInt(model.attributes.p3)});
      console.log(this.p2);
      if(p3)
        this.p3.html( oponentInfo( p3.toJSON() ) );
    },

    //If the game start, the word is setted
    setWord: function(model){
      this.wordID = model.id;
      var word = '';
      for (var i = 0; i < model.answer.length; i++) {
        word += model.answer[i];
      };
      this.theword.html( '<h1>'+word+'</h1>' );

      var self = this;

      app.socket.on('finish', function (data){
        if(data.state){
          self.stopListening(app.words, 'change');
          console.log(data);
          var winner = app.users.findWhere({_id: parseInt(data.id)});
          self.theword.html( '<h1 style="font-size:1em;"> Completado!! ha ganado el usuario <strong>'+winner.attributes.name+'</strong> </h1><a href="/">Go Back!!</a>' );
          self.changeUserInfo();
          app.socket.emit('leave', {id:self.room.id});
        }
      });
    },

    //Update the word every 4 seconds
    update: function(model){
      console.log(model);
      var word = '';
      for (var i = 0; i < model.attributes.answer.length; i++) {
        word += model.attributes.answer[i];
      };
      this.theword.html( '<h1>'+word+'</h1>' );
    },

    //Render gameplay
    render: function(created){
      this.$el.html( this.wordTemplate({answer:'Espere...'}) );
      if(created){
        var userInfo = _.template($('#user-info').html());
        var owner = app.users.findWhere({_id: parseInt(localStorage.getItem('user'))});
        if(owner)
          $('#you').html( userInfo( owner.toJSON() ) );
      }
      return this;
    },

    //Send the answer.
    sendAnswer: function(e){
      if(e.keyCode==ENTER_KEY){
        app.socket.emit('try', {user:parseInt(localStorage.getItem('user')), room:this.room, answer:e.target.value, word:this.wordID});

      }
    },

    //This not work correctly
    changeUserInfo: function (argument) {
      this.addOwner(this.room);
      this.addUser2(this.room);
      this.addUser3(this.room);
    },

    //If game finish, go home.
    goHome: function (){
      setTimeout(function(){
        app.TodoRouter.navigate('/', {trigger:true});
      }, 5000);
    }
  });
})(jQuery);