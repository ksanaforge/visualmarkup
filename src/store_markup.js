/*
  construct drawable markup object
*/
var Reflux=require("reflux");
var actions=require("./actions_markup");
var testmarkups=require("./testmarkups");
var persistent=require("./persistent");
var layoutMarkups=function(viewpositions,viewmarkups) {
	var out=[];
	for (var i=0;i<viewmarkups.length;i++) {
		var markups=viewmarkups[i];
		var positions=viewpositions[i];
		if (!positions) continue ;
		for (var j=0;j<markups.length;j++) {
			var markup=markups[j];
			var start=markup[0], end=markup[0]+markup[1];
			for (var k=start;k<end;k++) {
				if (positions[k] ) {//onscreen
					out.push( [markup[2].tag,positions[k]] );
				}
			}
		}
	}
	return out;
}

var store_markup=Reflux.createStore({
	listenables: [actions]
	,viewmarkups:testmarkups
	,viewpositions:[]
	,onMarkupUpdated:function(){
		var drawables=layoutMarkups(this.viewpositions,this.viewmarkups);
		if (drawables) this.trigger(drawables);
	},
	removeMarkupAtPos:function(markups,vpos,exclusive) {
		return markups.filter(function(m){
			return !(m[0]==vpos && exclusive.indexOf(m[2].tag)>-1);
		})
	}
	,createMarkup:function(viewid,vpos,length,payload,opts) {
		opts=opts||{};
		var markups=this.viewmarkups[viewid];
		if (!markups) {
			console.error("invalid viewid",viewid);
			return;
		}
		if (opts.exclusive) {
			markups=this.removeMarkupAtPos(markups,vpos,opts.exclusive);
		}
		markups.push([vpos,length,payload]);
		this.viewmarkups[viewid]=markups;
		this.onMarkupUpdated();
	}
	,onTokenPositionUpdated:function(positions,nview) {
		this.viewpositions[nview]=positions;
		var drawables=layoutMarkups(this.viewpositions,this.viewmarkups);
		if (drawables) this.trigger(drawables);
	}
});

module.exports=store_markup;