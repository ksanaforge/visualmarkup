var Reflux=require("reflux");
var actions=require("./actions_markup");
var store_tagset=Reflux.createStore({
	listenables: [actions]
	,onLoadTagsets:function(){
		this.tagsets=require("./tagsets");
		this.trigger(this.tagsets);
	}
	,tagsetOfTag:function(tag) {
		for (var i=0;i<this.tagsets.length;i++){
			var tagset=this.tagsets[i].tagset;
			for (var j=0;j<tagset.length;j++) {
				var tagdef=tagset[j];
				if (tagdef.name==tag) return this.tagsets[i].name;
			}
		};
		return null;
	}
	,

});
module.exports=store_tagset;