/*
	handle multiple selection
	hover for some time on char with markup , show a button 
*/

var Reflux=require("reflux");
var actions=require("./actions_markup");
var actions_selection=require("./actions_selection");
var store=require("./store_markup");
var store_selection=require("./store_selection");
var store_highlight=require("./store_highlight");
var Markuplayer=require("./markuplayer");
var textselection=require("./textselection");
var Markuptable=React.createClass({
	mixins:[Reflux.listenTo(store_selection,"onSelection"),
	        Reflux.listenTo(store_highlight,"onHighlight")]
	,getInitialState:function() {
		return {ready:false,scrolling:false,selections:[],highlights:[]};
	}
	,onSelection:function(selections,viewid) {
		var sels=selections[viewid];
		if (viewid!=this.props.viewid || //not my business
		  JSON.stringify(sels)==JSON.stringify(this.state.selections)) return ; //nothing to update	
		this.setState({selections:sels});
	}
	,onHighlight:function(highlights,viewid) {
		var hls=highlights[viewid]||[];
		if (viewid!=this.props.viewid || //not my business
		  JSON.stringify(hls)==JSON.stringify(this.state.highlights)) return ; //nothing to update	
		this.setState({highlights:hls});
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
		if (nextProps.text!=this.props.text) {
			actions.tokenPositionUpdated({}, this.props.viewid);//clear all markups
			this.setState({ready:false});
		} 
	}
	,componentWillUpdate:function() {
		this.editing=store.getEditing(this.props.viewid);
	}
	,componentDidUpdate:function(){
		if (!this.state.ready) {
			setTimeout(this.updatePosition,300);//browser need sometime to layout
		}
	}
	,componentDidMount:function() {
		actions.registerViewid(this.props.viewid);
	}
	,mouseUp:function(e) {
      var sel=textselection();  
      var selections=this.state.selections;
      var oldlength=selections.length;
      if (!sel)return;

      actions.cancelEdit();
      actions_selection.addSelection(this.props.viewid, selections, sel.start,sel.len , e.ctrlKey );
	}
	,mouseOut:function() {

	}
	,mouseMove:function() {

	}
	,inSelected:function(idx) {
		for (var i=0;i<this.state.selections.length;i++) {
			var sel=this.state.selections[i];
			if (idx>=sel[0] && idx<sel[0]+sel[1]) return true;
		}
		return false;
	}
	,highlighedStyle:function(idx) {
		for (var i=0;i<this.state.highlights.length;i++) {
			var hl=this.state.highlights[i];
			if (idx>=hl[0] && idx<hl[0]+hl[1]) {
				if (this.editing && this.editing[0]==hl[0] && this.editing[1]==hl[1]) {
					return "editing";
				} else {
					return "highlighted";	
				}
			}
		}
		return "";
	}
	,renderChar:function(item,idx){
		var cls="";
		if (this.inSelected(item[1])) cls="selected";
		cls+=this.highlighedStyle(item[1]);
		
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