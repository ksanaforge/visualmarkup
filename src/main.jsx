var Kse=require("ksana-search");
 
var ReferText=require("./refertext");
var MarkupText=require("./markuptext");
var MarkupPanel=require("./markuppanel");
var DictionaryPanel=require("./dictionarypanel");
var KepanPanel=require("./kepanpanel");

var actions=require("./actions");
var maincomponent = React.createClass({
	getInitialState:function() {
		return {data:""} 
	},
	componentDidMount:function() { 
		actions.openDS();
		actions.openDSL();
	},
	showText:function(n) {
		console.log(n)
	},
	render: function() {
		return <div>
			<div className="col-md-3">
				<KepanPanel showText={this.showText}/>
			</div>
			<div className="col-md-6">
				<MarkupPanel/>
				<ReferText/>
				<MarkupText/>
			</div>
			<div className="col-md-3">
				<DictionaryPanel/>
			</div>

		</div>;
	}
});
module.exports=maincomponent;