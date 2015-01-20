var Choices=require("ksana2015-components").choices;
var store=require("./store_tagset");
var actions=require("./actions_markup");
var Reflux=require("reflux");
var TagsetTab=React.createClass({
	mixins:[Reflux.listenTo(store,"onTagSet")],
	propTypes:{
	} ,
	onTagSet:function(tagset) {
		this.setState({tagset:tagset});
	},
	getInitialState:function(){
		return {selected:0,tagset:[]};
	},
	onSelect:function(n,perv) {
		this.setState({selected:n})
	},
	componentDidMount:function() {
		actions.loadTagsets();
	},
	onSelectTag:function(n,prev){
		console.log(n,prev)
	},
	disableRandom:function(tagset) {
		tagset.map(function(tag){
			tag.disabledLabel=Math.random()>0.5;
		});
	},
	render:function() {
		var selectedset=this.state.tagset[this.state.selected];
		var tagset=selectedset?selectedset.tagset:[];
		this.disableRandom(tagset);
		return <div>
		<Choices data={this.state.tagset} onSelect={this.onSelect} labelfor={true}/>
		<Choices data={tagset} onSelect={this.onSelectTag} type="checkbox" checked={true}/>
		</div>
	}
});

module.exports=TagsetTab;