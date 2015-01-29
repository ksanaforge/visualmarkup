var Reflux=require("reflux");
var actions=require("./actions_markup");
var actions_selection=require("./actions_selection");
var store=require("./store_markup");
var store_trait=Reflux.createStore({
	listenables: [actions]
	,onEditMarkup:function(viewid,markup,nmarkup) {
		var group=null,master=null;
		if (markup) {
			if (markup[2].id) {
				master=store.getMasterMarkup(markup,viewid);			
				var group=store.findShadow(master[0]);
				if (!group[master[1]]) group[master[1]]=[];
				group[master[1]].push(master[0]);
			}
			if (master && master[0]!=markup) markup=master[0];
		}
		this.viewid=viewid;
		this.nmarkup=nmarkup; //this where user click
		this.markup=markup;
		//this.viewid+this.nmarkup point to current editing markup
		//this.markup always point to master markup, where the payload is editable
		this.trigger(this.viewid,this.markup,this.nmarkup, group);
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