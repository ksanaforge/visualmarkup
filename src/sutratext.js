var Reflux=require("reflux");
var store=require("./store_text").ds;
var actions=require("./action_text");
var domhelper=require("./domhelper");
var Markable=require("./markable");
var Controls=React.createClass({
	nextpara:function() {
		actions.nextSutraPara();
	},
	prevpara:function() {
		actions.prevSutraPara();
	},
	render:function() {
		return <div className="text-center">經文
				<div className="pull-right"><button onClick={this.prevpara}>上一段</button>
				<button onClick={this.nextpara}>下一段</button>
				</div>
		    </div>
	}
});

var Refertext=React.createClass({
	mixins:[Reflux.listenTo(store,"sutratext")],
	getInitialState:function() {
		return {text:[],db:null};
	},
	spanClicked:function(e) {
		tofind=domhelper.getTextUntilPunc(e.target);
		actions.searchDictionary(tofind);
	},
	sutratext:function(text,db){
		if (text) this.setState({text:text});
		if (this.state.db!=db) this.setState({db:db});
	}, 
	render:function() {
		return <div className="panel panel-info">
				<div className="panel-heading"><Controls/></div>
				<div onClick={this.spanClicked} className="sutratext panel-body">
					<Markable text={this.state.text} viewid={0} />
		        </div>
		     </div>
	}
});

module.exports=Refertext;