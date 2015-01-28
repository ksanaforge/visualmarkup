var Reflux=require("reflux");
var actions=require("./actions_text");
var actions_markup=require("./actions_markup");
var domhelper=require("./domhelper");
var Markable=require("./markable");
var viewid="lecture";
var store_dsl=require("./store_text").lecture;
var TextNav=require("./textnav");
var Controls=React.createClass({
	nextpara:function() {
		actions.nextLecturePara();
	},
	prevpara:function() {
		actions.prevLecturePara();
	},
	render:function() {
		return <div className="text-center">講義
			<div className="pull-right"><button onClick={this.prevpara}>上一段</button>
				<button onClick={this.nextpara}>下一段</button>
			</div>
			</div>
	}
});
var Markuptext=React.createClass({
	mixins:[Reflux.listenTo(store_dsl,"lecturetext")],
	getInitialState:function() {
		return {text:[],db:null};
	},
	spanClicked:function(e) {
		var tofind=domhelper.getTextUntilPunc(e.target);
		var vpos=parseInt(e.target.dataset.n);
		if (isNaN(vpos)) return;
		actions.searchDictionary(tofind,vpos,viewid);
		actions_markup.editMarkupAtPos(viewid,vpos);
	},
	lecturetext:function(text,db){
		if (text) this.setState({text:text});
		if (this.state.db!=db) this.setState({db:db});
	}, 
	render:function() {
		return <div className="panel panel-success">
				<div className="panel-heading clearfix">
					<TextNav store={store_dsl} actions={actions} viewid={viewid} title="江味農居士金剛經講義"/>
				</div>
				<div onClick={this.spanClicked} className="panel-body lecturetext">
				<Markable text={this.state.text} viewid={viewid} />
		        </div>
		     </div>
	}
});
module.exports=Markuptext;