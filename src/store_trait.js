var Reflux=require("reflux");
var actions=require("./actions_markup");
var actions_selection=require("./actions_selection");
var store=require("./store_markup");
var store_trait=Reflux.createStore({
	listenables: [actions]
	,onDeleteEditingMarkup:function(opts){
		opts=opts||{};
		if (!this.markup) return;
		actions.deleteMarkup(this.viewid,this.markup);
		if (opts.setSelection) {
			actions_selection.setSelections(this.markupselections);
		}
		this.onCancelEdit();
	}
	,onEditMarkup:function(viewid,markup,nmarkup) {
		var group={},master=null;
		if (markup) {
			if (markup[2].id) {
				master=store.getMasterMarkup(markup,viewid);			
				var group=store.findShadow(master[0]);
				if (!group[master[1]]) group[master[1]]=[];
				group[master[1]].push(master[0]);
			} else { //single range
				group[viewid]=[markup];
			}
			if (master && master[0]!=markup) markup=master[0];
		}
		this.viewid=viewid;
		this.nmarkup=nmarkup; //this where user click
		this.markup=markup;
		//this.viewid+this.nmarkup point to current editing markup
		//this.markup always point to master markup, where the payload is editable
		this.markupselections={};
		this.group=group;

		for (var i in group) {
			if (!this.markupselections[i]) this.markupselections[i]=[];
			var ranges=group[i].map(function(m){return [m[0],m[1]];});
			this.markupselections[i]=this.markupselections[i].concat(ranges);
		}

		this.onRestore();
	}
	,onRestore:function() {
		this.trigger(this.viewid,this.markup,this.nmarkup,this.group,this.markupselections);
	}
	,onCancelEdit:function(){
		actions_selection.clearHighlights();
		this.viewid=null;
		this.nmarkup=-1;
		this.markup=null;
		this.markupselections=null;
		this.trigger();	
	}
});

module.exports=store_trait;