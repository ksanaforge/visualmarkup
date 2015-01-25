/*
  construct drawable markup object
*/
var Reflux=require("reflux");
var actions=require("./actions_markup");
var actions_text=require("./actions_text");
var testmarkups=require("./testmarkups");
var persistent=require("./persistent");
var layoutMarkups=function(viewpositions,viewmarkups, visibletags, hiddenviews) {
	var out=[];
	var findShadow=function(payload) {

	}
	for (var i in viewmarkups) {
		if (hiddenviews && hiddenviews.indexOf(i)>-1) continue;
		var markups=viewmarkups[i].markups;
		var positions=viewpositions[i];
		if (!positions) continue ;
		for (var j=0;j<markups.length;j++) {
			var markup=markups[j];
			var len=markup[1];
			var start=markup[0], end=markup[0]+len;
			var payload=markup[2];
			for (var k=start;k<end;k++) {
				if (positions[k] && visibletags.indexOf(payload.tag)>-1 ) {//onscreen
					// tag , position, nth, total in this group
					var shadows=findShadow(payload);
					out.push( [payload,shadows,positions[k], k-start,len ] );
				}
			}
		}
	}
	return out;
}

var store_trait=require("./store_trait");

var store_markup=Reflux.createStore({
	listenables: [actions]
	,viewmarkups:{}    // all markups to be drawn, including on disk and virtual
	,viewIDs:[]        // markable view id
	,hiddenViews:[]     // this view doesn't display
	,viewpositions:{}  // span positions in each view
	,visibletags:[]    // only tag in this array are visible
	,editing:{}        //the markup being edit
	,onMarkupUpdated:function(){
		var drawables=layoutMarkups(this.viewpositions,this.viewmarkups,this.visibletags,this.hiddenViews);
		if (drawables) this.trigger(drawables);
		actions.cancelEdit();
	}
	,removeMarkupAtPos:function(markups,vpos,exclusive) {
		return markups.filter(function(m){
			return !(m[0]==vpos && exclusive.indexOf(m[2].tag)>-1);
		});
	}
	,onRegisterViewid:function(viewid) {
		if (this.viewIDs.indexOf(viewid)==-1) this.viewIDs.push(viewid);
	}
	,docIDs:function() {
		return this.viewIDs.map(function(v){return v+"."+this.tagsetname},this);
	}
	,loadMarkups:function() {
		var keys=this.docIDs();
		persistent.loadMarkups(keys,function(content){
			for (var i=0;i<content.length;i++){
				var viewid=keys[i].substr(0,keys[i].indexOf("."));
				this.viewmarkups[viewid  ]=content[i];
			}
			this.onMarkupUpdated();
		},this);		
	}
	,onSetActiveTagset:function(tagsetname){ 
		this.tagsetname=tagsetname;
		this.loadMarkups();
	}
	,onSetVisibleTags:function(visibletags,norefresh) {
		this.visibletags=visibletags;
		if (!norefresh) this.onMarkupUpdated();
	}
	,onDeleteMarkup:function(viewid,n) {
		var markups=this.viewmarkups[viewid].markups;
		if (!markups) return;
		if (n>=markups.length) return;
		markups.splice(n,1);
		this.viewmarkups[viewid].markups=markups;
		this.onMarkupUpdated();
	}
	,sortMarkups:function() {
		for (var viewid in this.viewmarkups) {
			var markups=this.viewmarkups[viewid].markups;
			this.viewmarkups[viewid].markups=markups.sort(function(m1,m2){
				return m1[0]-m2[0];
			});
		}
	}
	,createMarkup:function(viewid,vpos,length,payload,opts) {
		opts=opts||{};
		var markups=this.viewmarkups[viewid].markups;
		if (!markups) {
			console.error("invalid viewid",viewid);
			return;
		}
		if (opts.exclusive) {
			markups=this.removeMarkupAtPos(markups,vpos,opts.exclusive);
		}
		var markup=[vpos,length,payload,true];
		//set 4th field to true for finding it after sort
		markups.push(markup);
		this.viewmarkups[viewid].markups=markups;
		this.sortMarkups();
		markups=this.viewmarkups[viewid].markups;
		this.onMarkupUpdated();
		if (opts.edit) {
			var n=0;
			for (var i=0;i<markups.length;i++) { //find out the newly addedmarkup
				if (markups[i][3]) {
					n=i;
					markups[i]=markups[i].slice(0,3); //remove the true flag
					break;
				}
			}
			actions.editMarkup(viewid,n,markup);
			this.editing={viewid:viewid,n:n};
		}

	}
	,findVisibleMarkupAt:function(viewid,vpos){
		if (!this.viewmarkups[viewid]) return;
		var markups=this.viewmarkups[viewid].markups;
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
		if (m) {
			this.editing={viewid:m[0],n:m[1]};
		} else {
			this.editing=null;
		}
		actions.editMarkup.apply(this,m);
	}
	,onNextMarkup:function() {
		if (!this.editing) return;
		var markups=this.viewmarkups[this.editing.viewid].markups;
		if (this.editing.n<markups.length-1) {
			//TODO , skip invisible markup
			this.editing.n++;
			actions.editMarkup(this.editing.viewid,this.editing.n,markups[this.editing.n]);
			actions_text.getTextByVpos(markups[this.editing.n][0],this.editing.viewid);
		}
	}
	,onPrevMarkup:function(){
		if (!this.editing) return;
		var markups=this.viewmarkups[this.editing.viewid].markups;
		if (this.editing.n>0) {
			this.editing.n--;
			//TODO , skip invisible markup
			actions.editMarkup(this.editing.viewid,this.editing.n,markups[this.editing.n]);
			actions_text.getTextByVpos(markups[this.editing.n][0],this.editing.viewid);
		}
	},onSaveMarkup:function(viewid,vpos,markup,opts){
		this.viewmarkups[viewid].markups[n]=markup;
		opts=opts||{};
		if (opts.forceUpdate) this.onMarkupUpdated();
	}
	,onTokenPositionUpdated:function(positions,viewid) {
		this.viewpositions[viewid]=positions;
		var drawables=layoutMarkups(this.viewpositions,this.viewmarkups,this.visibletags,this.hiddenViews);
		if (drawables) this.trigger(drawables);
	}
	,onAddHiddenView:function(viewid) {
		if (viewid && this.hiddenViews.indexOf(viewid)==-1) {
			this.hiddenViews.push(viewid);
			this.onMarkupUpdated();
		}
	}
	,onRemoveHiddenView:function(viewid){
		var at=this.hiddenViews.indexOf(viewid);
		if (at>-1) {
			this.hiddenViews.splice(at,1);
			this.onMarkupUpdated();
		}
	}
	,markupsArrayForSerialize:function() { // pouchdb needs array of docs
		var out=[];
		for (var i in this.viewmarkups){
			if (this.viewIDs.indexOf(i)>-1) out.push(this.viewmarkups[i]);
		}
		return out;
	}
	,onSaveMarkups:function(cb,context){
		persistent.saveMarkups(this.markupsArrayForSerialize(), cb,context);
	}
	,onClearAllMarkups:function(){
		persistent.resetMarkups(this.markupsArrayForSerialize());
		this.onMarkupUpdated();
	}
	,getRawMarkup:function() {
		var out={};
		for (var i in this.viewmarkups) {
			if (this.viewIDs.indexOf(i)>-1) out[i]=this.viewmarkups[i];
		}
		return out;
	}
	,onSetVirtualMarkup:function( markups,viewid) {// virtual markup will not save to db
		this.viewmarkups[viewid]={markups:markups};
		//this.onMarkupUpdated();
	}
	,setRawMarkup:function(content) {
		for (var i in content){
			var rev=this.viewmarkups[i]._rev;
			this.viewmarkups[i]=content[i];
			this.viewmarkups[i]._rev=rev;
		}
		this.onMarkupUpdated();
	}

});

module.exports=store_markup;