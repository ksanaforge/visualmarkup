var Reflux=require("reflux");
var actions=require("./actions_text");
var actions_markup=require("./actions_markup");
var domhelper=require("./domhelper");
var Markable=require("./markable");
var store_ds=require("./store_text").ds;
var TextNav=require("./textnav");
var viewid="sutra";
var Refertext=React.createClass({
	mixins:[Reflux.listenTo(store_ds,"sutratext")]
	,getInitialState:function() {
		return {text:[],db:null};
	}
	,spanClicked:function(e) {
		var tofind=domhelper.getTextUntilPunc(e.target);
		var vpos=parseInt(e.target.dataset.n); 
		actions.searchDictionary(tofind,vpos,viewid);
		actions_markup.editMarkupAtPos(viewid,vpos);
	}
	,sutratext:function(text,db){
		if (text) this.setState({text:text});
		if (this.state.db!=db) this.setState({db:db});
	}
	,render:function() {
		return <div className="panel panel-success">
				<div className="panel-heading clearfix">
				<TextNav store={store_ds} actions={actions} viewid={viewid} title="經文"/></div>
				<div  onClick={this.spanClicked} className="sutratext panel-body">
					<Markable text={this.state.text} viewid={viewid} />
		        </div>
		     </div>
	}
});

module.exports=Refertext;