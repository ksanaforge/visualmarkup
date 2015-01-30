var Reflux=require("reflux");
var actions=require("./actions_markup");
var tagsetdef=require("./tagtypedef");
var store_tagsets=Reflux.createStore({
	listenables: [actions]
	,onLoadTagsets:function(){
		this.tagsets=require("./tagsets");
		for (var viewid in this.tagsets) {
			var tagset=this.tagsets[viewid].tagset;
			for (var i in tagset) {
				var tag=tagset[i];
				if (!tag.type) tag.type="simple";
				type=tag.type;
				tag.def=tagsetdef[tag.type];
				if (!tag.def) {
					console.error("unknown tag",tag.type)
				} else {
					tag.checked=true;
					tag.def.type=type;
				}
			}
		}
		this.trigger(this.tagsets);
	}
	,settingOfTag:function(tagname) {
		for (var i=0;i<this.tagsets.length;i++){
			var tagset=this.tagsets[i].tagset;
			for (var j=0;j<tagset.length;j++) {
				var tagsetting=tagset[j];
				if (tagsetting.name==tagname) return tagsetting;
			}
		};
		return null;
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
	,typeOfTag:function(tag) {
		for (var i=0;i<this.tagsets.length;i++){
			var tagset=this.tagsets[i].tagset;
			for (var j=0;j<tagset.length;j++) {
				var tagdef=tagset[j];
				if (tagdef.name==tag) return tagdef.type;
			}
		};
		return null;		
	}
});
module.exports=store_tagsets;