var Reflux=require("reflux");

var actions=require("./actions_markup");
var store_tagsetname=Reflux.createStore({
	listenables: [actions]
	,onSetTagsetName:function(tagsetname){
		this.tagsetname=tagsetname;
		this.trigger(tagsetname);
	},
	getTagsetName:function() {
		return this.tagsetname;
	}
});
module.exports=store_tagsetname;