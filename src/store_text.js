
var kde=require("ksana-database");
var kse=require("ksana-search");
var Reflux=require("reflux");
var preloadfields=[["fields"],["extra"]];
var actions=require("./actions_text");

var kepanIdToFileSeg=function(db,kepanid,fieldname) {
	var N=db.get(["fields",fieldname||"kw","n"]);
	var vpos=db.get(["fields",fieldname||"kw","vpos"]);
	var n=N.indexOf(kepanid.toString());
	if (n==-1) return null;
	var fileseg= db.fileSegFromVpos(vpos[n]);
	fileseg.seg+=1;
	return fileseg;
};
var	segToKepanId=function(db,seg,fieldname) {
		var N=db.get(["fields",fieldname||"kw","n"]);
		var vpos=db.get(["fields",fieldname||"kw","vpos"]);
		var segoffsets=db.get("segoffsets");
		var i=kde.bsearch(vpos, segoffsets[seg-1] ,true);
		var nearest=vpos[i];
		while (vpos[i+1]==nearest) i++;
		return N[i];
};

var store_dsl=Reflux.createStore({
	listenables: [actions],
	opendb:function(cb) {
		kde.open("dsl_jwn",{preload:preloadfields},function(err,db){
			if (!err) {
				this.db=db;
				cb.apply(this,[db]);
			}
		},this);
	},
	onGetLectureTextByKepanId:function(kepanid) {
		this.opendb(function(db){
			var fileseg=kepanIdToFileSeg(db,kepanid);
			if (fileseg){
				this.currentseg=db.fileSegToAbsSeg(fileseg.file,fileseg.seg);
				this.onGetLectureTextBySeg(this.currentseg);
			}
		},this);		
	},
	onGetLectureTextBySeg:function(seg) {
		var fileseg=this.db.absSegToFileSeg(seg);
		this.currentseg=seg;
		var kepanid=segToKepanId(this.db,seg);

		this.kepanid=kepanid;
		kse.highlightSeg(this.db,fileseg.file,fileseg.seg,{token:true},function(data){
			this.trigger(data.text,this.db);
		},this);
	},
	onNextLecturePara:function(){
		if (!this.db) return;
		var segnames=this.db.get("segnames");
		if (this.currentseg+1>=segnames.length) return;
		this.onGetLectureTextBySeg(this.currentseg+1);
	},
	onPrevLecturePara:function(){
		if (!this.db) return;
		var segnames=this.db.get("segnames");
		if (this.currentseg<2) return;
		this.onGetLectureTextBySeg(this.currentseg-1);
	}
});

var store_kepan=Reflux.createStore({
	listenables: [actions],
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
	onGoKepanId:function(n) {
		if (!this.db) return ;
		this.trigger(n,this.db);
	},
	onGetKepan:function(){
		kde.open("ds",{preload:preloadfields},function(err,db){
			var kepan=this.prepareKepan(db);
			this.db=db;
			this.trigger(kepan,db);
		},this);
	},

});

var store_ds=Reflux.createStore({
	listenables: [actions],
	opendb:function(cb) {
		kde.open("ds",{preload:preloadfields},function(err,db){
			if (!err) cb.apply(this,[db]);
		},this);
	},
	onGetSutraTextByKepanId:function(kepanid) {
		this.opendb(function(db){
			var fileseg=kepanIdToFileSeg(db,kepanid,"kw_jwn");
			this.db=db;
			if (fileseg){
				this.currentseg=db.fileSegToAbsSeg(fileseg.file,fileseg.seg);
				this.onGetSutraTextBySeg(this.currentseg,false);
			};
		});
	},
	onGetSutraTextBySeg:function(seg,synckepan) {
		this.currentseg=seg;
		var fileseg=this.db.absSegToFileSeg(seg);
		var kepanid=segToKepanId(this.db,seg,"kw_jwn");
		if (kepanid && kepanid!=this.kepanId) {
			actions.getLectureTextByKepanId(kepanid);
			if (synckepan) actions.goKepanId(parseInt(kepanid)) ; //this is not good, assuming kepanid start from 1
		}
		this.kepanid=kepanid;

		kse.highlightSeg(this.db,fileseg.file,fileseg.seg,{token:true},function(data){
			this.trigger(data.text,this.db);
		},this);
	},
	onNextSutraPara:function(){
		if (!this.db) return;
		var segnames=this.db.get("segnames");
		if (this.currentseg+1>=segnames.length) return;
		this.onGetSutraTextBySeg(this.currentseg+1,true);
	},
	onPrevSutraPara:function(){
		if (!this.db) return;
		var segnames=this.db.get("segnames");
		if (this.currentseg<2) return;
		this.onGetSutraTextBySeg(this.currentseg-1,true);
	}

});

var matchEntries=function(entries,tofind) {
	var res=[];
	for (var i=0;i<tofind.length;i++) {
		var sub=tofind.substr(0,i+1);
		var idx=kde.bsearch(entries,sub);
		if (entries[idx]==sub) {
			res.unshift(idx);
		}
	}
	return res;
}
var fetchDef=function(db,segids,cb,context) {
	var paths=[];
	for (var i=0;i<segids.length;i++) {
		var fileseg=db.absSegToFileSeg(segids[i]);
		paths.push(["filecontents",fileseg.file,fileseg.seg]);
	}
	if (paths.length==0) return;
	db.get(paths,function(data){
		cb.apply(context,[data]);
	});
}
var store_dictionary=Reflux.createStore({
	listenables: [actions],
	onSearchDictionary:function(tofind,vpos,viewid) {
		if (!tofind) return;
		kde.open("moedict",function(err,db){
			var entries=db.get("segnames");
			var segids=matchEntries(entries,tofind);
			fetchDef(db,segids,function(data){
				this.trigger(data,{db:db,vpos:vpos,viewid:viewid});
			},this); 
			
		},this);
	}
});

module.exports={ds:store_ds,dsl:store_dsl,kepan:store_kepan,dictionary:store_dictionary};
