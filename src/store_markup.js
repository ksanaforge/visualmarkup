/*
  construct drawable markup object
*/
var Reflux=require("reflux");
var actions=require("./actions_markup");
var actions_text=require("./actions_text");

var testmarkups=require("./testmarkups");
var persistent=require("./persistent");
var store_tagsets=require("./store_tagsets");

var store_markup=Reflux.createStore({
	listenables: [actions]
	,viewmarkups:{}    // all markups to be drawn, including on disk and virtual
	,viewIDs:[]        // markable view id
	,hiddenViews:[]     // this view doesn't display
	,viewpositions:{}  // span positions in each view
	,visibletags:[]    // only tag in this array are visible
	,editing:{}        //the markup being edited
	,onMarkupUpdated:function(){
		var drawables=this.layoutMarkups();
		if (drawables) this.trigger(drawables);
	}
	,removeMarkupAtPos:function(markups,vpos,exclusive) {
		return markups.filter(function(m){
			return !(m[0]==vpos && exclusive.indexOf(m[2].tag)>-1);
		});
	}
	,onRegisterViewid:function(viewid) {
		if (this.viewIDs.indexOf(viewid)==-1) this.viewIDs.push(viewid);
	}
	,otherView:function(viewid) {
		return this.viewIDs.filter(function(v){return v!=viewid});
	}
	,docIDs:function() {
		return this.viewIDs.map(function(v){return v+"."+this.tagsetname},this);
	}
	,linkShadow:function(drawables){
		for (var i=0;i<drawables.length;i++) {
			var drawable=drawables[i];
			if (drawable.payload.id && !drawable.payload.shadow) {
				var shadows=[];
				for (var j=0;j<drawables.length;j++) {
					var shadow=drawables[j];
					if (!shadow.master && shadow.nth==0 && 
						shadow.payload.shadow && shadow.payload.id==drawable.payload.id) {
						shadows.push(drawable);
						shadow.master=drawable;
					}
				}
				drawable.shadows=shadows;
			}
		}
	}
	,findShadow:function(markup) { //return object of array of markup, object key is viewid
		var id=markup[2].id;
		var out={};
		this.forEachMarkup(function(m,viewid){
			if (m[2].id==id && m[2].shadow) {
				if (!out[viewid]) out[viewid]=[];
				out[viewid].push(m);
			}
		});
		return out;
	}
	,layoutMarkups:function() {
		var out=[];
		for (var i in this.viewmarkups) {
			if (this.hiddenViews && this.hiddenViews.indexOf(i)>-1) continue;
			var markups=this.viewmarkups[i].markups;
			var positions=this.viewpositions[i];
			if (!positions) continue;
			for (var j=0;j<markups.length;j++) {
				var markup=markups[j];
				var len=markup[1];
				var start=markup[0], end=markup[0]+len;
				var payload=markup[2];
				for (var k=start;k<end;k++) {
					if (positions[k] && this.visibletags.indexOf(payload.tag)>-1 ) {//onscreen
						// tag , position, nth, total in this group
						var tagsetting=store_tagsets.settingOfTag(payload.tag);
						out.push( {tagsetname:this.tagsetname,payload:payload,shadows:null, master:null,
							rect:positions[k], nth:k-start,len:len,tagsetting:tagsetting } );
					}
				}
			}
		}
		this.linkShadow(out);
		return out;
	}
	,loadMarkups:function() {
		var keys=this.docIDs();
		actions.cancelEdit();
		persistent.loadMarkups(keys,function(content){
			for (var i=0;i<content.length;i++){
				var viewid=keys[i].substr(0,keys[i].indexOf("."));
				this.viewmarkups[viewid]=content[i];
			}
			this.onMarkupUpdated();
		},this);		
	}
	,onSetActiveTagset:function(tagsetname,tagset){ 
		this.tagsetname=tagsetname;
		this.tagset=tagset;
		this.loadMarkups();
	}
	,onSetVisibleTags:function(visibletags,norefresh) {
		this.visibletags=visibletags;
		actions.cancelEdit();
		if (!norefresh) this.onMarkupUpdated();
	}
	,findMarkupN:function(viewid,markup) {
		var markups=this.viewmarkups[viewid].markups;
		if (!markups) return;
		for (var i=0;i<markups.length;i++) {
			if (markups[i]==markup) return i;
		}
		return -1;
	}
	,onDeleteMarkup:function(viewid,markup) {
		var markups=this.viewmarkups[viewid].markups;
		if (!markups) return;
		var n=this.findMarkupN(viewid,markup);
		if (n==-1) return;

		var id=markups[n][2].id;
		if (id) {
			this.filterMarkup(function(m,viewid){
				return (!m[2].id || m[2].id!=id);
			});
		} else {
			markups.splice(n,1);
			this.viewmarkups[viewid].markups=markups;
		}
		this.sortMarkups();
		this.onMarkupUpdated();
		actions.cancelEdit();
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
		var markup=[vpos,length,payload];
		//set 4th field to true for finding it after sort
		markups.push(markup);
		this.viewmarkups[viewid].markups=markups;
		this.sortMarkups();
		markups=this.viewmarkups[viewid].markups;
		this.onMarkupUpdated();
		if (opts.edit) {
			var n=0;
			for (var i=0;i<markups.length;i++) { //find the nth of newly created markup
				if (markups[i]==markup) {//newly created
					n=i;
					break;
				}
			}
			actions.editMarkup(viewid,markup,n);
			this.editing={viewid:viewid,n:n};
		}

	}
	,getEditing:function(viewid) {
		if (!this.editing) return null;
		if (this.editing.viewid==viewid) {
			var v=this.viewmarkups[viewid].markups;
			if (!v) return null;
			return v[this.editing.n];
		};
		return null;
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
		return {viewid:viewid,n:inrange[0][2],markup:inrange[0][0]}; //for editmarkup
	}
	,onEditMarkupAtPos:function(viewid,vpos) {
		var res=this.findVisibleMarkupAt(viewid,vpos);
		this.editing=null;
		if (res) {
			this.editing={viewid:res.viewid,n:res.n};
			actions.editMarkup(res.viewid,res.markup,res.n);
		} else {
			actions.editMarkup(null,null,null);
		}
		
	}
	,editNMarkup:function(markups,n) {
		if (n<markups.length && n>-1) {
			this.editing.n=n;
			this.markup=markups[this.editing.n];
			actions.editMarkup(this.editing.viewid,this.markup,this.editing.n);
			actions_text.getTextByVpos(this.markup[0],this.editing.viewid,true);
		}
	}
	,isTagVisible:function(tag) {
		return this.visibletags.indexOf(tag)>-1;
	}
	,onNextMarkup:function(opts) {
		if (!this.editing) return;
		var markups=this.viewmarkups[this.editing.viewid].markups;
		opts=opts||{};
		var n=this.editing.n;
		var tag=markups[n][2].tag;
		while (n<markups.length-1) {
			var py=markups[++n][2];
			if (py.shadow) continue;
			if (!this.isTagVisible(py.tag))continue;
			if (!opts.sametag) {
				break;
			} else if (tag==py.tag) {
				break;
			}
		}
		this.editNMarkup(markups,n);
	}
	,onPrevMarkup:function(opts){
		if (!this.editing) return;
		var markups=this.viewmarkups[this.editing.viewid].markups;
		opts=opts||{};
		var n=this.editing.n;
		var tag=markups[n][2].tag;

		while (n) {
			var py=markups[--n][2];
			if (py.shadow) continue;
			if (!this.isTagVisible(py.tag))continue;
			if (!opts.sametag) {
				break;
			} else if (tag==py.tag) {
				 break;
			}
		}
		this.editNMarkup(markups,n);
	}
	,onTokenPositionUpdated:function(positions,viewid) {
		this.viewpositions[viewid]=positions;
		var drawables=this.layoutMarkups();
		if (drawables) this.trigger(drawables);
	}
	,onAddHiddenView:function(viewid) {
		if (viewid && this.hiddenViews.indexOf(viewid)==-1) {
			this.hiddenViews.push(viewid);
			actions.cancelEdit();
			this.onMarkupUpdated();
		}
	}
	,onRemoveHiddenView:function(viewid){
		var at=this.hiddenViews.indexOf(viewid);
		if (at>-1) {
			this.hiddenViews.splice(at,1);
			actions.cancelEdit();
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
	,onSaveMarkup:function(viewid,n,markup,opts){
		this.viewmarkups[viewid].markups[n]=markup;
		opts=opts||{};
		if (opts.forceUpdate) {
			actions.cancelEdit();
			this.onMarkupUpdated();
		}
	}
	,onClearAllMarkups:function(){
		persistent.resetMarkups(this.markupsArrayForSerialize());
		actions.cancelEdit();
		this.onMarkupUpdated();
	}
	,forEachMarkup:function(cb) {//return no null to quit loop
		for (var i in this.viewmarkups) {
			if (this.viewIDs.indexOf(i)==-1) continue;
			var markups=this.viewmarkups[i].markups;
			for (var j=0;j<markups.length;j++) {
				var ret=cb(markups[j],i);
				if (ret) return ret;
			}
		}
	}
	,filterMarkup:function(cb) {//return no null to quit loop
		for (var i in this.viewmarkups) {
			if (this.hiddenViews.indexOf(i)>-1) {
				continue;
			}
			
			var markups=this.viewmarkups[i].markups;
			var out=[];			
			for (var j=0;j<markups.length;j++) {
				if (cb(markups[j],i)) {
					out.push(markups[j]);
				}
			}
			this.viewmarkups[i].markups=out;
		}
	}
	,getMasterMarkup:function(markup,viewid) { //return [mastermarkup,viewid]
		var payload=markup[2];
		var id=payload.id;
		if (id && !payload.shadow) return [markup,viewid];
		return this.forEachMarkup(function(m,viewid){
			if (m[2].id==id && !m[2].shadow) return [m,viewid];
		});
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
		this.sortMarkups(); //make sure it is sorted
		actions.cancelEdit();
		this.onMarkupUpdated();
	}

});

module.exports=store_markup;