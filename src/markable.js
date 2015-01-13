/*
	when text is updated, send position of all tokens to store
*/

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
	updatePosition:function(){
		var children=this.getDOMNode().children[0].children;
		var out={};
		for (var i=0;i<children.length;i++) {
			var rect=children[i].getBoundingClientRect();
			var vpos=children[i].attributes.vpos;
			if (vpos){
				out[parseInt(vpos.value)]=[rect.left,rect.top,rect.right,rect.bottom];	
			}
		}
		actions.tokenPositionUpdated( out, this.props.viewid);
	},
	componentWillReceiveProps:function(nextProps) {
		if (nextProps.text!=this.props.text) this.setState({ready:false});
	},
	componentDidUpdate:function(){
		if (!this.state.ready) this.updatePosition();
	},
	render:function() {
		return <div>
				<div dangerouslySetInnerHTML={{__html:this.props.text}}/>
			</div>
	}
});

module.exports=Markuptable;