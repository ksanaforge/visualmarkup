//var kde=require("ksana-jsonrom");
var Kse=require("ksana-search");
var maincomponent = React.createClass({
	getInitialState:function() {
		return {data:""}
	},
	componentDidMount:function() {
		Kse.search("cbeta","菩提",{range:{start:0}},function(err,data){
			if (!err){
				this.setState({data:data.excerpt});
			}
			//that.setState({data:"ok"});
		},this);
	},
	render: function() {
		return <div>Hello {this.state.data}</div>;
	}
});
module.exports=maincomponent;