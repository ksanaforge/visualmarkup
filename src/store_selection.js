var Reflux=require("reflux");
var actions=require("./actions_markup");
var store_selection=Reflux.createStore({
	listenables: [actions]
	,selections:{}
	,onSetSelection:function(selections,viewid) {
		this.selections[viewid]=selections;
		this.trigger(this.selections,viewid);
	}
	,getSelections:function(){
		return this.selections;
	}
	,getSelection:function(viewid){
		return this.selections[viewid];
	}
});

module.exports=store_selection;