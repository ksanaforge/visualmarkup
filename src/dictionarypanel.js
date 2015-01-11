var Reflux=require("reflux");
var store=require("./stores").dictionary;
module.exports=React.createClass({
	mixins:[Reflux.listenTo(store,"onData")],
	getInitialState:function() {
		return {data:[]}
	},
	onData:function(data,db){
		this.setState({db:db,data:data});
	},
	renderItem:function(item) {
		return <li>{item}</li>
	},
	render:function(){
		return <div className="dictview"><ul>{this.state.data.map(this.renderItem)}</ul></div>
	}
});