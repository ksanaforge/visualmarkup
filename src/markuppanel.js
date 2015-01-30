var TagsetTab=require("./tagsettab");
var Trait=require("./trait");
var actions=require("./actions_markup");

var Reflux=require("reflux");
var MarkupNav=require("./markupnav");
var MarkupPanel=React.createClass({
	getInitialState:function() {
		return {}
	},
	render:function(){
		return <div className="markuppanel">
			<div className="pull-right"><MarkupNav/></div>		
			<TagsetTab/>
		</div>
	}
});

module.exports=MarkupPanel;