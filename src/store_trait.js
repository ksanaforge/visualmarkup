var Reflux=require("reflux");
var actions=require("./actions_markup");
var actions_selection=require("./actions_selection");
var store=require("./store_markup");
var store_trait=Reflux.createStore({
	listenables: [actions]
	,onEditMarkup:function(viewid,markup,nmarkup) {
		var related=null;
		if (markup) {
			var master=store.getMasterMarkup(markup,viewid);
			related=store.findShadow(master[0]);
			markup=master[0];
			viewid=master[1];
		}
		this.viewid=viewid;
		this.nmarkup=nmarkup; //this where user click
		this.markup=markup;
		this.trigger(this.viewid,this.markup,this.nmarkup, related);
	}
	,onRestore:function() {
		this.trigger(this.viewid,this.nmarkup,this.markup);
	}
	,onCancelEdit:function(){
		actions_selection.clearHighlights();
		this.trigger();	
	}
});

module.exports=store_trait;