var TagsetTab=require("./tagsettab");
var TagParam=require("./tagparam");
var actions=require("./actions_markup");

var Reflux=require("reflux");
var MarkupPanel=React.createClass({
	getInitialState:function() {
		return {}
	},
	render:function(){
		return <div className="markuppanel">
			<div>
			<div className="col-md-1">LOGO</div>
			<div className="col-md-7"><TagsetTab/></div>
			<div className="col-md-4"><TagParam/></div>
			</div>
		</div>
	}
});

module.exports=MarkupPanel;