var Reflux=require("reflux");
var store=require("./store_text").ds;
var actions=require("./action_text");
var domhelper=require("./domhelper");
var Markuptable=require("./markuptable");
var Controls=React.createClass({
	nextpara:function() {
		actions.nextSutraPara();
	},
	prevpara:function() {
		actions.prevSutraPara();
	},
	render:function() {
		return <div className="pull-right">
			<button onClick={this.prevpara}>上一段經文</button><button onClick={this.nextpara}>下一段經文</button>
			</div>
	}
});

var Refertext=React.createClass({
	mixins:[Reflux.listenTo(store,"sutratext")],
	getInitialState:function() {
		return {text:"",db:null};
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
		return <div><Controls/>
				<div onClick={this.spanClicked} className="sutratext">
				<Markuptable text={this.state.text} viewid={0} />
		        </div>
		     </div>
	}
});

module.exports=Refertext;