var Reflux=require("reflux");
var actions=require("./actions_system");
var store_userinfo=Reflux.createStore({
	listenables: [actions],
	init:function() {
		try {
			this.user=JSON.parse(localStorage.getItem("user"));
			if (!this.user || typeof this.user!="object") ;
		} catch (e) {
			this.user=null;
		} finally {
			if (!this.user) this.user={name:"yap",email:"yapcheahshen@gmail.com"}
		}
		var that=this;
		setTimeout(function(){
			that.trigger(that.user);	
		},500);
		
	},
	onSetUserName:function(username) {
		this.user.name=username;
		localStorage.setItem("user",JSON.stringify(this.user));
		this.trigger(this.user);
	},
	getUserName:function() {
		return this.user.name;
	}
});

module.exports=store_userinfo;