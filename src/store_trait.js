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
			if (master[0]!=markup) { //user click on shadow markup
				//add master markup into related, for completing the highlight
				if (!related[master[1]]) related[master[1]]=[];
				related[master[1]].push(master[0]);
			}
			markup=master[0];
		}
		this.viewid=viewid;
		this.nmarkup=nmarkup; //this where user click
		this.markup=markup;
		//this.viewid+this.nmarkup point to current editing markup
		//this.markup always point to master markup, where the payload is editable
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