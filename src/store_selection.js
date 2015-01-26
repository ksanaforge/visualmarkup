var Reflux=require("reflux");
var actions=require("./actions_markup");

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
		//check overlap
		//remove all existing selection overlap with newselection
		//if newselection is exact matching an old selection, just remove it (unselect)
		//otherwise append
		//onSetSelction
	}
	,onSetSelection:function(selections,viewid) {
		this.selections[viewid]=selections;
		this.trigger(this.selections,viewid);
	}
	,getSelections:function(){
		return this.selections;
	}
	,getSelection:function(viewid){
		return this.selections[viewid];
	}
});

module.exports=store_selection;