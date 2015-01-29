var Reflux=require("reflux");
var actions=require("./actions_selection");

var store_selection=Reflux.createStore({
	listenables: [actions]
	,selections:{}
	,init:function() {
	}
	,removeOverlapSelection:function(selections,start,len) {
		return selections.filter(function(sel){
			return (sel[0]>start+len || sel[0]+sel[1]<start);
		});
	}
	,hasSameSelection:function(selections,start,len) {
		for (var i=0;i<selections.length;i++) {
			var sel=selections[i];
			if (sel[0]==start &&sel[1]==len) return i;
		}
		return -1;
	}
	,onClearSelection:function(viewid) {
		this.onSetSelection({},viewid);
	}
	,onClearSelections:function() {
		var keys=Object.keys(this.selections);
		var cleared={};
		for (var i=0;i<keys.length;i++) {
			cleared[keys[i]]=[];
		}
		this.onSetSelections(cleared);
	}
	,onAddSelection:function(viewid,existingselections,start,len,append) {
		var selections=JSON.parse(JSON.stringify(existingselections));
		var oldselections=selections;
		var same=this.hasSameSelection(selections,start,len);
		var updated=true;

		if (same>-1) { //toggle 
			selections.splice(same,1);
		} else {
			oldlength=selections.length;
			selections=this.removeOverlapSelection(selections,start,len);
			if (append && len) {
				selections.push([start,len]);
			} else {
				if (len) {
					selections=[[start,len]];
				} else {
					if (selections.length) selections=[];
					else updated=false;
				}
			}
		}

		if (updated) {
			actions.setSelection(selections , viewid);
		}
	}
	,onSetSelection:function(selections,viewid) {
		this.selections[viewid]=selections;
		actions.clearHighlights();
		this.trigger(this.selections,viewid);
	}
	,onSetSelections:function(viewselections) {
		for (var i in viewselections) {
			this.selections[i]=viewselections[i];
		}
		var updated=Object.keys(viewselections);
		for (var i=0;i<updated.length;i++){
			this.trigger(this.selections,updated[i]); //notify affected view
		}
		actions.clearHighlights();
	}
	,getSelections:function(){
		return this.selections;
	}
	,getSelection:function(viewid){
		return this.selections[viewid];
	}
});

module.exports=store_selection;