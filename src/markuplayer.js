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
			var tag=data[i][0],rect=data[i][1],nth=data[i][2],len=data[i][3];
			shapes.draw(tag,rect,ctx,nth,len);
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