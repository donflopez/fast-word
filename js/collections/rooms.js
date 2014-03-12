/*global Backbone */
var app = app || {};

(function () {
  'use strict';
  // Todo Collection
  // ---------------

  // The collection of todos is backed by *localStorage* instead of a remote
  // server.
    var Users = Backbone.Collection.extend({
    
    model: app.User,
    url: 'users',
    socket:app.socket,

    initialize: function () {

      _.bindAll(this, 'serverCreate', 'collectionCleanup');
      this.ioBind('create', this.serverCreate, this);
    },

    serverCreate: function (data) {
      console.log(data);

      // make sure no duplicates, just in case
      var exists = this.get(data._id);
      if (!exists) {
        this.add(data);
      } else {
        data.fromServer = true;
        exists.set(data);
      }
    },

    collectionCleanup: function (callback) {
      this.ioUnbindAll();
      this.each(function (model) {
        model.modelCleanup();
      });
      return this;
    }
  });

  // Create our global collection of **Todos**.
  app.users = new Users();



  var Rooms = Backbone.Collection.extend({
    
    model: app.Room,
    url: 'rooms',
    socket:app.socket,

    initialize: function () {
      _.bindAll(this, 'serverCreate', 'collectionCleanup');
      this.ioBind('create', this.serverCreate, this);
    },

    serverCreate: function (data) {
      console.log('Server created');
      // make sure no duplicates, just in case
      var exists = this.get(data.id);
      if (!exists) {
        this.add(data);
      } else {
        data.fromServer = true;
        exists.set(data);
      }
    },

    collectionCleanup: function (callback) {
      this.ioUnbindAll();
      this.each(function (model) {
        model.modelCleanup();
      });
      return this;
    }
  });

  // Create our global collection of **Todos**.
  app.rooms = new Rooms();
})();