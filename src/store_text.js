
var kde=require("ksana-database");
var kse=require("ksana-search");
var Reflux=require("reflux");
var preloadfields=[["fields"],["extra"]];
var actions=require("./actions_text");

var kepanIdToFileSeg=function(db,kepanid,fieldname) {
	if (!kepanid)return 1;
	var N=db.get(["fields",fieldname||"kw","n"]);
	var vpos=db.get(["fields",fieldname||"kw","vpos"]);
	var n=N.indexOf(kepanid.toString());
	if (n==-1) return null;
	var fileseg= db.fileSegFromVpos(vpos[n]);
	return fileseg;
};
var	segToKepanId=function(db,seg,fieldname) {
		var N=db.get(["fields",fieldname||"kw","n"]);
		var vpos=db.get(["fields",fieldname||"kw","vpos"]);
		var segoffsets=db.get("segoffsets");

		var i=kde.bsearch(vpos, segoffsets[seg-1] ,true);
		var nearest=vpos[i];
		if (i&&nearest>segoffsets[seg-1]) i--;
		return parseInt(N[i]);
		
};
var getTextBySelection=function(db,vpos,len) {
	var fseg=db.fileSegFromVpos(vpos);
	//make sure the text is already in memory
	var text=db.get(["filecontents",fseg.file,fseg.seg]);
	var startvpos=db.fileSegToVpos(fseg.file,fseg.seg);
	if (!text) return "";
	return text.substr(vpos-startvpos+1,len);
}
var getSegByVpos=function(db,vpos) {
	var fseg=db.fileSegFromVpos(vpos);
	return db.fileSegToAbsSeg(fseg.file,fseg.seg);
}
var store_dsl=Reflux.createStore({
	listenables: [actions],
	opendb:function(cb) {
		kde.open("dsl_jwn",{preload:preloadfields},function(err,db){
			if (!err) {
				this.db=db;
				if (cb) cb.apply(this,[db]);
			}
		},this);
	}
	,currentseg:0
	,init:function() {
		this.opendb();
	}
	,onGetLectureTextByKepanId:function(kepanid) {
		this.opendb(function(db){
			var fileseg=kepanIdToFileSeg(db,kepanid);
			if (fileseg){
				var seg=db.fileSegToAbsSeg(fileseg.file,fileseg.seg);
				this.onGetLectureTextBySeg(seg,true);
			}
		},this);		
	}
	,onGetTextByKepanId:function(viewid,kepanid){
		if (viewid!="lecture") return;
		if (kepanid!=this.getKepanId()) {
			this.onGetLectureTextByKepanId(kepanid);
		}
	}
	,onGetTextByVpos:function(vpos,viewid,nosync) {
		if (viewid!="lecture") return;
		if (!this.db)return; //this is trigger by markup jump, db should be realy
		var fileseg=this.db.fileSegFromVpos(vpos);
		if (fileseg) {
			var seg=this.db.fileSegToAbsSeg(fileseg.file,fileseg.seg);
			this.onGetLectureTextBySeg(seg,nosync);
		}
	}
	,onGetTextBySeg:function(viewid,seg,nosync){
		if (viewid!="lecture") return;
		this.onGetLectureTextBySeg(seg,nosync);
	}
	,onGetLectureTextBySeg:function(seg,nosync) {
		if (seg==this.currentseg) return;
		this.currentseg=seg;
		var fileseg=this.db.absSegToFileSeg(seg);
		var kepanid=segToKepanId(this.db,seg);
		this.kepanId=kepanid;
		this.startvpos=this.db.fileSegToVpos(fileseg.file,fileseg.seg);
		this.endvpos=this.db.fileSegToVpos(fileseg.file,fileseg.seg+1);

		kse.highlightSeg(this.db,fileseg.file,fileseg.seg,{token:true},function(data){
			this.trigger(data.text,seg,this.db,{nosync:nosync});
		},this);
	}
	,onNextPara:function(viewid) {
		if (viewid!="lecture") return;
		this.onNextLecturePara();
	}
	,onPrevPara:function(viewid) {
		if (viewid!="lecture") return;
		this.onPrevLecturePara();
	}
	,onNextLecturePara:function(){
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
	,onSyncSutra:function(totop) {
		if (totop||store_sutra.getKepanId()!=this.kepanId) {
			actions.getSutraTextByKepanId(this.kepanId);
		}
	}
	,onSyncKepan:function() {
		actions.goKepanId(this.kepanId) ; //this is not good, assuming kepanid start from 1
	}
	,getKepanId:function() {
		return this.kepanId;
	}
	,vposInSight:function(vpos) {
		return (vpos>=this.startvpos && vpos<this.endvpos);
	}
	,getTextBySelection:function(vpos,len) {
		return getTextBySelection(this.db,vpos,len);
	}
	,getSegByVpos:function(vpos) {
		return getSegByVpos(this.db,vpos);
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
		if (this.nkepan==n) return;
		this.nkepan=n;
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
	listenables: [actions]
	,currentseg:0
	,opendb:function(cb) {
		kde.open("ds",{preload:preloadfields},function(err,db){
			if (!err) cb.apply(this,[db]);
		},this);
	}
	,onGetTextByVpos:function(vpos,viewid,nosync) {
		if (viewid!="sutra") return;
		if (!this.db)return; //this is trigger by markup jump, db should be realy
		var fileseg=this.db.fileSegFromVpos(vpos);
		if (fileseg) {
			var seg=this.db.fileSegToAbsSeg(fileseg.file,fileseg.seg);
			this.onGetSutraTextBySeg(seg,nosync);
		}
	}
	,onGetSutraTextByKepanId:function(kepanid,nosync) {
		this.opendb(function(db){
			var fileseg=kepanIdToFileSeg(db,kepanid,"kw_jwn");
			this.db=db;
			if (fileseg){
				var seg=db.fileSegToAbsSeg(fileseg.file,fileseg.seg);
				this.onGetSutraTextBySeg(seg,nosync);
			};
		});
	}
	,onGetTextByKepanId:function(viewid,kepanid,nosync){
		if (viewid!="sutra") return;
		if (kepanid!=this.getKepanId()) {
			this.onGetSutraTextByKepanId(kepanid,nosync);
		}
	}
	,onSyncLecture:function(totop) {
		if (totop||store_lecture.getKepanId()!=this.kepanId) {
			actions.getLectureTextByKepanId(kepanid,nosync);
		}
	}
	,onSyncKepan:function() {
		actions.goKepanId(this.kepanId); //this is not good, assuming kepanid start from 1
	}
	,onGetTextBySeg:function(viewid,seg,nosync){
		if (viewid!="sutra") return;
		this.onGetSutraTextBySeg(seg,nosync);
	}
	,onNextPara:function(viewid) {
		if (viewid!="sutra") return;
		this.onNextSutraPara();
	}
	,onPrevPara:function(viewid) {
		if (viewid!="sutra") return;
		this.onPrevSutraPara();
	}
	,onGetSutraTextBySeg:function(seg,nosync) {
		if (seg==this.currentseg) return;
		this.currentseg=seg;
		var fileseg=this.db.absSegToFileSeg(seg);
		var kepanid=segToKepanId(this.db,seg,"kw_jwn");
		this.kepanId=kepanid;

		this.startvpos=this.db.fileSegToVpos(fileseg.file,fileseg.seg);
		this.endvpos=this.db.fileSegToVpos(fileseg.file,fileseg.seg+1);

		kse.highlightSeg(this.db,fileseg.file,fileseg.seg,{token:true},function(data){
			this.trigger(data.text,seg,this.db,{nosync:nosync});
		},this);
	}
	,onNextSutraPara:function(){
		if (!this.db) return;
		var segnames=this.db.get("segnames");
		if (this.currentseg+1>=segnames.length) return;
		this.onGetSutraTextBySeg(this.currentseg+1);
	}
	,onPrevSutraPara:function(){
		if (!this.db) return;
		var segnames=this.db.get("segnames");
		if (this.currentseg<2) return;
		this.onGetSutraTextBySeg(this.currentseg-1);
	}
	,getKepanId:function() {
		return this.kepanId;
	}
	,vposInSight:function(vpos) {
		return (vpos>=this.startvpos && vpos<this.endvpos);
	}
	,getTextBySelection:function(vpos,len) {
		return getTextBySelection(this.db,vpos,len);
	}
	,getSegByVpos:function(vpos) {
		return getSegByVpos(this.db,vpos);
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

module.exports={sutra:store_ds,lecture:store_dsl,kepan:store_kepan,dictionary:store_dictionary};
