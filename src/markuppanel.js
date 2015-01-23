var TagsetTab=require("./tagsettab");
var Trait=require("./trait");
var actions=require("./actions_markup");

var Reflux=require("reflux");
var MarkupPanel=React.createClass({
	getInitialState:function() {
		return {}
	},
	render:function(){
		return <div className="markuppanel">
			<TagsetTab/>
		</div>
	}
});

module.exports=MarkupPanel;