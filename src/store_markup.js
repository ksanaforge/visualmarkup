/*
  construct drawable markup object
*/
var Reflux=require("reflux");
var actions=require("./actions_markup");
var testmarkups=require("./testmarkups");
var persistent=require("./persistent");

var layoutMarkups=function(viewpositions,viewmarkups, visibletags) {
	var out=[];
	for (var i=0;i<viewmarkups.length;i++) {
		var markups=viewmarkups[i];
		var positions=viewpositions[i];
		if (!positions) continue ;
		for (var j=0;j<markups.length;j++) {
			var markup=markups[j];
			var start=markup[0], end=markup[0]+markup[1];
			for (var k=start;k<end;k++) {
				if (positions[k] && visibletags.indexOf(markup[2].tag)>-1 ) {//onscreen
					out.push( [markup[2].tag,positions[k]] );
				}
			}
		}
	}
	return out;
}

var store_trait=require("./store_trait");

var store_markup=Reflux.createStore({
	listenables: [actions]
	,viewmarkups:testmarkups
	,viewpositions:[]
	,visibletags:[]
	,onMarkupUpdated:function(){
		var drawables=layoutMarkups(this.viewpositions,this.viewmarkups,this.visibletags);
		if (drawables) this.trigger(drawables);
	}
	,removeMarkupAtPos:function(markups,vpos,exclusive) {
		return markups.filter(function(m){
			return !(m[0]==vpos && exclusive.indexOf(m[2].tag)>-1);
		})
	}
	,onSetVisibleTags:function(visibletags,norefresh) {
		this.visibletags=visibletags;
		if (!norefresh) this.onMarkupUpdated();
	}
	,deleteMarkup:function(viewid,n) {
		var markups=this.viewmarkups[viewid];
		if (!markups) return;
		if (n>=markups.length) return;
		this.viewmarkups[viewid]=markups.splice(n,1);
		actions.cancelEdit();
		this.onMarkupUpdated();
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
		actions.cancelEdit();
		this.onMarkupUpdated();
	}
	,findVisibleMarkupAt:function(viewid,vpos){
		var markups=this.viewmarkups[viewid];
		if (!markups) return null;
		var inrange=[]; // markup, distance, n in viewmarkups
		for (var i=0;i<markups.length;i++) {
			m=markups[i];
			if (vpos>=m[0] && vpos<=m[0]+m[1] && this.visibletags.indexOf(m[2].tag)>-1 ) {
				inrange.push([m,vpos-m[0],i]);
			}
		};
		if (!inrange.length) return null;
		inrange.sort(function(a,b){return a[1]-b[1]}); //find out the nearest
		return [viewid,inrange[0][2],inrange[0][0]]; //for editmarkup
	}
	,onEditMarkupAtPos:function(viewid,vpos) {
		var m=this.findVisibleMarkupAt(viewid,vpos);
		actions.editMarkup.apply(this,m);
	}
	,onSaveMarkup:function(viewid,vpos,markup,opts){
		this.viewmarkups[viewid][n]=markup;
		opts=opts||{};
		if (opts.forceUpdate) this.onMarkupUpdated();
	}
	,onTokenPositionUpdated:function(positions,nview) {
		this.viewpositions[nview]=positions;
		var drawables=layoutMarkups(this.viewpositions,this.viewmarkups,this.visibletags);
		if (drawables) this.trigger(drawables);
	}
});

module.exports=store_markup;