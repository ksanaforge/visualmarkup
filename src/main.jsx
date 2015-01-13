var SutraText=require("./sutratext");
var LectureText=require("./lecturetext");
var MarkupPanel=require("./markuppanel");
var DictionaryPanel=require("./dictionarypanel");
var KepanPanel=require("./kepanpanel");
var Markuplayer=require("./markuplayer");
var maincomponent = React.createClass({
	render: function() {
		return <div>
			<div className="tocpanel col-md-3">
				<KepanPanel/>
			</div>
			<div className="textpanel col-md-6">
				<MarkupPanel/>
				<SutraText/>
				<LectureText/>
				<Markuplayer/>
			</div>
			<div className="dictpanel col-md-3">
				<DictionaryPanel/>
			</div>

		</div>;
	}
});
module.exports=maincomponent;