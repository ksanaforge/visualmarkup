
var kde=require("ksana-database");
var Reflux=require("reflux");
var preloadfields=[["fields"],["extra"]];

var store_dsl=Reflux.createStore({
	listenables: [require("./actions")],
	onGetLectureTextByKepanId:function(kepanid) {
		kde.open("dsl_jwn",{preload:preloadfields},function(err,db){
			var N=db.get(["fields","kw","n"]);
			var vpos=db.get(["fields","kw","vpos"]);
			var n=N.indexOf(kepanid.toString());
			if (n!=-1){
				var fileseg=db.getFileSegByVpos(vpos[n]);
				db.get(["filecontents",fileseg.file,fileseg.seg+2],function(data){
					this.trigger(data,db);
				},this);
			}
		},this);		
	}
});

var store_kepan=Reflux.createStore({
	listenables: [require("./actions")],
	parseKepan:function(kepan) { //leading number is depth
		var depths=[],texts=[];
		for (var i=0;i<kepan.length;i++) {
			var depth=parseInt(kepan[i]);
			depths.push(depth);
			var at=kepan[i].indexOf(".");
			texts.push(kepan[i].substr(at+1));
		}
		return {texts:texts,depths:depths};
	},
	prepareKepan:function(db) {
		var extra=db.get(["extra"]);
		var fields=db.get(["fields"]);
		var kepan=this.parseKepan(extra.kepan_jwn);
		kepan.vpos=fields.kw_jwn.vpos;
		return kepan;
	},
	onGetKepan:function(){
		kde.open("ds",{preload:preloadfields},function(err,db){
			var kepan=this.prepareKepan(db);
			this.trigger(kepan,db);
		},this);
	},

});

var store_ds=Reflux.createStore({
	listenables: [require("./actions")],
	onGetSutraTextByKepanId:function(kepanid) {
		kde.open("ds",{preload:preloadfields},function(err,db){
			var N=db.get(["fields","kw_jwn","n"]);
			var vpos=db.get(["fields","kw_jwn","vpos"]);
			var n=N.indexOf(kepanid.toString());
			if (n!=-1){
				var fileseg=db.getFileSegByVpos(vpos[n]);
				db.get(["filecontents",fileseg.file,fileseg.seg+2],function(data){
					this.trigger(data,db);
				},this);
			}
		},this);		
	}
});

module.exports={ds:store_ds,dsl:store_dsl,kepan:store_kepan};
