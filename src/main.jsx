var Kse=require("ksana-search");
 
var ReferText=require("./refertext");
var MarkupText=require("./markuptext");
var MarkupPanel=require("./markuppanel");
var DictionaryPanel=require("./dictionarypanel");
var KepanPanel=require("./kepanpanel");
var Reflux=require("reflux");
var store=require("./stores").ds;
var actions=require("./actions");
var maincomponent = React.createClass({
	getInitialState:function() {
		var kepanid=parseInt(localStorage.getItem("visualmarkup.kepanid")||"1");
		return {data:"",kepanid:kepanid} 
	},
	mixins:[Reflux.listenTo(store,"onReady")],
	onReady:function(text,db) {
		//
	},
	componentDidMount:function() { 
		actions.getSutraTextByKepanId(this.state.kepanid);
		actions.getLectureTextByKepanId(this.state.kepanid);
	},
	showText:function(n) {
		actions.getSutraTextByKepanId(n);
		actions.getLectureTextByKepanId(n);
		localStorage.setItem("visualmarkup.kepanid",n);
		this.setState({kepanid:n});
	},
	render: function() {
		return <div>
			<div className="tocpanel col-md-3">
				<KepanPanel showText={this.showText}/>
			</div>
			<div className="textpanel col-md-6">
				<MarkupPanel/>
				<ReferText/>
				<MarkupText/>
			</div>
			<div className="dictpanel col-md-3">
				<DictionaryPanel/>
			</div>

		</div>;
	}
});
module.exports=maincomponent;