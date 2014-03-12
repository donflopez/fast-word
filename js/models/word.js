/*global Backbone */
var app = app || {};

(function () {
  'use strict';
  // Todo Model
  // ----------

  // Our basic **Todo** model has `title`, `order`, and `completed` attributes.
  app.Word = Backbone.Model.extend({
    // Default attributes for the todo
    // and ensure that each todo created has `title` and `completed` keys.
    urlRoot:'word',
    noIoBind:false,
    socket:app.socket,

    defaults: {
      word:'The Words Game!',
      length:0,
      answer: [],
      used: true
    },

    initialize: function () {
      _.bindAll(this, 'serverChange', 'serverDelete', 'modelCleanup');
      
      /*!
       * if we are creating a new model to push to the server we don't want
       * to iobind as we only bind new models from the server. This is because
       * the server assigns the id.
       */
      if (!this.noIoBind) {
        this.ioBind('update', this.serverChange, this);
        this.ioBind('delete', this.serverDelete, this);
      }
    },
    serverChange: function (data) {
      console.log('Updated model');
      // Useful to prevent loops when dealing with client-side updates (ie: forms).
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
    }
  });
})();
