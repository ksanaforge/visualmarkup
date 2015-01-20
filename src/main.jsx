var SutraText=require("./sutratext");
var LectureText=require("./lecturetext");
var DictionaryPanel=require("./dictionarypanel");
var KepanPanel=require("./kepanpanel");
var Markuplayer=require("./markuplayer");
var MarkupPanel=require("./markuppanel");
//var pageScrollMixin=require("ksana2015-components").pageScrollMixin; 
	

var maincomponent = React.createClass({
//	mixins:[pageScrollMixin],
	componentDidMount:function() {
		var that=this;
		window.addEventListener('resize', function(event){
		  that.forceUpdate();
		});
	},
	onScrollEnd:function() {
		this.forceUpdate();
	},
	render: function() {
		return <div>
			<Markuplayer/>
			<MarkupPanel/>

			<div className="tocpanel col-md-3">
					<KepanPanel tocname="金剛經講義"/>
			</div>
			<div className="textpanel col-md-6">			
				<SutraText/>
				<LectureText/>
			</div>
			<div className="dictpanel col-md-3">
				<DictionaryPanel/>
			</div>
		</div>;
	}
});
module.exports=maincomponent;