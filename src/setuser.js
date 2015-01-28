var Reflux=require("reflux");
var store=require("./store_userinfo");
var actions=require("./actions_system");
var SetUser=React.createClass({
	mixins:[Reflux.listenTo(store,"onUser")]
	,getInitialState:function() {
		return {username:"",email:""};
	}
	,onUser:function(userinfo) {
		this.setState({username:userinfo.name,email:userinfo.email});
	}
	,userchange:function(e) {
		var username=e.target.value;
		this.setState({username:e.target.value});
		if (this.timer) clearTimeout(this.timer);
		this.timer=setTimeout(function(){
			actions.setUserName(username);
		},1000);
	},
	render:function() {

		return  <div className="input-group">
				<span className="input-group-addon">Username</span>
				<input value={this.state.username} onChange={this.userchange} type="text" className="form-control larger-input"></input>
		</div>
		return <div>Username:<input /></div>
	}
});
module.exports=SetUser;