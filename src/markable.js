/*
	handle multiple selection
	hover for some time on char with markup , show a button 
*/

var Reflux=require("reflux");
var actions=require("./actions_markup");
var store=require("./store_markup");
var store_selection=require("./store_selection");
var Markuplayer=require("./markuplayer");
var textselection=require("./textselection");
var Markuptable=React.createClass({
	mixins:[Reflux.listenTo(store_selection,"onSelection")]
	,getInitialState:function() {
		return {ready:false,scrolling:false,selections:[]};
	}
	,onSelection:function(selections,viewid) {
		var sels=selections[viewid];
		if (viewid!=this.props.viewid || //not my business
		  JSON.stringify(sels)==JSON.stringify(this.state.selections)) return ; //nothing to update	
		this.setState({selections:sels});
	}
	,propTypes:{
		text:React.PropTypes.array.isRequired
		,viewid:React.PropTypes.string.isRequired
	}
	,onScrollStart:function() {

	}
	,onScrollEnd:function() {
		this.updatePosition();
	}	
	,updatePosition:function(){
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
	}
	,componentWillReceiveProps:function(nextProps) {
		if (nextProps.text!=this.props.text) this.setState({ready:false});
	}
	,componentDidUpdate:function(){
		if (!this.state.ready) this.updatePosition();
	}
	,componentDidMount:function() {
		actions.registerViewid(this.props.viewid);
	}
	,mouseUp:function(e) {
      var sel=textselection();  
      var selections=this.state.selections;
      var oldlength=selections.length;
      if (!sel)return;

      actions.addSelection(this.props.viewid, selections, sel.start,sel.len , e.ctrlKey );
	}
	,mouseOut:function() {

	}
	,mouseMove:function() {

	}
	,inSelection:function(idx) {
		for (var i=0;i<this.state.selections.length;i++) {
			var sel=this.state.selections[i];
			if (idx>=sel[0] && idx<sel[0]+sel[1]) return true;
		}
		return false;
	}
	,renderChar:function(item,idx){
		var cls="";
		if (this.inSelection(item[1])) cls="selected";
		return <span className={cls} key={"c"+idx} data-n={item[1]}>{item[0]}</span>
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