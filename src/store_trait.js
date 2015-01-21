var Reflux=require("reflux");
var actions=require("./actions_markup");

var store_trait=Reflux.createStore({
	listenables: [actions]
	,onEditMarkup:function(viewid,nmarkup,markup) {
		this.viewid=viewid;
		this.nmarkup=nmarkup;
		this.markup=markup;
		this.trigger(this.viewid,this.nmarkup,this.markup);
	}
	,onRestore:function() {
		this.trigger(this.viewid,this.nmarkup,this.markup);
	}
	,onCancelEdit:function(){
		this.trigger();	
	}
});

module.exports=store_trait;