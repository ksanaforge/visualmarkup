var Reflux=require("reflux");
var store=require("./stores").dsl;
var actions=require("./actions");
 
module.exports=React.createClass({
	mixins:[Reflux.listenTo(store,"lecturetext")],
	getInitialState:function() {
		return {text:"",db:null};
	},
	lecturetext:function(text,db){
		if (text) this.setState({text:text});
		if (this.state.db!=db) this.setState({db:db});
	}, 
	render:function() {
		return <div className="lecturetext">{this.state.text}</div>
	}
})