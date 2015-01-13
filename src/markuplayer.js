var Reflux=require("reflux");
var actions=require("./actions_markup");
var store=require("./store_markup");

var Markuplayer=React.createClass({
	mixins:[Reflux.listenTo(store,"updatemarkup")],
	getInitialState:function() {
		return {};
	},
	updatemarkup:function(drawables) {
		console.log("markup layer updating ",drawables)
	},
	render:function() {
		return <div className='markuplayer'>
			<canvas ref="thecanvas"></canvas>
        </div>
	}
});
module.exports=Markuplayer;