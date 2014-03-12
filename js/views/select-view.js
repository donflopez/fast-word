/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	// The Application
	// ---------------

	// Our overall **AppView** is the top-level piece of UI.
	app.RoomSelectView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.

		// Our template for the line of statistics at the bottom of the app.
		selectTemplate: _.template($('#room-select').html()),

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			'keypress #new-todo': 'createOnEnter',
			'click #clear-completed': 'clearCompleted',
			'click #toggle-all': 'toggleAllComplete'
		},

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.
		initialize: function () {

		},

		// Re-rendering the App just means refreshing the statistics -- the rest
		// of the app doesn't change.
		render: function () {
			this.$el.html( this.selectTemplate(this.model.toJSON()) );
			return this;
		},

		// Add a single todo item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function (room) {
			var view = new app.TodoView({ model: todo });
			this.$el.append(view.render().el);
		},

		// Add all items in the **Todos** collection at once.
		addAll: function () {
			this.render();
			app.todos.each(this.addOne, this);
		}
	});

	app.AddRoomView = Backbone.View.extend({
		addTemplate: _.template($('#add-room').html()),

		events: {
			'keypress #name': 'createRoom'
		},

		initialize: function(){
			this.render();
		},

		render: function(){
			this.$el.html( this.addTemplate() );
			return this;
		},

		createRoom: function(data){
			if(data.keyCode==ENTER_KEY){
				console.log(data.currentTarget.value);
				var room = new app.Room({title:data.currentTarget.value, owner: localStorage.getItem('user')});
				room.save();
			}
		}
	});

	app.CreateUserView = Backbone.View.extend({
		id: 'addUser',

		addTemplate: _.template($('#add-user').html()),

		events: {
			'keypress #username': 'createUser'
		},

		initialize: function(){
			this.render();
		},

		render: function(){
			this.$el.html( this.addTemplate() );
			return this;
		},

		createUser: function(data){
			if(data.keyCode==ENTER_KEY){
				app.user=data.currentTarget.value;
				var user = new app.User({name:data.currentTarget.value});
				user.save();
			}
		}
	});


	//To-Do: This view can be user for load are users info
	//passing user id at instantiate;
	app.UserInfoView = Backbone.View.extend({

		addTemplate: _.template($('#user-info').html()),

		//Here, pasing an user id we can use this to render all user.
		//and observe user model for real time changes.
		initialize: function(){
			//this.render();
		},

		render: function(){
			var user = app.users.findWhere({_id: parseInt(localStorage.getItem('user')) });
			console.log(user);
			if(user){
				this.$el.html( this.addTemplate( user.toJSON() ) );
				$('#addUser').remove();
			}
			else
				console.log('There is a problem!!');
			return this;
		}
	});
})(jQuery);