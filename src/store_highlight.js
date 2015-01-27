var Reflux=require("reflux");
var actions=require("./actions_selection");

var store_highlight=Reflux.createStore({
	listenables: [actions]
	,highlights:{}
	,init:function() {
	}
	,onSetHighlight:function(highlights,viewid) {
		this.highlights[viewid]=highlights;
		this.trigger(this.highlights,viewid);
	}
	,onSetHighlights:function(viewhighlights) {
		for (var i in viewhighlights) {
			this.highlights[i]=viewhighlights[i];
		}
		var updated=Object.keys(viewhighlights);
		for (var i=0;i<updated.length;i++){
			this.trigger(this.highlights,updated[i]); //notify affected view
		}
	}
	,onClearHighlights:function() {
		for (var i in this.highlights) {
			this.trigger({},i);
		}
		this.highlights={};
	}
	,getHighlights:function(){
		return this.highlights;
	}
	,getHighlight:function(viewid){
		return this.highlights[viewid];
	}
});

module.exports=store_highlight;