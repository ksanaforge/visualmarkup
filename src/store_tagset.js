var Reflux=require("reflux");

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
		console.log("do tag n",n,this.tagset[n].name);
		//add markup
	}
});
module.exports=store_tagset;