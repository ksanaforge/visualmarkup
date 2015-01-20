var Reflux=require("reflux");
var store=require("./store_text").dictionary;
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
		return <div className="dictionarypanel panel panel-success">
				<div className="panel-heading text-center">教育部國語辭典</div>
				<div className="panel-body dictionarytext">
				<ul>{this.state.data.map(this.renderItem)}</ul>
				</div>
		</div>
	}
});