var Choices=require("ksana2015-components").choices;
var store=require("./store_tagsets");
var actions=require("./actions_markup");
var Reflux=require("reflux");
var viewID= "markuppanel";
var TagsetTab=React.createClass({
	mixins:[Reflux.listenTo(store,"onTagSet")],
	propTypes:{
	} 
	,onTagSet:function(tagset) {
		this.setState({tagset:tagset});
		this.setVisibility(0,true);
	}
	,getInitialState:function(){
		return {selected:0,tagset:[],displayonoff:false};
	}
	,onSelect:function(n,perv) {
		this.setState({selected:n});
		this.setVisibility(n);
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
		this.updatePosition(this.refs.markupchoice.getDOMNode().children);
	}
	,componentDidMount:function() {
		actions.loadTagsets();
	}
	,onSelectTag:function(n,prev){
		actions.doTag(n);
	}
	,disableRandom:function(tagset) {
		tagset.map(function(tag){
			tag.disabledLabel=Math.random()>0.5;
		});
	}
	,setVisibility:function(selected,norefresh) {
		var tagset=this.getTagset(selected);
		actions.setActiveTagset(this.state.tagset[selected].name,tagset);
		actions.setVisibleTags(tagset.map(function(t){return t.name}),norefresh);
	}
	,getTagset:function(n) {
		var selectedset=this.state.tagset[n];
		return selectedset?selectedset.tagset:[];
	}
	,setDisplay:function(e) {
		this.setState({displayonoff:e.target.checked});
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
			<Choices data={this.state.tagset} onSelect={this.onSelect} type="dropdown"/>
			<label className="pull-right">
				<input type="checkbox" checked={this.state.displayonoff} onChange={this.setDisplay}/>display
			</label>
			<Choices ref="markupchoice" data={this.getTagset(this.state.selected)} 
				onSelect={this.onSelectTag} type={this.state.displayonoff?"checkbox":"button"} 
				checked={true} labelfor={true} linebreak={true} autovpos={true} vposInItem={this.vposInItem}/>
		</div>
	}
});

module.exports=TagsetTab;