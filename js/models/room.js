/*global Backbone */
var app = app || {};

(function () {
  'use strict';

  //Cambiad esta url a la url donde se ejecute el server
  //para poder jugar desde diferentes pcs
  app.socket = io.connect('http://localhost:8081');
  // Todo Model
  // ----------
  app.User = Backbone.Model.extend({
    urlRoot:'user',
    noIoBind:false,
    socket:app.socket,

    //Hay algunas cosas raras en los modelos porque seed
    //no tiene documentación y me da errores con los undefined
    //los numbers y otros.
    defaults: {
      //name: 'User'+Math.random(),
      name: 'User',
      playing:false,
      roomGame:'undefined',
      points:'0',
      gamesPlayed:'0',
      online:false,
    },

    initialize: function(){
      _.bindAll(this, 'serverChange', 'serverDelete', 'modelCleanup');
      this.ioBind('update', app.socket, this.serverChange, this);
      this.ioBind('delete', app.socket, this.serverDelete, this);
    },

    serverChange: function (data){
      console.log('Cambia'+data);
      data.fromServer = true;
      this.set(data);
    },

    serverDelete: function (data) {
      if (this.collection) {
        this.collection.remove(this);
      } else {
        this.trigger('remove', this);
      }
      this.modelCleanup();
    },

    modelCleanup: function () {
      this.ioUnbindAll();
      return this;
    },
  });
  // Our basic **Todo** model has `title`, `order`, and `completed` attributes.
  app.Room = Backbone.Model.extend({

    //Socket configuration
    urlRoot:'room', //Socket name in server
    noIoBind:false,
    socket:app.socket, //io instance


    defaults: {
      title: 'Room',
      components: '1',
      owner: '',
      p2: 'undefined',
      p3: 'undefined',
      p4: 'undefined',
    },

    initialize: function () {
      _.bindAll(this, 'serverChange', 'serverDelete', 'modelCleanup');

      if (!this.noIoBind) {
        this.ioBind('update', this.serverChange, this);
        this.ioBind('delete', this.serverDelete, this);
      }
    },

    serverChange: function (data){
      console.log('server change');
      data.fromServer = true;
      this.set(data);
    },

    serverDelete: function (data) {
      if (this.collection) {
        this.collection.remove(this);
      } else {
        this.trigger('remove', this);
      }
      this.modelCleanup();
    },

    modelCleanup: function () {
      this.ioUnbindAll();
      return this;
    },

    // join to a room
    join: function () {
      this.save({
        components: this.get('components')+1
      });
    }
  });
})();