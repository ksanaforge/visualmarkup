var Choices=require("ksana2015-components").choices;
var store=require("./store_tagset");
var actions=require("./actions_markup");
var Reflux=require("reflux");
var TagsetTab=React.createClass({
	mixins:[Reflux.listenTo(store,"onTagSet")],
	propTypes:{
	} 
	,onTagSet:function(tagset) {
		this.setState({tagset:tagset});
		this.setVisibility(0,true);
	}
	,getInitialState:function(){
		return {selected:0,tagset:[]};
	}
	,onSelect:function(n,perv) {
		this.setState({selected:n});
		this.setVisibility(n);
	}
	,componentDidMount:function() {
		actions.loadTagsets();
	}
	,onSelectTag:function(n,prev){
		console.log(n,prev)
	}
	,disableRandom:function(tagset) {
		tagset.map(function(tag){
			tag.disabledLabel=Math.random()>0.5;
		});
	}
	,setVisibility:function(selected,norefresh) {
		var tagset=this.getTagset(selected);
		actions.setTagsetName(this.state.tagset[selected].name);
		actions.setVisibleTags(tagset.map(function(t){return t.name}),norefresh);
	}
	,getTagset:function(n) {
		var selectedset=this.state.tagset[n];
		return selectedset?selectedset.tagset:[];
	}
	,render:function() {
		//this.disableRandom(tagset);
		return <div>
			<Choices data={this.state.tagset} onSelect={this.onSelect} labelfor={true}/>
			<Choices data={this.getTagset(this.state.selected)} onSelect={this.onSelectTag} type="checkbox" checked={true}/>
		</div>
	}
});

module.exports=TagsetTab;