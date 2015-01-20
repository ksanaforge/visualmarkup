var Reflux=require("reflux");
var actions=require("./actions_markup");
var store_tagset=Reflux.createStore({
	listenables: [actions]
	,onLoadTagsets:function(){
		this.trigger(require("./tagsets"))
	}
});
module.exports=store_tagset;