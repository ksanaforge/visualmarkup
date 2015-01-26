var Reflux=require("reflux");
var store_userinfo=require("./store_userinfo");
var store_selection=require("./store_selection");

var actions=require("./actions_markup");
var store_tagset=Reflux.createStore({
	listenables: [actions]
	,init:function() {
		this.listenTo(store_selection, this.selectionChanged);
	}
	,enableTagsetBySelection:function(viewselections) {
		if (!this.tagset) return;
		var groupedselection=[];

		for (var i in viewselections) { //how many selections in each view
			var len=viewselections[i].length;
			if (len) groupedselection.push(len);
		}
		for (var i=0;i<this.tagset.length;i++) {
			this.tagset[i].disabled=!this.tagset[i].def.isValidSelection(groupedselection,viewselections);
		}
	}
	,selectionChanged:function(viewselections) {
		this.enableTagsetBySelection(viewselections);
		this.trigger(this.tagsetname,this.tagset);
	}
	,onSetActiveTagset:function(tagsetname,tagset){
		this.tagsetname=tagsetname;
		this.tagset=tagset;
		this.enableTagsetBySelection(store_selection.getSelections());
		this.trigger(tagsetname,tagset); 
	}
	,getTagsetName:function() {
		return this.tagsetname;
	}
	,onDoTag:function(n) {
		var exclusive=[];
		var tag=this.tagset[n].name;
		var viewsels=store_selection.getSelections();
		var valid=this.tagset[n].def.isValidSelection(viewsels);
		if (!valid) return;
		for (var viewid in viewsels) {
				var sels=viewsels[viewid];
				for (var j=0;j<sels.length;j++){
					var sel=sels[j];
					var payload={tag:tag,source:store_userinfo.getUserName()};
					actions.createMarkup(viewid,sel[0],sel[1],payload,{edit:true,exclusive:exclusive});
				}			
		}
	}
});
module.exports=store_tagset;