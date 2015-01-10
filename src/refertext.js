var Reflux=require("reflux");
var store=require("./stores").ds;
var actions=require("./actions");

module.exports=React.createClass({
	mixins:[Reflux.listenTo(store,"dbOpened")],
	dbOpened:function(db){
		this.setState({db:db});
		console.log("ds opened");
	},
	render:function() {
		return <div>金剛經</div>
	}
})