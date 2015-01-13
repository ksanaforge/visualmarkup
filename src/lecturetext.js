var Reflux=require("reflux");
var store=require("./store_text").dsl;
var actions=require("./action_text");
var domhelper=require("./domhelper");
var Markable=require("./markable");
var Controls=React.createClass({
	nextpara:function() {
		actions.nextLecturePara();
	},
	prevpara:function() {
		actions.prevLecturePara();
	},
	render:function() {
		return <div className="pull-right">
			<button onClick={this.prevpara}>上一段</button>
			<button onClick={this.nextpara}>下一段</button>
			</div>
	}
});
var Markuptext=React.createClass({
	mixins:[Reflux.listenTo(store,"lecturetext")],
	getInitialState:function() {
		return {text:"",db:null};
	},
	spanClicked:function(e) {
		tofind=domhelper.getTextUntilPunc(e.target);
		actions.searchDictionary(tofind);
	},
	lecturetext:function(text,db){
		if (text) this.setState({text:text});
		if (this.state.db!=db) this.setState({db:db});
	}, 
	render:function() {
		return <div><Controls/>
				<div onClick={this.spanClicked} className="lecturetext">
				<Markable text={this.state.text} viewid={1} />
		        </div>
		     </div>
	}
});
module.exports=Markuptext;