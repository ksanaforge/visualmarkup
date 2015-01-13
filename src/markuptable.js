var Reflux=require("reflux");
var actions=require("./actions_markup");
var store=require("./store_markup");
var Markuplayer=require("./markuplayer");

var Markuptable=React.createClass({
	getInitialState:function() {
		return {ready:false};
	},
	propTypes:{
		text:React.PropTypes.string.isRequired
		,viewid:React.PropTypes.number.isRequired
	},
	renderMarkups:function(){
		var that=this;
		console.log("calculate token positions");
		actions.tokenPositionUpdated( [], this.props.viewid);
	},
	componentWillReceiveProps:function(nextProps) {
		if (nextProps.text!=this.props.text) this.setState({ready:false});
	},
	componentDidUpdate:function(){
		if (!this.state.ready) this.renderMarkups();
	},
	render:function() {
		return <div>
				<div dangerouslySetInnerHTML={{__html:this.props.text}}/>
			</div>
	}
});

module.exports=Markuptable;