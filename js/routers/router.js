/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Todo Router
	// ----------
	var TodoRouter = Backbone.Router.extend({
		routes: {
			'':'home',
			'room/:id' : 'renderRoom'
		},

		home: function (){
			app.users.fetch({success:function(){
		    if(app.users.length==0)
		      localStorage.clear('user');
		    new app.AppView();
		  }});
		},

		renderRoom: function(id){
			app.users.fetch({success:function(){
				app.rooms.fetch({success:function(){
					var ourRoom = app.rooms.findWhere({id:parseInt(id)});
					//console.log(app.rooms.toJSON());
					//console.log(app.rooms.findWhere({_id:parseInt(id)}).attributes);
					if(ourRoom.attributes.owner!=localStorage.getItem('user')){
						console.log(ourRoom);
						if(ourRoom.attributes.p2=='undefined'||ourRoom.attributes.p2==localStorage.getItem('user')){
							ourRoom.save({p2:localStorage.getItem('user'), components:'2'});
							var Game = new app.RoomGameView({created:false, p:2, room:ourRoom});
						}
						else if(ourRoom.attributes.p3=='undefined'||ourRoom.attributes.p3==localStorage.getItem('user')){
							ourRoom.save({p3:localStorage.getItem('user'), components:'3'});
							var Game = new app.RoomGameView({created:false, p:3, room:ourRoom});
						}
					}
					else{
						var Game = new app.RoomGameView({created:true, room:ourRoom});
					}
				}});
		  }});
		}
	});

	app.TodoRouter = new TodoRouter();
	Backbone.history.start();
})();
