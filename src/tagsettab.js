var Choices=require("ksana2015-components").choices;
var store=require("./store_tagsets");
var store_tagset=require("./store_tagset");
var actions=require("./actions_markup");
var Reflux=require("reflux");
var MarkupNav=require("./markupnav");
var viewID= "markuppanel";
var TagsetTab=React.createClass({
	mixins:[Reflux.listenTo(store,"onTagSets"), Reflux.listenTo(store_tagset,"onTagsetStatus")],
	propTypes:{
	} 
	,onTagSets:function(tagsets) {
		this.setState({tagsets:tagsets});
		this.setVisibility(this.state.selected,true);
	}
	,onTagsetStatus:function(activetagset) {//enabling buttons
		this.setState({updatepos:false});
	}
	,getInitialState:function(){
		return {selected:3,tagsets:[],displayonoff:false,updatepos:true};
	}
	,onSelect:function(n,perv) {
		this.setState({selected:n,updatepos:false});
		if (n!=this.state.selected) {
			this.setVisibility(n);
			this.setState({updatepos:true});
		}
	}
	,updatePosition:function(children) {
		var out={};
		for (var i=0;i<children.length;i++) {
			var spans=children[i].getElementsByTagName("span");
			for (var j=0;j<spans.length;j++) {
				var rect=spans[j].getBoundingClientRect();
				var vpos=spans[j].dataset.vpos;
				if (vpos){
					out[parseInt(vpos)]=[rect.left,rect.top,rect.right,rect.bottom];	
				}
			}
		}
		actions.tokenPositionUpdated( out,viewID);
	}
	,componentDidUpdate:function() {
		if (this.state.updatepos) this.updatePosition(this.refs.markupchoice.getDOMNode().children);
	}
	,componentDidMount:function() {
		actions.loadTagsets();
	}
	,onSelectTag:function(n,prev){
		actions.doTag(n);
	}
	,setVisibility:function(selected,norefresh) {
		var tagset=this.getTagset(selected);
		actions.setActiveTagset(this.state.tagsets[selected].name,tagset);
		actions.setVisibleTags(tagset.map(function(t){return t.name}),norefresh);
	}
	,getTagset:function(n) {
		var selectedset=this.state.tagsets[n];
		return selectedset?selectedset.tagset:[];
	}
	,setDisplay:function(e) {
		this.setState({displayonoff:e.target.checked,updatepos:true});
	}
	,convertToMarkup:function(arr) {
		return arr.map(function(item){
			var payload={tag:item[2]};
			if (item[3]) payload.shadow=true;
			return [item[0],item[1],payload];
		});
	}
	,vposInItem:function(arr) {
		var markups=this.convertToMarkup(arr);
		actions.setVirtualMarkup(markups,viewID);
	}
	,render:function() {
		return <div className="tagsetpanel">
			<Choices data={this.state.tagsets} selected={this.state.selected}
			          onSelect={this.onSelect} type="radio" labelfor={true}/>
			<label className="pull-right">
				<input type="checkbox" checked={this.state.displayonoff} onChange={this.setDisplay}/>display
			</label>
			<Choices ref="markupchoice" data={this.getTagset(this.state.selected)} 
				onSelect={this.onSelectTag} type={this.state.displayonoff?"checkbox":"button"} 
				hotkey={true} checked={true} labelfor={true} linebreak={true} autovpos={true} vposInItem={this.vposInItem}/>
			<div className="pull-right"><MarkupNav/></div>
		</div>
	}
});

module.exports=TagsetTab;