/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	// The Application
	// ---------------

	app.AppView = Backbone.View.extend({

		el: '#wordapp',

		homeTemplate: _.template($('#home-screen').html()),


		//Initialize main view.
		initialize: function () {

			this.listenTo(app.rooms, 'add', this.addOne);
			this.listenTo(app.users, 'add', this.pair);
			//this.listenTo(app.rooms, 'reset', this.addAll);
			
			app.rooms.fetch();

			this.render();

			if(!app.user&&!localStorage.getItem('user'))
				this.renderCreateUser();

			if(!app.rooms.length&&localStorage.getItem('user'))
				this.renderCreateRoom();
		},

		render: function () {
			this.$el.html( this.homeTemplate() );
			return this;
		},

		//Add a single room.
		addOne: function (room) {
			console.log(room.attributes);
			if(room.attributes.owner==localStorage.getItem('user')){
				//If the user have an open room, go to this.
				this.stopListening(app.rooms, 'add');
				app.TodoRouter.navigate('/room/'+room.attributes._id, {trigger:true});
			}
			else{
				//Render the room.
				var view = new app.RoomSelectView({model:room});
				this.$el.append(view.render().el);
			}
		},

		// Add all rooms in rooms collection.
		addAll: function () {
			this.render();
			app.rooms.each(this.addOne, this);
		},

		renderCreateRoom: function(){
			var view = new app.AddRoomView();
			this.$el.append( view.render().el );
		},

		renderCreateUser: function(){
			var view = new app.CreateUserView();
			this.$el.append( view.render().el );
		},

		//Pairing the user with the localStorage user id
		pair: function(user){
			console.log(app.user);
			if(app.user){
				if(app.user==user.attributes.name){
					localStorage.setItem('user', user.attributes._id);
					app.user=user.attributes._id;
					this.renderUserInfo();
					this.renderCreateRoom();
				}
			}
			else{
				if(localStorage.getItem('user')){
					app.user=localStorage.getItem('user');
					this.renderUserInfo();
				}
			}
		},

		renderUserInfo: function(){
			var view = new app.UserInfoView();
			this.$el.append( view.render().el );
		}
	});
})(jQuery);
