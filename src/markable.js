/*
	handle multiple selection
	hover for some time on char with markup , show a button 
*/

var Reflux=require("reflux");
var actions=require("./actions_markup");
var store=require("./store_markup");
var Markuplayer=require("./markuplayer");
var textselection=require("./textselection");
var Markuptable=React.createClass({
	getInitialState:function() {
		return {ready:false,scrolling:false};
	},
	propTypes:{
		text:React.PropTypes.array.isRequired
		,viewid:React.PropTypes.number.isRequired
	},
	onScrollStart:function() {

	},
	onScrollEnd:function() {
		this.updatePosition();
	},
	selection:[],
	updatePosition:function(){
		var children=this.getDOMNode().children[0].children;
		var out={};
		for (var i=0;i<children.length;i++) {
			var rect=children[i].getBoundingClientRect();
			var vpos=children[i].dataset.n;
			if (vpos){
				out[parseInt(vpos)]=[rect.left,rect.top,rect.right,rect.bottom];	
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
	mouseUp:function(e) {
      var sel=textselection();  
      if (!sel) return;
      if (e.ctrlKey && sel) {
      	this.selection.push([sel.start,sel.len]);
      } else {
      	this.selection=[[sel.start,sel.len]];
      }
      actions.setSelection({selection:this.selection , viewid:this.props.viewid});
      console.log(this.selection)
	},
	mouseOut:function() {

	},
	mouseMove:function() {

	},
	renderChar:function(item,idx){
		return <span key={"c"+idx} data-n={item[1]}>{item[0]}</span>
	},
	render:function() {
		return <div>
				<div 
				    onMouseUp={this.mouseUp}
			        onMouseOut={this.mouseOut}
          			onMouseMove={this.mouseMove}
          		>
          		{this.props.text.map(this.renderChar)}
          		</div>
			</div>
	}
});

module.exports=Markuptable;