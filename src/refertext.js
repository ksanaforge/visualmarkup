var Reflux=require("reflux");
var store=require("./stores").ds;
var actions=require("./actions");

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
	getTextUntilPunc:function(ele) {
		var tofind="";
		if (ele.nodeName!="SPAN")return;
		while (ele) {
			if (ele.nodeName=="SPAN") {
				var text=ele.innerHTML;
				var ic=text.charCodeAt(0);
				if ((ic>=0x3F00 && ic<=0x9FFF) || (ic>=0xD800 && ic<=0xDFFF)) {
					tofind+=text;
					ele=ele.nextSibling;
				} else break;
			} else break;
		}
		return tofind;		
	},
	spanClicked:function(e) {
		tofind=this.getTextUntilPunc(e.target);
		actions.searchDictionary(tofind);
	},
	sutratext:function(text,db){
		if (text) this.setState({text:text});
		if (this.state.db!=db) this.setState({db:db});
	}, 
	render:function() {
		return <div><Controls/>
				<div onClick={this.spanClicked}
		        className="sutratext" dangerouslySetInnerHTML={{__html:this.state.text}}>
		        </div>
		        </div>
	}
});

module.exports=Refertext;