var Reflux=require("reflux");
var actions=require("./actions_markup");
var store=require("./store_markup");
var shapes=require("./shapes");
var Markuplayer=React.createClass({
	mixins:[Reflux.listenTo(store,"updatemarkup")],
	getInitialState:function() {
		return {};
	},
	updatemarkup:function(data) {
		var ctx = this.refs.thecanvas.getDOMNode().getContext("2d");
		ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
		for (var i=0;i<data.length;i++){
			shapes.draw(ctx,data[i],i,data);
		}
	},
	componentDidMount:function() {
		var ctx = this.refs.thecanvas.getDOMNode().getContext("2d");
		ctx.canvas.width = window.innerWidth;
		ctx.canvas.height = window.innerHeight;
		window.ctx=ctx;
	},
	render:function() {
		return <div className='markuplayer'>
			<canvas ref="thecanvas"></canvas>
        </div>
	}
});
module.exports=Markuplayer;