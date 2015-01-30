var SutraText=require("./sutratext");
var LectureText=require("./lecturetext");
var Markuplayer=require("./markuplayer");
var Trait=require("./trait");
var ControlPanel=require("./controlpanel");
var LeftPanel=require("./leftpanel");
var keyboardshortcut=require("./keyboardshortcut");
//var pageScrollMixin=require("ksana2015-components").pageScrollMixin; 

var maincomponent = React.createClass({
//	mixins:[pageScrollMixin],
	componentDidMount:function() {
		var that=this;
		window.addEventListener('resize', function(e){
		  that.forceUpdate();
		});
		window.addEventListener('keyup',function(e){
			if (keyboardshortcut(e)) e.preventDefault();
		})
	},
	onScrollEnd:function() {
		this.forceUpdate();
	},
	render: function() {
		return <div>
			<Markuplayer/>
			<div className="tocpanel col-md-3">
				<LeftPanel/>
			</div>
			<div className="textpanel col-md-6">			
				<SutraText/>
				<LectureText/>
			</div>
			<div className="dictpanel col-md-3">
				<div className="panel panel-warning">
					<div className="panel-heading text-center">Visual Semantic Markup System</div>
					<div className="panel-body"><ControlPanel/></div>
				</div>
				
				<div className="panel panel-warning">
					<div className="panel-heading text-center">Tag Attributes and Selection</div>
					<div className="panel-body"><Trait/></div>
				</div>
				

			</div>
		</div>;
	}
});
module.exports=maincomponent;