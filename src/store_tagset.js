var Reflux=require("reflux");
var store_userinfo=require("./store_userinfo");
var store_selection=require("./store_selection");

var actions=require("./actions_markup");
var store_tagset=Reflux.createStore({
	listenables: [actions]
	,onSetActiveTagset:function(tagsetname,tagset){
		this.tagsetname=tagsetname;
		this.tagset=tagset;
		this.trigger(tagsetname,tagset); 
	},
	getTagsetName:function() {
		return this.tagsetname;
	},
	onDoTag:function(n) {
		var exclusive=[];
		var tag=this.tagset[n].name;
		var viewsels=store_selection.getSelections();
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