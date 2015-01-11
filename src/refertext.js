var Reflux=require("reflux");
var store=require("./stores").ds;
var actions=require("./actions");

module.exports=React.createClass({
	mixins:[Reflux.listenTo(store,"sutratext")],
	getInitialState:function() {
		return {text:"",db:null};
	},
	sutratext:function(text,db){
		if (text) this.setState({text:text});
		if (this.state.db!=db) this.setState({db:db});
	}, 
	render:function() {
		return <div className="sutratext">{this.state.text}</div>
	}
})