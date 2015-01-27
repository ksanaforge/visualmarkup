var Reflux=require("reflux");
var store_userinfo=require("./store_userinfo");
var store_selection=require("./store_selection");
var store_tagsets=require("./store_tagsets");
var actions=require("./actions_markup");
var S4=function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
var genGUID = function() {
	return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();	
} 

var store_tagset=Reflux.createStore({
	listenables: [actions]
	,init:function() {
		this.listenTo(store_selection, this.selectionChanged);
	}
	,groupSelection:function(viewselections){
		var groupedselection=[];

		for (var i in viewselections) { //how many selections in each view
			var len=viewselections[i].length;
			if (len) groupedselection.push(len);
		}
		return groupedselection;
	}
	,enableTagsetBySelection:function(viewselections) {
		if (!this.tagset) return;
		var g=this.groupSelection(viewselections);
		for (var i=0;i<this.tagset.length;i++) {
			this.tagset[i].disabled=!this.tagset[i].def.isValidSelection(g,viewselections);
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
		var g=this.groupSelection(viewsels);
		var valid=this.tagset[n].def.isValidSelection(g,viewsels);
		if (!valid) return;
		var guid=null;
		var first=true;
		if (g.length>1 || g[0]>1) guid=genGUID();		

		for (var viewid in viewsels) {
			var sels=viewsels[viewid];
			for (var j=0;j<sels.length;j++){
				var sel=sels[j];
				var def=store_tagsets.defOfTag(tag);
				var payload=def.initPayload(tag,first,guid,sel,j,sels);
				if (payload) {
					actions.createMarkup(viewid,sel[0],sel[1],payload,{edit:first,exclusive:exclusive});
				}
				first=false;
			}
		}
	}
});
module.exports=store_tagset;