var Reflux=require("reflux");
var actions=require("./actions_markup");
var store_markup=Reflux.createStore({
	listenables: [actions]
	,onTokenPositionUpdated:function(positions,nview) {
		console.log(positions,nview);
		this.trigger({drawables:[]});
	}
});

module.exports=store_markup;