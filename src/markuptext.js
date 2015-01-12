var Reflux=require("reflux");
var store=require("./stores").dsl;
var actions=require("./actions");
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
	lecturetext:function(text,db){
		if (text) this.setState({text:text});
		if (this.state.db!=db) this.setState({db:db});
	}, 
	render:function() {
		return <div><Controls/>
				<div onClick={this.spanClicked}
		        className="lecturetext" dangerouslySetInnerHTML={{__html:this.state.text}}>
		        </div>
		        </div>
	}
});
module.exports=Markuptext;