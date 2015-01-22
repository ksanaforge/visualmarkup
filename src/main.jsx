var SutraText=require("./sutratext");
var LectureText=require("./lecturetext");
var DictionaryPanel=require("./dictionarypanel");
var KepanPanel=require("./kepanpanel");
var Markuplayer=require("./markuplayer");
var MarkupPanel=require("./markuppanel");
var Trait=require("./trait");
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
			

			<div className="tocpanel col-md-3">
				<div>
					<ul className="nav nav-tabs">
						<li className="active"><a href="#kepan" data-toggle="tab">科文</a></li>
						<li><a href="#markup" data-toggle="tab">標籤集</a></li>
						<li><a href="#dictionary" data-toggle="tab">辭典</a></li>
					</ul>
				</div>
				<div className="tab-content">
					<div className="tab-pane active" id="kepan"><KepanPanel tocname="金剛經講義"/></div>
					<div className="tab-pane" id="markup"><MarkupPanel/></div>
					<div className="tab-pane" id="dictionary"><DictionaryPanel/></div>

				</div>
			</div>
			<div className="textpanel col-md-6">			
				<SutraText/>
				<LectureText/>
			</div>
			<div className="dictpanel col-md-3">
				<div className="col-md-4"><Trait/></div>
			</div>
		</div>;
	}
});
module.exports=maincomponent;