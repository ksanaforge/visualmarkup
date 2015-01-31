(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\ksana2015\\node_modules\\ksana-analyzer\\configs.js":[function(require,module,exports){
var tokenizers=require('./tokenizers');
var normalizeTbl=null;
var setNormalizeTable=function(tbl,obj) {
	if (!obj) {
		obj={};
		for (var i=0;i<tbl.length;i++) {
			var arr=tbl[i].split("=");
			obj[arr[0]]=arr[1];
		}
	}
	normalizeTbl=obj;
	return obj;
}
var normalize1=function(token) {
	if (!token) return "";
	token=token.replace(/[ \n\.,，。！．「」：；、]/g,'').trim();
	if (!normalizeTbl) return token;
	if (token.length==1) {
		return normalizeTbl[token] || token;
	} else {
		for (var i=0;i<token.length;i++) {
			token[i]=normalizeTbl[token[i]] || token[i];
		}
		return token;
	}
}
var isSkip1=function(token) {
	var t=token.trim();
	return (t=="" || t=="　" || t=="※" || t=="\n");
}
var normalize_tibetan=function(token) {
	return token.replace(/[།་ ]/g,'').trim();
}

var isSkip_tibetan=function(token) {
	var t=token.trim();
	return (t=="" || t=="　" ||  t=="\n");	
}
var simple1={
	func:{
		tokenize:tokenizers.simple
		,setNormalizeTable:setNormalizeTable
		,normalize: normalize1
		,isSkip:	isSkip1
	}
	
}
var tibetan1={
	func:{
		tokenize:tokenizers.tibetan
		,setNormalizeTable:setNormalizeTable
		,normalize:normalize_tibetan
		,isSkip:isSkip_tibetan
	}
}
module.exports={"simple1":simple1,"tibetan1":tibetan1}
},{"./tokenizers":"C:\\ksana2015\\node_modules\\ksana-analyzer\\tokenizers.js"}],"C:\\ksana2015\\node_modules\\ksana-analyzer\\index.js":[function(require,module,exports){
/* 
  custom func for building and searching ydb

  keep all version
  
  getAPI(version); //return hash of functions , if ver is omit , return lastest
	
  postings2Tree      // if version is not supply, get lastest
  tokenize(text,api) // convert a string into tokens(depends on other api)
  normalizeToken     // stemming and etc
  isSpaceChar        // not a searchable token
  isSkipChar         // 0 vpos

  for client and server side
  
*/
var configs=require("./configs");
var config_simple="simple1";
var optimize=function(json,config) {
	config=config||config_simple;
	return json;
}

var getAPI=function(config) {
	config=config||config_simple;
	var func=configs[config].func;
	func.optimize=optimize;
	if (config=="simple1") {
		//add common custom function here
	} else if (config=="tibetan1") {

	} else throw "config "+config +"not supported";

	return func;
}

module.exports={getAPI:getAPI};
},{"./configs":"C:\\ksana2015\\node_modules\\ksana-analyzer\\configs.js"}],"C:\\ksana2015\\node_modules\\ksana-analyzer\\tokenizers.js":[function(require,module,exports){
var tibetan =function(s) {
	//continuous tsheg grouped into same token
	//shad and space grouped into same token
	var offset=0;
	var tokens=[],offsets=[];
	s=s.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
	var arr=s.split('\n');

	for (var i=0;i<arr.length;i++) {
		var last=0;
		var str=arr[i];
		str.replace(/[།་ ]+/g,function(m,m1){
			tokens.push(str.substring(last,m1)+m);
			offsets.push(offset+last);
			last=m1+m.length;
		});
		if (last<str.length) {
			tokens.push(str.substring(last));
			offsets.push(last);
		}
		if (i===arr.length-1) break;
		tokens.push('\n');
		offsets.push(offset+last);
		offset+=str.length+1;
	}

	return {tokens:tokens,offsets:offsets};
};
var isSpace=function(c) {
	return (c==" ") ;//|| (c==",") || (c==".");
}
var isCJK =function(c) {return ((c>=0x3000 && c<=0x9FFF) 
|| (c>=0xD800 && c<0xDC00) || (c>=0xFF00) ) ;}
var simple1=function(s) {
	var offset=0;
	var tokens=[],offsets=[];
	s=s.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
	arr=s.split('\n');

	var pushtoken=function(t,off) {
		var i=0;
		if (t.charCodeAt(0)>255) {
			while (i<t.length) {
				var c=t.charCodeAt(i);
				offsets.push(off+i);
				tokens.push(t[i]);
				if (c>=0xD800 && c<=0xDFFF) {
					tokens[tokens.length-1]+=t[i]; //extension B,C,D
				}
				i++;
			}
		} else {
			tokens.push(t);
			offsets.push(off);	
		}
	}
	for (var i=0;i<arr.length;i++) {
		var last=0,sp="";
		str=arr[i];
		str.replace(/[_0-9A-Za-z]+/g,function(m,m1){
			while (isSpace(sp=str[last]) && last<str.length) {
				tokens[tokens.length-1]+=sp;
				last++;
			}
			pushtoken(str.substring(last,m1)+m , offset+last);
			offsets.push(offset+last);
			last=m1+m.length;
		});

		if (last<str.length) {
			while (isSpace(sp=str[last]) && last<str.length) {
				tokens[tokens.length-1]+=sp;
				last++;
			}
			pushtoken(str.substring(last), offset+last);
			
		}		
		offsets.push(offset+last);
		offset+=str.length+1;
		if (i===arr.length-1) break;
		tokens.push('\n');
	}

	return {tokens:tokens,offsets:offsets};

};

var simple=function(s) {
	var token='';
	var tokens=[], offsets=[] ;
	var i=0; 
	var lastspace=false;
	var addtoken=function() {
		if (!token) return;
		tokens.push(token);
		offsets.push(i);
		token='';
	}
	while (i<s.length) {
		var c=s.charAt(i);
		var code=s.charCodeAt(i);
		if (isCJK(code)) {
			addtoken();
			token=c;
			if (code>=0xD800 && code<0xDC00) { //high sorragate
				token+=s.charAt(i+1);i++;
			}
			addtoken();
		} else {
			if (c=='&' || c=='<' || c=='?' || c=="," || c=="."
			|| c=='|' || c=='~' || c=='`' || c==';' 
			|| c=='>' || c==':' 
			|| c=='=' || c=='@'  || c=="-" 
			|| c==']' || c=='}'  || c==")" 
			//|| c=='{' || c=='}'|| c=='[' || c==']' || c=='(' || c==')'
			|| code==0xf0b || code==0xf0d // tibetan space
			|| (code>=0x2000 && code<=0x206f)) {
				addtoken();
				if (c=='&' || c=='<'){ // || c=='{'|| c=='('|| c=='[') {
					var endchar='>';
					if (c=='&') endchar=';'
					//else if (c=='{') endchar='}';
					//else if (c=='[') endchar=']';
					//else if (c=='(') endchar=')';

					while (i<s.length && s.charAt(i)!=endchar) {
						token+=s.charAt(i);
						i++;
					}
					token+=endchar;
					addtoken();
				} else {
					token=c;
					addtoken();
				}
				token='';
			} else {
				if (c==" ") {
					token+=c;
					lastspace=true;
				} else {
					if (lastspace) addtoken();
					lastspace=false;
					token+=c;
				}
			}
		}
		i++;
	}
	addtoken();
	return {tokens:tokens,offsets:offsets};
}
module.exports={simple:simple,tibetan:tibetan};
},{}],"C:\\ksana2015\\node_modules\\ksana-database\\bsearch.js":[function(require,module,exports){
var indexOfSorted = function (array, obj, near) { 
  var low = 0,
  high = array.length;
  while (low < high) {
    var mid = (low + high) >> 1;
    if (array[mid]==obj) return mid;
    array[mid] < obj ? low = mid + 1 : high = mid;
  }
  if (near) return low;
  else if (array[low]==obj) return low;else return -1;
};
var indexOfSorted_str = function (array, obj, near) { 
  var low = 0,
  high = array.length;
  while (low < high) {
    var mid = (low + high) >> 1;
    if (array[mid]==obj) return mid;
    //(array[mid].localeCompare(obj)<0) ? low = mid + 1 : high = mid;
    array[mid]<obj ? low=mid+1 : high=mid;
  }
  if (near) return low;
  else if (array[low]==obj) return low;else return -1;
};


var bsearch=function(array,value,near) {
	var func=indexOfSorted;
	if (typeof array[0]=="string") func=indexOfSorted_str;
	return func(array,value,near);
}
var bsearchNear=function(array,value) {
	return bsearch(array,value,true);
}

module.exports=bsearch;//{bsearchNear:bsearchNear,bsearch:bsearch};
},{}],"C:\\ksana2015\\node_modules\\ksana-database\\index.js":[function(require,module,exports){
var KDE=require("./kde");
//currently only support node.js fs, ksanagap native fs, html5 file system
//use socket.io to read kdb from remote server in future
module.exports=KDE;
},{"./kde":"C:\\ksana2015\\node_modules\\ksana-database\\kde.js"}],"C:\\ksana2015\\node_modules\\ksana-database\\kde.js":[function(require,module,exports){
/* Ksana Database Engine

   2015/1/2 , 
   move to ksana-database
   simplified by removing document support and socket.io support


*/
var pool={},localPool={};
var apppath="";
var bsearch=require("./bsearch");
var Kdb=require('ksana-jsonrom');
var kdbs=[]; //available kdb , id and absolute path
var strsep="\uffff";
var kdblisted=false;
/*
var _getSync=function(paths,opts) {
	var out=[];
	for (var i in paths) {
		out.push(this.getSync(paths[i],opts));	
	}
	return out;
}
*/
var _gets=function(paths,opts,cb) { //get many data with one call

	if (!paths) return ;
	if (typeof paths=='string') {
		paths=[paths];
	}
	var engine=this, output=[];

	var makecb=function(path){
		return function(data){
				if (!(data && typeof data =='object' && data.__empty)) output.push(data);
				engine.get(path,opts,taskqueue.shift());
		};
	};

	var taskqueue=[];
	for (var i=0;i<paths.length;i++) {
		if (typeof paths[i]=="null") { //this is only a place holder for key data already in client cache
			output.push(null);
		} else {
			taskqueue.push(makecb(paths[i]));
		}
	};

	taskqueue.push(function(data){
		output.push(data);
		cb.apply(engine.context||engine,[output,paths]); //return to caller
	});

	taskqueue.shift()({__empty:true}); //run the task
}

var getFileRange=function(i) {
	var engine=this;

	var filesegcount=engine.get(["filesegcount"]);
	if (filesegcount) {
		if (i==0) {
			return {start:0,end:filesegcount[0]-1};
		} else {
			return {start:filesegcount[i-1],end:filesegcount[i]-1};
		}
	}
	//old buggy code
	var filenames=engine.get(["filenames"]);
	var fileoffsets=engine.get(["fileoffsets"]);
	var segoffsets=engine.get(["segoffsets"]);
	var segnames=engine.get(["segnames"]);
	var filestart=fileoffsets[i], fileend=fileoffsets[i+1]-1;

	var start=bsearch(segoffsets,filestart,true);
	//if (segOffsets[start]==fileStart) start--;
	
	//work around for jiangkangyur
	while (segNames[start+1]=="_") start++;

  //if (i==0) start=0; //work around for first file
	var end=bsearch(segoffsets,fileend,true);
	return {start:start,end:end};
}

var absSegToFileSeg=function(absoluteseg) {
	var filesegcount=this.get("filesegcount");
	var s=absoluteseg;
	var file=0;
	while (s>filesegcount[file]) {
		s-=filesegcount[file];
		file++;
	}
	return {file:file,seg:s};
}

var fileSegToAbsSeg=function(file,seg) {
	if (file==0)return seg;
	return this.get("filesegcount")[file]+(seg);
}
/*
var vposToFileSeg=function(engine,vpos) {
    var segoffsets=engine.get("segoffsets");
    var fileoffsets=engine.get(["fileoffsets"]);
    var segnames=engine.get("segnames");
    var fileid=bsearch(fileoffsets,vpos+1,true);
    fileid--;
    var segid=bsearch(segoffsets,vpos+1,true);
	var range=engine.getFileRange(fileid);
	segid-=range.start;
    return {file:fileid,seg:segid};
}
*/
//return array of object of nfile nseg given segname
var findSeg=function(segname) {
	var segnames=this.get("segnames");
	var out=[];
	for (var i=0;i<segnames.length;i++) {
		if (segnames[i]==segname) {
			var fileseg=absSegToFileSeg.apply(this,[i]);
			out.push({file:fileseg.file,seg:fileseg.seg,absseg:i});
		}
	}
	return out;
}
var getFileSegOffsets=function(i) {
	var segoffsets=this.get("segoffsets");
	var range=getFileRange.apply(this,[i]);
	if (segoffsets.subarray) {
		return segoffsets.subarray(range.start,range.end+1);
	} else {
		return segoffsets.slice(range.start,range.end+1);	
	}
	

}

var fileSegFromVpos=function(vpos) { 
	var segoffsets=this.get(["segoffsets"]);
	var i=bsearch(segoffsets,vpos,true);
	while (segoffsets[i]==vpos) i++;
	return absSegToFileSeg.apply(this,[i]);
}
var fileSegToVpos=function(f,s) {
	var segoffsets=this.get(["segoffsets"]);
	var seg=fileSegToAbsSeg(f,s);
	return segoffsets[seg-1];
}

var getFileSegNames=function(i) {
	var range=getFileRange.apply(this,[i]);
	var segnames=this.get("segnames");
	return segnames.slice(range.start,range.end+1);
}
var localengine_get=function(path,opts,cb,context) {
	var engine=this;
	if (typeof opts=="function") {
		context=cb;
		cb=opts;
		opts={recursive:false};
	}
	if (!path) {
		if (cb) cb.apply(context,[null]);
		return null;
	}

	if (typeof cb!="function") {
		return engine.kdb.get(path,opts);
	}

	if (typeof path=="string") {
		return engine.kdb.get([path],opts,cb,context);
	} else if (typeof path[0] =="string") {
		return engine.kdb.get(path,opts,cb,context);
	} else if (typeof path[0] =="object") {
		return _gets.apply(engine,[path,opts,cb,context]);
	} else {
		engine.kdb.get([],opts,function(data){
			cb.apply(context,[data]);//return top level keys
		},context);
	}
};	

var getPreloadField=function(user) {
	var preload=[["meta"],["filenames"],["fileoffsets"],["segnames"],["segoffsets"],["filesegcount"]];
	//["tokens"],["postingslen"] kse will load it
	if (user && user.length) { //user supply preload
		for (var i=0;i<user.length;i++) {
			if (preload.indexOf(user[i])==-1) {
				preload.push(user[i]);
			}
		}
	}
	return preload;
}
var createLocalEngine=function(kdb,opts,cb,context) {
	var engine={kdb:kdb, queryCache:{}, postingCache:{}, cache:{}};

	if (typeof context=="object") engine.context=context;
	engine.get=localengine_get;

	engine.segOffset=segOffset;
	engine.fileOffset=fileOffset;
	engine.getFileSegNames=getFileSegNames;
	engine.getFileSegOffsets=getFileSegOffsets;
	engine.getFileRange=getFileRange;
	engine.findSeg=findSeg;
	engine.absSegToFileSeg=absSegToFileSeg;
	engine.fileSegToAbsSeg=fileSegToAbsSeg;
	engine.fileSegFromVpos=fileSegFromVpos;
	engine.fileSegToVpos=fileSegToVpos;
	
	//engine.fileSegToVpos=fileSegToVpos;
	//engine.vposToFileSeg=vposToFileSeg;
	//only local engine allow getSync
	//if (kdb.fs.getSync) engine.getSync=engine.kdb.getSync;
	
	//speedy native functions
	if (kdb.fs.mergePostings) {
		engine.mergePostings=kdb.fs.mergePostings.bind(kdb.fs);
	}
	
	var setPreload=function(res) {
		engine.dbname=res[0].name;
		//engine.customfunc=customfunc.getAPI(res[0].config);
		engine.ready=true;
	}

	var preload=getPreloadField(opts.preload);
	var opts={recursive:true};
	//if (typeof cb=="function") {
		_gets.apply(engine,[ preload, opts,function(res){
			setPreload(res);
			cb.apply(engine.context,[engine]);
		}]);
	//} else {
	//	setPreload(_getSync.apply(engine,[preload,opts]));
	//}
	return engine;
}

var segOffset=function(segname) {
	var engine=this;
	if (arguments.length>1) throw "argument : segname ";

	var segNames=engine.get("segnames");
	var segOffsets=engine.get("segoffsets");

	var i=segNames.indexOf(segname);
	return (i>-1)?segOffsets[i]:0;
}
var fileOffset=function(fn) {
	var engine=this;
	var filenames=engine.get("filenames");
	var offsets=engine.get("fileoffsets");
	var i=filenames.indexOf(fn);
	if (i==-1) return null;
	return {start: offsets[i], end:offsets[i+1]};
}

var folderOffset=function(folder) {
	var engine=this;
	var start=0,end=0;
	var filenames=engine.get("filenames");
	var offsets=engine.get("fileoffsets");
	for (var i=0;i<filenames.length;i++) {
		if (filenames[i].substring(0,folder.length)==folder) {
			if (!start) start=offsets[i];
			end=offsets[i];
		} else if (start) break;
	}
	return {start:start,end:end};
}

 //TODO delete directly from kdb instance
 //kdb.free();
var closeLocal=function(kdbid) {
	var engine=localPool[kdbid];
	if (engine) {
		engine.kdb.free();
		delete localPool[kdbid];
	}
}
var close=function(kdbid) {
	var engine=pool[kdbid];
	if (engine) {
		engine.kdb.free();
		delete pool[kdbid];
	}
}

var getLocalTries=function(kdbfn) {
	if (!kdblisted) {
		kdbs=require("./listkdb")();
		kdblisted=true;
	}

	var kdbid=kdbfn.replace('.kdb','');
	var tries= ["./"+kdbid+".kdb"
	           ,"../"+kdbid+".kdb"
	];

	for (var i=0;i<kdbs.length;i++) {
		if (kdbs[i][0]==kdbid) {
			tries.push(kdbs[i][1]);
		}
	}
	return tries;
}
var openLocalKsanagap=function(kdbid,opts,cb,context) {
	var kdbfn=kdbid;
	var tries=getLocalTries(kdbfn);

	for (var i=0;i<tries.length;i++) {
		if (fs.existsSync(tries[i])) {
			//console.log("kdb path: "+nodeRequire('path').resolve(tries[i]));
			var kdb=new Kdb.open(tries[i],function(err,kdb){
				if (err) {
					cb.apply(context,[err]);
				} else {
					createLocalEngine(kdb,opts,function(engine){
						localPool[kdbid]=engine;
						cb.apply(context||engine.context,[0,engine]);
					},context);
				}
			});
			return null;
		}
	}
	if (cb) cb.apply(context,[kdbid+" not found"]);
	return null;

}
var openLocalNode=function(kdbid,opts,cb,context) {
	var fs=require('fs');
	var tries=getLocalTries(kdbid);

	for (var i=0;i<tries.length;i++) {
		if (fs.existsSync(tries[i])) {

			new Kdb.open(tries[i],function(err,kdb){
				if (err) {
					cb.apply(context||engine.content,[err]);
				} else {
					createLocalEngine(kdb,opts,function(engine){
							localPool[kdbid]=engine;
							cb.apply(context||engine.context,[0,engine]);
					},context);
				}
			});
			return null;
		}
	}
	if (cb) cb.apply(context,[kdbid+" not found"]);
	return null;
}

var openLocalHtml5=function(kdbid,opts,cb,context) {	
	var engine=localPool[kdbid];
	var kdbfn=kdbid;
	if (kdbfn.indexOf(".kdb")==-1) kdbfn+=".kdb";
	new Kdb.open(kdbfn,function(err,handle){
		if (err) {
			cb.apply(context,[err]);
		} else {
			createLocalEngine(handle,opts,function(engine){
				localPool[kdbid]=engine;
				cb.apply(context||engine.context,[0,engine]);
			},context);
		}
	});
}
//omit cb for syncronize open
var openLocal=function(kdbid,opts,cb,context)  {
	if (typeof opts=="function") { //no opts
		if (typeof cb=="object") context=cb;
		cb=opts;
		opts={};
	}

	var engine=localPool[kdbid];
	if (engine) {
		if (cb) cb.apply(context||engine.context,[0,engine]);
		return engine;
	}

	var platform=require("./platform").getPlatform();
	if (platform=="node-webkit" || platform=="node") {
		openLocalNode(kdbid,opts,cb,context);
	} else if (platform=="html5" || platform=="chrome"){
		openLocalHtml5(kdbid,opts,cb,context);		
	} else {
		openLocalKsanagap(kdbid,opts,cb,context);	
	}
}
var setPath=function(path) {
	apppath=path;
	console.log("set path",path)
}

var enumKdb=function(cb,context){
	return kdbs.map(function(k){return k[0]});
}

module.exports={open:openLocal,setPath:setPath, close:closeLocal, enumKdb:enumKdb, bsearch:bsearch};
},{"./bsearch":"C:\\ksana2015\\node_modules\\ksana-database\\bsearch.js","./listkdb":"C:\\ksana2015\\node_modules\\ksana-database\\listkdb.js","./platform":"C:\\ksana2015\\node_modules\\ksana-database\\platform.js","fs":false,"ksana-jsonrom":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\index.js"}],"C:\\ksana2015\\node_modules\\ksana-database\\listkdb.js":[function(require,module,exports){
/* return array of dbid and absolute path*/
var listkdb_html5=function() {
	throw "not implement yet";
	require("ksana-jsonrom").html5fs.readdir(function(kdbs){
			cb.apply(this,[kdbs]);
	},context||this);		

}

var listkdb_node=function(){
	var fs=require("fs");
	var path=require("path")
	var parent=path.resolve(process.cwd(),"..");
	var files=fs.readdirSync(parent);
	var output=[];
	files.map(function(f){
		var subdir=parent+path.sep+f;
		var stat=fs.statSync(subdir );
		if (stat.isDirectory()) {
			var subfiles=fs.readdirSync(subdir);
			for (var i=0;i<subfiles.length;i++) {
				var file=subfiles[i];
				var idx=file.indexOf(".kdb");
				if (idx>-1&&idx==file.length-4) {
					output.push([ file.substr(0,file.length-4), subdir+path.sep+file]);
				}
			}
		}
	})
	return output;
}
var fileNameOnly=function(fn) {
	var at=fn.lastIndexOf("/");
	if (at>-1) return fn.substr(at+1);
	return fn;
}
var listkdb_ksanagap=function() {
	var output=[];
	var apps=JSON.parse(kfs.listApps());
	for (var i=0;i<apps.length;i++) {
		var app=apps[i];
		if (app.files) for (var j=0;j<app.files.length;j++) {
			var file=app.files[j];
			if (file.substr(file.length-4)==".kdb") {
				output.push([app.dbid,fileNameOnly(file)]);
			}
		}
	};
	return output;
}
var listkdb=function() {
	var platform=require("./platform").getPlatform();
	var files=[];
	if (platform=="node" || platform=="node-webkit") {
		files=listkdb_node();
	} else if (typeof kfs!="undefined") {
		files=listkdb_ksanagap();
	} else {
		throw "not implement yet";
	}
	return files;
}
module.exports=listkdb;
},{"./platform":"C:\\ksana2015\\node_modules\\ksana-database\\platform.js","fs":false,"ksana-jsonrom":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\index.js","path":false}],"C:\\ksana2015\\node_modules\\ksana-database\\platform.js":[function(require,module,exports){
var getPlatform=function() {
	if (typeof ksanagap=="undefined") {
		platform="node";
	} else {
		platform=ksanagap.platform;
	}
	return platform;
}
module.exports={getPlatform:getPlatform};
},{}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\html5read.js":[function(require,module,exports){

/* emulate filesystem on html5 browser */
/* emulate filesystem on html5 browser */
var read=function(handle,buffer,offset,length,position,cb) {//buffer and offset is not used
	var xhr = new XMLHttpRequest();
	xhr.open('GET', handle.url , true);
	var range=[position,length+position-1];
	xhr.setRequestHeader('Range', 'bytes='+range[0]+'-'+range[1]);
	xhr.responseType = 'arraybuffer';
	xhr.send();
	xhr.onload = function(e) {
		var that=this;
		setTimeout(function(){
			cb(0,that.response.byteLength,that.response);
		},0);
	}; 
}
var close=function(handle) {}
var fstatSync=function(handle) {
	throw "not implement yet";
}
var fstat=function(handle,cb) {
	throw "not implement yet";
}
var _open=function(fn_url,cb) {
		var handle={};
		if (fn_url.indexOf("filesystem:")==0){
			handle.url=fn_url;
			handle.fn=fn_url.substr( fn_url.lastIndexOf("/")+1);
		} else {
			handle.fn=fn_url;
			var url=API.files.filter(function(f){ return (f[0]==fn_url)});
			if (url.length) handle.url=url[0][1];
			else cb(null);
		}
		cb(handle);
}
var open=function(fn_url,cb) {
		if (!API.initialized) {init(1024*1024,function(){
			_open.apply(this,[fn_url,cb]);
		},this)} else _open.apply(this,[fn_url,cb]);
}
var load=function(filename,mode,cb) {
	open(filename,mode,cb,true);
}
function errorHandler(e) {
	console.error('Error: ' +e.name+ " "+e.message);
}
var readdir=function(cb,context) {
	 var dirReader = API.fs.root.createReader();
	 var out=[],that=this;
		dirReader.readEntries(function(entries) {
			if (entries.length) {
				for (var i = 0, entry; entry = entries[i]; ++i) {
					if (entry.isFile) {
						out.push([entry.name,entry.toURL ? entry.toURL() : entry.toURI()]);
					}
				}
			}
			API.files=out;
			if (cb) cb.apply(context,[out]);
		}, function(){
			if (cb) cb.apply(context,[null]);
		});
}
var initfs=function(grantedBytes,cb,context) {
	webkitRequestFileSystem(PERSISTENT, grantedBytes,  function(fs) {
		API.fs=fs;
		API.quota=grantedBytes;
		readdir(function(){
			API.initialized=true;
			cb.apply(context,[grantedBytes,fs]);
		},context);
	}, errorHandler);
}
var init=function(quota,cb,context) {
	navigator.webkitPersistentStorage.requestQuota(quota, 
			function(grantedBytes) {
				initfs(grantedBytes,cb,context);
		}, errorHandler 
	);
}
var API={
	read:read
	,readdir:readdir
	,open:open
	,close:close
	,fstatSync:fstatSync
	,fstat:fstat
}
module.exports=API;
},{}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\index.js":[function(require,module,exports){
module.exports={
	open:require("./kdb")
}

},{"./kdb":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdb.js"}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdb.js":[function(require,module,exports){
/*
	KDB version 3.0 GPL
	yapcheahshen@gmail.com
	2013/12/28
	asyncronize version of yadb

  remove dependency of Q, thanks to
  http://stackoverflow.com/questions/4234619/how-to-avoid-long-nesting-of-asynchronous-functions-in-node-js

  2015/1/2
  moved to ksanaforge/ksana-jsonrom
  add err in callback for node.js compliant
*/
var Kfs=null;

if (typeof ksanagap=="undefined") {
	Kfs=require('./kdbfs');			
} else {
	if (ksanagap.platform=="ios") {
		Kfs=require("./kdbfs_ios");
	} else if (ksanagap.platform=="node-webkit") {
		Kfs=require("./kdbfs");
	} else if (ksanagap.platform=="chrome") {
		Kfs=require("./kdbfs");
	} else {
		Kfs=require("./kdbfs_android");
	}
		
}


var DT={
	uint8:'1', //unsigned 1 byte integer
	int32:'4', // signed 4 bytes integer
	utf8:'8',  
	ucs2:'2',
	bool:'^', 
	blob:'&',
	utf8arr:'*', //shift of 8
	ucs2arr:'@', //shift of 2
	uint8arr:'!', //shift of 1
	int32arr:'$', //shift of 4
	vint:'`',
	pint:'~',	

	array:'\u001b',
	object:'\u001a' 
	//ydb start with object signature,
	//type a ydb in command prompt shows nothing
}
var verbose=0, readLog=function(){};
var _readLog=function(readtype,bytes) {
	console.log(readtype,bytes,"bytes");
}
if (verbose) readLog=_readLog;
var strsep="\uffff";
var Create=function(path,opts,cb) {
	/* loadxxx functions move file pointer */
	// load variable length int
	if (typeof opts=="function") {
		cb=opts;
		opts={};
	}

	
	var loadVInt =function(opts,blocksize,count,cb) {
		//if (count==0) return [];
		var that=this;

		this.fs.readBuf_packedint(opts.cur,blocksize,count,true,function(o){
			//console.log("vint");
			opts.cur+=o.adv;
			cb.apply(that,[o.data]);
		});
	}
	var loadVInt1=function(opts,cb) {
		var that=this;
		loadVInt.apply(this,[opts,6,1,function(data){
			//console.log("vint1");
			cb.apply(that,[data[0]]);
		}])
	}
	//for postings
	var loadPInt =function(opts,blocksize,count,cb) {
		var that=this;
		this.fs.readBuf_packedint(opts.cur,blocksize,count,false,function(o){
			//console.log("pint");
			opts.cur+=o.adv;
			cb.apply(that,[o.data]);
		});
	}
	// item can be any type (variable length)
	// maximum size of array is 1TB 2^40
	// structure:
	// signature,5 bytes offset, payload, itemlengths
	var getArrayLength=function(opts,cb) {
		var that=this;
		var dataoffset=0;

		this.fs.readUI8(opts.cur,function(len){
			var lengthoffset=len*4294967296;
			opts.cur++;
			that.fs.readUI32(opts.cur,function(len){
				opts.cur+=4;
				dataoffset=opts.cur; //keep this
				lengthoffset+=len;
				opts.cur+=lengthoffset;

				loadVInt1.apply(that,[opts,function(count){
					loadVInt.apply(that,[opts,count*6,count,function(sz){						
						cb({count:count,sz:sz,offset:dataoffset});
					}]);
				}]);
				
			});
		});
	}

	var loadArray = function(opts,blocksize,cb) {
		var that=this;
		getArrayLength.apply(this,[opts,function(L){
				var o=[];
				var endcur=opts.cur;
				opts.cur=L.offset;

				if (opts.lazy) { 
						var offset=L.offset;
						for (var i=0;i<L.sz.length;i++) {
							var sz=L.sz[i];
							o[o.length]=strsep+offset.toString(16)
								   +strsep+sz.toString(16);
							offset+=sz;
						};
				} else {
					var taskqueue=[];
					for (var i=0;i<L.count;i++) {
						taskqueue.push(
							(function(sz){
								return (
									function(data){
										if (typeof data=='object' && data.__empty) {
											 //not pushing the first call
										}	else o.push(data);
										opts.blocksize=sz;
										load.apply(that,[opts, taskqueue.shift()]);
									}
								);
							})(L.sz[i])
						);
					}
					//last call to child load
					taskqueue.push(function(data){
						o.push(data);
						opts.cur=endcur;
						cb.apply(that,[o]);
					});
				}

				if (opts.lazy) cb.apply(that,[o]);
				else {
					taskqueue.shift()({__empty:true});
				}
			}
		])
	}		
	// item can be any type (variable length)
	// support lazy load
	// structure:
	// signature,5 bytes offset, payload, itemlengths, 
	//                    stringarray_signature, keys
	var loadObject = function(opts,blocksize,cb) {
		var that=this;
		var start=opts.cur;
		getArrayLength.apply(this,[opts,function(L) {
			opts.blocksize=blocksize-opts.cur+start;
			load.apply(that,[opts,function(keys){ //load the keys
				if (opts.keys) { //caller ask for keys
					keys.map(function(k) { opts.keys.push(k)});
				}

				var o={};
				var endcur=opts.cur;
				opts.cur=L.offset;
				if (opts.lazy) { 
					var offset=L.offset;
					for (var i=0;i<L.sz.length;i++) {
						//prefix with a \0, impossible for normal string
						o[keys[i]]=strsep+offset.toString(16)
							   +strsep+L.sz[i].toString(16);
						offset+=L.sz[i];
					}
				} else {
					var taskqueue=[];
					for (var i=0;i<L.count;i++) {
						taskqueue.push(
							(function(sz,key){
								return (
									function(data){
										if (typeof data=='object' && data.__empty) {
											//not saving the first call;
										} else {
											o[key]=data; 
										}
										opts.blocksize=sz;
										if (verbose) readLog("key",key);
										load.apply(that,[opts, taskqueue.shift()]);
									}
								);
							})(L.sz[i],keys[i-1])

						);
					}
					//last call to child load
					taskqueue.push(function(data){
						o[keys[keys.length-1]]=data;
						opts.cur=endcur;
						cb.apply(that,[o]);
					});
				}
				if (opts.lazy) cb.apply(that,[o]);
				else {
					taskqueue.shift()({__empty:true});
				}
			}]);
		}]);
	}

	//item is same known type
	var loadStringArray=function(opts,blocksize,encoding,cb) {
		var that=this;
		this.fs.readStringArray(opts.cur,blocksize,encoding,function(o){
			opts.cur+=blocksize;
			cb.apply(that,[o]);
		});
	}
	var loadIntegerArray=function(opts,blocksize,unitsize,cb) {
		var that=this;
		loadVInt1.apply(this,[opts,function(count){
			var o=that.fs.readFixedArray(opts.cur,count,unitsize,function(o){
				opts.cur+=count*unitsize;
				cb.apply(that,[o]);
			});
		}]);
	}
	var loadBlob=function(blocksize,cb) {
		var o=this.fs.readBuf(this.cur,blocksize);
		this.cur+=blocksize;
		return o;
	}	
	var loadbysignature=function(opts,signature,cb) {
		  var blocksize=opts.blocksize||this.fs.size; 
			opts.cur+=this.fs.signature_size;
			var datasize=blocksize-this.fs.signature_size;
			//basic types
			if (signature===DT.int32) {
				opts.cur+=4;
				this.fs.readI32(opts.cur-4,cb);
			} else if (signature===DT.uint8) {
				opts.cur++;
				this.fs.readUI8(opts.cur-1,cb);
			} else if (signature===DT.utf8) {
				var c=opts.cur;opts.cur+=datasize;
				this.fs.readString(c,datasize,'utf8',cb);
			} else if (signature===DT.ucs2) {
				var c=opts.cur;opts.cur+=datasize;
				this.fs.readString(c,datasize,'ucs2',cb);	
			} else if (signature===DT.bool) {
				opts.cur++;
				this.fs.readUI8(opts.cur-1,function(data){cb(!!data)});
			} else if (signature===DT.blob) {
				loadBlob(datasize,cb);
			}
			//variable length integers
			else if (signature===DT.vint) {
				loadVInt.apply(this,[opts,datasize,datasize,cb]);
			}
			else if (signature===DT.pint) {
				loadPInt.apply(this,[opts,datasize,datasize,cb]);
			}
			//simple array
			else if (signature===DT.utf8arr) {
				loadStringArray.apply(this,[opts,datasize,'utf8',cb]);
			}
			else if (signature===DT.ucs2arr) {
				loadStringArray.apply(this,[opts,datasize,'ucs2',cb]);
			}
			else if (signature===DT.uint8arr) {
				loadIntegerArray.apply(this,[opts,datasize,1,cb]);
			}
			else if (signature===DT.int32arr) {
				loadIntegerArray.apply(this,[opts,datasize,4,cb]);
			}
			//nested structure
			else if (signature===DT.array) {
				loadArray.apply(this,[opts,datasize,cb]);
			}
			else if (signature===DT.object) {
				loadObject.apply(this,[opts,datasize,cb]);
			}
			else {
				console.error('unsupported type',signature,opts)
				cb.apply(this,[null]);//make sure it return
				//throw 'unsupported type '+signature;
			}
	}

	var load=function(opts,cb) {
		opts=opts||{}; // this will served as context for entire load procedure
		opts.cur=opts.cur||0;
		var that=this;
		this.fs.readSignature(opts.cur, function(signature){
			loadbysignature.apply(that,[opts,signature,cb])
		});
		return this;
	}
	var CACHE=null;
	var KEY={};
	var ADDRESS={};
	var reset=function(cb) {
		if (!CACHE) {
			load.apply(this,[{cur:0,lazy:true},function(data){
				CACHE=data;
				cb.call(this);
			}]);	
		} else {
			cb.call(this);
		}
	}

	var exists=function(path,cb) {
		if (path.length==0) return true;
		var key=path.pop();
		var that=this;
		get.apply(this,[path,false,function(data){
			if (!path.join(strsep)) return (!!KEY[key]);
			var keys=KEY[path.join(strsep)];
			path.push(key);//put it back
			if (keys) cb.apply(that,[keys.indexOf(key)>-1]);
			else cb.apply(that,[false]);
		}]);
	}

	var getSync=function(path) {
		if (!CACHE) return undefined;	
		var o=CACHE;
		for (var i=0;i<path.length;i++) {
			var r=o[path[i]];
			if (typeof r=="undefined") return null;
			o=r;
		}
		return o;
	}
	var get=function(path,opts,cb,context) {
		if (typeof path=='undefined') path=[];
		if (typeof path=="string") path=[path];
		//opts.recursive=!!opts.recursive;
		if (typeof opts=="function") {
			context=cb;
			cb=opts;
			opts={};
		}
		var context=context||this;
		var that=this;
		if (typeof cb!='function') return getSync(path);

		reset.apply(this,[function(){
			var o=CACHE;
			if (path.length==0) {
				if (opts.address) {
					cb.apply(context,[[0,that.fs.size]]);
				} else {
					cb.apply(context,[Object.keys(CACHE)]);
				}
				return;
			} 
			
			var pathnow="",taskqueue=[],newopts={},r=null;
			var lastkey="";

			for (var i=0;i<path.length;i++) {
				var task=(function(key,k){

					return (function(data){
						if (!(typeof data=='object' && data.__empty)) {
							if (typeof o[lastkey]=='string' && o[lastkey][0]==strsep) o[lastkey]={};
							o[lastkey]=data; 
							o=o[lastkey];
							r=data[key];
							KEY[pathnow]=opts.keys;								
						} else {
							data=o[key];
							r=data;
						}

						if (typeof r==="undefined") {
							taskqueue=null;
							cb.apply(context,[r]); //return empty value
						} else {							
							if (parseInt(k)) pathnow+=strsep;
							pathnow+=key;
							if (typeof r=='string' && r[0]==strsep) { //offset of data to be loaded
								var p=r.substring(1).split(strsep).map(function(item){return parseInt(item,16)});
								var cur=p[0],sz=p[1];
								newopts.lazy=!opts.recursive || (k<path.length-1) ;
								newopts.blocksize=sz;newopts.cur=cur,newopts.keys=[];
								lastkey=key; //load is sync in android
								if (opts.address && taskqueue.length==1) {
									ADDRESS[pathnow]=[cur,sz];
									taskqueue.shift()(null,ADDRESS[pathnow]);
								} else {
									load.apply(that,[newopts, taskqueue.shift()]);
								}
							} else {
								if (opts.address && taskqueue.length==1) {
									taskqueue.shift()(null,ADDRESS[pathnow]);
								} else {
									taskqueue.shift().apply(that,[r]);
								}
							}
						}
					})
				})
				(path[i],i);
				
				taskqueue.push(task);
			}

			if (taskqueue.length==0) {
				cb.apply(context,[o]);
			} else {
				//last call to child load
				taskqueue.push(function(data,cursz){
					if (opts.address) {
						cb.apply(context,[cursz]);
					} else{
						var key=path[path.length-1];
						o[key]=data; KEY[pathnow]=opts.keys;
						cb.apply(context,[data]);
					}
				});
				taskqueue.shift()({__empty:true});			
			}

		}]); //reset
	}
	// get all keys in given path
	var getkeys=function(path,cb) {
		if (!path) path=[]
		var that=this;

		get.apply(this,[path,false,function(){
			if (path && path.length) {
				cb.apply(that,[KEY[path.join(strsep)]]);
			} else {
				cb.apply(that,[Object.keys(CACHE)]); 
				//top level, normally it is very small
			}
		}]);
	}

	var setupapi=function() {
		this.load=load;
//		this.cur=0;
		this.cache=function() {return CACHE};
		this.key=function() {return KEY};
		this.free=function() {
			CACHE=null;
			KEY=null;
			this.fs.free();
		}
		this.setCache=function(c) {CACHE=c};
		this.keys=getkeys;
		this.get=get;   // get a field, load if needed
		this.exists=exists;
		this.DT=DT;
		
		//install the sync version for node
		//if (typeof process!="undefined") require("./kdb_sync")(this);
		//if (cb) setTimeout(cb.bind(this),0);
		var that=this;
		var err=0;
		if (cb) {
			setTimeout(function(){
				cb(err,that);	
			},0);
		}
	}
	var that=this;
	var kfs=new Kfs(path,opts,function(err){
		if (err) {
			setTimeout(function(){
				cb(err,0);
			},0);
			return null;
		} else {
			that.size=this.size;
			setupapi.call(that);			
		}
	});
	this.fs=kfs;
	return this;
}

Create.datatypes=DT;

if (module) module.exports=Create;
//return Create;

},{"./kdbfs":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs.js","./kdbfs_android":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_android.js","./kdbfs_ios":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_ios.js"}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs.js":[function(require,module,exports){
/* node.js and html5 file system abstraction layer*/
try {
	var fs=require("fs");
	var Buffer=require("buffer").Buffer;
} catch (e) {
	var fs=require('./html5read');
	var Buffer=function(){ return ""};
	var html5fs=true; 	
}
var signature_size=1;
var verbose=0, readLog=function(){};
var _readLog=function(readtype,bytes) {
	console.log(readtype,bytes,"bytes");
}
if (verbose) readLog=_readLog;

var unpack_int = function (ar, count , reset) {
   count=count||ar.length;
  var r = []
  //var r=new Uint32Array(count);
  var i = 0, v = 0,n=0;
  do {
	var shift = 0;
	do {
	  v += ((ar[i] & 0x7F) << shift);
	  shift += 7;	  
	} while (ar[++i] & 0x80);
	r.push(v);
	//r[n++]=v;
	if (reset) v=0;
	count--;
  } while (i<ar.length && count);

  //var rr=r.subarray(0,n);
  return {data:r, adv:i };
}
var Open=function(path,opts,cb) {
	opts=opts||{};

	var readSignature=function(pos,cb) {
		var buf=new Buffer(signature_size);
		var that=this;
		fs.read(this.handle,buf,0,signature_size,pos,function(err,len,buffer){
			if (html5fs) var signature=String.fromCharCode((new Uint8Array(buffer))[0])
			else var signature=buffer.toString('utf8',0,signature_size);
			cb.apply(that,[signature]);
		});
	}

	//this is quite slow
	//wait for StringView +ArrayBuffer to solve the problem
	//https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/ylgiNY_ZSV0
	//if the string is always ucs2
	//can use Uint16 to read it.
	//http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
	var decodeutf8 = function (utftext) {
		var string = "";
		var i = 0;
		var c=0,c1 = 0, c2 = 0 , c3=0;
		for (var i=0;i<utftext.length;i++) {
			if (utftext.charCodeAt(i)>127) break;
		}
		if (i>=utftext.length) return utftext;

		while ( i < utftext.length ) {
			c = utftext.charCodeAt(i);
			if (c < 128) {
				string += utftext[i];
				i++;
			} else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			} else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
		return string;
	}

	var readString= function(pos,blocksize,encoding,cb) {
		encoding=encoding||'utf8';
		var buffer=new Buffer(blocksize);
		var that=this;
		fs.read(this.handle,buffer,0,blocksize,pos,function(err,len,buffer){
			readLog("string",len);
			if (html5fs) {
				if (encoding=='utf8') {
					var str=decodeutf8(String.fromCharCode.apply(null, new Uint8Array(buffer)))
				} else { //ucs2 is 3 times faster
					var str=String.fromCharCode.apply(null, new Uint16Array(buffer))	
				}
				
				cb.apply(that,[str]);
			} 
			else cb.apply(that,[buffer.toString(encoding)]);	
		});
	}

	//work around for chrome fromCharCode cannot accept huge array
	//https://code.google.com/p/chromium/issues/detail?id=56588
	var buf2stringarr=function(buf,enc) {
		if (enc=="utf8") 	var arr=new Uint8Array(buf);
		else var arr=new Uint16Array(buf);
		var i=0,codes=[],out=[],s="";
		while (i<arr.length) {
			if (arr[i]) {
				codes[codes.length]=arr[i];
			} else {
				s=String.fromCharCode.apply(null,codes);
				if (enc=="utf8") out[out.length]=decodeutf8(s);
				else out[out.length]=s;
				codes=[];				
			}
			i++;
		}
		
		s=String.fromCharCode.apply(null,codes);
		if (enc=="utf8") out[out.length]=decodeutf8(s);
		else out[out.length]=s;

		return out;
	}
	var readStringArray = function(pos,blocksize,encoding,cb) {
		var that=this,out=null;
		if (blocksize==0) return [];
		encoding=encoding||'utf8';
		var buffer=new Buffer(blocksize);
		fs.read(this.handle,buffer,0,blocksize,pos,function(err,len,buffer){
			if (html5fs) {
				readLog("stringArray",buffer.byteLength);

				if (encoding=='utf8') {
					out=buf2stringarr(buffer,"utf8");
				} else { //ucs2 is 3 times faster
					out=buf2stringarr(buffer,"ucs2");
				}
			} else {
				readLog("stringArray",buffer.length);
				out=buffer.toString(encoding).split('\0');
			} 	
			cb.apply(that,[out]);
		});
	}
	var readUI32=function(pos,cb) {
		var buffer=new Buffer(4);
		var that=this;
		fs.read(this.handle,buffer,0,4,pos,function(err,len,buffer){
			readLog("ui32",len);
			if (html5fs){
				//v=(new Uint32Array(buffer))[0];
				var v=new DataView(buffer).getUint32(0, false)
				cb(v);
			}
			else cb.apply(that,[buffer.readInt32BE(0)]);	
		});		
	}

	var readI32=function(pos,cb) {
		var buffer=new Buffer(4);
		var that=this;
		fs.read(this.handle,buffer,0,4,pos,function(err,len,buffer){
			readLog("i32",len);
			if (html5fs){
				var v=new DataView(buffer).getInt32(0, false)
				cb(v);
			}
			else  	cb.apply(that,[buffer.readInt32BE(0)]);	
		});
	}
	var readUI8=function(pos,cb) {
		var buffer=new Buffer(1);
		var that=this;

		fs.read(this.handle,buffer,0,1,pos,function(err,len,buffer){
			readLog("ui8",len);
			if (html5fs)cb( (new Uint8Array(buffer))[0]) ;
			else  			cb.apply(that,[buffer.readUInt8(0)]);	
			
		});
	}
	var readBuf=function(pos,blocksize,cb) {
		var that=this;
		var buf=new Buffer(blocksize);
		fs.read(this.handle,buf,0,blocksize,pos,function(err,len,buffer){
			readLog("buf",len);
			var buff=new Uint8Array(buffer)
			cb.apply(that,[buff]);
		});
	}
	var readBuf_packedint=function(pos,blocksize,count,reset,cb) {
		var that=this;
		readBuf.apply(this,[pos,blocksize,function(buffer){
			cb.apply(that,[unpack_int(buffer,count,reset)]);	
		}]);
		
	}
	var readFixedArray_html5fs=function(pos,count,unitsize,cb) {
		var func=null;
		if (unitsize===1) {
			func='getUint8';//Uint8Array;
		} else if (unitsize===2) {
			func='getUint16';//Uint16Array;
		} else if (unitsize===4) {
			func='getUint32';//Uint32Array;
		} else throw 'unsupported integer size';

		fs.read(this.handle,null,0,unitsize*count,pos,function(err,len,buffer){
			readLog("fix array",len);
			var out=[];
			if (unitsize==1) {
				out=new Uint8Array(buffer);
			} else {
				for (var i = 0; i < len / unitsize; i++) { //endian problem
				//	out.push( func(buffer,i*unitsize));
					out.push( v=new DataView(buffer)[func](i,false) );
				}
			}

			cb.apply(that,[out]);
		});
	}
	// signature, itemcount, payload
	var readFixedArray = function(pos ,count, unitsize,cb) {
		var func=null;
		var that=this;
		
		if (unitsize* count>this.size && this.size)  {
			console.log("array size exceed file size",this.size)
			return;
		}
		
		if (html5fs) return readFixedArray_html5fs.apply(this,[pos,count,unitsize,cb]);

		var items=new Buffer( unitsize* count);
		if (unitsize===1) {
			func=items.readUInt8;
		} else if (unitsize===2) {
			func=items.readUInt16BE;
		} else if (unitsize===4) {
			func=items.readUInt32BE;
		} else throw 'unsupported integer size';
		//console.log('itemcount',itemcount,'buffer',buffer);

		fs.read(this.handle,items,0,unitsize*count,pos,function(err,len,buffer){
			readLog("fix array",len);
			var out=[];
			for (var i = 0; i < items.length / unitsize; i++) {
				out.push( func.apply(items,[i*unitsize]));
			}
			cb.apply(that,[out]);
		});
	}

	var free=function() {
		//console.log('closing ',handle);
		fs.closeSync(this.handle);
	}
	var setupapi=function() {
		var that=this;
		this.readSignature=readSignature;
		this.readI32=readI32;
		this.readUI32=readUI32;
		this.readUI8=readUI8;
		this.readBuf=readBuf;
		this.readBuf_packedint=readBuf_packedint;
		this.readFixedArray=readFixedArray;
		this.readString=readString;
		this.readStringArray=readStringArray;
		this.signature_size=signature_size;
		this.free=free;
		if (html5fs) {
			var fn=path;
			if (path.indexOf("filesystem:")==0) fn=path.substr(path.lastIndexOf("/"));
			fs.fs.root.getFile(fn,{},function(entry){
			  entry.getMetadata(function(metadata) { 
				that.size=metadata.size;
				if (cb) setTimeout(cb.bind(that),0);
				});
			});
		} else {
			var stat=fs.fstatSync(this.handle);
			this.stat=stat;
			this.size=stat.size;		
			if (cb)	setTimeout(cb.bind(this,0),0);	
		}
	}

	var that=this;
	if (html5fs) {
		fs.open(path,function(h){
			if (!h) {
				if (cb)	setTimeout(cb.bind(null,"file not found:"+path),0);	
			} else {
				that.handle=h;
				that.html5fs=true;
				setupapi.call(that);
				that.opened=true;				
			}
		})
	} else {
		if (fs.existsSync(path)){
			this.handle=fs.openSync(path,'r');//,function(err,handle){
			this.opened=true;
			setupapi.call(this);
		} else {
			if (cb)	setTimeout(cb.bind(null,"file not found:"+path),0);	
			return null;
		}
	}
	return this;
}
module.exports=Open;
},{"./html5read":"C:\\ksana2015\\node_modules\\ksana-jsonrom\\html5read.js","buffer":false,"fs":false}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_android.js":[function(require,module,exports){
/*
  JAVA can only return Number and String
	array and buffer return in string format
	need JSON.parse
*/
var verbose=0;

var readSignature=function(pos,cb) {
	if (verbose) console.debug("read signature");
	var signature=kfs.readUTF8String(this.handle,pos,1);
	if (verbose) console.debug(signature,signature.charCodeAt(0));
	cb.apply(this,[signature]);
}
var readI32=function(pos,cb) {
	if (verbose) console.debug("read i32 at "+pos);
	var i32=kfs.readInt32(this.handle,pos);
	if (verbose) console.debug(i32);
	cb.apply(this,[i32]);	
}
var readUI32=function(pos,cb) {
	if (verbose) console.debug("read ui32 at "+pos);
	var ui32=kfs.readUInt32(this.handle,pos);
	if (verbose) console.debug(ui32);
	cb.apply(this,[ui32]);
}
var readUI8=function(pos,cb) {
	if (verbose) console.debug("read ui8 at "+pos); 
	var ui8=kfs.readUInt8(this.handle,pos);
	if (verbose) console.debug(ui8);
	cb.apply(this,[ui8]);
}
var readBuf=function(pos,blocksize,cb) {
	if (verbose) console.debug("read buffer at "+pos+ " blocksize "+blocksize);
	var buf=kfs.readBuf(this.handle,pos,blocksize);
	var buff=JSON.parse(buf);
	if (verbose) console.debug("buffer length"+buff.length);
	cb.apply(this,[buff]);	
}
var readBuf_packedint=function(pos,blocksize,count,reset,cb) {
	if (verbose) console.debug("read packed int at "+pos+" blocksize "+blocksize+" count "+count);
	var buf=kfs.readBuf_packedint(this.handle,pos,blocksize,count,reset);
	var adv=parseInt(buf);
	var buff=JSON.parse(buf.substr(buf.indexOf("[")));
	if (verbose) console.debug("packedInt length "+buff.length+" first item="+buff[0]);
	cb.apply(this,[{data:buff,adv:adv}]);	
}


var readString= function(pos,blocksize,encoding,cb) {
	if (verbose) console.debug("readstring at "+pos+" blocksize " +blocksize+" enc:"+encoding);
	if (encoding=="ucs2") {
		var str=kfs.readULE16String(this.handle,pos,blocksize);
	} else {
		var str=kfs.readUTF8String(this.handle,pos,blocksize);	
	}	 
	if (verbose) console.debug(str);
	cb.apply(this,[str]);	
}

var readFixedArray = function(pos ,count, unitsize,cb) {
	if (verbose) console.debug("read fixed array at "+pos+" count "+count+" unitsize "+unitsize); 
	var buf=kfs.readFixedArray(this.handle,pos,count,unitsize);
	var buff=JSON.parse(buf);
	if (verbose) console.debug("array length"+buff.length);
	cb.apply(this,[buff]);	
}
var readStringArray = function(pos,blocksize,encoding,cb) {
	if (verbose) console.log("read String array at "+pos+" blocksize "+blocksize +" enc "+encoding); 
	encoding = encoding||"utf8";
	var buf=kfs.readStringArray(this.handle,pos,blocksize,encoding);
	//var buff=JSON.parse(buf);
	if (verbose) console.debug("read string array");
	var buff=buf.split("\uffff"); //cannot return string with 0
	if (verbose) console.debug("array length"+buff.length);
	cb.apply(this,[buff]);	
}
var mergePostings=function(positions,cb) {
	var buf=kfs.mergePostings(this.handle,JSON.stringify(positions));
	if (!buf || buf.length==0) return [];
	else return JSON.parse(buf);
}

var free=function() {
	//console.log('closing ',handle);
	kfs.close(this.handle);
}
var Open=function(path,opts,cb) {
	opts=opts||{};
	var signature_size=1;
	var setupapi=function() { 
		this.readSignature=readSignature;
		this.readI32=readI32;
		this.readUI32=readUI32;
		this.readUI8=readUI8;
		this.readBuf=readBuf;
		this.readBuf_packedint=readBuf_packedint;
		this.readFixedArray=readFixedArray;
		this.readString=readString;
		this.readStringArray=readStringArray;
		this.signature_size=signature_size;
		this.mergePostings=mergePostings;
		this.free=free;
		this.size=kfs.getFileSize(this.handle);
		if (verbose) console.log("filesize  "+this.size);
		if (cb)	cb.call(this);
	}

	this.handle=kfs.open(path);
	this.opened=true;
	setupapi.call(this);
	return this;
}

module.exports=Open;
},{}],"C:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_ios.js":[function(require,module,exports){
/*
  JSContext can return all Javascript types.
*/
var verbose=1;

var readSignature=function(pos,cb) {
	if (verbose)  ksanagap.log("read signature at "+pos);
	var signature=kfs.readUTF8String(this.handle,pos,1);
	if (verbose)  ksanagap.log(signature+" "+signature.charCodeAt(0));
	cb.apply(this,[signature]);
}
var readI32=function(pos,cb) {
	if (verbose)  ksanagap.log("read i32 at "+pos);
	var i32=kfs.readInt32(this.handle,pos);
	if (verbose)  ksanagap.log(i32);
	cb.apply(this,[i32]);	
}
var readUI32=function(pos,cb) {
	if (verbose)  ksanagap.log("read ui32 at "+pos);
	var ui32=kfs.readUInt32(this.handle,pos);
	if (verbose)  ksanagap.log(ui32);
	cb.apply(this,[ui32]);
}
var readUI8=function(pos,cb) {
	if (verbose)  ksanagap.log("read ui8 at "+pos); 
	var ui8=kfs.readUInt8(this.handle,pos);
	if (verbose)  ksanagap.log(ui8);
	cb.apply(this,[ui8]);
}
var readBuf=function(pos,blocksize,cb) {
	if (verbose)  ksanagap.log("read buffer at "+pos);
	var buf=kfs.readBuf(this.handle,pos,blocksize);
	if (verbose)  ksanagap.log("buffer length"+buf.length);
	cb.apply(this,[buf]);	
}
var readBuf_packedint=function(pos,blocksize,count,reset,cb) {
	if (verbose)  ksanagap.log("read packed int fast, blocksize "+blocksize+" at "+pos);var t=new Date();
	var buf=kfs.readBuf_packedint(this.handle,pos,blocksize,count,reset);
	if (verbose)  ksanagap.log("return from packedint, time" + (new Date()-t));
	if (typeof buf.data=="string") {
		buf.data=eval("["+buf.data.substr(0,buf.data.length-1)+"]");
	}
	if (verbose)  ksanagap.log("unpacked length"+buf.data.length+" time" + (new Date()-t) );
	cb.apply(this,[buf]);
}


var readString= function(pos,blocksize,encoding,cb) {

	if (verbose)  ksanagap.log("readstring at "+pos+" blocksize "+blocksize+" "+encoding);var t=new Date();
	if (encoding=="ucs2") {
		var str=kfs.readULE16String(this.handle,pos,blocksize);
	} else {
		var str=kfs.readUTF8String(this.handle,pos,blocksize);	
	}
	if (verbose)  ksanagap.log(str+" time"+(new Date()-t));
	cb.apply(this,[str]);	
}

var readFixedArray = function(pos ,count, unitsize,cb) {
	if (verbose)  ksanagap.log("read fixed array at "+pos); var t=new Date();
	var buf=kfs.readFixedArray(this.handle,pos,count,unitsize);
	if (verbose)  ksanagap.log("array length "+buf.length+" time"+(new Date()-t));
	cb.apply(this,[buf]);	
}
var readStringArray = function(pos,blocksize,encoding,cb) {
	//if (verbose)  ksanagap.log("read String array "+blocksize +" "+encoding); 
	encoding = encoding||"utf8";
	if (verbose)  ksanagap.log("read string array at "+pos);var t=new Date();
	var buf=kfs.readStringArray(this.handle,pos,blocksize,encoding);
	if (typeof buf=="string") buf=buf.split("\0");
	//var buff=JSON.parse(buf);
	//var buff=buf.split("\uffff"); //cannot return string with 0
	if (verbose)  ksanagap.log("string array length"+buf.length+" time"+(new Date()-t));
	cb.apply(this,[buf]);
}

var mergePostings=function(positions) {
	var buf=kfs.mergePostings(this.handle,positions);
	if (typeof buf=="string") {
		buf=eval("["+buf.substr(0,buf.length-1)+"]");
	}
	return buf;
}
var free=function() {
	////if (verbose)  ksanagap.log('closing ',handle);
	kfs.close(this.handle);
}
var Open=function(path,opts,cb) {
	opts=opts||{};
	var signature_size=1;
	var setupapi=function() { 
		this.readSignature=readSignature;
		this.readI32=readI32;
		this.readUI32=readUI32;
		this.readUI8=readUI8;
		this.readBuf=readBuf;
		this.readBuf_packedint=readBuf_packedint;
		this.readFixedArray=readFixedArray;
		this.readString=readString;
		this.readStringArray=readStringArray;
		this.signature_size=signature_size;
		this.mergePostings=mergePostings;
		this.free=free;
		this.size=kfs.getFileSize(this.handle);
		if (verbose)  ksanagap.log("filesize  "+this.size);
		if (cb)	cb.call(this);
	}

	this.handle=kfs.open(path);
	this.opened=true;
	setupapi.call(this);
	return this;
}

module.exports=Open;
},{}],"C:\\ksana2015\\node_modules\\ksana-search\\boolsearch.js":[function(require,module,exports){
/*
  TODO
  and not

*/

// http://jsfiddle.net/neoswf/aXzWw/
var plist=require('./plist');
function intersect(I, J) {
  var i = j = 0;
  var result = [];

  while( i < I.length && j < J.length ){
     if      (I[i] < J[j]) i++; 
     else if (I[i] > J[j]) j++; 
     else {
       result[result.length]=l[i];
       i++;j++;
     }
  }
  return result;
}

/* return all items in I but not in J */
function subtract(I, J) {
  var i = j = 0;
  var result = [];

  while( i < I.length && j < J.length ){
    if (I[i]==J[j]) {
      i++;j++;
    } else if (I[i]<J[j]) {
      while (I[i]<J[j]) result[result.length]= I[i++];
    } else {
      while(J[j]<I[i]) j++;
    }
  }

  if (j==J.length) {
    while (i<I.length) result[result.length]=I[i++];
  }

  return result;
}

var union=function(a,b) {
	if (!a || !a.length) return b;
	if (!b || !b.length) return a;
    var result = [];
    var ai = 0;
    var bi = 0;
    while (true) {
        if ( ai < a.length && bi < b.length) {
            if (a[ai] < b[bi]) {
                result[result.length]=a[ai];
                ai++;
            } else if (a[ai] > b[bi]) {
                result[result.length]=b[bi];
                bi++;
            } else {
                result[result.length]=a[ai];
                result[result.length]=b[bi];
                ai++;
                bi++;
            }
        } else if (ai < a.length) {
            result.push.apply(result, a.slice(ai, a.length));
            break;
        } else if (bi < b.length) {
            result.push.apply(result, b.slice(bi, b.length));
            break;
        } else {
            break;
        }
    }
    return result;
}
var OPERATION={'include':intersect, 'union':union, 'exclude':subtract};

var boolSearch=function(opts) {
  opts=opts||{};
  ops=opts.op||this.opts.op;
  this.docs=[];
	if (!this.phrases.length) return;
	var r=this.phrases[0].docs;
  /* ignore operator of first phrase */
	for (var i=1;i<this.phrases.length;i++) {
		var op= ops[i] || 'union';
		r=OPERATION[op](r,this.phrases[i].docs);
	}
	this.docs=plist.unique(r);
	return this;
}
module.exports={search:boolSearch}
},{"./plist":"C:\\ksana2015\\node_modules\\ksana-search\\plist.js"}],"C:\\ksana2015\\node_modules\\ksana-search\\bsearch.js":[function(require,module,exports){
var indexOfSorted = function (array, obj, near) { 
  var low = 0,
  high = array.length;
  while (low < high) {
    var mid = (low + high) >> 1;
    if (array[mid]==obj) return mid;
    array[mid] < obj ? low = mid + 1 : high = mid;
  }
  if (near) return low;
  else if (array[low]==obj) return low;else return -1;
};
var indexOfSorted_str = function (array, obj, near) { 
  var low = 0,
  high = array.length;
  while (low < high) {
    var mid = (low + high) >> 1;
    if (array[mid]==obj) return mid;
    (array[mid].localeCompare(obj)<0) ? low = mid + 1 : high = mid;
  }
  if (near) return low;
  else if (array[low]==obj) return low;else return -1;
};


var bsearch=function(array,value,near) {
	var func=indexOfSorted;
	if (typeof array[0]=="string") func=indexOfSorted_str;
	return func(array,value,near);
}
var bsearchNear=function(array,value) {
	return bsearch(array,value,true);
}

module.exports=bsearch;//{bsearchNear:bsearchNear,bsearch:bsearch};
},{}],"C:\\ksana2015\\node_modules\\ksana-search\\excerpt.js":[function(require,module,exports){
var plist=require("./plist");

var getPhraseWidths=function (Q,phraseid,vposs) {
	var res=[];
	for (var i in vposs) {
		res.push(getPhraseWidth(Q,phraseid,vposs[i]));
	}
	return res;
}
var getPhraseWidth=function (Q,phraseid,vpos) {
	var P=Q.phrases[phraseid];
	var width=0,varwidth=false;
	if (P.width) return P.width; // no wildcard
	if (P.termid.length<2) return P.termlength[0];
	var lasttermposting=Q.terms[P.termid[P.termid.length-1]].posting;

	for (var i in P.termid) {
		var T=Q.terms[P.termid[i]];
		if (T.op=='wildcard') {
			width+=T.width;
			if (T.wildcard=='*') varwidth=true;
		} else {
			width+=P.termlength[i];
		}
	}
	if (varwidth) { //width might be smaller due to * wildcard
		var at=plist.indexOfSorted(lasttermposting,vpos);
		var endpos=lasttermposting[at];
		if (endpos-vpos<width) width=endpos-vpos+1;
	}

	return width;
}
/* return [vpos, phraseid, phrasewidth, optional_tagname] by slot range*/
var hitInRange=function(Q,startvpos,endvpos) {
	var res=[];
	if (!Q || !Q.rawresult || !Q.rawresult.length) return res;
	for (var i=0;i<Q.phrases.length;i++) {
		var P=Q.phrases[i];
		if (!P.posting) continue;
		var s=plist.indexOfSorted(P.posting,startvpos);
		var e=plist.indexOfSorted(P.posting,endvpos);
		var r=P.posting.slice(s,e+1);
		var width=getPhraseWidths(Q,i,r);

		res=res.concat(r.map(function(vpos,idx){ return [vpos,width[idx],i] }));
	}
	// order by vpos, if vpos is the same, larger width come first.
	// so the output will be
	// <tag1><tag2>one</tag2>two</tag1>
	//TODO, might cause overlap if same vpos and same width
	//need to check tag name
	res.sort(function(a,b){return a[0]==b[0]? b[1]-a[1] :a[0]-b[0]});

	return res;
}

var tagsInRange=function(Q,renderTags,startvpos,endvpos) {
	var res=[];
	if (typeof renderTags=="string") renderTags=[renderTags];

	renderTags.map(function(tag){
		var starts=Q.engine.get(["fields",tag+"_start"]);
		var ends=Q.engine.get(["fields",tag+"_end"]);
		if (!starts) return;

		var s=plist.indexOfSorted(starts,startvpos);
		var e=s;
		while (e<starts.length && starts[e]<endvpos) e++;
		var opentags=starts.slice(s,e);

		s=plist.indexOfSorted(ends,startvpos);
		e=s;
		while (e<ends.length && ends[e]<endvpos) e++;
		var closetags=ends.slice(s,e);

		opentags.map(function(start,idx) {
			res.push([start,closetags[idx]-start,tag]);
		})
	});
	// order by vpos, if vpos is the same, larger width come first.
	res.sort(function(a,b){return a[0]==b[0]? b[1]-a[1] :a[0]-b[0]});

	return res;
}

/*
given a vpos range start, file, convert to filestart, fileend
   filestart : starting file
   start   : vpos start
   showfile: how many files to display
   showpage: how many pages to display

output:
   array of fileid with hits
*/
var getFileWithHits=function(engine,Q,range) {
	var fileOffsets=engine.get("fileoffsets");
	var out=[],filecount=100;
	var start=0 , end=Q.byFile.length;
	Q.excerptOverflow=false;
	if (range.start) {
		var first=range.start ;
		var last=range.end;
		if (!last) last=Number.MAX_SAFE_INTEGER;
		for (var i=0;i<fileOffsets.length;i++) {
			//if (fileOffsets[i]>first) break;
			if (fileOffsets[i]>last) {
				end=i;
				break;
			}
			if (fileOffsets[i]<first) start=i;
		}		
	} else {
		start=range.filestart || 0;
		if (range.maxfile) {
			filecount=range.maxfile;
		} else if (range.showseg) {
			throw "not implement yet"
		}
	}

	var fileWithHits=[],totalhit=0;
	range.maxhit=range.maxhit||1000;

	for (var i=start;i<end;i++) {
		if(Q.byFile[i].length>0) {
			totalhit+=Q.byFile[i].length;
			fileWithHits.push(i);
			range.nextFileStart=i;
			if (fileWithHits.length>=filecount) {
				Q.excerptOverflow=true;
				break;
			}
			if (totalhit>range.maxhit) {
				Q.excerptOverflow=true;
				break;
			}
		}
	}
	if (i>=end) { //no more file
		Q.excerptStop=true;
	}
	return fileWithHits;
}
var resultlist=function(engine,Q,opts,cb) {
	var output=[];
	if (!Q.rawresult || !Q.rawresult.length) {
		cb(output);
		return;
	}

	if (opts.range) {
		if (opts.range.maxhit && !opts.range.maxfile) {
			opts.range.maxfile=opts.range.maxhit;
			opts.range.maxseg=opts.range.maxhit;
		}
		if (!opts.range.maxseg) opts.range.maxseg=100;
		if (!opts.range.end) {
			opts.range.end=Number.MAX_SAFE_INTEGER;
		}
	}
	var fileWithHits=getFileWithHits(engine,Q,opts.range);
	if (!fileWithHits.length) {
		cb(output);
		return;
	}

	var output=[],files=[];//temporary holder for segnames
	for (var i=0;i<fileWithHits.length;i++) {
		var nfile=fileWithHits[i];
		var segoffsets=engine.getFileSegOffsets(nfile);
		var segnames=engine.getFileSegNames(nfile);
		files[nfile]={segoffsets:segoffsets};
		var segwithhit=plist.groupbyposting2(Q.byFile[ nfile ],  segoffsets);
		//if (segoffsets[0]==1)
		//segwithhit.shift(); //the first item is not used (0~Q.byFile[0] )

		for (var j=0; j<segwithhit.length;j++) {
			if (!segwithhit[j].length) continue;
			//var offsets=segwithhit[j].map(function(p){return p- fileOffsets[i]});
			if (segoffsets[j]>opts.range.end) break;
			output.push(  {file: nfile, seg:j,  segname:segnames[j]});
			if (output.length>opts.range.maxseg) break;
		}
	}

	var segpaths=output.map(function(p){
		return ["filecontents",p.file,p.seg];
	});
	//prepare the text
	engine.get(segpaths,function(segs){
		var seq=0;
		if (segs) for (var i=0;i<segs.length;i++) {
			var startvpos=files[output[i].file].segoffsets[output[i].seg-1] ||0;
			var endvpos=files[output[i].file].segoffsets[output[i].seg];
			var hl={};

			if (opts.range && opts.range.start  ) {
				if ( startvpos<opts.range.start) startvpos=opts.range.start;
			//	if (endvpos>opts.range.end) endvpos=opts.range.end;
			}
			
			if (opts.nohighlight) {
				hl.text=segs[i];
				hl.hits=hitInRange(Q,startvpos,endvpos);
			} else {
				var o={nocrlf:true,nospan:true,
					text:segs[i],startvpos:startvpos, endvpos: endvpos, 
					Q:Q,fulltext:opts.fulltext};
				hl=highlight(Q,o);
			}
			if (hl.text) {
				output[i].text=hl.text;
				output[i].hits=hl.hits;
				output[i].seq=seq;
				seq+=hl.hits.length;

				output[i].start=startvpos;				
			} else {
				output[i]=null; //remove item vpos less than opts.range.start
			}
		} 
		output=output.filter(function(o){return o!=null});
		cb(output);
	});
}
var injectTag=function(Q,opts){
	var hits=opts.hits;
	var tags=opts.tags;
	if (!tags) tags=[];
	var hitclass=opts.hitclass||'hl';
	var output='',O=[],j=0,k=0;
	var surround=opts.surround||5;

	var tokens=Q.tokenize(opts.text).tokens;
	var vpos=opts.vpos;
	var i=0,previnrange=!!opts.fulltext ,inrange=!!opts.fulltext;
	var hitstart=0,hitend=0,tagstart=0,tagend=0,tagclass="";
	while (i<tokens.length) {
		var skip=Q.isSkip(tokens[i]);
		var hashit=false;
		inrange=opts.fulltext || (j<hits.length && vpos+surround>=hits[j][0] ||
				(j>0 && j<=hits.length &&  hits[j-1][0]+surround*2>=vpos));	

		if (previnrange!=inrange) {
			output+=opts.abridge||"...";
		}
		previnrange=inrange;
		var token=tokens[i];
		if (opts.nocrlf && token=="\n") token="";

		if (inrange && i<tokens.length) {
			if (skip) {
				output+=token;
			} else {
				var classes="";	

				//check hit
				if (j<hits.length && vpos==hits[j][0]) {
					var nphrase=hits[j][2] % 10, width=hits[j][1];
					hitstart=hits[j][0];
					hitend=hitstart+width;
					j++;
				}

				//check tag
				if (k<tags.length && vpos==tags[k][0]) {
					var width=tags[k][1];
					tagstart=tags[k][0];
					tagend=tagstart+width;
					tagclass=tags[k][2];
					k++;
				}

				if (vpos>=hitstart && vpos<hitend) classes=hitclass+" "+hitclass+nphrase;
				if (vpos>=tagstart && vpos<tagend) classes+=" "+tagclass;

				if (classes || !opts.nospan) {
					output+='<span vpos="'+vpos+'"';
					if (classes) classes=' class="'+classes+'"';
					output+=classes+'>';
					output+=token+'</span>';
				} else {
					output+=token;
				}
			}
		}
		if (!skip) vpos++;
		i++; 
	}

	O.push(output);
	output="";

	return O.join("");
}
var highlight=function(Q,opts) {
	if (!opts.text) return {text:"",hits:[]};
	var opt={text:opts.text,
		hits:null,abridge:opts.abridge,vpos:opts.startvpos,
		fulltext:opts.fulltext,renderTags:opts.renderTags,nospan:opts.nospan,nocrlf:opts.nocrlf,
	};

	opt.hits=hitInRange(opts.Q,opts.startvpos,opts.endvpos);
	return {text:injectTag(Q,opt),hits:opt.hits};
}

var addspan=function(text,startvpos){
	engine=this;
	var output="";
	var tokens=engine.analyzer.tokenize(text).tokens;
	var isSkip=engine.analyzer.isSkip;
	var vpos=startvpos;
	for (var i=0;i<tokens.length;i++) {
		output+='<span vpos="'+(vpos)+'">'+tokens[i]+"</span>";
		if (!isSkip(tokens[i])) vpos++;
	}		
	return output;
}
var addtoken=function(text,startvpos) {
	engine=this;
	var output=[];
	var tokens=engine.analyzer.tokenize(text).tokens;
	var isSkip=engine.analyzer.isSkip;
	var vpos=startvpos;
	for (var i=0;i<tokens.length;i++) {
		output.push([tokens[i],vpos]);
		if (!isSkip(tokens[i])) vpos++;
	}		
	return output;
}
var getSeg=function(engine,fileid,segid,opts,cb,context) {
	if (typeof opts=="function") {
		context=cb;
		cb=opts;
		opts={};
	}

	var fileOffsets=engine.get("fileoffsets");
	var segpaths=["filecontents",fileid,segid];
	var segnames=engine.getFileSegNames(fileid);
	var vpos=engine.fileSegToVpos(fileid,segid);

	engine.get(segpaths,function(text){
		var out=text;
		if (opts.span) out=addspan.apply(engine,[text,vpos]);
		else if(opts.token) out=addtoken.apply(engine,[text,vpos]);
		cb.apply(context||engine.context,[{text:out,file:fileid,seg:segid,segname:segnames[segid]}]);
	});
}

var getSegSync=function(engine,fileid,segid) {
	var fileOffsets=engine.get("fileoffsets");
	var segpaths=["filecontents",fileid,segid];
	var segnames=engine.getFileSegNames(fileid);

	var text=engine.get(segpaths);
	return {text:text,file:fileid,seg:segid,segname:segnames[segid]};
}

var getRange=function(engine,start,end,cb) {
	var fileoffsets=engine.get("fileoffsets");
	//var pagepaths=["fileContents",];
	//find first page and last page
	//create get paths

}

var getFile=function(engine,fileid,cb) {
	var filename=engine.get("filenames")[fileid];
	var segnames=engine.getFileSegNames(fileid);
	var filestart=engine.get("fileoffsets")[fileid];
	var offsets=engine.getFileSegOffsets(fileid);
	var pc=0;
	engine.get(["fileContents",fileid],true,function(data){
		var text=data.map(function(t,idx) {
			if (idx==0) return ""; 
			var pb='<pb n="'+segnames[idx]+'"></pb>';
			return pb+t;
		});
		cb({texts:data,text:text.join(""),segnames:segnames,filestart:filestart,offsets:offsets,file:fileid,filename:filename}); //force different token
	});
}

var highlightRange=function(Q,startvpos,endvpos,opts,cb){
	//not implement yet
}

var highlightFile=function(Q,fileid,opts,cb) {
	if (typeof opts=="function") {
		cb=opts;
	}

	if (!Q || !Q.engine) return cb(null);

	var segoffsets=Q.engine.getFileSegOffsets(fileid);
	var output=[];	
	//console.log(startvpos,endvpos)
	Q.engine.get(["fileContents",fileid],true,function(data){
		if (!data) {
			console.error("wrong file id",fileid);
		} else {
			for (var i=0;i<data.length-1;i++ ){
				var startvpos=segoffsets[i];
				var endvpos=segoffsets[i+1];
				var segnames=Q.engine.getFileSegNames(fileid);
				var seg=getSegSync(Q.engine, fileid,i+1);
					var opt={text:seg.text,hits:null,tag:'hl',vpos:startvpos,
					fulltext:true,nospan:opts.nospan,nocrlf:opts.nocrlf};
				var segname=segnames[i+1];
				opt.hits=hitInRange(Q,startvpos,endvpos);
				var pb='<pb n="'+segname+'"></pb>';
				var withtag=injectTag(Q,opt);
				output.push(pb+withtag);
			}			
		}

		cb.apply(Q.engine.context,[{text:output.join(""),file:fileid}]);
	})
}
var highlightSeg=function(Q,fileid,segid,opts,cb,context) {
	if (typeof opts=="function") {
		cb=opts;
	}

	if (!Q || !Q.engine) return cb.apply(context,[null]);
	var segoffsets=Q.engine.getFileSegOffsets(fileid);
	var startvpos=segoffsets[segid-1];
	var endvpos=segoffsets[segid];
	var segnames=Q.engine.getFileSegNames(fileid);

	this.getSeg(Q.engine,fileid,segid,function(res){
		var opt={text:res.text,hits:null,vpos:startvpos,fulltext:true,
			nospan:opts.nospan,nocrlf:opts.nocrlf};
			opt.hits=hitInRange(Q,startvpos,endvpos);
			if (opts.renderTags) {
				opt.tags=tagsInRange(Q,opts.renderTags,startvpos,endvpos);
			}

		var segname=segnames[segid];
		cb.apply(context||Q.engine.context,[{text:injectTag(Q,opt),seg:segid,file:fileid,hits:opt.hits,segname:segname}]);
	});
}
module.exports={resultlist:resultlist, 
	hitInRange:hitInRange, 
	highlightSeg:highlightSeg,
	getSeg:getSeg,
	highlightFile:highlightFile,
	getFile:getFile
	//highlightRange:highlightRange,
  //getRange:getRange,
};
},{"./plist":"C:\\ksana2015\\node_modules\\ksana-search\\plist.js"}],"C:\\ksana2015\\node_modules\\ksana-search\\index.js":[function(require,module,exports){
/*
  Ksana Search Engine.

  need a KDE instance to be functional
  
*/
var bsearch=require("./bsearch");
var dosearch=require("./search");

var prepareEngineForSearch=function(engine,cb){
	if (engine.get("tokens") && engine.tokenizer) {
		cb();
		return;
	}

	engine.get([["tokens"],["postingslength"]],function(){
		if (!engine.analyzer) {
			var analyzer=require("ksana-analyzer");
			var config=engine.get("meta").config;
			engine.analyzer=analyzer.getAPI(config);			
		}
		cb();
	});
}

var _search=function(engine,q,opts,cb,context) {
	if (typeof engine=="string") {//browser only
		var kde=require("ksana-database");
		if (typeof opts=="function") { //user didn't supply options
			if (typeof cb=="object")context=cb;
			cb=opts;
			opts={};
		}
		opts.q=q;
		opts.dbid=engine;
		kde.open(opts.dbid,function(err,db){
			if (err) {
				cb(err);
				return;
			}
			console.log("opened",opts.dbid)
			prepareEngineForSearch(db,function(){
				return dosearch(db,q,opts,cb);	
			});
		},context);
	} else {
		prepareEngineForSearch(engine,function(){
			return dosearch(engine,q,opts,cb);	
		});
	}
}

var _highlightSeg=function(engine,fileid,segid,opts,cb,context){
	if (!opts.q) {
		if (!engine.analyzer) {
			var analyzer=require("ksana-analyzer");
			var config=engine.get("meta").config;
			engine.analyzer=analyzer.getAPI(config);			
		}
		api.excerpt.getSeg(engine,fileid,segid,opts,cb,context);
	} else {
		_search(engine,opts.q,opts,function(err,Q){
			api.excerpt.highlightSeg(Q,fileid,segid,opts,cb,context);
		});			
	}
}
var _highlightRange=function(engine,start,end,opts,cb,context){

	if (opts.q) {
		_search(engine,opts.q,opts,function(Q){
			api.excerpt.highlightRange(Q,start,end,opts,cb,context);
		});
	} else {
		prepareEngineForSearch(engine,function(){
			api.excerpt.getRange(engine,start,end,cb,context);
		});
	}
}
var _highlightFile=function(engine,fileid,opts,cb){
	if (!opts.q) opts.q=""; 
	_search(engine,opts.q,opts,function(Q){
		api.excerpt.highlightFile(Q,fileid,opts,cb);
	});
	/*
	} else {
		api.excerpt.getFile(engine,fileid,function(data) {
			cb.apply(engine.context,[data]);
		});
	}
	*/
}

var api={
	search:_search
//	,concordance:require("./concordance")
//	,regex:require("./regex")
	,highlightSeg:_highlightSeg
	,highlightFile:_highlightFile
//	,highlightRange:_highlightRange
	,excerpt:require("./excerpt")
	//,vpos2fileseg:vpos2fileseg
}
module.exports=api;
},{"./bsearch":"C:\\ksana2015\\node_modules\\ksana-search\\bsearch.js","./excerpt":"C:\\ksana2015\\node_modules\\ksana-search\\excerpt.js","./search":"C:\\ksana2015\\node_modules\\ksana-search\\search.js","ksana-analyzer":"C:\\ksana2015\\node_modules\\ksana-analyzer\\index.js","ksana-database":"C:\\ksana2015\\node_modules\\ksana-database\\index.js"}],"C:\\ksana2015\\node_modules\\ksana-search\\plist.js":[function(require,module,exports){

var unpack = function (ar) { // unpack variable length integer list
  var r = [],
  i = 0,
  v = 0;
  do {
	var shift = 0;
	do {
	  v += ((ar[i] & 0x7F) << shift);
	  shift += 7;
	} while (ar[++i] & 0x80);
	r[r.length]=v;
  } while (i < ar.length);
  return r;
}

/*
   arr:  [1,1,1,1,1,1,1,1,1]
   levels: [0,1,1,2,2,0,1,2]
   output: [5,1,3,1,1,3,1,1]
*/

var groupsum=function(arr,levels) {
  if (arr.length!=levels.length+1) return null;
  var stack=[];
  var output=new Array(levels.length);
  for (var i=0;i<levels.length;i++) output[i]=0;
  for (var i=1;i<arr.length;i++) { //first one out of toc scope, ignored
    if (stack.length>levels[i-1]) {
      while (stack.length>levels[i-1]) stack.pop();
    }
    stack.push(i-1);
    for (var j=0;j<stack.length;j++) {
      output[stack[j]]+=arr[i];
    }
  }
  return output;
}
/* arr= 1 , 2 , 3 ,4 ,5,6,7 //token posting
  posting= 3 , 5  //tag posting
  out = 3 , 2, 2
*/
var countbyposting = function (arr, posting) {
  if (!posting.length) return [arr.length];
  var out=[];
  for (var i=0;i<posting.length;i++) out[i]=0;
  out[posting.length]=0;
  var p=0,i=0,lasti=0;
  while (i<arr.length && p<posting.length) {
    if (arr[i]<=posting[p]) {
      while (p<posting.length && i<arr.length && arr[i]<=posting[p]) {
        out[p]++;
        i++;
      }      
    } 
    p++;
  }
  out[posting.length] = arr.length-i; //remaining
  return out;
}

var groupbyposting=function(arr,gposting) { //relative vpos
  if (!gposting.length) return [arr.length];
  var out=[];
  for (var i=0;i<=gposting.length;i++) out[i]=[];
  
  var p=0,i=0,lasti=0;
  while (i<arr.length && p<gposting.length) {
    if (arr[i]<gposting[p]) {
      while (p<gposting.length && i<arr.length && arr[i]<gposting[p]) {
        var start=0;
        if (p>0) start=gposting[p-1];
        out[p].push(arr[i++]-start);  // relative
      }      
    } 
    p++;
  }
  //remaining
  while(i<arr.length) out[out.length-1].push(arr[i++]-gposting[gposting.length-1]);
  return out;
}
var groupbyposting2=function(arr,gposting) { //absolute vpos
  if (!arr || !arr.length) return [];
  if (!gposting.length) return [arr.length];
  var out=[];
  for (var i=0;i<=gposting.length;i++) out[i]=[];
  
  var p=0,i=0,lasti=0;
  while (i<arr.length && p<gposting.length) {
    if (arr[i]<gposting[p]) {
      while (p<gposting.length && i<arr.length && arr[i]<gposting[p]) {
        var start=0;
        if (p>0) start=gposting[p-1]; //absolute
        out[p].push(arr[i++]);
      }      
    } 
    p++;
  }
  //remaining
  while(i<arr.length) out[out.length-1].push(arr[i++]-gposting[gposting.length-1]);
  return out;
}
var groupbyblock2 = function(ar, ntoken,slotshift,opts) {
  if (!ar.length) return [{},{}];
  
  slotshift = slotshift || 16;
  var g = Math.pow(2,slotshift);
  var i = 0;
  var r = {}, ntokens={};
  var groupcount=0;
  do {
    var group = Math.floor(ar[i] / g) ;
    if (!r[group]) {
      r[group] = [];
      ntokens[group]=[];
      groupcount++;
    }
    r[group].push(ar[i] % g);
    ntokens[group].push(ntoken[i]);
    i++;
  } while (i < ar.length);
  if (opts) opts.groupcount=groupcount;
  return [r,ntokens];
}
var groupbyslot = function (ar, slotshift, opts) {
  if (!ar.length)
	return {};
  
  slotshift = slotshift || 16;
  var g = Math.pow(2,slotshift);
  var i = 0;
  var r = {};
  var groupcount=0;
  do {
	var group = Math.floor(ar[i] / g) ;
	if (!r[group]) {
	  r[group] = [];
	  groupcount++;
	}
	r[group].push(ar[i] % g);
	i++;
  } while (i < ar.length);
  if (opts) opts.groupcount=groupcount;
  return r;
}
/*
var identity = function (value) {
  return value;
};
var sortedIndex = function (array, obj, iterator) { //taken from underscore
  iterator || (iterator = identity);
  var low = 0,
  high = array.length;
  while (low < high) {
	var mid = (low + high) >> 1;
	iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
  }
  return low;
};*/

var indexOfSorted = function (array, obj) { 
  var low = 0,
  high = array.length-1;
  while (low < high) {
    var mid = (low + high) >> 1;
    array[mid] < obj ? low = mid + 1 : high = mid;
  }
  return low;
};
var plhead=function(pl, pltag, opts) {
  opts=opts||{};
  opts.max=opts.max||1;
  var out=[];
  if (pltag.length<pl.length) {
    for (var i=0;i<pltag.length;i++) {
       k = indexOfSorted(pl, pltag[i]);
       if (k>-1 && k<pl.length) {
        if (pl[k]==pltag[i]) {
          out[out.length]=pltag[i];
          if (out.length>=opts.max) break;
        }
      }
    }
  } else {
    for (var i=0;i<pl.length;i++) {
       k = indexOfSorted(pltag, pl[i]);
       if (k>-1 && k<pltag.length) {
        if (pltag[k]==pl[i]) {
          out[out.length]=pltag[k];
          if (out.length>=opts.max) break;
        }
      }
    }
  }
  return out;
}
/*
 pl2 occur after pl1, 
 pl2>=pl1+mindis
 pl2<=pl1+maxdis
*/
var plfollow2 = function (pl1, pl2, mindis, maxdis) {
  var r = [],i=0;
  var swap = 0;
  
  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + mindis);
    var t = (pl2[k] >= (pl1[i] +mindis) && pl2[k]<=(pl1[i]+maxdis)) ? k : -1;
    if (t > -1) {
      r[r.length]=pl1[i];
      i++;
    } else {
      if (k>=pl2.length) break;
      var k2=indexOfSorted (pl1,pl2[k]-maxdis);
      if (k2>i) {
        var t = (pl2[k] >= (pl1[i] +mindis) && pl2[k]<=(pl1[i]+maxdis)) ? k : -1;
        if (t>-1) r[r.length]=pl1[k2];
        i=k2;
      } else break;
    }
  }
  return r;
}

var plnotfollow2 = function (pl1, pl2, mindis, maxdis) {
  var r = [],i=0;
  
  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + mindis);
    var t = (pl2[k] >= (pl1[i] +mindis) && pl2[k]<=(pl1[i]+maxdis)) ? k : -1;
    if (t > -1) {
      i++;
    } else {
      if (k>=pl2.length) {
        r=r.concat(pl1.slice(i));
        break;
      } else {
        var k2=indexOfSorted (pl1,pl2[k]-maxdis);
        if (k2>i) {
          r=r.concat(pl1.slice(i,k2));
          i=k2;
        } else break;
      }
    }
  }
  return r;
}
/* this is incorrect */
var plfollow = function (pl1, pl2, distance) {
  var r = [],i=0;

  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + distance);
    var t = (pl2[k] === (pl1[i] + distance)) ? k : -1;
    if (t > -1) {
      r.push(pl1[i]);
      i++;
    } else {
      if (k>=pl2.length) break;
      var k2=indexOfSorted (pl1,pl2[k]-distance);
      if (k2>i) {
        t = (pl2[k] === (pl1[k2] + distance)) ? k : -1;
        if (t>-1) {
           r.push(pl1[k2]);
           k2++;
        }
        i=k2;
      } else break;
    }
  }
  return r;
}
var plnotfollow = function (pl1, pl2, distance) {
  var r = [];
  var r = [],i=0;
  var swap = 0;
  
  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + distance);
    var t = (pl2[k] === (pl1[i] + distance)) ? k : -1;
    if (t > -1) { 
      i++;
    } else {
      if (k>=pl2.length) {
        r=r.concat(pl1.slice(i));
        break;
      } else {
        var k2=indexOfSorted (pl1,pl2[k]-distance);
        if (k2>i) {
          r=r.concat(pl1.slice(i,k2));
          i=k2;
        } else break;
      }
    }
  }
  return r;
}
var pland = function (pl1, pl2, distance) {
  var r = [];
  var swap = 0;
  
  if (pl1.length > pl2.length) { //swap for faster compare
    var t = pl2;
    pl2 = pl1;
    pl1 = t;
    swap = distance;
    distance = -distance;
  }
  for (var i = 0; i < pl1.length; i++) {
    var k = indexOfSorted(pl2, pl1[i] + distance);
    var t = (pl2[k] === (pl1[i] + distance)) ? k : -1;
    if (t > -1) {
      r.push(pl1[i] - swap);
    }
  }
  return r;
}
var combine=function (postings) {
  var out=[];
  for (var i in postings) {
    out=out.concat(postings[i]);
  }
  out.sort(function(a,b){return a-b});
  return out;
}

var unique = function(ar){
   if (!ar || !ar.length) return [];
   var u = {}, a = [];
   for(var i = 0, l = ar.length; i < l; ++i){
    if(u.hasOwnProperty(ar[i])) continue;
    a.push(ar[i]);
    u[ar[i]] = 1;
   }
   return a;
}



var plphrase = function (postings,ops) {
  var r = [];
  for (var i=0;i<postings.length;i++) {
  	if (!postings[i])  return [];
  	if (0 === i) {
  	  r = postings[0];
  	} else {
      if (ops[i]=='andnot') {
        r = plnotfollow(r, postings[i], i);  
      }else {
        r = pland(r, postings[i], i);  
      }
  	}
  }
  
  return r;
}
//return an array of group having any of pl item
var matchPosting=function(pl,gupl,start,end) {
  start=start||0;
  end=end||-1;
  if (end==-1) end=Math.pow(2, 53); // max integer value

  var count=0, i = j= 0,  result = [] ,v=0;
  var docs=[], freq=[];
  if (!pl) return {docs:[],freq:[]};
  while( i < pl.length && j < gupl.length ){
     if (pl[i] < gupl[j] ){ 
       count++;
       v=pl[i];
       i++; 
     } else {
       if (count) {
        if (v>=start && v<end) {
          docs.push(j);
          freq.push(count);          
        }
       }
       j++;
       count=0;
     }
  }
  if (count && j<gupl.length && v>=start && v<end) {
    docs.push(j);
    freq.push(count);
    count=0;
  }
  else {
    while (j==gupl.length && i<pl.length && pl[i] >= gupl[gupl.length-1]) {
      i++;
      count++;
    }
    if (v>=start && v<end) {
      docs.push(j);
      freq.push(count);      
    }
  } 
  return {docs:docs,freq:freq};
}

var trim=function(arr,start,end) {
  var s=indexOfSorted(arr,start);
  var e=indexOfSorted(arr,end);
  return arr.slice(s,e+1);
}
var plist={};
plist.unpack=unpack;
plist.plphrase=plphrase;
plist.plhead=plhead;
plist.plfollow2=plfollow2;
plist.plnotfollow2=plnotfollow2;
plist.plfollow=plfollow;
plist.plnotfollow=plnotfollow;
plist.unique=unique;
plist.indexOfSorted=indexOfSorted;
plist.matchPosting=matchPosting;
plist.trim=trim;

plist.groupbyslot=groupbyslot;
plist.groupbyblock2=groupbyblock2;
plist.countbyposting=countbyposting;
plist.groupbyposting=groupbyposting;
plist.groupbyposting2=groupbyposting2;
plist.groupsum=groupsum;
plist.combine=combine;
module.exports=plist;
},{}],"C:\\ksana2015\\node_modules\\ksana-search\\search.js":[function(require,module,exports){
/*
var dosearch2=function(engine,opts,cb,context) {
	opts
		nfile,npage  //return a highlighted page
		nfile,[pages] //return highlighted pages 
		nfile        //return entire highlighted file
		abs_npage
		[abs_pages]  //return set of highlighted pages (may cross file)

		filename, pagename
		filename,[pagenames]

		excerpt      //
	    sortBy       //default natural, sortby by vsm ranking

	//return err,array_of_string ,Q  (Q contains low level search result)
}

*/
/* TODO sorted tokens */
var plist=require("./plist");
var boolsearch=require("./boolsearch");
var excerpt=require("./excerpt");
var parseTerm = function(engine,raw,opts) {
	if (!raw) return;
	var res={raw:raw,variants:[],term:'',op:''};
	var term=raw, op=0;
	var firstchar=term[0];
	var termregex="";
	if (firstchar=='-') {
		term=term.substring(1);
		firstchar=term[0];
		res.exclude=true; //exclude
	}
	term=term.trim();
	var lastchar=term[term.length-1];
	term=engine.analyzer.normalize(term);
	
	if (term.indexOf("%")>-1) {
		var termregex="^"+term.replace(/%+/g,".+")+"$";
		if (firstchar=="%") 	termregex=".+"+termregex.substr(1);
		if (lastchar=="%") 	termregex=termregex.substr(0,termregex.length-1)+".+";
	}

	if (termregex) {
		res.variants=expandTerm(engine,termregex);
	}

	res.key=term;
	return res;
}
var expandTerm=function(engine,regex) {
	var r=new RegExp(regex);
	var tokens=engine.get("tokens");
	var postingsLength=engine.get("postingslength");
	if (!postingsLength) postingsLength=[];
	var out=[];
	for (var i=0;i<tokens.length;i++) {
		var m=tokens[i].match(r);
		if (m) {
			out.push([m[0],postingsLength[i]||1]);
		}
	}
	out.sort(function(a,b){return b[1]-a[1]});
	return out;
}
var isWildcard=function(raw) {
	return !!raw.match(/[\*\?]/);
}

var isOrTerm=function(term) {
	term=term.trim();
	return (term[term.length-1]===',');
}
var orterm=function(engine,term,key) {
		var t={text:key};
		if (engine.analyzer.simplifiedToken) {
			t.simplified=engine.analyzer.simplifiedToken(key);
		}
		term.variants.push(t);
}
var orTerms=function(engine,tokens,now) {
	var raw=tokens[now];
	var term=parseTerm(engine,raw);
	if (!term) return;
	orterm(engine,term,term.key);
	while (isOrTerm(raw))  {
		raw=tokens[++now];
		var term2=parseTerm(engine,raw);
		orterm(engine,term,term2.key);
		for (var i in term2.variants){
			term.variants[i]=term2.variants[i];
		}
		term.key+=','+term2.key;
	}
	return term;
}

var getOperator=function(raw) {
	var op='';
	if (raw[0]=='+') op='include';
	if (raw[0]=='-') op='exclude';
	return op;
}
var parsePhrase=function(q) {
	var match=q.match(/(".+?"|'.+?'|\S+)/g)
	match=match.map(function(str){
		var n=str.length, h=str.charAt(0), t=str.charAt(n-1)
		if (h===t&&(h==='"'|h==="'")) str=str.substr(1,n-2)
		return str;
	})
	return match;
}
var tibetanNumber={
	"\u0f20":"0","\u0f21":"1","\u0f22":"2",	"\u0f23":"3",	"\u0f24":"4",
	"\u0f25":"5","\u0f26":"6","\u0f27":"7","\u0f28":"8","\u0f29":"9"
}
var parseNumber=function(raw) {
	var n=parseInt(raw,10);
	if (isNaN(n)){
		var converted=[];
		for (var i=0;i<raw.length;i++) {
			var nn=tibetanNumber[raw[i]];
			if (typeof nn !="undefined") converted[i]=nn;
			else break;
		}
		return parseInt(converted,10);
	} else {
		return n;
	}
}
var parseWildcard=function(raw) {
	var n=parseNumber(raw) || 1;
	var qcount=raw.split('?').length-1;
	var scount=raw.split('*').length-1;
	var type='';
	if (qcount) type='?';
	else if (scount) type='*';
	return {wildcard:type, width: n , op:'wildcard'};
}

var newPhrase=function() {
	return {termid:[],posting:[],raw:'',termlength:[]};
} 
var parseQuery=function(q,sep) {
	if (sep && q.indexOf(sep)>-1) {
		var match=q.split(sep);
	} else {
		var match=q.match(/(".+?"|'.+?'|\S+)/g)
		match=match.map(function(str){
			var n=str.length, h=str.charAt(0), t=str.charAt(n-1)
			if (h===t&&(h==='"'|h==="'")) str=str.substr(1,n-2)
			return str
		})
		//console.log(input,'==>',match)		
	}
	return match;
}
var loadPhrase=function(phrase) {
	/* remove leading and ending wildcard */
	var Q=this;
	var cache=Q.engine.postingCache;
	if (cache[phrase.key]) {
		phrase.posting=cache[phrase.key];
		return Q;
	}
	if (phrase.termid.length==1) {
		if (!Q.terms.length){
			phrase.posting=[];
		} else {
			cache[phrase.key]=phrase.posting=Q.terms[phrase.termid[0]].posting;	
		}
		return Q;
	}

	var i=0, r=[],dis=0;
	while(i<phrase.termid.length) {
	  var T=Q.terms[phrase.termid[i]];
		if (0 === i) {
			r = T.posting;
		} else {
		    if (T.op=='wildcard') {
		    	T=Q.terms[phrase.termid[i++]];
		    	var width=T.width;
		    	var wildcard=T.wildcard;
		    	T=Q.terms[phrase.termid[i]];
		    	var mindis=dis;
		    	if (wildcard=='?') mindis=dis+width;
		    	if (T.exclude) r = plist.plnotfollow2(r, T.posting, mindis, dis+width);
		    	else r = plist.plfollow2(r, T.posting, mindis, dis+width);		    	
		    	dis+=(width-1);
		    }else {
		    	if (T.posting) {
		    		if (T.exclude) r = plist.plnotfollow(r, T.posting, dis);
		    		else r = plist.plfollow(r, T.posting, dis);
		    	}
		    }
		}
		dis += phrase.termlength[i];
		i++;
		if (!r) return Q;
  }
  phrase.posting=r;
  cache[phrase.key]=r;
  return Q;
}
var trimSpace=function(engine,query) {
	if (!query) return "";
	var i=0;
	var isSkip=engine.analyzer.isSkip;
	while (i<query.length && isSkip(query[i])) i++;
	return query.substring(i);
}
var getSegWithHit=function(fileid,offsets) {
	var Q=this,engine=Q.engine;
	var segWithHit=plist.groupbyposting2(Q.byFile[fileid ], offsets);
	if (segWithHit.length) segWithHit.shift(); //the first item is not used (0~Q.byFile[0] )
	var out=[];
	segWithHit.map(function(p,idx){if (p.length) out.push(idx)});
	return out;
}
var segWithHit=function(fileid) {
	var Q=this,engine=Q.engine;
	var offsets=engine.getFileSegOffsets(fileid);
	return getSegWithHit.apply(this,[fileid,offsets]);
}
var isSimplePhrase=function(phrase) {
	var m=phrase.match(/[\?%^]/);
	return !m;
}

// 發菩提心   ==> 發菩  提心       2 2   
// 菩提心     ==> 菩提  提心       1 2
// 劫劫       ==> 劫    劫         1 1   // invalid
// 因緣所生道  ==> 因緣  所生   道   2 2 1
var splitPhrase=function(engine,simplephrase,bigram) {
	var bigram=bigram||engine.get("meta").bigram||[];
	var tokens=engine.analyzer.tokenize(simplephrase).tokens;
	var loadtokens=[],lengths=[],j=0,lastbigrampos=-1;
	while (j+1<tokens.length) {
		var token=engine.analyzer.normalize(tokens[j]);
		var nexttoken=engine.analyzer.normalize(tokens[j+1]);
		var bi=token+nexttoken;
		var i=plist.indexOfSorted(bigram,bi);
		if (bigram[i]==bi) {
			loadtokens.push(bi);
			if (j+3<tokens.length) {
				lastbigrampos=j;
				j++;
			} else {
				if (j+2==tokens.length){ 
					if (lastbigrampos+1==j ) {
						lengths[lengths.length-1]--;
					}
					lastbigrampos=j;
					j++;
				}else {
					lastbigrampos=j;	
				}
			}
			lengths.push(2);
		} else {
			if (!bigram || lastbigrampos==-1 || lastbigrampos+1!=j) {
				loadtokens.push(token);
				lengths.push(1);				
			}
		}
		j++;
	}

	while (j<tokens.length) {
		var token=engine.analyzer.normalize(tokens[j]);
		loadtokens.push(token);
		lengths.push(1);
		j++;
	}

	return {tokens:loadtokens, lengths: lengths , tokenlength: tokens.length};
}
/* host has fast native function */
var fastPhrase=function(engine,phrase) {
	var phrase_term=newPhrase();
	//var tokens=engine.analyzer.tokenize(phrase).tokens;
	var splitted=splitPhrase(engine,phrase);

	var paths=postingPathFromTokens(engine,splitted.tokens);
//create wildcard

	phrase_term.width=splitted.tokenlength; //for excerpt.js to getPhraseWidth

	engine.get(paths,{address:true},function(postingAddress){ //this is sync
		phrase_term.key=phrase;
		var postingAddressWithWildcard=[];
		for (var i=0;i<postingAddress.length;i++) {
			postingAddressWithWildcard.push(postingAddress[i]);
			if (splitted.lengths[i]>1) {
				postingAddressWithWildcard.push([splitted.lengths[i],0]); //wildcard has blocksize==0 
			}
		}
		engine.postingCache[phrase]=engine.mergePostings(postingAddressWithWildcard);
	});
	return phrase_term;
	// put posting into cache[phrase.key]
}
var slowPhrase=function(engine,terms,phrase) {
	var j=0,tokens=engine.analyzer.tokenize(phrase).tokens;
	var phrase_term=newPhrase();
	var termid=0;
	while (j<tokens.length) {
		var raw=tokens[j], termlength=1;
		if (isWildcard(raw)) {
			if (phrase_term.termid.length==0)  { //skip leading wild card
				j++
				continue;
			}
			terms.push(parseWildcard(raw));
			termid=terms.length-1;
			phrase_term.termid.push(termid);
			phrase_term.termlength.push(termlength);
		} else if (isOrTerm(raw)){
			var term=orTerms.apply(this,[tokens,j]);
			if (term) {
				terms.push(term);
				termid=terms.length-1;
				j+=term.key.split(',').length-1;					
			}
			j++;
			phrase_term.termid.push(termid);
			phrase_term.termlength.push(termlength);
		} else {
			var phrase="";
			while (j<tokens.length) {
				if (!(isWildcard(tokens[j]) || isOrTerm(tokens[j]))) {
					phrase+=tokens[j];
					j++;
				} else break;
			}

			var splitted=splitPhrase(engine,phrase);
			for (var i=0;i<splitted.tokens.length;i++) {

				var term=parseTerm(engine,splitted.tokens[i]);
				var termidx=terms.map(function(a){return a.key}).indexOf(term.key);
				if (termidx==-1) {
					terms.push(term);
					termid=terms.length-1;
				} else {
					termid=termidx;
				}				
				phrase_term.termid.push(termid);
				phrase_term.termlength.push(splitted.lengths[i]);
			}
		}
		j++;
	}
	phrase_term.key=phrase;
	//remove ending wildcard
	var P=phrase_term , T=null;
	do {
		T=terms[P.termid[P.termid.length-1]];
		if (!T) break;
		if (T.wildcard) P.termid.pop(); else break;
	} while(T);		
	return phrase_term;
}
var newQuery =function(engine,query,opts) {
	//if (!query) return;
	opts=opts||{};
	query=trimSpace(engine,query);

	var phrases=query,phrases=[];
	if (typeof query=='string' && query) {
		phrases=parseQuery(query,opts.phrase_sep || "");
	}
	
	var phrase_terms=[], terms=[],variants=[],operators=[];
	var pc=0;//phrase count
	for  (var i=0;i<phrases.length;i++) {
		var op=getOperator(phrases[pc]);
		if (op) phrases[pc]=phrases[pc].substring(1);

		/* auto add + for natural order ?*/
		//if (!opts.rank && op!='exclude' &&i) op='include';
		operators.push(op);

		if (isSimplePhrase(phrases[pc]) && engine.mergePostings ) {
			var phrase_term=fastPhrase(engine,phrases[pc]);
		} else {
			var phrase_term=slowPhrase(engine,terms,phrases[pc]);
		}
		phrase_terms.push(phrase_term);

		if (!engine.mergePostings && phrase_terms[pc].termid.length==0) {
			phrase_terms.pop();
		} else pc++;
	}
	opts.op=operators;

	var Q={dbname:engine.dbname,engine:engine,opts:opts,query:query,
		phrases:phrase_terms,terms:terms
	};
	Q.tokenize=function() {return engine.analyzer.tokenize.apply(engine,arguments);}
	Q.isSkip=function() {return engine.analyzer.isSkip.apply(engine,arguments);}
	Q.normalize=function() {return engine.analyzer.normalize.apply(engine,arguments);}
	Q.segWithHit=segWithHit;

	//Q.getRange=function() {return that.getRange.apply(that,arguments)};
	//API.queryid='Q'+(Math.floor(Math.random()*10000000)).toString(16);
	return Q;
}
var postingPathFromTokens=function(engine,tokens) {
	var alltokens=engine.get("tokens");

	var tokenIds=tokens.map(function(t){ return 1+alltokens.indexOf(t)});
	var postingid=[];
	for (var i=0;i<tokenIds.length;i++) {
		postingid.push( tokenIds[i]); // tokenId==0 , empty token
	}
	return postingid.map(function(t){return ["postings",t]});
}
var loadPostings=function(engine,tokens,cb) {
	var toloadtokens=tokens.filter(function(t){
		return !engine.postingCache[t.key]; //already in cache
	});
	if (toloadtokens.length==0) {
		cb();
		return;
	}
	var postingPaths=postingPathFromTokens(engine,tokens.map(function(t){return t.key}));
	engine.get(postingPaths,function(postings){
		postings.map(function(p,i) { tokens[i].posting=p });
		if (cb) cb();
	});
}
var groupBy=function(Q,posting) {
	phrases.forEach(function(P){
		var key=P.key;
		var docfreq=docfreqcache[key];
		if (!docfreq) docfreq=docfreqcache[key]={};
		if (!docfreq[that.groupunit]) {
			docfreq[that.groupunit]={doclist:null,freq:null};
		}		
		if (P.posting) {
			var res=matchPosting(engine,P.posting);
			P.freq=res.freq;
			P.docs=res.docs;
		} else {
			P.docs=[];
			P.freq=[];
		}
		docfreq[that.groupunit]={doclist:P.docs,freq:P.freq};
	});
	return this;
}
var groupByFolder=function(engine,filehits) {
	var files=engine.get("filenames");
	var prevfolder="",hits=0,out=[];
	for (var i=0;i<filehits.length;i++) {
		var fn=files[i];
		var folder=fn.substring(0,fn.indexOf('/'));
		if (prevfolder && prevfolder!=folder) {
			out.push(hits);
			hits=0;
		}
		hits+=filehits[i].length;
		prevfolder=folder;
	}
	out.push(hits);
	return out;
}
var phrase_intersect=function(engine,Q) {
	var intersected=null;
	var fileoffsets=Q.engine.get("fileoffsets");
	var empty=[],emptycount=0,hashit=0;
	for (var i=0;i<Q.phrases.length;i++) {
		var byfile=plist.groupbyposting2(Q.phrases[i].posting,fileoffsets);
		if (byfile.length) byfile.shift();
		if (byfile.length) byfile.pop();
		byfile.pop();
		if (intersected==null) {
			intersected=byfile;
		} else {
			for (var j=0;j<byfile.length;j++) {
				if (!(byfile[j].length && intersected[j].length)) {
					intersected[j]=empty; //reuse empty array
					emptycount++;
				} else hashit++;
			}
		}
	}

	Q.byFile=intersected;
	Q.byFolder=groupByFolder(engine,Q.byFile);
	var out=[];
	//calculate new rawposting
	for (var i=0;i<Q.byFile.length;i++) {
		if (Q.byFile[i].length) out=out.concat(Q.byFile[i]);
	}
	Q.rawresult=out;
	countFolderFile(Q);
}
var countFolderFile=function(Q) {
	Q.fileWithHitCount=0;
	Q.byFile.map(function(f){if (f.length) Q.fileWithHitCount++});
			
	Q.folderWithHitCount=0;
	Q.byFolder.map(function(f){if (f) Q.folderWithHitCount++});
}

var main=function(engine,q,opts,cb){

	var starttime=new Date();
	var meta=engine.get("meta");
	if (meta.normalize && engine.analyzer.setNormalizeTable) {
		meta.normalizeObj=engine.analyzer.setNormalizeTable(meta.normalize,meta.normalizeObj);
	}
	if (typeof opts=="function") cb=opts;
	opts=opts||{};
	var Q=engine.queryCache[q];
	if (!Q) Q=newQuery(engine,q,opts); 
	if (!Q) {
		engine.searchtime=new Date()-starttime;
		engine.totaltime=engine.searchtime;
		if (engine.context) cb.apply(engine.context,["empty result",{rawresult:[]}]);
		else cb("empty result",{rawresult:[]});
		return;
	};
	engine.queryCache[q]=Q;
	if (Q.phrases.length) {
		
		loadPostings(engine,Q.terms,function(){
			if (!Q.phrases[0].posting) {
				engine.searchtime=new Date()-starttime;
				engine.totaltime=engine.searchtime;
				cb.apply(engine.context,["no such posting",{rawresult:[]}]);
				return;			
			}
			
			if (!Q.phrases[0].posting.length) { //
				Q.phrases.forEach(loadPhrase.bind(Q));
			}
			if (Q.phrases.length==1) {
				Q.rawresult=Q.phrases[0].posting;
			} else {
				phrase_intersect(engine,Q);
			}
			var fileoffsets=Q.engine.get("fileoffsets");
			//console.log("search opts "+JSON.stringify(opts));

			if (!Q.byFile && Q.rawresult && !opts.nogroup) {
				Q.byFile=plist.groupbyposting2(Q.rawresult, fileoffsets);
				Q.byFile.shift();Q.byFile.pop();
				Q.byFolder=groupByFolder(engine,Q.byFile);

				countFolderFile(Q);
			}

			if (opts.range) {
				engine.searchtime=new Date()-starttime;
				excerpt.resultlist(engine,Q,opts,function(data) { 
					//console.log("excerpt ok");
					Q.excerpt=data;
					engine.totaltime=new Date()-starttime;
					cb.apply(engine.context,[0,Q]);
				});
			} else {
				engine.searchtime=new Date()-starttime;
				engine.totaltime=new Date()-starttime;
				cb.apply(engine.context,[0,Q]);
			}
		});
	} else { //empty search
		engine.searchtime=new Date()-starttime;
		engine.totaltime=new Date()-starttime;
		cb.apply(engine.context,[0,Q]);
	};
}

main.splitPhrase=splitPhrase; //just for debug
module.exports=main;
},{"./boolsearch":"C:\\ksana2015\\node_modules\\ksana-search\\boolsearch.js","./excerpt":"C:\\ksana2015\\node_modules\\ksana-search\\excerpt.js","./plist":"C:\\ksana2015\\node_modules\\ksana-search\\plist.js"}],"C:\\ksana2015\\node_modules\\ksana2015-components\\choices.js":[function(require,module,exports){
var E=React.createElement;
var Choices=React.createClass({
	propTypes:{
		data:React.PropTypes.array.isRequired
		,selected:React.PropTypes.number
		,onSelect:React.PropTypes.func
		,onCheck:React.PropTypes.func
		,type:React.PropTypes.string
		,checked:React.PropTypes.bool
		,prefix:React.PropTypes.string
		,labelfor:React.PropTypes.bool
		,vposInItem:React.PropTypes.func //return vpos in each item(for rendering markup style)
	}
	,selected:0 //might receive from parent in the future
	,vposInItem:[]
	,getDefaultProps:function(){
		return {prefix:""};
	}
	,renderDropdownItem:function(item,idx) {
		var disabled=item.disabled ? " disabled":"";
		return (
			E("li",{key:"li"+idx},
			   E("a",{href:"#", onClick:this.select, "data-n":idx},item.label))
		);
	}
	,autovpos:function(str,item) { //do not use surrogate in desc
		var out=[];
		var startvpos=this.vpos;
		var samples=str.split("|")
		for (var j=0;j<samples.length;j++) {
			var s=samples[j];
			for (var i=0;i<s.length;i++) {
				var key="k"+j+"_"+i;
				var code=s.charCodeAt(i);
				out.push(E("span",{key:key,"data-vpos":this.vpos},str[i]));
				//if (code>=0x3400&&code<=0x9fff)	
				this.vpos++;
			}
			if (this.vpos>startvpos) this.vposInItem.push( [startvpos+2,this.vpos-startvpos-2,item.name, j] );
		}
		return E("span",{className:"markupdesc"},out);
	}
	,componentWillUpdate:function() {
		this.vposInItem=[];
	}
	,componentWillMount:function() {
		this.selected=this.props.selected;
	}
	,componentDidUpdate:function() {
		if (this.props.vposInItem) this.props.vposInItem(this.vposInItem);
	}
	,renderButton:function(item,idx) {
		var label=item.label;
		var disabled=item.disabled ? " disabled":"";
		if (this.props.hotkey && idx<10) {
			var hotkey=(idx+1).toString();
			if (hotkey.length>1) hotkey=hotkey.substr(1);
			label=hotkey+label;
		}

		var thelinebreak=null;
		if (this.props.linebreak) thelinebreak=E("br");		
		var theinput=React.createElement("button",{className:"btn btn-default markupbutton"+disabled,key:"b"+idx},label);		
		var description="",descriptionspans=null;
		if (item.desc) description += " "+item.desc;
		if (this.props.autovpos) descriptionspans=this.autovpos(description,item);
		else descriptionspans=E("span",{className:"markupdesc"},description);

		return E("span", {"data-n": idx,
			key:"t"+idx,className:(this.props.type||"radio")+"inline"+disabled}
			," ", theinput,descriptionspans,thelinebreak);

	}
	,onchange:function(e) {
		var target=e.target;
		while (target) {
			if (target.dataset&& target.dataset.n) break;
			else  target=target.parentNode;
		}
		if (!target) return;

		var n=parseInt(target.dataset.n);
		if (this.props.onCheck) this.props.onCheck(n,e.target.checked);
	}
	,renderCheckbox_radio:function(item,idx) {
		var checked=(this.selected==idx);
		if (this.props.type=="checkbox") checked=item.checked;
		var theinput=null;
		var key=this.props.prefix+"_i"+idx;
		theinput=React.createElement("input", {type: this.props.type||"radio", key:key, id:key,
				onChange: this.onchange, checked:checked,name: "tagsettab"}); 

		var thelabel=null;
		var thelabel=E("span", {key:"l"+idx,className:"tagsetlabel "}, item.label);

		var thelinebreak=null;
		if (this.props.linebreak) thelinebreak=E("br");

		var description="",descriptionspans=null;
		if (item.desc) description += " "+item.desc;
		if (this.props.autovpos) descriptionspans=this.autovpos(description,item);
		else descriptionspans=E("span",{className:"markupdesc"},description);

		var labelfor=(this.props.labelfor)?E("label", {"htmlFor":key}, theinput,thelabel):[theinput,thelabel];
		return E("span", {"data-n": idx,
			key:"t"+idx,className:" inline"}
			," ", labelfor,descriptionspans,thelinebreak);
	}
	,select:function(e) {
		var target=e.target;
		while (target) {
			if (target.dataset&& target.dataset.n) break;
			else  target=target.parentNode;
		}
		if (!target) return;
		if (target.classList.contains("disabledLabel") || target.classList.contains("disabled")) {
			e.preventDefault();
			return;
		}
		var n=parseInt(target.dataset.n);
		if (this.selected!=n || this.props.type=="button") {
			if (this.props.onSelect) this.props.onSelect(n, this.selected); //newly selected, previous selected
			this.selected=n;
		}
	}
	,renderItems:function(){
		var itemrenderer=this.renderCheckbox_radio;
		if (this.props.type=="button") itemrenderer=this.renderButton;
		return (this.props.data ||[]).map(itemrenderer);
	}
	,selectedLabel:function() {
		if (!this.props.data.length) return "";
		return this.props.data[this.selected].label;
	}
	,renderDropdown:function() {
		return E("div",{className:"dropdown"},
				E("button",{className:"dropdown-toggle", type:"button","data-toggle":"dropdown"},
				    this.selectedLabel(),
				    E("span",{className:"caret"})
				),
				E("ul",{className:"dropdown-menu",role:"menu"},
					(this.props.data ||[]).map(this.renderDropdownItem)
				)
			);
	}
	,render:function(){
		this.vpos=1;
		var renderItems=this.renderItems;
		if (this.props.type=="dropdown") renderItems=this.renderDropdown;
		return E("div", {onClick: this.select}, 
			renderItems()
		);
	}
})
module.exports=Choices;
},{}],"C:\\ksana2015\\node_modules\\ksana2015-components\\index.js":[function(require,module,exports){
module.exports={choices:require("./choices"),pageScrollMixin:require("./pagescroll")};
},{"./choices":"C:\\ksana2015\\node_modules\\ksana2015-components\\choices.js","./pagescroll":"C:\\ksana2015\\node_modules\\ksana2015-components\\pagescroll.js"}],"C:\\ksana2015\\node_modules\\ksana2015-components\\pagescroll.js":[function(require,module,exports){
/*http://jsfiddle.net/aabeL/1/ */

var SCROLL_TIMEOUT = 200;

// How often to check if we're scrolling; this is a reasonable default.
var CHECK_INTERVAL = SCROLL_TIMEOUT / 2;

var PageScrollStartEndMixin = {
    componentWillUnmount:function(){
    	this.getDOMNode().removeEventListener('wheel', this.onScroll, false);
    },
    componentDidMount: function() {
    	this.getDOMNode().addEventListener('wheel', this.onScroll, false);
        this.checkScrollInterval = setInterval(this.checkScroll, CHECK_INTERVAL);
        this.scrolling = false;
    },
    componentWillUnmount: function() {
        clearInterval(this.checkScrollInterval);
    },
    checkScroll: function() {
        if (Date.now() - this.lastScrollTime > SCROLL_TIMEOUT && this.scrolling) {
            this.scrolling = false;
            if (this.onScrollEnd) this.onScrollEnd();
        }
    },
    onScroll: function() {
        if (!this.scrolling) {
            this.scrolling = true;
            if (this.onScrollStart) this.onScrollStart();
        }
        this.lastScrollTime = Date.now();
    }
};

module.exports=PageScrollStartEndMixin;
},{}],"C:\\ksana2015\\node_modules\\ksana2015-stacktoc\\index.js":[function(require,module,exports){

var E=React.createElement;
var trimHit=function(hit) {
  if (hit>999) { 
    return (Math.floor(hit/1000)).toString()+"K+";
  } else return hit.toString();
}
var trimText=function(text,opts) {
    if (opts.maxitemlength && text.length>opts.maxitemlength) {
      var stopAt=opts.stopAt||"";
      if (stopAt) {
        var at=opts.maxitemlength;
        while (at>10) {
          if (text.charAt(at)==stopAt) return text.substr(0,at)+"...";
          at--;
        }
      } else {
        return text.substr(0,opts.maxitemlength)+"...";
      }
    } 
    return text;
}
var ganzhi="　甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥";

var renderDepth=function(depth,opts,nodetype) {
  var out=[];
  if (opts.tocstyle=="vertical_line") {
    for (var i=0;i<depth;i++) {
      if (i==depth-1) {
        out.push(E("img", {src: opts.tocbar_start}));
      } else {
        out.push(E("img", {src: opts.tocbar}));  
      }
    }
    return out;    
  } else if (opts.tocstyle=="ganzhi") {
    return E("span", null, ganzhi[depth]+".");
  } else {
    if (depth) return E("span", null, depth, ".")
    else return null;
  }
  return null;
};


var Ancestors=React.createClass({
  goback:function(e) {
    var n=e.target.dataset["n"];  
    if (typeof n=="undefined") n=e.target.parentNode.dataset["n"];
    this.props.setCurrent(n); 
  },
  showExcerpt:function(e) {
    var n=parseInt(e.target.parentNode.dataset["n"]);
    e.stopPropagation();
    e.preventDefault();
    this.props.showExcerpt(n);
  }, 
  showHit:function(hit) {
    if (hit)  return E("a", {href: "#", onClick: this.showExcerpt, className: "pull-right badge hitbadge"}, trimHit(hit))
    else return E("span", null);
  },
  renderAncestor:function(n,idx) {
    var hit=this.props.toc[n].hit;
    var text=this.props.toc[n].text.trim();
    text=trimText(text,this.props.opts);
    if (this.props.textConverter) text=this.props.textConverter(text);
    return E("div", {key: "a"+n, className: "node parent", "data-n": n, onClick: this.goback}, renderDepth(idx,this.props.opts,"ancestor"),
              E("a", {className: "text", href: "#"}, text), this.showHit(hit))
  },
  render:function() {
    if (!this.props.data || !this.props.data.length) return E("div",null);
    return E("div", null, this.props.data.map(this.renderAncestor))
  } 
}); 
var Children=React.createClass({
  getInitialState:function() {
    return {selected:0};
  },
  shouldComponentUpdate:function(nextProps,nextState) {
    if (nextProps.data.join()!=this.props.data.join() ) {
      nextState.selected=parseInt(nextProps.data[0]);
    }
    return true;
  },
  open:function(e) {
    var n=e.target.parentNode.dataset["n"];
    if (typeof n!=="undefined") this.props.setCurrent(parseInt(n));
  }, 
  showHit:function(hit) {
    if (hit)  return E("a", {href: "#", onClick: this.showExcerpt, 
      className: "pull-right badge hitbadge"}, trimHit(hit))
    else return E("span",null);
  },
  showExcerpt:function(e) {
    var n=parseInt(e.target.parentNode.dataset["n"]);
    e.stopPropagation();
    e.preventDefault();
    this.props.hitClick(n);
  }, 
  nodeClicked:function(e) {
    var target=e.target;
    while (target && typeof target.dataset.n=="undefined")target=target.parentNode;
    if (!target) return;
    var n=parseInt(target.dataset.n);
    var child=this.props.toc[n];
    if (this.props.showTextOnLeafNodeOnly) {
      if (child.hasChild) {
        this.open(e);
      } else {
        this.showText(e);
      }
    } else {
      if (n==this.state.selected) {
        if (child.hasChild) this.open(e);
        else this.showText(e);
      } else {
        this.showText(e);
      }
    }
    this.setState({selected:n});
  },
  renderChild:function(n) {
    var child=this.props.toc[n];
    var hit=this.props.toc[n].hit;
    var classes="node child",haschild=false;  
    //if (child.extra) extra="<extra>"+child.extra+"</extra>";
    if (!child.hasChild) classes+=" nochild";
    else haschild=true;
    var selected=this.state.selected;
    if (this.props.showTextOnLeafNodeOnly) {
      selected=n;
    }

    var classes="btn btn-link";
    if (n==selected) {
      if (haschild) classes="btn btn-default expandable";
      else classes="btn btn-link link-selected";
    }

    var text=this.props.toc[n].text.trim();
    var depth=this.props.toc[n].depth;
    text=trimText(text,this.props.opts)
    if (this.props.textConverter) text=this.props.textConverter(text);
    return E("div", {key: "child"+n, "data-n": n}, renderDepth(depth,this.props.opts,"child"), 
           E("a", {"data-n": n, className: classes +" tocitem text", onClick: this.nodeClicked}, text+" "), this.showHit(hit)
           )
  },
  showText:function(e) { 
    var target=e.target;
    var n=e.target.dataset.n;
    while (target && typeof target.dataset.n=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset.n && this.props.showText) {
      this.props.showText(parseInt(target.dataset.n));
    }
  },
  render:function() {
    if (!this.props.data || !this.props.data.length) return E("div", null);
    return E("div", null, this.props.data.map(this.renderChild))
  }
}); 

var stacktoc = React.createClass({
  getInitialState: function() {
    return {bar: "world",cur:this.props.current|0};//403
  },
  buildtoc: function(toc) {
    if (!toc || !toc.length) return;  
      var depths=[];
      var prev=0;
      for (var i=0;i<toc.length;i++) {
        var depth=toc[i].depth;
        if (prev>depth) { //link to prev sibling
          if (depths[depth]) toc[depths[depth]].next = i;
          for (var j=depth;j<prev;j++) depths[j]=0;
        }
        if (i<toc.length-1 && toc[i+1].depth>depth) {
          toc[i].hasChild=true;
        }
        depths[depth]=i;
        prev=depth;
      } 

  }, 

  componentWillReceiveProps:function(nextProps) {
    if (nextProps.data && nextProps.data.length && nextProps.data != this.props.data) {
      this.buildtoc(nextProps.data);
    }
  }, 
  setCurrent:function(n) {
    n=parseInt(n);
    this.setState({cur:n});
    var child=this.props.data[n];
    if (!(child.hasChild && this.props.showTextOnLeafNodeOnly)) {
		  if (this.props.showText)  this.props.showText(n);
    }
  },
  findByVoff:function(voff) {
    for (var i=0;i<this.props.data.length;i++) {
      var t=this.props.data[i];
      if (t.voff>voff) return i-1;
    }
    return 0; //return root node
  },
  shouldComponentUpdate:function(nextProps,nextState) {
    if (nextProps.goVoff&&nextProps.goVoff !=this.props.goVoff) {
      nextState.cur=this.findByVoff(nextProps.goVoff);
    }
    if (nextProps.current != this.props.current) {
      nextState.cur=nextProps.current;
    }
    return true;
  },
  fillHit:function(nodeIds) {
    if (typeof nodeIds=="undefined") return;
    if (typeof nodeIds=="number") nodeIds=[nodeIds];
    var toc=this.props.data;
    var hits=this.props.hits;
    if (toc.length<2) return;
    var getRange=function(n) {
      if (n+1>=toc.length) {
        console.error("exceed toc length",n);
        return;
      }
      var depth=toc[n].depth , nextdepth=toc[n+1].depth;
      if (n==toc.length-1 || n==0) {
          toc[n].end=Math.pow(2, 48);
          return;
      } else  if (nextdepth>depth){
        if (toc[n].next) {
          toc[n].end= toc[toc[n].next].voff;  
        } else { //last sibling
          var next=n+1;
          while (next<toc.length && toc[next].depth>depth) next++;
          if (next==toc.length) toc[n].end=Math.pow(2,48);
          else toc[n].end=toc[next].voff;
        }
      } else { //same level or end of sibling
        toc[n].end=toc[n+1].voff;
      }
    }
    var getHit=function(n) {
      var start=toc[n].voff;
      var end=toc[n].end;
      if (n==0) {
        toc[0].hit=hits.length;
      } else {
        var hit=0;
        for (var i=0;i<hits.length;i++) {
          if (hits[i]>=start && hits[i]<end) hit++;
        }
        toc[n].hit=hit;
      }
    }
    nodeIds.forEach(function(n){getRange(n)});
    nodeIds.forEach(function(n){getHit(n)});
  },
  fillHits:function(ancestors,children) {
      this.fillHit(ancestors);
      this.fillHit(children);
      this.fillHit(this.state.cur);
  },
  hitClick:function(n) {
    if (this.props.showExcerpt)  this.props.showExcerpt(n);
  },
  onHitClick:function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.hitClick(this.state.cur);
  },
  showHit:function(hit) {
    if (hit)  return E("a", {href: "#", onClick: this.onHitClick, className: "pull-right badge hitbadge"}, trimHit(hit))
    else return E("span",null);
  },
  showText:function(e) {
    var target=e.target;
    var n=e.target.dataset.n;
    while (target && typeof target.dataset.n=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset.n && this.props.showText) {
      this.props.showText(parseInt(target.dataset.n));
    }
  },
  render: function() {
    if (!this.props.data || !this.props.data.length) return E("div",null);
    var depth=this.props.data[this.state.cur].depth+1;
    var ancestors=enumAncestors(this.props.data,this.state.cur);
    var children=enumChildren(this.props.data,this.state.cur);
    var opts=this.props.opts||{};
    var current=this.props.data[this.state.cur];
    if (this.props.hits && this.props.hits.length) {
      this.fillHits(ancestors,children);
    }

    var text=current.text.trim();
    text=trimText(text,opts);
    if (this.props.textConverter) text=this.props.textConverter(text);
    return ( 
      E("div", {className: "stacktoc"}, 
        E(Ancestors, {opts: opts, textConverter: this.props.textConverter, showExcerpt: this.hitClick, setCurrent: this.setCurrent, toc: this.props.data, data: ancestors}), 
        E("div", {className: "node current"}, renderDepth(depth-1,opts,"current"), E("a", {href: "#", onClick: this.showText, "data-n": this.state.cur}, E("span", {className: "text"}, text)), this.showHit(current.hit)), 
        E(Children, {opts: opts, textConverter: this.props.textConverter, showTextOnLeafNodeOnly: this.props.showTextOnLeafNodeOnly, 
                  showText: this.props.showText, hitClick: this.hitClick, setCurrent: this.setCurrent, toc: this.props.data, data: children})
      )
    ); 
  }
});
var enumAncestors=function(toc,cur) {
    if (!toc || !toc.length) return;
    if (cur==0) return [];
    var n=cur-1;
    var depth=toc[cur].depth - 1;
    var parents=[];
    while (n>=0 && depth>0) {
      if (toc[n].depth==depth) {
        parents.unshift(n);
        depth--;
      }
      n--;
    }
    parents.unshift(0); //first ancestor is root node
    return parents;
}

var enumChildren=function(toc,cur) {
    var children=[];
    if (!toc || !toc.length || toc.length==1) return children;

    if (toc[cur+1].depth!= 1+toc[cur].depth) return children;  // no children node
    var n=cur+1;
    var child=toc[n];
    
    while (child) {
      children.push(n);
      var next=toc[n+1];
      if (!next) break;
      if (next.depth==child.depth) {
        n++;
      } else if (next.depth>child.depth) {
        n=child.next;
      } else break;
      if (n) child=toc[n];else break;
    }
    return children;
}
var genToc=function(toc,title) {
    var out=[{depth:0,text:title||ksana.js.title}];
    if (toc.texts) for (var i=0;i<toc.texts.length;i++) {
      out.push({text:toc.texts[i],depth:toc.depths[i], voff:toc.vpos[i]});
    }
    return out; 
}
module.exports={component:stacktoc,genToc:genToc,enumChildren:enumChildren,enumAncestors:enumAncestors};

},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\checkbrowser.js":[function(require,module,exports){
/** @jsx React.DOM */
/*
convert to pure js
save -g reactify
*/
var E=React.createElement;

var hasksanagap=(typeof ksanagap!="undefined");
if (hasksanagap && (typeof console=="undefined" || typeof console.log=="undefined")) {
		window.console={log:ksanagap.log,error:ksanagap.error,debug:ksanagap.debug,warn:ksanagap.warn};
		console.log("install console output funciton");
}

var checkfs=function() {
	return (navigator && navigator.webkitPersistentStorage) || hasksanagap;
}
var featurechecks={
	"fs":checkfs
}
var checkbrowser = React.createClass({
	getInitialState:function() {

		var missingFeatures=this.getMissingFeatures();
		return {ready:false, missing:missingFeatures};
	},
	getMissingFeatures:function() {
		var feature=this.props.feature.split(",");
		var status=[];
		feature.map(function(f){
			var checker=featurechecks[f];
			if (checker) checker=checker();
			status.push([f,checker]);
		});
		return status.filter(function(f){return !f[1]});
	},
	downloadbrowser:function() {
		window.location="https://www.google.com/chrome/"
	},
	renderMissing:function() {
		var showMissing=function(m) {
			return E("div", null, m);
		}
		return (
		 E("div", {ref: "dialog1", className: "modal fade", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("button", {type: "button", className: "close", "data-dismiss": "modal", "aria-hidden": "true"}, "×"), 
		          E("h4", {className: "modal-title"}, "Browser Check")
		        ), 
		        E("div", {className: "modal-body"}, 
		          E("p", null, "Sorry but the following feature is missing"), 
		          this.state.missing.map(showMissing)
		        ), 
		        E("div", {className: "modal-footer"}, 
		          E("button", {onClick: this.downloadbrowser, type: "button", className: "btn btn-primary"}, "Download Google Chrome")
		        )
		      )
		    )
		  )
		 );
	},
	renderReady:function() {
		return E("span", null, "browser ok")
	},
	render:function(){
		return  (this.state.missing.length)?this.renderMissing():this.renderReady();
	},
	componentDidMount:function() {
		if (!this.state.missing.length) {
			this.props.onReady();
		} else {
			$(this.refs.dialog1.getDOMNode()).modal('show');
		}
	}
});

module.exports=checkbrowser;
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\downloader.js":[function(require,module,exports){

var userCancel=false;
var files=[];
var totalDownloadByte=0;
var targetPath="";
var tempPath="";
var nfile=0;
var baseurl="";
var result="";
var downloading=false;
var startDownload=function(dbid,_baseurl,_files) { //return download id
	var fs     = require("fs");
	var path   = require("path");

	
	files=_files.split("\uffff");
	if (downloading) return false; //only one session
	userCancel=false;
	totalDownloadByte=0;
	nextFile();
	downloading=true;
	baseurl=_baseurl;
	if (baseurl[baseurl.length-1]!='/')baseurl+='/';
	targetPath=ksanagap.rootPath+dbid+'/';
	tempPath=ksanagap.rootPath+".tmp/";
	result="";
	return true;
}

var nextFile=function() {
	setTimeout(function(){
		if (nfile==files.length) {
			nfile++;
			endDownload();
		} else {
			downloadFile(nfile++);	
		}
	},100);
}

var downloadFile=function(nfile) {
	var url=baseurl+files[nfile];
	var tmpfilename=tempPath+files[nfile];
	var mkdirp = require("./mkdirp");
	var fs     = require("fs");
	var http   = require("http");

	mkdirp.sync(path.dirname(tmpfilename));
	var writeStream = fs.createWriteStream(tmpfilename);
	var datalength=0;
	var request = http.get(url, function(response) {
		response.on('data',function(chunk){
			writeStream.write(chunk);
			totalDownloadByte+=chunk.length;
			if (userCancel) {
				writeStream.end();
				setTimeout(function(){nextFile();},100);
			}
		});
		response.on("end",function() {
			writeStream.end();
			setTimeout(function(){nextFile();},100);
		});
	});
}

var cancelDownload=function() {
	userCancel=true;
	endDownload();
}
var verify=function() {
	return true;
}
var endDownload=function() {
	nfile=files.length+1;//stop
	result="cancelled";
	downloading=false;
	if (userCancel) return;
	var fs     = require("fs");
	var mkdirp = require("./mkdirp");

	for (var i=0;i<files.length;i++) {
		var targetfilename=targetPath+files[i];
		var tmpfilename   =tempPath+files[i];
		mkdirp.sync(path.dirname(targetfilename));
		fs.renameSync(tmpfilename,targetfilename);
	}
	if (verify()) {
		result="success";
	} else {
		result="error";
	}
}

var downloadedByte=function() {
	return totalDownloadByte;
}
var doneDownload=function() {
	if (nfile>files.length) return result;
	else return "";
}
var downloadingFile=function() {
	return nfile-1;
}

var downloader={startDownload:startDownload, downloadedByte:downloadedByte,
	downloadingFile:downloadingFile, cancelDownload:cancelDownload,doneDownload:doneDownload};
module.exports=downloader;
},{"./mkdirp":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\mkdirp.js","fs":false,"http":false,"path":false}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\fileinstaller.js":[function(require,module,exports){
/** @jsx React.DOM */

/* todo , optional kdb */

var HtmlFS=require("./htmlfs");
var html5fs=require("./html5fs");
var CheckBrowser=require("./checkbrowser");
var E=React.createElement;
  

var FileList = React.createClass({
	getInitialState:function() {
		return {downloading:false,progress:0};
	},
	updatable:function(f) {
        var classes="btn btn-warning";
        if (this.state.downloading) classes+=" disabled";
		if (f.hasUpdate) return   E("button", {className: classes, 
			"data-filename": f.filename, "data-url": f.url, 
	            onClick: this.download
	       }, "Update")
		else return null;
	},
	showLocal:function(f) {
        var classes="btn btn-danger";
        if (this.state.downloading) classes+=" disabled";
	  return E("tr", null, E("td", null, f.filename), 
	      E("td", null), 
	      E("td", {className: "pull-right"}, 
	      this.updatable(f), E("button", {className: classes, 
	               onClick: this.deleteFile, "data-filename": f.filename}, "Delete")
	        
	      )
	  )
	},  
	showRemote:function(f) { 
	  var classes="btn btn-warning";
	  if (this.state.downloading) classes+=" disabled";
	  return (E("tr", {"data-id": f.filename}, E("td", null, 
	      f.filename), 
	      E("td", null, f.desc), 
	      E("td", null, 
	      E("span", {"data-filename": f.filename, "data-url": f.url, 
	            className: classes, 
	            onClick: this.download}, "Download")
	      )
	  ));
	},
	showFile:function(f) {
	//	return <span data-id={f.filename}>{f.url}</span>
		return (f.ready)?this.showLocal(f):this.showRemote(f);
	},
	reloadDir:function() {
		this.props.action("reload");
	},
	download:function(e) {
		var url=e.target.dataset["url"];
		var filename=e.target.dataset["filename"];
		this.setState({downloading:true,progress:0,url:url});
		this.userbreak=false;
		html5fs.download(url,filename,function(){
			this.reloadDir();
			this.setState({downloading:false,progress:1});
			},function(progress,total){
				if (progress==0) {
					this.setState({message:"total "+total})
			 	}
			 	this.setState({progress:progress});
			 	//if user press abort return true
			 	return this.userbreak;
			}
		,this);
	},
	deleteFile:function( e) {
		var filename=e.target.attributes["data-filename"].value;
		this.props.action("delete",filename);
	},
	allFilesReady:function(e) {
		return this.props.files.every(function(f){ return f.ready});
	},
	dismiss:function() {
		$(this.refs.dialog1.getDOMNode()).modal('hide');
		this.props.action("dismiss");
	},
	abortdownload:function() {
		this.userbreak=true;
	},
	showProgress:function() {
	     if (this.state.downloading) {
	      var progress=Math.round(this.state.progress*100);
	      return (
	      	E("div", null, 
	      	"Downloading from ", this.state.url, 
	      E("div", {key: "progress", className: "progress col-md-8"}, 
	          E("div", {className: "progress-bar", role: "progressbar", 
	              "aria-valuenow": progress, "aria-valuemin": "0", 
	              "aria-valuemax": "100", style: {width: progress+"%"}}, 
	            progress, "%"
	          )
	        ), 
	        E("button", {onClick: this.abortdownload, 
	        	className: "btn btn-danger col-md-4"}, "Abort")
	        )
	        );
	      } else {
	      		if ( this.allFilesReady() ) {
	      			return E("button", {onClick: this.dismiss, className: "btn btn-success"}, "Ok")
	      		} else return null;
	      		
	      }
	},
	showUsage:function() {
		var percent=this.props.remainPercent;
           return (E("div", null, E("span", {className: "pull-left"}, "Usage:"), E("div", {className: "progress"}, 
		  E("div", {className: "progress-bar progress-bar-success progress-bar-striped", role: "progressbar", style: {width: percent+"%"}}, 
		    	percent+"%"
		  )
		)));
	},
	render:function() {
	  	return (
		E("div", {ref: "dialog1", className: "modal fade", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("h4", {className: "modal-title"}, "File Installer")
		        ), 
		        E("div", {className: "modal-body"}, 
		        	E("table", {className: "table"}, 
		        	E("tbody", null, 
		          	this.props.files.map(this.showFile)
		          	)
		          )
		        ), 
		        E("div", {className: "modal-footer"}, 
		        	this.showUsage(), 
		           this.showProgress()
		        )
		      )
		    )
		  )
		);
	},	
	componentDidMount:function() {
		$(this.refs.dialog1.getDOMNode()).modal('show');
	}
});
/*TODO kdb check version*/
var Filemanager = React.createClass({
	getInitialState:function() {
		var quota=this.getQuota();
		return {browserReady:false,noupdate:true,	requestQuota:quota,remain:0};
	},
	getQuota:function() {
		var q=this.props.quota||"128M";
		var unit=q[q.length-1];
		var times=1;
		if (unit=="M") times=1024*1024;
		else if (unit="K") times=1024;
		return parseInt(q) * times;
	},
	missingKdb:function() {
		if (ksanagap.platform!="chrome") return [];
		var missing=this.props.needed.filter(function(kdb){
			for (var i in html5fs.files) {
				if (html5fs.files[i][0]==kdb.filename) return false;
			}
			return true;
		},this);
		return missing;
	},
	getRemoteUrl:function(fn) {
		var f=this.props.needed.filter(function(f){return f.filename==fn});
		if (f.length ) return f[0].url;
	},
	genFileList:function(existing,missing){
		var out=[];
		for (var i in existing) {
			var url=this.getRemoteUrl(existing[i][0]);
			out.push({filename:existing[i][0], url :url, ready:true });
		}
		for (var i in missing) {
			out.push(missing[i]);
		}
		return out;
	},
	reload:function() {
		html5fs.readdir(function(files){
  			this.setState({files:this.genFileList(files,this.missingKdb())});
  		},this);
	 },
	deleteFile:function(fn) {
	  html5fs.rm(fn,function(){
	  	this.reload();
	  },this);
	},
	onQuoteOk:function(quota,usage) {
		if (ksanagap.platform!="chrome") {
			//console.log("onquoteok");
			this.setState({noupdate:true,missing:[],files:[],autoclose:true
				,quota:quota,remain:quota-usage,usage:usage});
			return;
		}
		//console.log("quote ok");
		var files=this.genFileList(html5fs.files,this.missingKdb());
		var that=this;
		that.checkIfUpdate(files,function(hasupdate) {
			var missing=this.missingKdb();
			var autoclose=this.props.autoclose;
			if (missing.length) autoclose=false;
			that.setState({autoclose:autoclose,
				quota:quota,usage:usage,files:files,
				missing:missing,
				noupdate:!hasupdate,
				remain:quota-usage});
		});
	},  
	onBrowserOk:function() {
	  this.totalDownloadSize();
	}, 
	dismiss:function() {
		this.props.onReady(this.state.usage,this.state.quota);
		setTimeout(function(){
			var modalin=$(".modal.in");
			if (modalin.modal) modalin.modal('hide');
		},500);
	}, 
	totalDownloadSize:function() {
		var files=this.missingKdb();
		var taskqueue=[],totalsize=0;
		for (var i=0;i<files.length;i++) {
			taskqueue.push(
				(function(idx){
					return (function(data){
						if (!(typeof data=='object' && data.__empty)) totalsize+=data;
						html5fs.getDownloadSize(files[idx].url,taskqueue.shift());
					});
				})(i)
			);
		}
		var that=this;
		taskqueue.push(function(data){	
			totalsize+=data;
			setTimeout(function(){that.setState({requireSpace:totalsize,browserReady:true})},0);
		});
		taskqueue.shift()({__empty:true});
	},
	checkIfUpdate:function(files,cb) {
		var taskqueue=[];
		for (var i=0;i<files.length;i++) {
			taskqueue.push(
				(function(idx){
					return (function(data){
						if (!(typeof data=='object' && data.__empty)) files[idx-1].hasUpdate=data;
						html5fs.checkUpdate(files[idx].url,files[idx].filename,taskqueue.shift());
					});
				})(i)
			);
		}
		var that=this;
		taskqueue.push(function(data){	
			files[files.length-1].hasUpdate=data;
			var hasupdate=files.some(function(f){return f.hasUpdate});
			if (cb) cb.apply(that,[hasupdate]);
		});
		taskqueue.shift()({__empty:true});
	},
	render:function(){
    		if (!this.state.browserReady) {   
      			return E(CheckBrowser, {feature: "fs", onReady: this.onBrowserOk})
    		} if (!this.state.quota || this.state.remain<this.state.requireSpace) {  
    			var quota=this.state.requestQuota;
    			if (this.state.usage+this.state.requireSpace>quota) {
    				quota=(this.state.usage+this.state.requireSpace)*1.5;
    			}
      			return E(HtmlFS, {quota: quota, autoclose: "true", onReady: this.onQuoteOk})
      		} else {
			if (!this.state.noupdate || this.missingKdb().length || !this.state.autoclose) {
				var remain=Math.round((this.state.usage/this.state.quota)*100);				
				return E(FileList, {action: this.action, files: this.state.files, remainPercent: remain})
			} else {
				setTimeout( this.dismiss ,0);
				return E("span", null, "Success");
			}
      		}
	},
	action:function() {
	  var args = Array.prototype.slice.call(arguments);
	  var type=args.shift();
	  var res=null, that=this;
	  if (type=="delete") {
	    this.deleteFile(args[0]);
	  }  else if (type=="reload") {
	  	this.reload();
	  } else if (type=="dismiss") {
	  	this.dismiss();
	  }
	}
});

module.exports=Filemanager;
},{"./checkbrowser":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\checkbrowser.js","./html5fs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js","./htmlfs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\htmlfs.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js":[function(require,module,exports){
/* emulate filesystem on html5 browser */
var get_head=function(url,field,cb){
	var xhr = new XMLHttpRequest();
	xhr.open("HEAD", url, true);
	xhr.onreadystatechange = function() {
			if (this.readyState == this.DONE) {
				cb(xhr.getResponseHeader(field));
			} else {
				if (this.status!==200&&this.status!==206) {
					cb("");
				}
			} 
	};
	xhr.send();	
}
var get_date=function(url,cb) {
	get_head(url,"Last-Modified",function(value){
		cb(value);
	});
}
var get_size=function(url, cb) {
	get_head(url,"Content-Length",function(value){
		cb(parseInt(value));
	});
};
var checkUpdate=function(url,fn,cb) {
	if (!url) {
		cb(false);
		return;
	}
	get_date(url,function(d){
		API.fs.root.getFile(fn, {create: false, exclusive: false}, function(fileEntry) {
			fileEntry.getMetadata(function(metadata){
				var localDate=Date.parse(metadata.modificationTime);
				var urlDate=Date.parse(d);
				cb(urlDate>localDate);
			});
		},function(){
			cb(false);
		});
	});
}
var download=function(url,fn,cb,statuscb,context) {
	 var totalsize=0,batches=null,written=0;
	 var fileEntry=0, fileWriter=0;
	 var createBatches=function(size) {
		var bytes=1024*1024, out=[];
		var b=Math.floor(size / bytes);
		var last=size %bytes;
		for (var i=0;i<=b;i++) {
			out.push(i*bytes);
		}
		out.push(b*bytes+last);
		return out;
	 }
	 var finish=function() {
		 rm(fn,function(){
				fileEntry.moveTo(fileEntry.filesystem.root, fn,function(){
					setTimeout( cb.bind(context,false) , 0) ; 
				},function(e){
					console.log("failed",e)
				});
		 },this); 
	 };
		var tempfn="temp.kdb";
		var batch=function(b) {
		var abort=false;
		var xhr = new XMLHttpRequest();
		var requesturl=url+"?"+Math.random();
		xhr.open('get', requesturl, true);
		xhr.setRequestHeader('Range', 'bytes='+batches[b]+'-'+(batches[b+1]-1));
		xhr.responseType = 'blob';    
		xhr.addEventListener('load', function() {
			var blob=this.response;
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.seek(fileWriter.length);
				fileWriter.write(blob);
				written+=blob.size;
				fileWriter.onwriteend = function(e) {
					if (statuscb) {
						abort=statuscb.apply(context,[ fileWriter.length / totalsize,totalsize ]);
						if (abort) setTimeout( cb.bind(context,false) , 0) ;
				 	}
					b++;
					if (!abort) {
						if (b<batches.length-1) setTimeout(batch.bind(context,b),0);
						else                    finish();
				 	}
			 	};
			}, console.error);
		},false);
		xhr.send();
	}

	get_size(url,function(size){
		totalsize=size;
		if (!size) {
			if (cb) cb.apply(context,[false]);
		} else {//ready to download
			rm(tempfn,function(){
				 batches=createBatches(size);
				 if (statuscb) statuscb.apply(context,[ 0, totalsize ]);
				 API.fs.root.getFile(tempfn, {create: 1, exclusive: false}, function(_fileEntry) {
							fileEntry=_fileEntry;
						batch(0);
				 });
			},this);
		}
	});
}

var readFile=function(filename,cb,context) {
	API.fs.root.getFile(filename, function(fileEntry) {
			var reader = new FileReader();
			reader.onloadend = function(e) {
					if (cb) cb.apply(cb,[this.result]);
				};            
	}, console.error);
}
var writeFile=function(filename,buf,cb,context){
	API.fs.root.getFile(filename, {create: true, exclusive: true}, function(fileEntry) {
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.write(buf);
				fileWriter.onwriteend = function(e) {
					if (cb) cb.apply(cb,[buf.byteLength]);
				};            
			}, console.error);
	}, console.error);
}

var readdir=function(cb,context) {
	var dirReader = API.fs.root.createReader();
	var out=[],that=this;
	dirReader.readEntries(function(entries) {
		if (entries.length) {
			for (var i = 0, entry; entry = entries[i]; ++i) {
				if (entry.isFile) {
					out.push([entry.name,entry.toURL ? entry.toURL() : entry.toURI()]);
				}
			}
		}
		API.files=out;
		if (cb) cb.apply(context,[out]);
	}, function(){
		if (cb) cb.apply(context,[null]);
	});
}
var getFileURL=function(filename) {
	if (!API.files ) return null;
	var file= API.files.filter(function(f){return f[0]==filename});
	if (file.length) return file[0][1];
}
var rm=function(filename,cb,context) {
	var url=getFileURL(filename);
	if (url) rmURL(url,cb,context);
	else if (cb) cb.apply(context,[false]);
}

var rmURL=function(filename,cb,context) {
	webkitResolveLocalFileSystemURL(filename, function(fileEntry) {
		fileEntry.remove(function() {
			if (cb) cb.apply(context,[true]);
		}, console.error);
	},  function(e){
		if (cb) cb.apply(context,[false]);//no such file
	});
}
function errorHandler(e) {
	console.error('Error: ' +e.name+ " "+e.message);
}
var initfs=function(grantedBytes,cb,context) {
	webkitRequestFileSystem(PERSISTENT, grantedBytes,  function(fs) {
		API.fs=fs;
		API.quota=grantedBytes;
		readdir(function(){
			API.initialized=true;
			cb.apply(context,[grantedBytes,fs]);
		},context);
	}, errorHandler);
}
var init=function(quota,cb,context) {
	navigator.webkitPersistentStorage.requestQuota(quota, 
			function(grantedBytes) {
				initfs(grantedBytes,cb,context);
		}, errorHandler
	);
}
var queryQuota=function(cb,context) {
	var that=this;
	navigator.webkitPersistentStorage.queryUsageAndQuota( 
	 function(usage,quota){
			initfs(quota,function(){
				cb.apply(context,[usage,quota]);
			},context);
	});
}
var API={
	init:init
	,readdir:readdir
	,checkUpdate:checkUpdate
	,rm:rm
	,rmURL:rmURL
	,getFileURL:getFileURL
	,writeFile:writeFile
	,readFile:readFile
	,download:download
	,get_head:get_head
	,get_date:get_date
	,get_size:get_size
	,getDownloadSize:get_size
	,queryQuota:queryQuota
}
module.exports=API;
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\htmlfs.js":[function(require,module,exports){
var html5fs=require("./html5fs");
var E=React.createElement;

var htmlfs = React.createClass({
	getInitialState:function() { 
		return {ready:false, quota:0,usage:0,Initialized:false,autoclose:this.props.autoclose};
	},
	initFilesystem:function() {
		var quota=this.props.quota||1024*1024*128; // default 128MB
		quota=parseInt(quota);
		html5fs.init(quota,function(q){
			this.dialog=false;
			$(this.refs.dialog1.getDOMNode()).modal('hide');
			this.setState({quota:q,autoclose:true});
		},this);
	},
	welcome:function() {
		return (
		E("div", {ref: "dialog1", className: "modal fade", id: "myModal", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("h4", {className: "modal-title"}, "Welcome")
		        ), 
		        E("div", {className: "modal-body"}, 
		          "Browser will ask for your confirmation."
		        ), 
		        E("div", {className: "modal-footer"}, 
		          E("button", {onClick: this.initFilesystem, type: "button", 
		            className: "btn btn-primary"}, "Initialize File System")
		        )
		      )
		    )
		  )
		 );
	},
	renderDefault:function(){
		var used=Math.floor(this.state.usage/this.state.quota *100);
		var more=function() {
			if (used>50) return E("button", {type: "button", className: "btn btn-primary"}, "Allocate More");
			else null;
		}
		return (
		E("div", {ref: "dialog1", className: "modal fade", id: "myModal", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("h4", {className: "modal-title"}, "Sandbox File System")
		        ), 
		        E("div", {className: "modal-body"}, 
		          E("div", {className: "progress"}, 
		            E("div", {className: "progress-bar", role: "progressbar", style: {width: used+"%"}}, 
		               used, "%"
		            )
		          ), 
		          E("span", null, this.state.quota, " total , ", this.state.usage, " in used")
		        ), 
		        E("div", {className: "modal-footer"}, 
		          E("button", {onClick: this.dismiss, type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "Close"), 
		          more()
		        )
		      )
		    )
		  )
		  );
	},
	dismiss:function() {
		var that=this;
		setTimeout(function(){
			that.props.onReady(that.state.quota,that.state.usage);	
		},0);
	},
	queryQuota:function() {
		if (ksanagap.platform=="chrome") {
			html5fs.queryQuota(function(usage,quota){
				this.setState({usage:usage,quota:quota,initialized:true});
			},this);			
		} else {
			this.setState({usage:333,quota:1000*1000*1024,initialized:true,autoclose:true});
		}
	},
	render:function() {
		var that=this;
		if (!this.state.quota || this.state.quota<this.props.quota) {
			if (this.state.initialized) {
				this.dialog=true;
				return this.welcome();	
			} else {
				return E("span", null, "checking quota");
			}			
		} else {
			if (!this.state.autoclose) {
				this.dialog=true;
				return this.renderDefault(); 
			}
			this.dismiss();
			this.dialog=false;
			return null;
		}
	},
	componentDidMount:function() {
		if (!this.state.quota) {
			this.queryQuota();

		};
	},
	componentDidUpdate:function() {
		if (this.dialog) $(this.refs.dialog1.getDOMNode()).modal('show');
	}
});

module.exports=htmlfs;
},{"./html5fs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\index.js":[function(require,module,exports){
var ksana={"platform":"remote"};
if (typeof window!="undefined") {
	window.ksana=ksana;
	if (typeof ksanagap=="undefined") {
		window.ksanagap=require("./ksanagap"); //compatible layer with mobile
	}
}
if (typeof process !="undefined") {
	if (process.versions && process.versions["node-webkit"]) {
  		if (typeof nodeRequire!="undefined") ksana.require=nodeRequire;
  		ksana.platform="node-webkit";
  		window.ksanagap.platform="node-webkit";
		var ksanajs=require("fs").readFileSync("ksana.js","utf8").trim();
		ksana.js=JSON.parse(ksanajs.substring(14,ksanajs.length-1));
		window.kfs=require("./kfs");
  	}
} else if (typeof chrome!="undefined"){//} && chrome.fileSystem){
//	window.ksanagap=require("./ksanagap"); //compatible layer with mobile
	window.ksanagap.platform="chrome";
	window.kfs=require("./kfs_html5");
	if(window.location.origin.indexOf("//127.0.0.1")>-1) {
		require("./livereload")();
	}
	ksana.platform="chrome";
} else {
	if (typeof ksanagap!="undefined" && typeof fs!="undefined") {//mobile
		var ksanajs=fs.readFileSync("ksana.js","utf8").trim(); //android extra \n at the end
		ksana.js=JSON.parse(ksanajs.substring(14,ksanajs.length-1));
		ksana.platform=ksanagap.platform;
		if (typeof ksanagap.android !="undefined") {
			ksana.platform="android";
		}
	}
}
var timer=null;
var boot=function(appId,cb) {
	if (typeof React!="undefined") {
		React.initializeTouchEvents(true);
	}
	ksana.appId=appId;
	if (ksanagap.platform=="chrome") { //need to wait for jsonp ksana.js
		timer=setInterval(function(){
			if (ksana.ready){
				clearInterval(timer);
				if (ksana.js && ksana.js.files && ksana.js.files.length) {
					require("./installkdb")(ksana.js,cb);
				} else {
					cb();		
				}
			}
		},300);
	} else {
		cb();
	}
}

module.exports={boot:boot
	,htmlfs:require("./htmlfs")
	,html5fs:require("./html5fs")
	,liveupdate:require("./liveupdate")
	,fileinstaller:require("./fileinstaller")
	,downloader:require("./downloader")
	,installkdb:require("./installkdb")
};
},{"./downloader":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\downloader.js","./fileinstaller":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\fileinstaller.js","./html5fs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js","./htmlfs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\htmlfs.js","./installkdb":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\installkdb.js","./kfs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs.js","./kfs_html5":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs_html5.js","./ksanagap":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\ksanagap.js","./livereload":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\livereload.js","./liveupdate":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\liveupdate.js","fs":false}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\installkdb.js":[function(require,module,exports){
var Fileinstaller=require("./fileinstaller");

var getRequire_kdb=function() {
    var required=[];
    ksana.js.files.map(function(f){
      if (f.indexOf(".kdb")==f.length-4) {
        var slash=f.lastIndexOf("/");
        if (slash>-1) {
          var dbid=f.substring(slash+1,f.length-4);
          required.push({url:f,dbid:dbid,filename:dbid+".kdb"});
        } else {
          var dbid=f.substring(0,f.length-4);
          required.push({url:ksana.js.baseurl+f,dbid:dbid,filename:f});
        }        
      }
    });
    return required;
}
var callback=null;
var onReady=function() {
	callback();
}
var openFileinstaller=function(keep) {
	var require_kdb=getRequire_kdb().map(function(db){
	  return {
	    url:window.location.origin+window.location.pathname+db.dbid+".kdb",
	    dbdb:db.dbid,
	    filename:db.filename
	  }
	})
	return React.createElement(Fileinstaller, {quota: "512M", autoclose: !keep, needed: require_kdb, 
	                 onReady: onReady});
}
var installkdb=function(ksanajs,cb,context) {
	React.render(openFileinstaller(),document.getElementById("main"));
	callback=cb;
}
module.exports=installkdb;
},{"./fileinstaller":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\fileinstaller.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs.js":[function(require,module,exports){
//Simulate feature in ksanagap
/* 
  runs on node-webkit only
*/

var readDir=function(path) { //simulate Ksanagap function
	var fs=nodeRequire("fs");
	path=path||"..";
	var dirs=[];
	if (path[0]==".") {
		if (path==".") dirs=fs.readdirSync(".");
		else {
			dirs=fs.readdirSync("..");
		}
	} else {
		dirs=fs.readdirSync(path);
	}

	return dirs.join("\uffff");
}
var listApps=function() {

	var fs=nodeRequire("fs");
	var ksanajsfile=function(d) {return "../"+d+"/ksana.js"};
	var dirs=fs.readdirSync("..").filter(function(d){
				return fs.statSync("../"+d).isDirectory() && d[0]!="."
				   && fs.existsSync(ksanajsfile(d));
	});
	
	var out=dirs.map(function(d){

		var fn=ksanajsfile(d);
		if (!fs.existsSync(fn)) return;
		var content=fs.readFileSync(fn,"utf8");
  		content=content.replace("})","}");
  		content=content.replace("jsonp_handler(","");
  		try{
  			var obj= JSON.parse(content);
			obj.dbid=d;
			obj.path=d;
			return obj;
  		} catch(e) {
  			console.log(e);
  			return null;
  		}
	});

	out=out.filter(function(o){return !!o});
	return JSON.stringify(out);
}



var kfs={readDir:readDir,listApps:listApps};

module.exports=kfs;
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs_html5.js":[function(require,module,exports){
var readDir=function(){
	return "[]";
}
var listApps=function(){
	return "[]";
}
module.exports={readDir:readDir,listApps:listApps};
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\ksanagap.js":[function(require,module,exports){
var appname="installer";
var switchApp=function(path) {
	var fs=require("fs");
	path="../"+path;
	appname=path;
	document.location.href= path+"/index.html"; 
	process.chdir(path);
}
var downloader={};
var rootPath="";

var deleteApp=function(app) {
	console.error("not allow on PC, do it in File Explorer/ Finder");
}
var username=function() {
	return "";
}
var useremail=function() {
	return ""
}
var runtime_version=function() {
	return "1.4";
}

//copy from liveupdate
var jsonp=function(url,dbid,callback,context) {
  var script=document.getElementById("jsonp2");
  if (script) {
    script.parentNode.removeChild(script);
  }
  window.jsonp_handler=function(data) {
    if (typeof data=="object") {
      data.dbid=dbid;
      callback.apply(context,[data]);    
    }  
  }
  window.jsonp_error_handler=function() {
    console.error("url unreachable",url);
    callback.apply(context,[null]);
  }
  script=document.createElement('script');
  script.setAttribute('id', "jsonp2");
  script.setAttribute('onerror', "jsonp_error_handler()");
  url=url+'?'+(new Date().getTime());
  script.setAttribute('src', url);
  document.getElementsByTagName('head')[0].appendChild(script); 
}

var ksanagap={
	platform:"node-webkit",
	startDownload:downloader.startDownload,
	downloadedByte:downloader.downloadedByte,
	downloadingFile:downloader.downloadingFile,
	cancelDownload:downloader.cancelDownload,
	doneDownload:downloader.doneDownload,
	switchApp:switchApp,
	rootPath:rootPath,
	deleteApp: deleteApp,
	username:username, //not support on PC
	useremail:username,
	runtime_version:runtime_version,
	
}

if (typeof process!="undefined" && !process.browser) {
	var ksanajs=require("fs").readFileSync("./ksana.js","utf8").trim();
	downloader=require("./downloader");
	//ksana.js=JSON.parse(ksanajs.substring(14,ksanajs.length-1));
	rootPath=process.cwd();
	rootPath=require("path").resolve(rootPath,"..").replace(/\\/g,"/")+'/';
	ksana.ready=true;
} else{
	var url=window.location.origin+window.location.pathname.replace("index.html","")+"ksana.js";
	jsonp(url,appname,function(data){
		ksana.js=data;
		ksana.ready=true;
	});
}
module.exports=ksanagap;
},{"./downloader":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\downloader.js","fs":false,"path":false}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\livereload.js":[function(require,module,exports){
var started=false;
var timer=null;
var bundledate=null;
var get_date=require("./html5fs").get_date;
var checkIfBundleUpdated=function() {
	get_date("bundle.js",function(date){
		if (bundledate &&bundledate!=date){
			location.reload();
		}
		bundledate=date;
	});
}
var livereload=function() {
	if (started) return;

	timer1=setInterval(function(){
		checkIfBundleUpdated();
	},2000);
	started=true;
}

module.exports=livereload;
},{"./html5fs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\liveupdate.js":[function(require,module,exports){

var jsonp=function(url,dbid,callback,context) {
  var script=document.getElementById("jsonp");
  if (script) {
    script.parentNode.removeChild(script);
  }
  if (typeof dbid=="function") {
    context=callback;
    callback=dbid;
    dbid="";
  }
  window.jsonp_handler=function(data) {
    //console.log("receive from ksana.js",data);
    if (typeof data=="object" && dbid) {
      if (typeof data.dbid=="undefined") {
        data.dbid=dbid;
      }
    }
    callback.apply(context,[data]);
  }

  window.jsonp_error_handler=function() {
    console.error("url unreachable",url);
    callback.apply(context,[null]);
  }

  script=document.createElement('script');
  script.setAttribute('id', "jsonp");
  script.setAttribute('onerror', "jsonp_error_handler()");
  url=url+'?'+(new Date().getTime());
  script.setAttribute('src', url);
  document.getElementsByTagName('head')[0].appendChild(script); 
}
var runtime_version_ok=function(minruntime) {
  if (!minruntime) return true;//not mentioned.
  var min=parseFloat(minruntime);
  var runtime=parseFloat( ksanagap.runtime_version()||"1.0");
  if (min>runtime) return false;
  return true;
}

var needToUpdate=function(fromjson,tojson) {
  var needUpdates=[];
  for (var i=0;i<fromjson.length;i++) { 
    var to=tojson[i];
    var from=fromjson[i];
    var newfiles=[],newfilesizes=[],removed=[];
    
    if (!to || !to.files) continue; //cannot reach host
    if (!runtime_version_ok(to.minruntime)) {
      console.warn("runtime too old, need "+to.minruntime);
      continue; 
    }
    if (!from.filedates) {
      console.warn("missing filedates in ksana.js of "+from.dbid);
      continue;
    }
    from.filedates.map(function(f,idx){
      var newidx=to.files.indexOf( from.files[idx]);
      if (newidx==-1) {
        //file removed in new version
        removed.push(from.files[idx]);
      } else {
        var fromdate=Date.parse(f);
        var todate=Date.parse(to.filedates[newidx]);
        if (fromdate<todate) {
          newfiles.push( to.files[newidx] );
          newfilesizes.push(to.filesizes[newidx]);
        }        
      }
    });
    if (newfiles.length) {
      from.newfiles=newfiles;
      from.newfilesizes=newfilesizes;
      from.removed=removed;
      needUpdates.push(from);
    }
  }
  return needUpdates;
}
var getUpdatables=function(apps,cb,context) {
  getRemoteJson(apps,function(jsons){
    var hasUpdates=needToUpdate(apps,jsons);
    cb.apply(context,[hasUpdates]);
  },context);
}
var getRemoteJson=function(apps,cb,context) {
  var taskqueue=[],output=[];
  var makecb=function(app){
    return function(data){
        if (!(data && typeof data =='object' && data.__empty)) output.push(data);
        if (!app.baseurl) {
          taskqueue.shift({__empty:true});
        } else {
          var url=app.baseurl+"/ksana.js";
          try {
            jsonp( url ,app.dbid,taskqueue.shift(), context);             
          } catch(e) {
            console.log(e);
            taskqueue.shift({__empty:true});
          }
        }
    };
  };
  apps.forEach(function(app){taskqueue.push(makecb(app))});

  taskqueue.push(function(data){
    output.push(data);
    cb.apply(context,[output]);
  });

  taskqueue.shift()({__empty:true}); //run the task
}
var humanFileSize=function(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(bytes < thresh) return bytes + ' B';
    var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(bytes >= thresh);
    return bytes.toFixed(1)+' '+units[u];
};
var humanDate=function(datestring) {
    var d=Date.parse(datestring);
    if (isNaN(d)) {
      return "invalid date";
    } else {
      return new Date(d).toLocaleString();
    }
}
var start=function(ksanajs,cb,context){
  var files=ksanajs.newfiles||ksanajs.files;
  var baseurl=ksanajs.baseurl|| "http://127.0.0.1:8080/"+ksanajs.dbid+"/";
  var started=ksanagap.startDownload(ksanajs.dbid,baseurl,files.join("\uffff"));
  cb.apply(context,[started]);
}
var status=function(){
  var nfile=ksanagap.downloadingFile();
  var downloadedByte=ksanagap.downloadedByte();
  var done=ksanagap.doneDownload();
  return {nfile:nfile,downloadedByte:downloadedByte, done:done};
}

var cancel=function(){
  return ksanagap.cancelDownload();
}

var liveupdate={ humanFileSize: humanFileSize, humanDate:humanDate,
  needToUpdate: needToUpdate , jsonp:jsonp, 
  getUpdatables:getUpdatables,
  start:start,
  cancel:cancel,
  status:status
  };
module.exports=liveupdate;
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\mkdirp.js":[function(require,module,exports){
function mkdirP (p, mode, f, made) {
     var path = nodeRequire('path');
     var fs = nodeRequire('fs');
	
    if (typeof mode === 'function' || mode === undefined) {
        f = mode;
        mode = 0x1FF & (~process.umask());
    }
    if (!made) made = null;

    var cb = f || function () {};
    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    fs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                mkdirP(path.dirname(p), mode, function (er, made) {
                    if (er) cb(er, made);
                    else mkdirP(p, mode, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                fs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made)
                    else cb(null, made);
                });
                break;
        }
    });
}

mkdirP.sync = function sync (p, mode, made) {
    var path = nodeRequire('path');
    var fs = nodeRequire('fs');
    if (mode === undefined) {
        mode = 0x1FF & (~process.umask());
    }
    if (!made) made = null;

    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    try {
        fs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = sync(path.dirname(p), mode, made);
                sync(p, mode, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = fs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
};

module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

},{}],"C:\\ksana2015\\node_modules\\reflux\\node_modules\\eventemitter3\\index.js":[function(require,module,exports){
'use strict';

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  if (!this._events || !this._events[event]) return [];
  if (this._events[event].fn) return [this._events[event].fn];

  for (var i = 0, l = this._events[event].length, ee = new Array(l); i < l; i++) {
    ee[i] = this._events[event][i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  if (!this._events || !this._events[event]) return false;

  var listeners = this._events[event]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
  if (!this._events || !this._events[event]) return this;

  var listeners = this._events[event]
    , events = [];

  if (fn) {
    if (listeners.fn && (listeners.fn !== fn || (once && !listeners.once))) {
      events.push(listeners);
    }
    if (!listeners.fn) for (var i = 0, length = listeners.length; i < length; i++) {
      if (listeners[i].fn !== fn || (once && !listeners[i].once)) {
        events.push(listeners[i]);
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[event] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[event];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[event];
  else this._events = {};

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the module.
//
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.EventEmitter2 = EventEmitter;
EventEmitter.EventEmitter3 = EventEmitter;

//
// Expose the module.
//
module.exports = EventEmitter;

},{}],"C:\\ksana2015\\node_modules\\reflux\\src\\ActionMethods.js":[function(require,module,exports){
/**
 * A module of methods that you want to include in all actions.
 * This module is consumed by `createAction`.
 */
module.exports = {
};

},{}],"C:\\ksana2015\\node_modules\\reflux\\src\\Keep.js":[function(require,module,exports){
exports.createdStores = [];

exports.createdActions = [];

exports.reset = function() {
    while(exports.createdStores.length) {
        exports.createdStores.pop();
    }
    while(exports.createdActions.length) {
        exports.createdActions.pop();
    }
};

},{}],"C:\\ksana2015\\node_modules\\reflux\\src\\ListenerMethods.js":[function(require,module,exports){
var _ = require('./utils'),
    maker = require('./joins').instanceJoinCreator;

/**
 * A module of methods related to listening.
 */
module.exports = {

    /**
     * An internal utility function used by `validateListening`
     *
     * @param {Action|Store} listenable The listenable we want to search for
     * @returns {Boolean} The result of a recursive search among `this.subscriptions`
     */
    hasListener: function(listenable) {
        var i = 0, j, listener, listenables;
        for (;i < (this.subscriptions||[]).length; ++i) {
            listenables = [].concat(this.subscriptions[i].listenable);
            for (j = 0; j < listenables.length; j++){
                listener = listenables[j];
                if (listener === listenable || listener.hasListener && listener.hasListener(listenable)) {
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * A convenience method that listens to all listenables in the given object.
     *
     * @param {Object} listenables An object of listenables. Keys will be used as callback method names.
     */
    listenToMany: function(listenables){
        for(var key in listenables){
            var cbname = _.callbackName(key),
                localname = this[cbname] ? cbname : this[key] ? key : undefined;
            if (localname){
                this.listenTo(listenables[key],localname,this[cbname+"Default"]||this[localname+"Default"]||localname);
            }
        }
    },

    /**
     * Checks if the current context can listen to the supplied listenable
     *
     * @param {Action|Store} listenable An Action or Store that should be
     *  listened to.
     * @returns {String|Undefined} An error message, or undefined if there was no problem.
     */
    validateListening: function(listenable){
        if (listenable === this) {
            return "Listener is not able to listen to itself";
        }
        if (!_.isFunction(listenable.listen)) {
            return listenable + " is missing a listen method";
        }
        if (listenable.hasListener && listenable.hasListener(this)) {
            return "Listener cannot listen to this listenable because of circular loop";
        }
    },

    /**
     * Sets up a subscription to the given listenable for the context object
     *
     * @param {Action|Store} listenable An Action or Store that should be
     *  listened to.
     * @param {Function|String} callback The callback to register as event handler
     * @param {Function|String} defaultCallback The callback to register as default handler
     * @returns {Object} A subscription obj where `stop` is an unsub function and `listenable` is the object being listened to
     */
    listenTo: function(listenable, callback, defaultCallback) {
        var desub, unsubscriber, subscriptionobj, subs = this.subscriptions = this.subscriptions || [];
        _.throwIf(this.validateListening(listenable));
        this.fetchInitialState(listenable, defaultCallback);
        desub = listenable.listen(this[callback]||callback, this);
        unsubscriber = function() {
            var index = subs.indexOf(subscriptionobj);
            _.throwIf(index === -1,'Tried to remove listen already gone from subscriptions list!');
            subs.splice(index, 1);
            desub();
        };
        subscriptionobj = {
            stop: unsubscriber,
            listenable: listenable
        };
        subs.push(subscriptionobj);
        return subscriptionobj;
    },

    /**
     * Stops listening to a single listenable
     *
     * @param {Action|Store} listenable The action or store we no longer want to listen to
     * @returns {Boolean} True if a subscription was found and removed, otherwise false.
     */
    stopListeningTo: function(listenable){
        var sub, i = 0, subs = this.subscriptions || [];
        for(;i < subs.length; i++){
            sub = subs[i];
            if (sub.listenable === listenable){
                sub.stop();
                _.throwIf(subs.indexOf(sub)!==-1,'Failed to remove listen from subscriptions list!');
                return true;
            }
        }
        return false;
    },

    /**
     * Stops all subscriptions and empties subscriptions array
     */
    stopListeningToAll: function(){
        var remaining, subs = this.subscriptions || [];
        while((remaining=subs.length)){
            subs[0].stop();
            _.throwIf(subs.length!==remaining-1,'Failed to remove listen from subscriptions list!');
        }
    },

    /**
     * Used in `listenTo`. Fetches initial data from a publisher if it has a `getInitialState` method.
     * @param {Action|Store} listenable The publisher we want to get initial state from
     * @param {Function|String} defaultCallback The method to receive the data
     */
    fetchInitialState: function (listenable, defaultCallback) {
        defaultCallback = (defaultCallback && this[defaultCallback]) || defaultCallback;
        var me = this;
        if (_.isFunction(defaultCallback) && _.isFunction(listenable.getInitialState)) {
            data = listenable.getInitialState();
            if (data && _.isFunction(data.then)) {
                data.then(function() {
                    defaultCallback.apply(me, arguments);
                });
            } else {
                defaultCallback.call(this, data);
            }
        }
    },

    /**
     * The callback will be called once all listenables have triggered at least once.
     * It will be invoked with the last emission from each listenable.
     * @param {...Publishers} publishers Publishers that should be tracked.
     * @param {Function|String} callback The method to call when all publishers have emitted
     * @returns {Object} A subscription obj where `stop` is an unsub function and `listenable` is an array of listenables
     */
    joinTrailing: maker("last"),

    /**
     * The callback will be called once all listenables have triggered at least once.
     * It will be invoked with the first emission from each listenable.
     * @param {...Publishers} publishers Publishers that should be tracked.
     * @param {Function|String} callback The method to call when all publishers have emitted
     * @returns {Object} A subscription obj where `stop` is an unsub function and `listenable` is an array of listenables
     */
    joinLeading: maker("first"),

    /**
     * The callback will be called once all listenables have triggered at least once.
     * It will be invoked with all emission from each listenable.
     * @param {...Publishers} publishers Publishers that should be tracked.
     * @param {Function|String} callback The method to call when all publishers have emitted
     * @returns {Object} A subscription obj where `stop` is an unsub function and `listenable` is an array of listenables
     */
    joinConcat: maker("all"),

    /**
     * The callback will be called once all listenables have triggered.
     * If a callback triggers twice before that happens, an error is thrown.
     * @param {...Publishers} publishers Publishers that should be tracked.
     * @param {Function|String} callback The method to call when all publishers have emitted
     * @returns {Object} A subscription obj where `stop` is an unsub function and `listenable` is an array of listenables
     */
    joinStrict: maker("strict")
};

},{"./joins":"C:\\ksana2015\\node_modules\\reflux\\src\\joins.js","./utils":"C:\\ksana2015\\node_modules\\reflux\\src\\utils.js"}],"C:\\ksana2015\\node_modules\\reflux\\src\\ListenerMixin.js":[function(require,module,exports){
var _ = require('./utils'),
    ListenerMethods = require('./ListenerMethods');

/**
 * A module meant to be consumed as a mixin by a React component. Supplies the methods from
 * `ListenerMethods` mixin and takes care of teardown of subscriptions.
 * Note that if you're using the `connect` mixin you don't need this mixin, as connect will
 * import everything this mixin contains!
 */
module.exports = _.extend({

    /**
     * Cleans up all listener previously registered.
     */
    componentWillUnmount: ListenerMethods.stopListeningToAll

}, ListenerMethods);

},{"./ListenerMethods":"C:\\ksana2015\\node_modules\\reflux\\src\\ListenerMethods.js","./utils":"C:\\ksana2015\\node_modules\\reflux\\src\\utils.js"}],"C:\\ksana2015\\node_modules\\reflux\\src\\PublisherMethods.js":[function(require,module,exports){
var _ = require('./utils');

/**
 * A module of methods for object that you want to be able to listen to.
 * This module is consumed by `createStore` and `createAction`
 */
module.exports = {

    /**
     * Hook used by the publisher that is invoked before emitting
     * and before `shouldEmit`. The arguments are the ones that the action
     * is invoked with. If this function returns something other than
     * undefined, that will be passed on as arguments for shouldEmit and
     * emission.
     */
    preEmit: function() {},

    /**
     * Hook used by the publisher after `preEmit` to determine if the
     * event should be emitted with given arguments. This may be overridden
     * in your application, default implementation always returns true.
     *
     * @returns {Boolean} true if event should be emitted
     */
    shouldEmit: function() { return true; },

    /**
     * Subscribes the given callback for action triggered
     *
     * @param {Function} callback The callback to register as event handler
     * @param {Mixed} [optional] bindContext The context to bind the callback with
     * @returns {Function} Callback that unsubscribes the registered event handler
     */
    listen: function(callback, bindContext) {
        var eventHandler = function(args) {
            callback.apply(bindContext, args);
        }, me = this;
        this.emitter.addListener(this.eventLabel, eventHandler);
        return function() {
            me.emitter.removeListener(me.eventLabel, eventHandler);
        };
    },

    /**
     * Publishes an event using `this.emitter` (if `shouldEmit` agrees)
     */
    trigger: function() {
        var args = arguments,
            pre = this.preEmit.apply(this, args);
        args = pre === undefined ? args : _.isArguments(pre) ? pre : [].concat(pre);
        if (this.shouldEmit.apply(this, args)) {
            this.emitter.emit(this.eventLabel, args);
        }
    },

    /**
     * Tries to publish the event on the next tick
     */
    triggerAsync: function(){
        var args = arguments,me = this;
        _.nextTick(function() {
            me.trigger.apply(me, args);
        });
    }
};

},{"./utils":"C:\\ksana2015\\node_modules\\reflux\\src\\utils.js"}],"C:\\ksana2015\\node_modules\\reflux\\src\\StoreMethods.js":[function(require,module,exports){
/**
 * A module of methods that you want to include in all stores.
 * This module is consumed by `createStore`.
 */
module.exports = {
};

},{}],"C:\\ksana2015\\node_modules\\reflux\\src\\bindMethods.js":[function(require,module,exports){
module.exports = function(store, definition) {
  for (var name in definition) {
    var property = definition[name];

    if (typeof property !== 'function' || !definition.hasOwnProperty(name)) {
      continue;
    }

    store[name] = property.bind(store);
  }

  return store;
};

},{}],"C:\\ksana2015\\node_modules\\reflux\\src\\connect.js":[function(require,module,exports){
var Reflux = require('../src'),
    _ = require('./utils');

module.exports = function(listenable,key){
    return {
        getInitialState: function(){
            if (!_.isFunction(listenable.getInitialState)) {
                return {};
            } else if (key === undefined) {
                return listenable.getInitialState();
            } else {
                return _.object([key],[listenable.getInitialState()]);
            }
        },
        componentDidMount: function(){
            _.extend(this,Reflux.ListenerMethods);
            var me = this, cb = (key === undefined ? this.setState : function(v){me.setState(_.object([key],[v]));});
            this.listenTo(listenable,cb);
        },
        componentWillUnmount: Reflux.ListenerMixin.componentWillUnmount
    };
};

},{"../src":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js","./utils":"C:\\ksana2015\\node_modules\\reflux\\src\\utils.js"}],"C:\\ksana2015\\node_modules\\reflux\\src\\createAction.js":[function(require,module,exports){
var _ = require('./utils'),
    Reflux = require('../src'),
    Keep = require('./Keep'),
    allowed = {preEmit:1,shouldEmit:1};

/**
 * Creates an action functor object. It is mixed in with functions
 * from the `PublisherMethods` mixin. `preEmit` and `shouldEmit` may
 * be overridden in the definition object.
 *
 * @param {Object} definition The action object definition
 */
module.exports = function(definition) {

    definition = definition || {};

    for(var a in Reflux.ActionMethods){
        if (!allowed[a] && Reflux.PublisherMethods[a]) {
            throw new Error("Cannot override API method " + a +
                " in Reflux.ActionMethods. Use another method name or override it on Reflux.PublisherMethods instead."
            );
        }
    }

    for(var d in definition){
        if (!allowed[d] && Reflux.PublisherMethods[d]) {
            throw new Error("Cannot override API method " + d +
                " in action creation. Use another method name or override it on Reflux.PublisherMethods instead."
            );
        }
    }

    var context = _.extend({
        eventLabel: "action",
        emitter: new _.EventEmitter(),
        _isAction: true
    }, Reflux.PublisherMethods, Reflux.ActionMethods, definition);

    var functor = function() {
        functor[functor.sync?"trigger":"triggerAsync"].apply(functor, arguments);
    };

    _.extend(functor,context);

    Keep.createdActions.push(functor);

    return functor;

};

},{"../src":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js","./Keep":"C:\\ksana2015\\node_modules\\reflux\\src\\Keep.js","./utils":"C:\\ksana2015\\node_modules\\reflux\\src\\utils.js"}],"C:\\ksana2015\\node_modules\\reflux\\src\\createStore.js":[function(require,module,exports){
var _ = require('./utils'),
    Reflux = require('../src'),
    Keep = require('./Keep'),
    allowed = {preEmit:1,shouldEmit:1},
    bindMethods = require('./bindMethods');

/**
 * Creates an event emitting Data Store. It is mixed in with functions
 * from the `ListenerMethods` and `PublisherMethods` mixins. `preEmit`
 * and `shouldEmit` may be overridden in the definition object.
 *
 * @param {Object} definition The data store object definition
 * @returns {Store} A data store instance
 */
module.exports = function(definition) {

    definition = definition || {};

    for(var a in Reflux.StoreMethods){
        if (!allowed[a] && (Reflux.PublisherMethods[a] || Reflux.ListenerMethods[a])){
            throw new Error("Cannot override API method " + a + 
                " in Reflux.StoreMethods. Use another method name or override it on Reflux.PublisherMethods / Reflux.ListenerMethods instead."
            );
        }
    }

    for(var d in definition){
        if (!allowed[d] && (Reflux.PublisherMethods[d] || Reflux.ListenerMethods[d])){
            throw new Error("Cannot override API method " + d + 
                " in store creation. Use another method name or override it on Reflux.PublisherMethods / Reflux.ListenerMethods instead."
            );
        }
    }

    function Store() {
        var i=0, arr;
        this.subscriptions = [];
        this.emitter = new _.EventEmitter();
        this.eventLabel = "change";
        if (this.init && _.isFunction(this.init)) {
            this.init();
        }
        if (this.listenables){
            arr = [].concat(this.listenables);
            for(;i < arr.length;i++){
                this.listenToMany(arr[i]);
            }
        }
    }

    _.extend(Store.prototype, Reflux.ListenerMethods, Reflux.PublisherMethods, Reflux.StoreMethods, definition);

    var store = new Store();
    bindMethods(store, definition);
    Keep.createdStores.push(store);

    return store;
};

},{"../src":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js","./Keep":"C:\\ksana2015\\node_modules\\reflux\\src\\Keep.js","./bindMethods":"C:\\ksana2015\\node_modules\\reflux\\src\\bindMethods.js","./utils":"C:\\ksana2015\\node_modules\\reflux\\src\\utils.js"}],"C:\\ksana2015\\node_modules\\reflux\\src\\index.js":[function(require,module,exports){
exports.ActionMethods = require('./ActionMethods');

exports.ListenerMethods = require('./ListenerMethods');

exports.PublisherMethods = require('./PublisherMethods');

exports.StoreMethods = require('./StoreMethods');

exports.createAction = require('./createAction');

exports.createStore = require('./createStore');

exports.connect = require('./connect');

exports.ListenerMixin = require('./ListenerMixin');

exports.listenTo = require('./listenTo');

exports.listenToMany = require('./listenToMany');


var maker = require('./joins').staticJoinCreator;

exports.joinTrailing = exports.all = maker("last"); // Reflux.all alias for backward compatibility

exports.joinLeading = maker("first");

exports.joinStrict = maker("strict");

exports.joinConcat = maker("all");


/**
 * Convenience function for creating a set of actions
 *
 * @param actionNames the names for the actions to be created
 * @returns an object with actions of corresponding action names
 */
exports.createActions = function(actionNames) {
    var i = 0, actions = {};
    for (; i < actionNames.length; i++) {
        actions[actionNames[i]] = exports.createAction();
    }
    return actions;
};

/**
 * Sets the eventmitter that Reflux uses
 */
exports.setEventEmitter = function(ctx) {
    var _ = require('./utils');
    _.EventEmitter = ctx;
};

/**
 * Sets the method used for deferring actions and stores
 */
exports.nextTick = function(nextTick) {
    var _ = require('./utils');
    _.nextTick = nextTick;
};

/**
 * Provides the set of created actions and stores for introspection
 */
exports.__keep = require('./Keep');

/**
 * Warn if Function.prototype.bind not available
 */
if (!Function.prototype.bind) {
  console.error(
    'Function.prototype.bind not available. ' +
    'ES5 shim required. ' +
    'https://github.com/spoike/refluxjs#es5'
  );
}

},{"./ActionMethods":"C:\\ksana2015\\node_modules\\reflux\\src\\ActionMethods.js","./Keep":"C:\\ksana2015\\node_modules\\reflux\\src\\Keep.js","./ListenerMethods":"C:\\ksana2015\\node_modules\\reflux\\src\\ListenerMethods.js","./ListenerMixin":"C:\\ksana2015\\node_modules\\reflux\\src\\ListenerMixin.js","./PublisherMethods":"C:\\ksana2015\\node_modules\\reflux\\src\\PublisherMethods.js","./StoreMethods":"C:\\ksana2015\\node_modules\\reflux\\src\\StoreMethods.js","./connect":"C:\\ksana2015\\node_modules\\reflux\\src\\connect.js","./createAction":"C:\\ksana2015\\node_modules\\reflux\\src\\createAction.js","./createStore":"C:\\ksana2015\\node_modules\\reflux\\src\\createStore.js","./joins":"C:\\ksana2015\\node_modules\\reflux\\src\\joins.js","./listenTo":"C:\\ksana2015\\node_modules\\reflux\\src\\listenTo.js","./listenToMany":"C:\\ksana2015\\node_modules\\reflux\\src\\listenToMany.js","./utils":"C:\\ksana2015\\node_modules\\reflux\\src\\utils.js"}],"C:\\ksana2015\\node_modules\\reflux\\src\\joins.js":[function(require,module,exports){
/**
 * Internal module used to create static and instance join methods
 */

var slice = Array.prototype.slice,
    _ = require("./utils"),
    createStore = require("./createStore"),
    strategyMethodNames = {
        strict: "joinStrict",
        first: "joinLeading",
        last: "joinTrailing",
        all: "joinConcat"
    };

/**
 * Used in `index.js` to create the static join methods
 * @param {String} strategy Which strategy to use when tracking listenable trigger arguments
 * @returns {Function} A static function which returns a store with a join listen on the given listenables using the given strategy
 */
exports.staticJoinCreator = function(strategy){
    return function(/* listenables... */) {
        var listenables = slice.call(arguments);
        return createStore({
            init: function(){
                this[strategyMethodNames[strategy]].apply(this,listenables.concat("triggerAsync"));
            }
        });
    };
};

/**
 * Used in `ListenerMethods.js` to create the instance join methods
 * @param {String} strategy Which strategy to use when tracking listenable trigger arguments
 * @returns {Function} An instance method which sets up a join listen on the given listenables using the given strategy
 */
exports.instanceJoinCreator = function(strategy){
    return function(/* listenables..., callback*/){
        _.throwIf(arguments.length < 3,'Cannot create a join with less than 2 listenables!');
        var listenables = slice.call(arguments),
            callback = listenables.pop(),
            numberOfListenables = listenables.length,
            join = {
                numberOfListenables: numberOfListenables,
                callback: this[callback]||callback,
                listener: this,
                strategy: strategy
            }, i, cancels = [], subobj;
        for (i = 0; i < numberOfListenables; i++) {
            _.throwIf(this.validateListening(listenables[i]));
        }
        for (i = 0; i < numberOfListenables; i++) {
            cancels.push(listenables[i].listen(newListener(i,join),this));
        }
        reset(join);
        subobj = {listenable: listenables};
        subobj.stop = makeStopper(subobj,cancels,this);
        this.subscriptions = (this.subscriptions || []).concat(subobj);
        return subobj;
    };
};

// ---- internal join functions ----

function makeStopper(subobj,cancels,context){
    return function() {
        var i, subs = context.subscriptions;
            index = (subs ? subs.indexOf(subobj) : -1);
        _.throwIf(index === -1,'Tried to remove join already gone from subscriptions list!');
        for(i=0;i < cancels.length; i++){
            cancels[i]();
        }
        subs.splice(index, 1);
    };
}

function reset(join) {
    join.listenablesEmitted = new Array(join.numberOfListenables);
    join.args = new Array(join.numberOfListenables);
}

function newListener(i,join) {
    return function() {
        var callargs = slice.call(arguments);
        if (join.listenablesEmitted[i]){
            switch(join.strategy){
                case "strict": throw new Error("Strict join failed because listener triggered twice.");
                case "last": join.args[i] = callargs; break;
                case "all": join.args[i].push(callargs);
            }
        } else {
            join.listenablesEmitted[i] = true;
            join.args[i] = (join.strategy==="all"?[callargs]:callargs);
        }
        emitIfAllListenablesEmitted(join);
    };
}

function emitIfAllListenablesEmitted(join) {
    for (var i = 0; i < join.numberOfListenables; i++) {
        if (!join.listenablesEmitted[i]) {
            return;
        }
    }
    join.callback.apply(join.listener,join.args);
    reset(join);
}

},{"./createStore":"C:\\ksana2015\\node_modules\\reflux\\src\\createStore.js","./utils":"C:\\ksana2015\\node_modules\\reflux\\src\\utils.js"}],"C:\\ksana2015\\node_modules\\reflux\\src\\listenTo.js":[function(require,module,exports){
var Reflux = require('../src');


/**
 * A mixin factory for a React component. Meant as a more convenient way of using the `ListenerMixin`,
 * without having to manually set listeners in the `componentDidMount` method.
 *
 * @param {Action|Store} listenable An Action or Store that should be
 *  listened to.
 * @param {Function|String} callback The callback to register as event handler
 * @param {Function|String} defaultCallback The callback to register as default handler
 * @returns {Object} An object to be used as a mixin, which sets up the listener for the given listenable.
 */
module.exports = function(listenable,callback,initial){
    return {
        /**
         * Set up the mixin before the initial rendering occurs. Import methods from `ListenerMethods`
         * and then make the call to `listenTo` with the arguments provided to the factory function
         */
        componentDidMount: function() {
            for(var m in Reflux.ListenerMethods){
                if (this[m] !== Reflux.ListenerMethods[m]){
                    if (this[m]){
                        throw "Can't have other property '"+m+"' when using Reflux.listenTo!";
                    }
                    this[m] = Reflux.ListenerMethods[m];
                }
            }
            this.listenTo(listenable,callback,initial);
        },
        /**
         * Cleans up all listener previously registered.
         */
        componentWillUnmount: Reflux.ListenerMethods.stopListeningToAll
    };
};

},{"../src":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\node_modules\\reflux\\src\\listenToMany.js":[function(require,module,exports){
var Reflux = require('../src');

/**
 * A mixin factory for a React component. Meant as a more convenient way of using the `listenerMixin`,
 * without having to manually set listeners in the `componentDidMount` method. This version is used
 * to automatically set up a `listenToMany` call.
 *
 * @param {Object} listenables An object of listenables
 * @returns {Object} An object to be used as a mixin, which sets up the listeners for the given listenables.
 */
module.exports = function(listenables){
    return {
        /**
         * Set up the mixin before the initial rendering occurs. Import methods from `ListenerMethods`
         * and then make the call to `listenTo` with the arguments provided to the factory function
         */
        componentDidMount: function() {
            for(var m in Reflux.ListenerMethods){
                if (this[m] !== Reflux.ListenerMethods[m]){
                    if (this[m]){
                        throw "Can't have other property '"+m+"' when using Reflux.listenToMany!";
                    }
                    this[m] = Reflux.ListenerMethods[m];
                }
            }
            this.listenToMany(listenables);
        },
        /**
         * Cleans up all listener previously registered.
         */
        componentWillUnmount: Reflux.ListenerMethods.stopListeningToAll
    };
};

},{"../src":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\node_modules\\reflux\\src\\utils.js":[function(require,module,exports){
/*
 * isObject, extend, isFunction, isArguments are taken from undescore/lodash in
 * order to remove the dependency
 */
var isObject = exports.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
};

exports.extend = function(obj) {
    if (!isObject(obj)) {
        return obj;
    }
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
        source = arguments[i];
        for (prop in source) {
            obj[prop] = source[prop];
        }
    }
    return obj;
};

exports.isFunction = function(value) {
    return typeof value === 'function';
};

exports.EventEmitter = require('eventemitter3');

exports.nextTick = function(callback) {
    setTimeout(callback, 0);
};

exports.callbackName = function(string){
    return "on"+string.charAt(0).toUpperCase()+string.slice(1);
};

exports.object = function(keys,vals){
    var o={}, i=0;
    for(;i<keys.length;i++){
        o[keys[i]] = vals[i];
    }
    return o;
};

exports.isArguments = function(value) {
    return value && typeof value == 'object' && typeof value.length == 'number' &&
      (toString.call(value) === '[object Arguments]' || (hasOwnProperty.call(value, 'callee' && !propertyIsEnumerable.call(value, 'callee')))) || false;
};

exports.throwIf = function(val,msg){
    if (val){
        throw Error(msg||val);
    }
};

},{"eventemitter3":"C:\\ksana2015\\node_modules\\reflux\\node_modules\\eventemitter3\\index.js"}],"C:\\ksana2015\\visualmarkup\\index.js":[function(require,module,exports){
var runtime=require("ksana2015-webruntime");
//var kde=require("ksana-database");
runtime.boot("visualmarkup",function(){
	var Main=React.createElement(require("./src/main.jsx"));
	React.render(Main,document.getElementById("main"));
});
},{"./src/main.jsx":"C:\\ksana2015\\visualmarkup\\src\\main.jsx","ksana2015-webruntime":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js":[function(require,module,exports){
var action_markups=require("reflux").createActions([
		"loadTagsets",
		"setActiveTagset",
		"tokenPositionUpdated",
		"createMarkup",
		"editMarkup",
		"editMarkupAtPos",
		"saveMarkup",
		"deleteMarkup",
		"deleteEditingMarkup",
		"cancelEdit",
		"markupUpdated",
		"setVisibleTags",
		"clearAllMarkups",
		"saveMarkups",
		"registerViewid",
		"setVirtualMarkup",
		"addHiddenView",
		"removeHiddenView",
		"doTag",
		"clearMarkupInSelection",
		"nextMarkup",
		"prevMarkup"
]);
module.exports=action_markups;
},{"reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\actions_selection.js":[function(require,module,exports){
var action_selection=require("reflux").createActions([
		"setSelection",
		"setSelections",
		"addSelection",
		"clearSelections",
		"setHighlight",
		"setHighlights",
		"clearHighlights"
]);
module.exports=action_selection;
},{"reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\actions_system.js":[function(require,module,exports){
var actions_system=require("reflux").createActions([
	"setUserName"
]);
module.exports=actions_system;
},{"reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\actions_text.js":[function(require,module,exports){
var action_texts=require("reflux").createActions([
		"getKepan",
		"openDSL",
		"openDS",
		"getSutraTextByKepanId",     
		"getLectureTextByKepanId",
		"getSutraTextBySeg",
		"getLectureTextBySeg",
		"getTextBySeg",
		"getTextByKepanId",
		"nextPara",
		"prevPara",
		"searchDictionary" ,
		"nextSutraPara",
		"prevSutraPara",
		"nextLecturePara",
		"prevLecturePara",
		"goKepanId",
		"getTextByVpos",
		"syncKepan"
]);
module.exports=action_texts;
},{"reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\controlpanel.js":[function(require,module,exports){
var Reflux=require("reflux");
var savecaption="Save";
var savedcaption="Markups Written.";
var store=require("./store_markup");
var actions=require("./actions_markup");
var SetUser=require("./setuser"); 
var  utf8_to_b64= function( str ) {
    return btoa(unescape(encodeURIComponent( str )));
};

var Controlpanel=React.createClass({displayName: "Controlpanel",
	getInitialState:function(){
		return {savecaption:savecaption,dangerzone:false,message:""};
	}
	,restoresavecapcation:function() {
		this.setState({savecaption:savecaption});
	}
	,reset:function() {
		actions.clearAllMarkups();
		this.setState({message:"All Markup Clear",messagetype:"success"});
		setTimeout(this.clearMessage,5000);	
	}
	,clearMessage:function() {
		this.setState({message:""});
	}
	,save:function() {
		actions.saveMarkups(function(){
			this.setState({message:"Markup Saved",messagetype:"success"});
			setTimeout(this.clearMessage,5000);
		},this);
	}
	,upload:function() {
		var reader = new FileReader();
		var that=this;
		reader.onload = function() {
		  try{
		  	var json=JSON.parse(this.result);
		  } catch (e) {
		  	that.setState({message:"incorrect json format"+e,messagetype:"danger"})
		  	setTimeout(that.clearMessage,5000);
		  	return;
		  }
		  store.setRawMarkup(json);
		}
		var file=this.refs.uploadfile.getDOMNode().files[0];
		reader.readAsText(file);
	},
	uploadfile:function(){
		this.refs.uploadfile.getDOMNode().click();
	}
	,renderDownloadLink:function() {
		var filename="sample-"+(new Date().toLocaleString())+".json";
		var markupjson=store.getRawMarkup();
		var jsonstr=JSON.stringify(markupjson,""," ");
		var dataurl="data:application/octet-stream;base64,"+utf8_to_b64(jsonstr);

		return React.createElement("a", {className: "btn btn-info", download: filename, href: dataurl}, "Export to JSON")
	}
	,renderDanger:function() {
		if (this.state.dangerzone) {
			return React.createElement("div", null, 
		    React.createElement("input", {ref: "uploadfile", type: "file", onChange: this.upload, style: {display:"none"}}), 
		    this.renderDownloadLink(), 
		    React.createElement("hr", null), 
		    React.createElement("button", {onClick: this.uploadfile, className: "btn btn-danger"}, "Import"), 
			React.createElement("button", {onClick: this.reset, className: "btn btn-danger"}, "Delete all markups")	
			)
		}	
	}
	,setAdvance:function(e) {
		this.setState({dangerzone:e.target.checked});
	}

	,render:function() {
		return React.createElement("div", null, 
			React.createElement(SetUser, null), 
			React.createElement("span", null, 
    			React.createElement("label", null, 
      			 React.createElement("input", {type: "checkbox", onChange: this.setAdvance}), "Advance"
    			)
  			), 
			React.createElement("button", {onClick: this.save, className: "btn btn-success pull-right"}, this.state.savecaption), 
			this.renderDanger(), 
			React.createElement("br", null), 
			React.createElement("div", {className: "label label-"+this.state.messagetype}, this.state.message)
		)
	}
});
module.exports=Controlpanel;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./setuser":"C:\\ksana2015\\visualmarkup\\src\\setuser.js","./store_markup":"C:\\ksana2015\\visualmarkup\\src\\store_markup.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\dictionarypanel.js":[function(require,module,exports){
var Reflux=require("reflux");
var store=require("./store_text").dictionary;
var store_tagset=require("./store_tagset");
var actions_text=require("./actions_text");
var actions_markup=require("./actions_markup");
var SearchDictionary=React.createClass({displayName: "SearchDictionary",
		search:function() {
			var tofind=this.refs.tofind.getDOMNode().value;
			actions_text.searchDictionary(tofind);
		},
		onkey:function(e) {
			if (e.key=="Enter") this.search();
		},
		render:function(){
			return React.createElement("div", null, 
				React.createElement("div", {className: "input-group"}, 
				React.createElement("span", {className: "input-group-addon"}, "教育部國語辭典"), 
				React.createElement("input", {onKeyPress: this.onkey, ref: "tofind", size: "3", className: "textinput form-control"}), 
				React.createElement("span", {className: "input-group-btn"}, 
				React.createElement("button", {className: "btn btn-default", onClick: this.search}, "查")
				)
				)
			)
		}
	});
var partofspeechtag={"動":"verb","副":"adverb","形":"adjective","名":"noun","助":"particle"
,"介":"preposition","連":"conjunction","代":"pronoun"};
var DictionaryPanel=React.createClass({displayName: "DictionaryPanel",
	mixins:[Reflux.listenTo(store,"onData"),Reflux.listenTo(store_tagset,"onTagsetname")],
	getInitialState:function() {
		return {data:[],enableMarkup:false}
	},
	onData:function(data,extra){
		this.setState({data:data,db:extra.db,viewid:extra.viewid,vpos:extra.vpos});
	}, 
	onTagsetname:function(tagsetname) {
		this.setState({enableMarkup:tagsetname=="partofspeech"});
	},
	createMarkup:function(partofspeech,explain,term) {
		//actions.addMarkup();
		var tag=partofspeechtag[partofspeech];
		var payload={tag:tag,source:this.state.db.dbname,explain:explain};
		var exclusive=[];
		for (var key in partofspeechtag) exclusive.push(partofspeechtag[key]);
		var m=actions_markup.createMarkup(this.state.viewid,this.state.vpos,term.length,payload,{edit:true,exclusive:exclusive});
	},
	onclick:function(e){
		if(e.target.nodeName=="BUTTON") {
			var term=e.target.parentElement.dataset.term;
			var explain=e.target.nextSibling.innerHTML;
			this.createMarkup(e.target.innerHTML,explain,term);
		}
	},
	renderItem:function(item,idx) {
		var lines=item.split("\n");
		var term=lines.shift();
		var out=['<div data-term="'+term+'">','<span class="dictentry">'+term+'</span>'];
		for (var i=0;i<lines.length;i++) {
			var line=lines[i];
			if (this.state.enableMarkup && line[0]=="{"){
				var	at=line.indexOf("}");
				line='<button>'+line.substring(1,at)+"</button><span>"+line.substr(at+1)+"</span>";
			}
			out.push(line);
		}
		out.push("</div>");
		
		return React.createElement("div", {key: "I"+idx, dangerouslySetInnerHTML: {__html:out.join("<br/>")}})
	},
	render:function(){
		return React.createElement("div", {className: "dictionarypanel panel panel-warning"}, 
				React.createElement("div", {className: "panel-heading text-center"}, React.createElement(SearchDictionary, null)), 
				React.createElement("div", {onClick: this.onclick, className: "panel-body dictionarytext"}, 
				this.state.data.map(this.renderItem)
				)
		)
	}
});
module.exports=DictionaryPanel;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./actions_text":"C:\\ksana2015\\visualmarkup\\src\\actions_text.js","./store_tagset":"C:\\ksana2015\\visualmarkup\\src\\store_tagset.js","./store_text":"C:\\ksana2015\\visualmarkup\\src\\store_text.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\domhelper.js":[function(require,module,exports){
var getTextUntilPunc=function(ele) {
	var tofind="";
	if (ele.nodeName!="SPAN")return;
	while (ele) {
		if (ele.nodeName=="SPAN") {
			var text=ele.innerHTML;
			var ic=text.charCodeAt(0);
			if ((ic>=0x3F00 && ic<=0x9FFF) || (ic>=0xD800 && ic<=0xDFFF)) {
				tofind+=text;
				ele=ele.nextSibling;
			} else break;
		} else break;
	}
	return tofind;		
};

module.exports={getTextUntilPunc:getTextUntilPunc};
},{}],"C:\\ksana2015\\visualmarkup\\src\\drawing.js":[function(require,module,exports){

var curveLink=function(ctx,rect,master) {
	var x1=(rect[0]+rect[2])/2, y1=(rect[3]); 

	var x3=(master[0]+master[2])/2, y3=(master[3]);

	if (Math.abs(y3-y1)>Math.abs(master[1]-y1)) y3=master[1];
	if (Math.abs(y1-y3)>Math.abs(rect[1]-y3)) y1=rect[1];

/*
	var max_y=y1;
	if (y3>y1) max_y=y3;
	var x2=(x1+x3)/2, y2=max_y+20;
*/
	ctx.moveTo(x1,y1+3);
	//ctx.quadraticCurveTo(x2,y2,x3,y3);
	ctx.lineTo(x3,y3+3);
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(x3 , y3 , 3, 0, Math.PI*2, true); 
	ctx.closePath();
	ctx.fill();

}

module.exports={curveLink:curveLink};
},{}],"C:\\ksana2015\\visualmarkup\\src\\kepanpanel.js":[function(require,module,exports){
var Reflux=require("reflux");
var store=require("./store_text").kepan;
var actions=require("./actions_text");
var stacktoc=require("ksana2015-stacktoc");
var StackToc=stacktoc.component; //react 0.12 component name first character has to beuppercase

var KepanPanel=React.createClass({displayName: "KepanPanel",
	getInitialState:function() {
		var kepanid=parseInt(localStorage.getItem("visualmarkup.kepanid")||"1");
		return {toc:[],current:0,kepanid:kepanid};
	},
	propTypes:{
		tocname:React.PropTypes.string.isRequired
	},
	mixins:[Reflux.listenTo(store,"onData")],
	onData:function(kepan,db){
		if (typeof kepan=="number") {
			this.setState({current:kepan});
		} else {
			var toc=stacktoc.genToc(kepan,this.props.tocname);
			this.setState({db:db,toc:toc});			
		}
	},
	showText:function(n) {
		actions.getSutraTextByKepanId(n);
		localStorage.setItem("visualmarkup.kepanid",n);
	},
	componentDidMount:function() { 
		actions.getKepan();
		actions.getSutraTextByKepanId(this.state.kepanid);
		actions.getLectureTextByKepanId(this.state.kepanid);
	},
	render:function(){
		return React.createElement("div", {className: "panel panel-info"}, 
			React.createElement("div", {className: "panel-heading text-center kepanpanel-title"}, "科文"), 
			React.createElement("div", {className: "panel-body kepanview"}, 
			React.createElement(StackToc, {data: this.state.toc, 
			opts: {tocstyle:"ganzhi"}, showText: this.showText, current: this.state.current})
			)
		)
	}
});

module.exports=KepanPanel;
},{"./actions_text":"C:\\ksana2015\\visualmarkup\\src\\actions_text.js","./store_text":"C:\\ksana2015\\visualmarkup\\src\\store_text.js","ksana2015-stacktoc":"C:\\ksana2015\\node_modules\\ksana2015-stacktoc\\index.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\keyboardshortcut.js":[function(require,module,exports){
var actions=require("./actions_markup");

var otherHotkey=function(e) {
	if (e.which==46) {
		actions.deleteEditingMarkup({setSelection:true});
	}
}
var keyboardshortcut=function(e) {
	if (!e.altKey) {
		return otherHotkey(e);
	}
	if (e.which<48&&e.which>57) return;
	//markup hot key
	var n=e.which-49;
	if (e.which==48) n=9;
	actions.doTag(n);
	return true;
}
module.exports=keyboardshortcut;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js"}],"C:\\ksana2015\\visualmarkup\\src\\lecturetext.js":[function(require,module,exports){
var Reflux=require("reflux");
var actions=require("./actions_text");
var actions_markup=require("./actions_markup");
var domhelper=require("./domhelper");
var Markable=require("./markable");
var viewid="lecture";
var store_dsl=require("./store_text").lecture;
var TextNav=require("./textnav");
var Controls=React.createClass({displayName: "Controls",
	nextpara:function() {
		actions.nextLecturePara();
	},
	prevpara:function() {
		actions.prevLecturePara();
	},
	render:function() {
		return React.createElement("div", {className: "text-center"}, "講義", 
			React.createElement("div", {className: "pull-right"}, React.createElement("button", {onClick: this.prevpara}, "上一段"), 
				React.createElement("button", {onClick: this.nextpara}, "下一段")
			)
			)
	}
});
var Markuptext=React.createClass({displayName: "Markuptext",
	mixins:[Reflux.listenTo(store_dsl,"lecturetext")],
	getInitialState:function() {
		return {text:[],db:null};
	},
	spanClicked:function(e) {
		var tofind=domhelper.getTextUntilPunc(e.target);
		var vpos=parseInt(e.target.dataset.n);
		if (isNaN(vpos)) return;
		actions.searchDictionary(tofind,vpos,viewid);
		actions_markup.editMarkupAtPos(viewid,vpos);
	},
	lecturetext:function(text,db){
		if (text) this.setState({text:text});
		if (this.state.db!=db) this.setState({db:db});
	}, 
	render:function() {
		return React.createElement("div", {className: "panel panel-success"}, 
				React.createElement("div", {className: "panel-heading clearfix"}, 
					React.createElement(TextNav, {store: store_dsl, actions: actions, viewid: viewid, title: "江味農居士金剛經講義"})
				), 
				React.createElement("div", {onClick: this.spanClicked, className: "panel-body lecturetext"}, 
				React.createElement(Markable, {text: this.state.text, viewid: viewid})
		        )
		     )
	}
});
module.exports=Markuptext;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./actions_text":"C:\\ksana2015\\visualmarkup\\src\\actions_text.js","./domhelper":"C:\\ksana2015\\visualmarkup\\src\\domhelper.js","./markable":"C:\\ksana2015\\visualmarkup\\src\\markable.js","./store_text":"C:\\ksana2015\\visualmarkup\\src\\store_text.js","./textnav":"C:\\ksana2015\\visualmarkup\\src\\textnav.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\leftpanel.js":[function(require,module,exports){
var actions=require("./actions_markup");
var KepanPanel=require("./kepanpanel");
var MarkupPanel=require("./markuppanel");
var DictionaryPanel=require("./dictionarypanel");
var mpviewid="markuppanel";
var LeftPanel=React.createClass({displayName: "LeftPanel",
	switchtab:function(e) {
		if (e.target.dataset.viewid==mpviewid) {
			actions.removeHiddenView(mpviewid);
		} else {
			actions.addHiddenView(mpviewid);
		}
	}
	,render:function() {
		return React.createElement("div", null, 
			React.createElement("div", null, 
				React.createElement("ul", {className: "nav nav-tabs", onClick: this.switchtab}, 
					React.createElement("li", null, React.createElement("a", {href: "#kepan", "data-toggle": "tab"}, "TOC")), 
					React.createElement("li", {className: "active"}, 
					    React.createElement("a", {href: "#markup", "data-viewid": mpviewid, "data-toggle": "tab"}, "Tagset")), 
					React.createElement("li", null, React.createElement("a", {href: "#dictionary", "data-toggle": "tab"}, "Dictionary"))
				)
			), 
			React.createElement("div", {className: "tab-content"}, 
				React.createElement("div", {className: "tab-pane", id: "kepan"}, React.createElement(KepanPanel, {tocname: "金剛經講義"})), 
				React.createElement("div", {className: "tab-pane active", id: "markup"}, React.createElement(MarkupPanel, null)), 
				React.createElement("div", {className: "tab-pane", id: "dictionary"}, React.createElement(DictionaryPanel, null))
			)		
		)
	}
});
module.exports=LeftPanel;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./dictionarypanel":"C:\\ksana2015\\visualmarkup\\src\\dictionarypanel.js","./kepanpanel":"C:\\ksana2015\\visualmarkup\\src\\kepanpanel.js","./markuppanel":"C:\\ksana2015\\visualmarkup\\src\\markuppanel.js"}],"C:\\ksana2015\\visualmarkup\\src\\main.jsx":[function(require,module,exports){
var SutraText=require("./sutratext");
var LectureText=require("./lecturetext");
var Markuplayer=require("./markuplayer");
var Trait=require("./trait");
var ControlPanel=require("./controlpanel");
var LeftPanel=require("./leftpanel");
var keyboardshortcut=require("./keyboardshortcut");
//var pageScrollMixin=require("ksana2015-components").pageScrollMixin; 

var maincomponent = React.createClass({displayName: "maincomponent",
//	mixins:[pageScrollMixin],
	componentDidMount:function() {
		var that=this;
		window.addEventListener('resize', function(e){
		  that.forceUpdate();
		});
		window.addEventListener('keyup',function(e){
			if (keyboardshortcut(e)) e.preventDefault();
		})
	},
	onScrollEnd:function() {
		this.forceUpdate();
	},
	render: function() {
		return React.createElement("div", null, 
			React.createElement(Markuplayer, null), 
			React.createElement("div", {className: "tocpanel col-md-3"}, 
				React.createElement(LeftPanel, null)
			), 
			React.createElement("div", {className: "textpanel col-md-6"}, 			
				React.createElement(SutraText, null), 
				React.createElement(LectureText, null)
			), 
			React.createElement("div", {className: "dictpanel col-md-3"}, 
				React.createElement("div", {className: "panel panel-warning"}, 
					React.createElement("div", {className: "panel-heading text-center"}, "Visual Semantic Markup System"), 
					React.createElement("div", {className: "panel-body"}, React.createElement(ControlPanel, null))
				), 
				
				React.createElement("div", {className: "panel panel-warning"}, 
					React.createElement("div", {className: "panel-heading text-center"}, "Tag Attributes and Selection"), 
					React.createElement("div", {className: "panel-body"}, React.createElement(Trait, null))
				)
				

			)
		);
	}
});
module.exports=maincomponent;
},{"./controlpanel":"C:\\ksana2015\\visualmarkup\\src\\controlpanel.js","./keyboardshortcut":"C:\\ksana2015\\visualmarkup\\src\\keyboardshortcut.js","./lecturetext":"C:\\ksana2015\\visualmarkup\\src\\lecturetext.js","./leftpanel":"C:\\ksana2015\\visualmarkup\\src\\leftpanel.js","./markuplayer":"C:\\ksana2015\\visualmarkup\\src\\markuplayer.js","./sutratext":"C:\\ksana2015\\visualmarkup\\src\\sutratext.js","./trait":"C:\\ksana2015\\visualmarkup\\src\\trait.js"}],"C:\\ksana2015\\visualmarkup\\src\\markable.js":[function(require,module,exports){
/*
	handle multiple selection
	hover for some time on char with markup , show a button 
*/

var Reflux=require("reflux");
var actions=require("./actions_markup");
var actions_selection=require("./actions_selection");
var store=require("./store_markup");
var store_selection=require("./store_selection");
var store_highlight=require("./store_highlight");
var Markuplayer=require("./markuplayer");
var textselection=require("./textselection");
var Markuptable=React.createClass({displayName: "Markuptable",
	mixins:[Reflux.listenTo(store_selection,"onSelection"),
	        Reflux.listenTo(store_highlight,"onHighlight")]
	,getInitialState:function() {
		return {ready:false,scrolling:false,selections:[],highlights:[]};
	}
	,onSelection:function(selections,viewid) {
		var sels=selections[viewid];
		if (viewid!=this.props.viewid || //not my business
		  JSON.stringify(sels)==JSON.stringify(this.state.selections)) return ; //nothing to update	
		this.setState({selections:sels});
	}
	,onHighlight:function(highlights,viewid) {
		var hls=highlights[viewid]||[];
		if (viewid!=this.props.viewid || //not my business
		  JSON.stringify(hls)==JSON.stringify(this.state.highlights)) return ; //nothing to update	
		this.setState({highlights:hls});
	}
	,propTypes:{
		text:React.PropTypes.array.isRequired
		,viewid:React.PropTypes.string.isRequired
	}
	,onScrollStart:function() {

	}
	,onScrollEnd:function() {
		this.updatePosition();
	}	
	,updatePosition:function(){
		var children=this.getDOMNode().children[0].children;
		var out={};
		for (var i=0;i<children.length;i++) {
			var rect=children[i].getBoundingClientRect();
			var vpos=children[i].dataset.n;
			if (vpos){
				out[parseInt(vpos)]=[rect.left,rect.top,rect.right,rect.bottom];	
			}
		}
		actions.tokenPositionUpdated( out, this.props.viewid);
	}
	,componentWillReceiveProps:function(nextProps) {
		if (nextProps.text!=this.props.text) {
			actions.tokenPositionUpdated({}, this.props.viewid);//clear all markups
			this.setState({ready:false});
		} 
	}
	,componentWillUpdate:function() {
		this.editing=store.getEditing(this.props.viewid);
	}
	,componentDidUpdate:function(){
		if (!this.state.ready) {
			setTimeout(this.updatePosition,300);//browser need sometime to layout
		}
	}
	,componentDidMount:function() {
		actions.registerViewid(this.props.viewid);
	}
	,mouseUp:function(e) {
      var sel=textselection();  
      var selections=this.state.selections;
      var oldlength=selections.length;
      if (!sel)return;

      actions.cancelEdit();
      actions_selection.addSelection(this.props.viewid, selections, sel.start,sel.len , e.ctrlKey );
	}
	,mouseOut:function() {

	}
	,mouseMove:function() {

	}
	,inSelected:function(idx) {
		for (var i=0;i<this.state.selections.length;i++) {
			var sel=this.state.selections[i];
			if (idx>=sel[0] && idx<sel[0]+sel[1]) return true;
		}
		return false;
	}
	,highlighedStyle:function(idx) {
		for (var i=0;i<this.state.highlights.length;i++) {
			var hl=this.state.highlights[i];
			if (idx>=hl[0] && idx<hl[0]+hl[1]) {
				if (this.editing && this.editing[0]==hl[0] && this.editing[1]==hl[1]) {
					return "editing";
				} else {
					return "highlighted";	
				}
			}
		}
		return "";
	}
	,renderChar:function(item,idx){
		var cls="";
		if (this.inSelected(item[1])) cls="selected";
		cls+=this.highlighedStyle(item[1]);
		
		return React.createElement("span", {className: cls, key: "c"+idx, "data-n": item[1]}, item[0])
	},
	render:function() {
		return React.createElement("div", null, 
				React.createElement("div", {
				    onMouseUp: this.mouseUp, 
			        onMouseOut: this.mouseOut, 
          			onMouseMove: this.mouseMove
          		}, 
          		this.props.text.map(this.renderChar)
          		)
			)
	}
});

module.exports=Markuptable;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./actions_selection":"C:\\ksana2015\\visualmarkup\\src\\actions_selection.js","./markuplayer":"C:\\ksana2015\\visualmarkup\\src\\markuplayer.js","./store_highlight":"C:\\ksana2015\\visualmarkup\\src\\store_highlight.js","./store_markup":"C:\\ksana2015\\visualmarkup\\src\\store_markup.js","./store_selection":"C:\\ksana2015\\visualmarkup\\src\\store_selection.js","./textselection":"C:\\ksana2015\\visualmarkup\\src\\textselection.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\markupgroup.js":[function(require,module,exports){
//render whole markups in same group,
//click to bring markup into view, and set new editing viewid, n
var MarkupGroup=React.createClass({displayName: "MarkupGroup",
	render:function(){

	}
})
module.exports=MarkupGroup;
},{}],"C:\\ksana2015\\visualmarkup\\src\\markuplayer.js":[function(require,module,exports){
var Reflux=require("reflux");
var actions=require("./actions_markup");
var store=require("./store_markup");
var shapes=require("./shapes");
var Markuplayer=React.createClass({displayName: "Markuplayer",
	mixins:[Reflux.listenTo(store,"updatemarkup")],
	getInitialState:function() {
		return {};
	},
	updatemarkup:function(data) {
		var ctx = this.refs.thecanvas.getDOMNode().getContext("2d");
		ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
		for (var i=0;i<data.length;i++){
			shapes.draw(ctx,data[i],i,data);
		}
	},
	componentDidMount:function() {
		var ctx = this.refs.thecanvas.getDOMNode().getContext("2d");
		ctx.canvas.width = window.innerWidth;
		ctx.canvas.height = window.innerHeight;
		window.ctx=ctx;
	},
	render:function() {
		return React.createElement("div", {className: "markuplayer"}, 
			React.createElement("canvas", {ref: "thecanvas"})
        )
	}
});
module.exports=Markuplayer;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./shapes":"C:\\ksana2015\\visualmarkup\\src\\shapes.js","./store_markup":"C:\\ksana2015\\visualmarkup\\src\\store_markup.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\markupnav.js":[function(require,module,exports){
var MarkupNav=React.createClass({displayName: "MarkupNav",
	render:function(){
		return React.createElement("div", null, React.createElement("a", {className: "btn btn-default"}, "First"), 
			React.createElement("a", {className: "btn btn-default"}, "Prev"), 
			React.createElement("a", {className: "btn btn-default"}, "Next"), 
			React.createElement("a", {className: "btn btn-default"}, "Last")
			)	
	} 
});
module.exports=MarkupNav;
},{}],"C:\\ksana2015\\visualmarkup\\src\\markuppanel.js":[function(require,module,exports){
var TagsetTab=require("./tagsettab");
var Trait=require("./trait");
var actions=require("./actions_markup");

var Reflux=require("reflux");
var MarkupNav=require("./markupnav");
var MarkupPanel=React.createClass({displayName: "MarkupPanel",
	getInitialState:function() {
		return {}
	},
	render:function(){
		return React.createElement("div", {className: "markuppanel"}, 
			React.createElement("div", {className: "pull-right"}, React.createElement(MarkupNav, null)), 		
			React.createElement(TagsetTab, null)
		)
	}
});

module.exports=MarkupPanel;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./markupnav":"C:\\ksana2015\\visualmarkup\\src\\markupnav.js","./tagsettab":"C:\\ksana2015\\visualmarkup\\src\\tagsettab.js","./trait":"C:\\ksana2015\\visualmarkup\\src\\trait.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\markupsearch.js":[function(require,module,exports){
var MarkupSearch=React.createClass({displayName: "MarkupSearch",
	render:function() {
		return React.createElement("div", null, 
		React.createElement("button", {className: "btn btn-default disabled"}, "Similar Markup"))
	}
});
module.exports=MarkupSearch;
},{}],"C:\\ksana2015\\visualmarkup\\src\\persistent.js":[function(require,module,exports){
var dbname="visualmarkup";

var db=new PouchDB(dbname);
/*
if (ksana.platform=="node-webkit" || window.location.host.substring(0,9)=="127.0.0.1"){
    var db=null;
    if (typeof PouchDB !="undefined") {
      db=new PouchDB(dbname);
    }
} else {
    //var db=new PouchDB('http://114.34.238.149:5984/'+dbname);
    var db=new PouchDB('http://ya.ksana.tw:5984/'+dbname);
}
*/


var loadMarkups=function(keys,cb,context){
  if (!db) {
    cb.apply(context,[]);
    return;
  }
  db.allDocs({keys:keys,include_docs:true},function(err,response){
    var bulk=[];
    if (response  && response.rows) response.rows.map(function(d){
    	if (d.error) {
    		bulk.push({_id:d.key,markups:[]});
    	} else {
    		bulk.push({_id:d.id,_rev:d.doc._rev,markups:d.doc.markups||[]});	
    	}
    });
    cb.apply(context,[bulk]);
  });	
}

var resetMarkups=function(bulk) {
	//db.destroy(dbname);  //doesn't work on nodewebkit
  
	bulk.map(function(b){
		b.markups=[];
	});
  saveMarkups(bulk);
}

var saveMarkups=function(markups,cb,context) {

	db.bulkDocs(markups,function(err,response){
		if (cb) cb.apply(context,[response]);
	});
  /*
    db.bulkDocs(markups,function(err,response){
       if (err) console.log(err);
       else console.log(response);
    });
  */
}

module.exports={loadMarkups:loadMarkups,saveMarkups:saveMarkups,resetMarkups:resetMarkups}
},{}],"C:\\ksana2015\\visualmarkup\\src\\selectionlist.js":[function(require,module,exports){
var Reflux=require("reflux");
var stores=require("./store_text");
var viewName={"lecture":"講義","sutra":"經文"};
var actions=require("./actions_text");

var SelectionList=React.createClass({displayName: "SelectionList",
	mixins:[Reflux.ListenerMixin]
	,propTypes:{
		viewselections:React.PropTypes.object.isRequired
		,showtext:React.PropTypes.bool
	}
	,goSelection:function(e) {
		var vpos=parseInt(e.target.dataset.vpos);
		var viewid=e.target.dataset.viewid;
		actions.getTextByVpos(vpos,viewid);		
	}
	,componentDidMount:function(){
		for (var i in stores) {
			this.listenTo(stores[i], this.onTextChange);
		}
	}
	,onTextChange:function() {
		this.forceUpdate();
	}
	,sortView:function() {//naive approach
		var keys=Object.keys(this.props.viewselections);
		keys.sort(function(a,b){ return a>b?-1:b>a?1:0});
		return keys;
	}
	,renderHelp:function() {
		var keys=Object.keys(this.props.viewselections);
		if (keys.length==1 && this.props.viewselections[keys[0]].length==1){
			return React.createElement("span", null, "Press Ctrl to append selection");
		}
	}
	,render:function() {
		var out=[];
		keys=this.sortView();
		for (var j=0;j<keys.length;j++) {
			var view=keys[j];
			var selections=this.props.viewselections[view];
			if (selections.length) out.push(React.createElement("div", {key: view+"view"}, viewName[view]))
			for (var i=0;i<selections.length;i++) {
				var sel=selections[i], cls="", onclick=null;
				var text="";
				if (this.props.showtext) text=stores[view].getTextBySelection(sel[0],sel[1]);
				var npara=stores[view].getSegByVpos(sel[0]);
				if (text && text.length>10) text=text.substr(0,10)+"...";
				if ( !stores[view].vposInSight(sel[0])) {
					cls="btn btn-default";
					onclick=this.goSelection;
				}
				out.push(React.createElement("div", {key: view+"s"+i}, React.createElement("span", {onClick: onclick, className: cls, 
					 "data-viewid": view, "data-vpos": sel[0]}, npara+"|"+sel[0]+"-"+sel[1]+" "
					), React.createElement("span", null, text), React.createElement("br", null)));
			}
			out.push(React.createElement("hr", {key: view+"hr"}))
		}
		return React.createElement("div", null, out, this.renderHelp());
	}	
});
module.exports=SelectionList;
},{"./actions_text":"C:\\ksana2015\\visualmarkup\\src\\actions_text.js","./store_text":"C:\\ksana2015\\visualmarkup\\src\\store_text.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\setuser.js":[function(require,module,exports){
var Reflux=require("reflux");
var store=require("./store_userinfo");
var actions=require("./actions_system");
var SetUser=React.createClass({displayName: "SetUser",
	mixins:[Reflux.listenTo(store,"onUser")]
	,getInitialState:function() {
		return {username:"",email:""};
	}
	,onUser:function(userinfo) {
		this.setState({username:userinfo.name,email:userinfo.email});
	}
	,userchange:function(e) {
		var username=e.target.value;
		this.setState({username:e.target.value});
		if (this.timer) clearTimeout(this.timer);
		this.timer=setTimeout(function(){
			actions.setUserName(username);
		},1000);
	},
	render:function() {

		return  React.createElement("div", {className: "input-group"}, 
				React.createElement("span", {className: "input-group-addon"}, "Username"), 
				React.createElement("input", {value: this.state.username, onChange: this.userchange, type: "text", className: "form-control larger-input"})
		)
		return React.createElement("div", null, "Username:", React.createElement("input", null))
	}
});
module.exports=SetUser;
},{"./actions_system":"C:\\ksana2015\\visualmarkup\\src\\actions_system.js","./store_userinfo":"C:\\ksana2015\\visualmarkup\\src\\store_userinfo.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\shapes.js":[function(require,module,exports){
var drawing=require("./drawing");
var drawImportant=function(ctx,inst) {
	var gra=ctx.createLinearGradient(0,0,0,(inst.rect[3]-inst.rect[1])*3);
	gra.addColorStop(0,"rgba(255, 0, 0, 0.2)");
	gra.addColorStop(1,"rgba(0,0 , 255, 0.7)");
	ctx.fillStyle=gra;
	ctx.fillinst.rect(inst.rect[0],inst.rect[1],inst.rect[2]-inst.rect[0],inst.rect[3]-inst.rect[1]);
}

var drawDoubt=function(ctx,inst) {
	var cx=(inst.rect[0]+inst.rect[2])/2;
	var cy=(inst.rect[1]+inst.rect[3])/2;
	var r=(inst.rect[3]-inst.rect[1])/2 +1;

	ctx.beginPath();
	ctx.setLineDash([3])
	ctx.lineWidth=1;
	ctx.strokeStyle="red";
	ctx.arc(cx,cy,r,0,2*Math.PI,false);
	ctx.stroke();
	//ctx.fillStyle="red";
	//ctx.fillinst.rect(inst.rect[0],inst.rect[3],inst.rect[2]-inst.rect[0],3);
}
var drawSimple=function(ctx,inst) {
	ctx.beginPath();
	ctx.strokeStyle=inst.tagsetting.color;
	ctx.setLineDash([2]);
	ctx.lineWidth=2;
	var x1=inst.rect[0],y1=inst.rect[1],x2=inst.rect[2],y2=inst.rect[3];

	ctx.moveTo(x2,y1);ctx.lineTo(x1,y1);
	if (inst.nth==0) ctx.lineTo(x1,y2);
	ctx.moveTo(x1,y2);ctx.lineTo(x2,y2);
	if (inst.nth==inst.len-1) ctx.lineTo(x2,y1);
	ctx.stroke();
}

var drawReaderExpress=function(ctx,inst) {
	var cx=(inst.rect[0]+inst.rect[2])/2;
	var cy=(inst.rect[1]+inst.rect[3])/2;
	var r=(inst.rect[3]-inst.rect[1])/2 +1;

	ctx.beginPath();
	ctx.setLineDash([3])
	ctx.lineWidth=2;
	ctx.strokeStyle=inst.tagsetting.color;
	ctx.arc(cx,cy,r,0,2*Math.PI,false);
	ctx.stroke();
}
var drawIntertext=function(ctx,inst,n,insts){
	var cx=(inst.rect[0]+inst.rect[2])/2;
	var cy=(inst.rect[1]+inst.rect[3])/2;
	var r=(inst.rect[3]-inst.rect[1])/2 +1;

	ctx.beginPath();
	ctx.setLineDash([3])
	ctx.lineWidth=2;
	ctx.strokeStyle=inst.tagsetting.color;
	ctx.arc(cx,cy,r,0,2*Math.PI,false);

	if (inst.master) {
		var x1=inst.master.rect[0],y1=inst.master.rect[3];
		var x2=inst.rect[0],y2=inst.rect[1];
		if (y1>y2) {
			y1=inst.master.rect[1];
			y2=inst.rect[3];
		}
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
	}
	ctx.stroke();
}
var combinedRect=function(insts,n){
	var i=n;
	var inst=insts[i];
	var x1=inst.rect[0],y1=inst.rect[1],x2=inst.rect[2],y2=inst.rect[3];
	while (i<insts.length) {
		x2=inst.rect[2],y2=inst.rect[3];
		if (inst.nth==inst.len-1) break;
		inst=insts[i++];
	}
	return [x1,y1,x2,y2];
}
var findMasterN=function(insts,master) {
	for (var i=0;i<insts.length;i++) {
		if (insts[i]==master) return i;
	}
}
var masterCombinedRect=function(insts,master){
	var n=findMasterN(insts,master);
	return combinedRect(insts,n);
}
var drawInternal=function(ctx,inst,n,insts) {
	ctx.beginPath();
	ctx.strokeStyle=inst.tagsetting.color;
	ctx.fillStyle=inst.tagsetting.fillcolor ||inst.tagsetting.color;
	ctx.setLineDash([3]);
	ctx.lineWidth=2;
	ctx.globalAlpha = 0.7;
	var x1=inst.rect[0],y1=inst.rect[1],x2=inst.rect[2],y2=inst.rect[3];

	ctx.moveTo(x2,y1);ctx.lineTo(x1,y1);
	if (inst.nth==0) ctx.lineTo(x1,y2);
	ctx.moveTo(x1,y2);ctx.lineTo(x2,y2);
	if (inst.nth==inst.len-1) ctx.lineTo(x2,y1);

	if (inst.master) {
		var masterRect=masterCombinedRect(insts,inst.master);
		var rect=combinedRect(insts,n);
		drawing.curveLink(ctx,rect,masterRect);

		if (inst.tagsetting && inst.tagsetting.labels) {
			ctx.strokeStyle='#000';
			ctx.fillStyle='#000';
			ctx.fillText(inst.tagsetting.labels[0],masterRect[0],masterRect[1]-2);
			ctx.fillText(inst.tagsetting.labels[1],rect[0],rect[1]-2);
		}
	}


	ctx.stroke();
}

var drawers={
	simple:drawSimple
	,intertext:drawInternal
	,internal:drawInternal
};

var draw=function(ctx,inst,n,insts) {
	var drawer=drawers[inst.tagsetting.type];
	if (drawer) drawer(ctx,inst,n,insts);
}
module.exports={draw:draw};
},{"./drawing":"C:\\ksana2015\\visualmarkup\\src\\drawing.js"}],"C:\\ksana2015\\visualmarkup\\src\\store_highlight.js":[function(require,module,exports){
var Reflux=require("reflux");
var actions=require("./actions_selection");

var store_highlight=Reflux.createStore({
	listenables: [actions]
	,highlights:{}
	,init:function() {
	}
	,onSetHighlight:function(highlights,viewid) {
		this.highlights[viewid]=highlights;
		this.trigger(this.highlights,viewid);
	}
	,onSetHighlights:function(viewhighlights) {
		for (var i in viewhighlights) {
			this.highlights[i]=viewhighlights[i];
		}
		var updated=Object.keys(viewhighlights);
		for (var i=0;i<updated.length;i++){
			this.trigger(this.highlights,updated[i]); //notify affected view
		}
	}
	,onClearHighlights:function() {
		for (var i in this.highlights) {
			this.trigger({},i);
		}
		this.highlights={};
	}
	,getHighlights:function(){
		return this.highlights;
	}
	,getHighlight:function(viewid){
		return this.highlights[viewid];
	}
});

module.exports=store_highlight;
},{"./actions_selection":"C:\\ksana2015\\visualmarkup\\src\\actions_selection.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\store_markup.js":[function(require,module,exports){
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
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./actions_text":"C:\\ksana2015\\visualmarkup\\src\\actions_text.js","./persistent":"C:\\ksana2015\\visualmarkup\\src\\persistent.js","./store_tagsets":"C:\\ksana2015\\visualmarkup\\src\\store_tagsets.js","./testmarkups":"C:\\ksana2015\\visualmarkup\\src\\testmarkups.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\store_selection.js":[function(require,module,exports){
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
},{"./actions_selection":"C:\\ksana2015\\visualmarkup\\src\\actions_selection.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\store_tagset.js":[function(require,module,exports){
var Reflux=require("reflux");
var store_userinfo=require("./store_userinfo");
var store_selection=require("./store_selection");
var store_tagsets=require("./store_tagsets");
var actions=require("./actions_markup");
var actions_selection=require("./actions_selection");
var S4=function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
var genGUID = function() {
	return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();	
} 

var store_tagset=Reflux.createStore({
	listenables: [actions]
	,init:function() {
		this.listenTo(store_selection, this.selectionChanged);
	}
	,groupSelection:function(viewselections){
		var groupedselection=[];

		for (var i in viewselections) { //how many selections in each view
			var len=viewselections[i].length;
			if (len) groupedselection.push(len);
		}
		return groupedselection;
	}
	,enableTagsetBySelection:function(viewselections) {
		if (!this.tagset) return;
		var g=this.groupSelection(viewselections);
		for (var i=0;i<this.tagset.length;i++) {
			this.tagset[i].disabled=!this.tagset[i].def.isValidSelection(g,viewselections);
		}
	}
	,selectionChanged:function(viewselections) {
		this.enableTagsetBySelection(viewselections);
		this.trigger(this.tagsetname,this.tagset);
	}
	,onSetActiveTagset:function(tagsetname,tagset){
		this.tagsetname=tagsetname;
		this.tagset=tagset;
		this.enableTagsetBySelection(store_selection.getSelections());
		this.trigger(tagsetname,tagset); 
	}
	,getTagsetName:function() {
		return this.tagsetname;
	}
	,sortSelection:function(viewsels) { //let the view with only one range be the head of group
		var arr=[];
		for (var i in viewsels) {
			arr.push([i,viewsels[i].length]);
		}
		arr.sort(function(a,b){return b[1].length-a[1].length});
		return arr.map(function(a){return a[0]});
	}
	,onDoTag:function(n) {
		var exclusive=[];
		var tag=this.tagset[n].name;
		var viewsels=store_selection.getSelections();
		var g=this.groupSelection(viewsels);
		var valid=this.tagset[n].def.isValidSelection(g,viewsels);
		if (!valid) return;
		var guid=null;
		var first=true;
		var setting=store_tagsets.settingOfTag(tag);
		if (setting.def.group) guid=genGUID();

		var arr=this.sortSelection(viewsels);

		for (var i=0;i<arr.length;i++) {
			var viewid=arr[i];
			var sels=viewsels[viewid];
			for (var j=0;j<sels.length;j++){
				var sel=sels[j];
				var payload=setting.def.initPayload(tag,first,guid,sel,j,sels);
				if (payload) {
					actions.createMarkup(viewid,sel[0],sel[1],payload,{edit:first,exclusive:exclusive});
				}
				first=false;
			}
		}
		actions_selection.clearSelections();

	}
});
module.exports=store_tagset;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./actions_selection":"C:\\ksana2015\\visualmarkup\\src\\actions_selection.js","./store_selection":"C:\\ksana2015\\visualmarkup\\src\\store_selection.js","./store_tagsets":"C:\\ksana2015\\visualmarkup\\src\\store_tagsets.js","./store_userinfo":"C:\\ksana2015\\visualmarkup\\src\\store_userinfo.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\store_tagsets.js":[function(require,module,exports){
var Reflux=require("reflux");
var actions=require("./actions_markup");
var tagsetdef=require("./tagtypedef");
var store_tagsets=Reflux.createStore({
	listenables: [actions]
	,onLoadTagsets:function(){
		this.tagsets=require("./tagsets");
		for (var viewid in this.tagsets) {
			var tagset=this.tagsets[viewid].tagset;
			for (var i in tagset) {
				var tag=tagset[i];
				if (!tag.type) tag.type="simple";
				type=tag.type;
				tag.def=tagsetdef[tag.type];
				if (!tag.def) {
					console.error("unknown tag",tag.type)
				} else {
					tag.checked=true;
					tag.def.type=type;
				}
			}
		}
		this.trigger(this.tagsets);
	}
	,settingOfTag:function(tagname) {
		for (var i=0;i<this.tagsets.length;i++){
			var tagset=this.tagsets[i].tagset;
			for (var j=0;j<tagset.length;j++) {
				var tagsetting=tagset[j];
				if (tagsetting.name==tagname) return tagsetting;
			}
		};
		return null;
	}
	,tagsetOfTag:function(tag) {
		for (var i=0;i<this.tagsets.length;i++){
			var tagset=this.tagsets[i].tagset;
			for (var j=0;j<tagset.length;j++) {
				var tagdef=tagset[j];
				if (tagdef.name==tag) return this.tagsets[i].name;
			}
		};
		return null;
	}
	,typeOfTag:function(tag) {
		for (var i=0;i<this.tagsets.length;i++){
			var tagset=this.tagsets[i].tagset;
			for (var j=0;j<tagset.length;j++) {
				var tagdef=tagset[j];
				if (tagdef.name==tag) return tagdef.type;
			}
		};
		return null;		
	}
});
module.exports=store_tagsets;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./tagsets":"C:\\ksana2015\\visualmarkup\\src\\tagsets.js","./tagtypedef":"C:\\ksana2015\\visualmarkup\\src\\tagtypedef.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\store_text.js":[function(require,module,exports){

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

},{"./actions_text":"C:\\ksana2015\\visualmarkup\\src\\actions_text.js","ksana-database":"C:\\ksana2015\\node_modules\\ksana-database\\index.js","ksana-search":"C:\\ksana2015\\node_modules\\ksana-search\\index.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\store_trait.js":[function(require,module,exports){
var Reflux=require("reflux");
var actions=require("./actions_markup");
var actions_selection=require("./actions_selection");
var store=require("./store_markup");
var store_trait=Reflux.createStore({
	listenables: [actions]
	,onDeleteEditingMarkup:function(opts){
		opts=opts||{};
		if (!this.markup) return;
		actions.deleteMarkup(this.viewid,this.markup);
		if (opts.setSelection) {
			actions_selection.setSelections(this.markupselections);
		}
		this.onCancelEdit();
	}
	,onEditMarkup:function(viewid,markup,nmarkup) {
		var group={},master=null;
		if (markup) {
			if (markup[2].id) {
				master=store.getMasterMarkup(markup,viewid);			
				var group=store.findShadow(master[0]);
				if (!group[master[1]]) group[master[1]]=[];
				group[master[1]].push(master[0]);
			} else { //single range
				group[viewid]=[markup];
			}
			if (master && master[0]!=markup) markup=master[0];
		}
		this.viewid=viewid;
		this.nmarkup=nmarkup; //this where user click
		this.markup=markup;
		//this.viewid+this.nmarkup point to current editing markup
		//this.markup always point to master markup, where the payload is editable
		this.markupselections={};
		this.group=group;

		for (var i in group) {
			if (!this.markupselections[i]) this.markupselections[i]=[];
			var ranges=group[i].map(function(m){return [m[0],m[1]];});
			this.markupselections[i]=this.markupselections[i].concat(ranges);
		}

		this.onRestore();
	}
	,onRestore:function() {
		this.trigger(this.viewid,this.markup,this.nmarkup,this.group,this.markupselections);
	}
	,onCancelEdit:function(){
		actions_selection.clearHighlights();
		this.viewid=null;
		this.nmarkup=-1;
		this.markup=null;
		this.markupselections=null;
		this.trigger();	
	}
});

module.exports=store_trait;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./actions_selection":"C:\\ksana2015\\visualmarkup\\src\\actions_selection.js","./store_markup":"C:\\ksana2015\\visualmarkup\\src\\store_markup.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\store_userinfo.js":[function(require,module,exports){
var Reflux=require("reflux");
var actions=require("./actions_system");
var store_userinfo=Reflux.createStore({
	listenables: [actions],
	init:function() {
		try {
			this.user=JSON.parse(localStorage.getItem("user"));
			if (!this.user || typeof this.user!="object") ;
		} catch (e) {
			this.user=null;
		} finally {
			if (!this.user) this.user={name:"yap",email:"yapcheahshen@gmail.com"}
		}
		var that=this;
		setTimeout(function(){
			that.trigger(that.user);	
		},500);
		
	},
	onSetUserName:function(username) {
		this.user.name=username;
		localStorage.setItem("user",JSON.stringify(this.user));
		this.trigger(this.user);
	},
	getUserName:function() {
		return this.user.name;
	}
});

module.exports=store_userinfo;
},{"./actions_system":"C:\\ksana2015\\visualmarkup\\src\\actions_system.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\sutratext.js":[function(require,module,exports){
var Reflux=require("reflux");
var actions=require("./actions_text");
var actions_markup=require("./actions_markup");
var domhelper=require("./domhelper");
var Markable=require("./markable");
var store_ds=require("./store_text").sutra;
var TextNav=require("./textnav");
var viewid="sutra";
var Refertext=React.createClass({displayName: "Refertext",
	mixins:[Reflux.listenTo(store_ds,"sutratext")]
	,getInitialState:function() {
		return {text:[],db:null};
	}
	,spanClicked:function(e) {
		var tofind=domhelper.getTextUntilPunc(e.target);
		var vpos=parseInt(e.target.dataset.n); 
		actions.searchDictionary(tofind,vpos,viewid);
		actions_markup.editMarkupAtPos(viewid,vpos);
	}
	,sutratext:function(text,db){
		if (text) {
			this.setState({text:text});
			actions.syncKepan();
		}
		if (this.state.db!=db) this.setState({db:db});
	}
	,render:function() {
		return React.createElement("div", {className: "panel panel-success"}, 
				React.createElement("div", {className: "panel-heading clearfix"}, 
				React.createElement(TextNav, {store: store_ds, actions: actions, viewid: viewid, title: "經文"})), 
				React.createElement("div", {onClick: this.spanClicked, className: "sutratext panel-body"}, 
					React.createElement(Markable, {text: this.state.text, viewid: viewid})
		        )
		     )
	}
});

module.exports=Refertext;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./actions_text":"C:\\ksana2015\\visualmarkup\\src\\actions_text.js","./domhelper":"C:\\ksana2015\\visualmarkup\\src\\domhelper.js","./markable":"C:\\ksana2015\\visualmarkup\\src\\markable.js","./store_text":"C:\\ksana2015\\visualmarkup\\src\\store_text.js","./textnav":"C:\\ksana2015\\visualmarkup\\src\\textnav.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\tagsets.js":[function(require,module,exports){
/*markup defination file*/
var tagset_partofspeech=[
  {label:"代名詞", name:"pronoun", type:"simple", desc:"：你、我、他", color:"#7F3"} 
  ,{label:"名詞", name:"noun", type:"simple", desc:"：桌、椅",color:"#F73"} 
  ,{label:"動詞", name:"verb", type:"simple", desc:"：行、住、坐、臥",color:"#993"} 
  ,{label:"副詞", name:"adverb",type:"simple", desc:"：快、慢",color:"#2FF"}  
  ,{label:"形容詞", name:"adjective",type:"simple", desc:"：冷、熱",color:"#66F"}  
  ,{label:"助詞", name:"particle",type:"simple", desc:"：很",color:"#0FF"}
  ,{label:"連接詞", name:"conjunction", type:"simple", desc:"：及",color:"#F0F"} 
  ,{label:"介詞", name:"preposition", type:"simple" , desc:"：向、於、對",color:"#3F3"} 
  ,{label:"數詞", name:"numeral",type:"simple", desc:"：百、千、萬",color:"#3F7"}  
  ,{label:"量詞", name:"classifier",type:"simple", desc:"：匹、頭",color:"#F07"}  

];
var tagset_punctuation=[
   {label:"句號", name:"fullstop", type:"punc",desc:"："} 
  ,{label:"逗號", name:"comma", type:"punc",desc:"："} 
  ,{label:"頓號", name:"douten", type:"punc",desc:"："} 
  ,{label:"分號", name:"semicolon",type:"punc",desc:"："}  
  ,{label:"冒號", name:"colon",type:"punc",desc:"："}  
  ,{label:"引號", name:"quotationmark",type:"punc2",desc:"：「」",desc:"：『』"}    
  ,{label:"雙引號", name:"quotationmark2",type:"punc2",desc:"：『』"}
  ,{label:"夾注號", name:"warichu", type:"punc2",desc:"：甲式：（　）"} 
  ,{label:"夾注號2", name:"warichu2", type:"punc2",desc:"：乙式：──　──"}   
  ,{label:"問號", name:"questionmark", type:"punc",desc:"：？"  } 
  ,{label:"驚嘆號", name:"exclamationmark",type:"punc",desc:"：！"}  
  ,{label:"破折號", name:"emdash",type:"punc",desc:"：──"}  
  ,{label:"刪節號", name:"ellipsis",type:"punc",desc:"：……"}  
  ,{label:"書名號", name:"booknamemark",type:"punc2",desc:"金剛經"}  
  ,{label:"專名號", name:"propernamemark",type:"punc2",desc:"：專有名詞"}  
  ,{label:"間隔號", name:"interpunct",type:"punc",desc:"：．"}  
  ,{label:"連接號", name:"dash",type:"punc",desc:"：甲式"}
  ,{label:"連接號2", name:"dash",type:"punc",desc:"：乙式"}

];
var tagset_defination=[
  {label:"釋義", name:"defination", type:"internal",labels:["字詞","釋義"],desc:"：通序|諸經通有"  } 
  ,{label:"同名異譯", name:"translation", type:"internal",labels:["字詞","譯名"],desc:"：耶斯那|耶舍陀"} 

];

var tagset_wordrelation=[
   {label:"同義", name:"synonym", type: "internal"  ,labels:["詞彙","同義詞"],desc:"：三衣|加沙", color:"#7F3" } 
  ,{label:"反義詞", name:"antonym", type: "internal"  ,labels:["詞彙","反義詞"],desc:"：如是|不如是" ,color:"#F73"} 
  ,{label:"能所", name:"sign", type: "internal"  ,labels:["能指","所指"],desc:"：五藏|經、律、論，及雜集藏、禁咒藏",color:"#993" } 
  ,{label:"名相", name:"nameappearance", type: "internal" ,labels:["名","相"],desc:"：如|不異",color:"#703"} 
  ,{label:"因果", name:"causeeffect", type: "internal" ,labels:["因","果"],desc:"：降伏我慢故，不貪口味故。|乞食" ,color:"#66F" } 
  ,{label:"題名互文", name:"bookquote", type: "internal" ,labels:["題名","引文"] ,desc:"：華嚴經|信為道元功德母，長養一切諸善法。",color:"#F07"} 
  ,{label:"人名互文", name:"personquote", type: "internal" ,desc:"：",labels:["人名","引文"] ,desc:"：台宗智者大師|說法華經題,說明體宗相用",color:"#F0F" } 
  ,{label:"跨文本互文", name:"quote", type: "intertext" ,desc:"：隋•嘉祥吉藏《金剛般若疏》|「一切經初當安如是我聞。」遺言令安此六事，故名遺教序。" ,color:"#307"} 
];
var tagset_wordcontext=[
   {label:"人", name:"person", type:"simple",desc:"：大迦葉"} 
  ,{label:"事", name:"matter", type:"simple",desc:"：大乘結集"} 
  ,{label:"時", name:"time",type:"simple",desc:"：佛滅七日"}  
  ,{label:"地", name:"place",type:"simple",desc:"：娑羅雙樹間"}  
  ,{label:"物", name:"thing",type:"simple",desc:"：三藏"}    
  ,{label:"狀態", name:"state",type:"simple",desc:"：滅"}    
  ,{label:"顏色", name:"color",type:"simple",desc:"：紫"}    
  ,{label:"動作", name:"action",type:"simple",desc:"：著衣"}    

  ,{label:"其他", name:"other",type:"simple",desc:"：如此之色"}    

  ,{label:"食", name:"eating", type:"simple" ,desc:"：吃飯"} 
  ,{label:"衣", name:"clothing", type:"simple" ,desc:"：三衣" } 
  ,{label:"住", name:"housing",type:"simple",desc:"：住舍衛城"}  
  ,{label:"行", name:"traffic",type:"simple",desc:"：旅行"}  
  ,{label:"育", name:"education",type:"simple",desc:"：世尊說法"}
  ,{label:"樂", name:"entertainment",type:"simple",desc:"歌舞"}
 ];
var tagset_authorexpress=[ 
   {label:"重點", name:"important", type: "simple",desc:"：乞食。降伏我慢故，不貪口味故"}
  ,{label:"說明", name:"clarify", type: "simple",desc:"：出家本為度眾生。"}
  ,{label:"提醒", name:"remind", type: "simple",desc:"：珍重"}
  ,{label:"補充", name:"complement", type: "simple",desc:"：這家布施甜，他家或布施鹹，故名加沙味。"}
  ,{label:"推論", name:"inference", type: "simple",desc:"：推之，若對於一切境緣皆能如是領會，則受用無窮矣。"}
  ,{label:"提問", name:"question", type: "simple",desc:"：云何六緣？"}
  ,{label:"回答", name:"answer", type: "simple",desc:"：一者，如是，信成就也。"}
  ,{label:"校勘", name:"revise", type: "simple",desc:"：校也，舊版無。據原稿補。"}
  ,{label:"語譜", name:"paradigm", type: "simple",desc:"：世尊|佛|如來"}
  ,{label:"情感", name:"emotion", type: "simple",desc:"：痛心"}
];

var tagset_readerexpress=[
   {label:"重點",name:"important2",type:"usernote",desc:"：世尊|佛說般若波羅蜜，則非般若波羅蜜。"} 
  ,{label:"摘要",name:"abstract2",type:"usernote",desc:"：三衣：安陀會、鬱多羅僧、僧伽黎"}
  ,{label:"提問",name:"question2",type:"usernote",desc:"：為什麼五條、七條、九條有下品、中品及上品之分？"} 
  ,{label:"解釋", name:"explain2", type:"usernote",desc:"：六緣指：信、聞、時、主、處、眾"} 
  ,{label:"感受", name:"feel2", type:"usernote",desc:"：現在能見聞到佛典，當懷恭敬和感恩心"} 
];

var tagsets=[
   {label:"詞性",name:"partofspeech", tagset:tagset_partofspeech}
  ,{label:"標逗",name:"punctuation",  tagset:tagset_punctuation}
  ,{label:"釋義",name:"defination",  tagset:tagset_defination}
  ,{label:"字詞關係",name:"wordrelation", tagset:tagset_wordrelation}
  ,{label:"字詞情境",name:"wordcontext",  tagset:tagset_wordcontext}
  ,{label:"作者表達",name:"authorexpress",tagset:tagset_authorexpress}
  ,{label:"讀者表達",name:"readerexpress",tagset:tagset_readerexpress}  
]


module.exports=tagsets;

},{}],"C:\\ksana2015\\visualmarkup\\src\\tagsettab.js":[function(require,module,exports){
var Choices=require("ksana2015-components").choices;
var store=require("./store_tagsets");
var store_tagset=require("./store_tagset");
var actions=require("./actions_markup");
var Reflux=require("reflux");

var viewID= "markuppanel";
var TagsetTab=React.createClass({displayName: "TagsetTab",
	mixins:[Reflux.listenTo(store,"onTagSets"), Reflux.listenTo(store_tagset,"onTagsetStatus")],
	propTypes:{
	} 
	,onTagSets:function(tagsets) {
		this.setState({tagsets:tagsets});
		this.setVisibility(this.state.selected,true);
	}
	,onTagsetStatus:function(activetagset) {//enabling buttons
		this.setState({updatepos:false});
	}
	,getInitialState:function(){
		var selected=parseInt(localStorage.getItem("selected.tab"))||0;
		return {selected:selected,tagsets:[],displayonoff:false,updatepos:true};
	}
	,onSelect:function(n,perv) {
		this.setState({selected:n,updatepos:false});
		localStorage.setItem("selected.tab",n);
		if (n!=this.state.selected) {
			this.setVisibility(n);
			this.setState({updatepos:true});
		}
	}
	,updatePosition:function(children) {
		var out={};
		for (var i=0;i<children.length;i++) {
			var spans=children[i].getElementsByTagName("span");
			for (var j=0;j<spans.length;j++) {
				var rect=spans[j].getBoundingClientRect();
				var vpos=spans[j].dataset.vpos;
				if (vpos){
					out[parseInt(vpos)]=[rect.left,rect.top,rect.right,rect.bottom];	
				}
			}
		}
		actions.tokenPositionUpdated( out,viewID);
	}
	,componentDidUpdate:function() {
		if (this.state.updatepos) this.updatePosition(this.refs.markupchoice.getDOMNode().children);
	}
	,componentDidMount:function() {
		actions.loadTagsets();
	}
	,onSelectTag:function(n,prev){
		actions.doTag(n);
	}
	,onCheckTag:function(n,checked){
		var tagset=this.getTagset(this.state.selected);
		tagset[n].checked=checked;
		this.setVisibility(this.state.selected,true);
		this.forceUpdate();
	}
	,getTagsetName:function() {
		var tagset=this.state.tagsets[this.state.selected||0];
		if (tagset) return tagset.name;
	}
	,setVisibility:function(selected,norefresh) {
		var tagset=this.getTagset(selected);
		actions.setActiveTagset(this.state.tagsets[selected].name,tagset);

		var visibletags=[];
		tagset.map(function(t){if (t.checked) return visibletags.push(t.name)});
		actions.setVisibleTags(visibletags,norefresh);
	}
	,getTagset:function(n) {
		var selectedset=this.state.tagsets[n];
		return selectedset?selectedset.tagset:[];
	}
	,setDisplay:function(e) {
		this.setState({displayonoff:e.target.checked,updatepos:true});
	}
	,convertToMarkup:function(arr) {
		return arr.map(function(item){
			var payload={tag:item[2]};
			if (item[3]) payload.shadow=true;
			return [item[0],item[1],payload];
		});
	}
	,vposInItem:function(arr) {
		var markups=this.convertToMarkup(arr);
		actions.setVirtualMarkup(markups,viewID);
	}
	,render:function() {
		return React.createElement("div", {className: "tagsetpanel"}, 
			React.createElement(Choices, {data: this.state.tagsets, selected: this.state.selected, 
			          onSelect: this.onSelect, type: "radio", labelfor: true}), 
			React.createElement("label", {className: "pull-right"}, 
				React.createElement("input", {type: "checkbox", checked: this.state.displayonoff, onChange: this.setDisplay}), "display"
			), 
			React.createElement(Choices, {ref: "markupchoice", data: this.getTagset(this.state.selected), 
				onSelect: this.onSelectTag, onCheck: this.onCheckTag, type: this.state.displayonoff?"checkbox":"button", 
				prefix: this.getTagsetName(), 
				hotkey: true, checked: true, labelfor: true, linebreak: true, autovpos: true, vposInItem: this.vposInItem})
		)
	}
});

module.exports=TagsetTab;
},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./store_tagset":"C:\\ksana2015\\visualmarkup\\src\\store_tagset.js","./store_tagsets":"C:\\ksana2015\\visualmarkup\\src\\store_tagsets.js","ksana2015-components":"C:\\ksana2015\\node_modules\\ksana2015-components\\index.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\tagtypedef.js":[function(require,module,exports){
var store_userinfo=require("./store_userinfo");

var simple={
	isValidSelection:function(grouped,viewselections) {
		return (grouped.length>0);
	}
	,initPayload:function(tag,first,guid,sel,nsel,sels) {
		return {tag:tag,source:store_userinfo.getUserName()};
	}
}
var internal={
	isValidSelection:function(grouped,viewselections) {
		return (grouped.length==1 && grouped[0]>1);
	}
	,initPayload:function(tag,first,guid,sel,nsel,sels) {
		if (first) {
			return {id:guid,tag:tag,note:"",source:store_userinfo.getUserName()};
		} else {
			return {id:guid,tag:tag,shadow:true};
		}		
	}
	,group:true
}
var intertext={ //only allow one to many
	isValidSelection:function(grouped,viewselections) {
		return (grouped.length==2 && (grouped[0]==1 || grouped[1]==1)) ;
	}
	,initPayload:function(tag,first,guid,sel,nsel,sels) {
		if (first) {
			return {id:guid,tag:tag,note:"",source:store_userinfo.getUserName()};
		} else {
			return {id:guid,tag:tag,shadow:true};
		}		
	}
	,group:true
}
var punc={
	isValidSelection:function(grouped,viewselections) {
		return (grouped.length==0);
		//2 viewid has selection, who is the leading?
	}
	,initPayload:function(tag,guid,sel,nsel,sels) {
		return {tag:tag,source:store_userinfo.getUserName(),note:""};
	}
}

var usernote={
	isValidSelection:function(grouped,viewselections) {
		return true;
		//2 viewid has selection, who is the leading?
	}
	,initPayload:function(tag,guid,sel,nsel,sels) {
		return {tag:tag,source:store_userinfo.getUserName(),note:""};
	}
}
var defs={
	"simple":simple
	,"internal":internal
	,"intertext":intertext
	,"usernote":usernote
	,"punc":punc
	,"punc2":simple
}

module.exports=defs;
},{"./store_userinfo":"C:\\ksana2015\\visualmarkup\\src\\store_userinfo.js"}],"C:\\ksana2015\\visualmarkup\\src\\testmarkups.js":[function(require,module,exports){
var markups_sutra={
	_id:"1_authorexpress",
	markups:[
		[236,3,{tag:"important",owner:"yap",note:"十大弟子"}]
]}
var markups_lecture={
	_id:"1_partofspeech",
	markups:[
		[39716,3,{tag:"adjective",source:"moedict",explain:"深刻的意義"}]
	]	
}
module.exports=[markups_sutra,markups_lecture]; 
},{}],"C:\\ksana2015\\visualmarkup\\src\\textnav.js":[function(require,module,exports){
var Reflux=require("reflux");
var store_markup=require("./store_markup");
var stores=require("./store_text");
var TextNav=React.createClass({displayName: "TextNav",
	mixins:[Reflux.ListenerMixin]
	,propTypes:{
		viewid:React.PropTypes.string.isRequired
		,title:React.PropTypes.string.isRequired
		,store:React.PropTypes.object.isRequired
		,actions:React.PropTypes.object.isRequired
	}
	,componentDidMount:function() {
		this.listenTo(this.props.store,this.onData);
	}
	,checkSynable:function() {
		var that=this;
		setTimeout(function(){
			var kepanid=that.props.store.getKepanId();
			var others=store_markup.otherView(that.props.viewid);
			var syncable=false;
			for (var i=0;i<others.length;i++) {
				if (kepanid!=stores[others[i]].getKepanId()) {
					syncable=true;
					break;
				}
			}

			that.setState({syncable:syncable});
		},500);
	}
	,onData:function(text,seg,db,opts) {
		var opts=opts||{};
		this.checkSynable();
		this.setState({npara:seg||0});
		if (this.state.sync && !opts.nosync) this.syncpara();
	}
	,getInitialState:function() {
		return {npara:1,sync:true,syncable:false};
	}
	,clearSystemSelection:function() {
		window.getSelection().empty();
	}
	,nextpara:function() {
		this.props.actions.nextPara(this.props.viewid);
		this.clearSystemSelection();
	}
	,prevpara:function() {
		this.props.actions.prevPara(this.props.viewid);
		this.clearSystemSelection();
	}
	,goPara:function(e) {
		var n=parseInt(this.state.npara)||1;
		if (e.key=="Enter")	{
			this.props.actions.getTextBySeg(this.props.viewid,n);
			this.clearSystemSelection();
		}
	}
	,changed:function(e) {
		//TODO , vpos can be prefixed with @, convert to npara and addHighlight
		this.setState({npara:e.target.value});
	}
	,toggleSync:function(e) {
		this.setState({sync:e.target.checked});
	}
	,syncpara:function() {
		//if (!this.state.sync) return;
		var kepanid=this.props.store.getKepanId();
		var others=store_markup.otherView(this.props.viewid);
		for (var i=0;i<others.length;i++) {
			this.props.actions.getTextByKepanId(others[i],kepanid);
		}
		this.setState({syncable:false});
	}
	,render:function() {
		return React.createElement("div", null, 
				React.createElement("div", {className: "col-md-3"}, 
					React.createElement("input", {checked: this.state.sync, className: "largecheckbox", type: "checkbox", onChange: this.toggleSync}), 
					React.createElement("button", {onClick: this.syncpara, className: "btn btn-success"+(this.state.syncable?"":" disabled")}, "Sync")
				), 
				React.createElement("div", {className: "col-md-5"}, React.createElement("div", {className: "text-center textpanel-title"}, this.props.title)), 

				React.createElement("div", {className: "col-md-4"}, 
					React.createElement("div", {className: "input-group"}, 
					React.createElement("span", {className: "input-group-btn"}, 
						React.createElement("button", {onClick: this.prevpara, className: "btn btn-success"}, "Previous")
					), 
					React.createElement("input", {size: "2", className: "text form-control larger-input", 
				   		onChange: this.changed, onKeyPress: this.goPara, value: this.state.npara}), 
					React.createElement("span", {className: "input-group-btn"}, 
						React.createElement("button", {onClick: this.nextpara, className: "btn btn-success"}, "Next")
					)
					)
				)
		    )
	}
});

module.exports=TextNav;
},{"./store_markup":"C:\\ksana2015\\visualmarkup\\src\\store_markup.js","./store_text":"C:\\ksana2015\\visualmarkup\\src\\store_text.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\textselection.js":[function(require,module,exports){
var getRange=function() {
  var sel = getSelection();
  if (!sel.rangeCount) return;
  var range = sel.getRangeAt(0);
  var s=range.startContainer.parentElement;
  var e=range.endContainer.parentElement;
  if (s.nodeName!='SPAN' || e.nodeName!='SPAN') return;
  var start=parseInt(s.getAttribute('data-n'),10);
  var end=parseInt(e.getAttribute('data-n'),10);
  return [start,end];
}
var getselection=function() {
  var R=getRange();
  if (!R) return;
  var start=R[0];
  var end=R[1];
  var length=0;
  var sel = getSelection();
  if (!sel.rangeCount) return;
  var range = sel.getRangeAt(0);    
  var s=range.startContainer.parentElement;
  var e=range.endContainer.parentElement;
  var n=e.nextSibling,nextstart=0;
  if (!n) return null;           
  if (n.nodeName=="SPAN") {
    nextstart=parseInt(n.getAttribute('data-n'),10);  
  }
  var selectionlength=end-start+sel.extentOffset-sel.anchorOffset;
  if (start+selectionlength==nextstart) {//select till end of last token
    length=selectionlength;
  } else {
    if (selectionlength)   length=nextstart-start; //https://github.com/ksanaforge/workshop/issues/50
    else length=end-start;
    //if (range.endOffset>range.startOffset &&!length) length=1;
    if (length<0) {
        var temp=end; end=start; start=end;
    }
  }

  //sel.empty();
 //this.refs.surface.getDOMNode().focus();
  return {start:start,len:length};
}

module.exports=getselection;
},{}],"C:\\ksana2015\\visualmarkup\\src\\trait.js":[function(require,module,exports){
var Reflux=require("reflux");
var store=require("./store_trait");
var store_tagsets=require("./store_tagsets");
var store_selection=require("./store_selection");
var actions=require("./actions_markup");
var actions_selection=require("./actions_selection");
var MarkupGroup=require("./markupgroup");
var trait_templates={
	"simple":require("./trait_simple")
	,"intertext":require("./trait_intertext")
	,"internal":require("./trait_internal")
	,"punc":require("./trait_punc")
}
var MarkupSearch=require("./markupsearch");
var SelectionList=require("./selectionlist");

var Trait=React.createClass({displayName: "Trait",
	mixins:[Reflux.listenTo(store,"onData"),Reflux.listenTo(store_selection,"onSelection")],
	getInitialState:function(){
		return {template:null,modified:false,viewselections:{},markupselections:{}};
	}
	,commitChange:function() {
		if (!this.state.modified || !this.state.markup) return;
		var markup=this.state.markup;
		markup[2]=this.refs.template.getValue();
		actions.saveMarkup(this.state.viewid,this.state.nmarkup,markup);
	}
	,componentWillUnmount:function() {
		this.commitChange();
	}
	,onData:function(viewid,markup,nmarkup,group,markupselections){
		this.commitChange();

		if (!markup) {
			this.setState({template:null,markup:null,modified:false,group:group});
			actions_selection.clearHighlights();
			return;
		}
		var type=store_tagsets.typeOfTag(markup[2].tag);
		if (!type) return;
		var template=trait_templates[type];
		actions_selection.setHighlights(markupselections);
		this.setState({markupselections:markupselections,template:template,markup:markup,viewid:viewid,nmarkup:nmarkup,modified:false});
	}
	,onChanged:function(){
		this.setState({modified:true});
	}
	,onSelection:function(viewselections){
		this.setState({viewselections:viewselections});
	}
	
	,renderTemplate:function() {
		if (this.state.template) {
			var ele=React.createFactory(this.state.template);
			var template=ele({ref:"template",onChanged:this.onChanged,trait:this.state.markup[2],revert:this.revert});
			this.revert=false;
			return template;
		}
	}
	,nextmarkup:function() {
		//todo , skip shahow, next same tag
		actions.nextMarkup({sametag:true});
	}
	,prevmarkup:function() {
		actions.prevMarkup({sametag:true});
	}
	,renderControls:function(){
		if (this.state.template) {
			var disabled=!this.state.modified?" disabled":"";
			var disabled_delete=!this.state.modified?"":" disabled";
			return React.createElement("div", null, 
					React.createElement("div", {className: "pull-right"}, 
					React.createElement("button", {onClick: this.prevmarkup, title: "Prev Markup", className: "btn btn-info"}, "Prev"), 
					React.createElement("button", {onClick: this.nextmarkup, title: "Next Markup", className: "btn btn-info"}, "Next")
					), 
					React.createElement("div", {className: ""}, 
					React.createElement("button", {onClick: this.revertmarkup, title: "Discard changes", className: "btn btn-warning"+disabled}, "Revert"), 
					React.createElement("button", {onClick: this.deletemarkup, title: "Delete this markup", className: "btn btn-danger"+disabled_delete}, "Delete")
					), 


					React.createElement(MarkupSearch, null), 
					React.createElement(SelectionList, {viewselections: this.state.markupselections})
				   )
		}
	}
	,deletemarkup:function() {
		actions.deleteMarkup(this.state.viewid,this.state.markup);
		actions_selection.setSelections(this.state.markupselections);
	}
	,revertmarkup:function() {
		this.revert=true;
		this.setState({modified:false});
	}
	,renderSelection:function() {
		if (!this.state.template) {
			return React.createElement(SelectionList, {showtext: true, viewselections: this.state.viewselections})
		}
	}
	,render:function() {
		return React.createElement("div", {className: "traitpanel"}, 
					this.renderTemplate(), 
					this.renderControls(), 
					React.createElement("br", null), 
					this.renderSelection()
			)
	}
});
module.exports=Trait;

},{"./actions_markup":"C:\\ksana2015\\visualmarkup\\src\\actions_markup.js","./actions_selection":"C:\\ksana2015\\visualmarkup\\src\\actions_selection.js","./markupgroup":"C:\\ksana2015\\visualmarkup\\src\\markupgroup.js","./markupsearch":"C:\\ksana2015\\visualmarkup\\src\\markupsearch.js","./selectionlist":"C:\\ksana2015\\visualmarkup\\src\\selectionlist.js","./store_selection":"C:\\ksana2015\\visualmarkup\\src\\store_selection.js","./store_tagsets":"C:\\ksana2015\\visualmarkup\\src\\store_tagsets.js","./store_trait":"C:\\ksana2015\\visualmarkup\\src\\store_trait.js","./trait_internal":"C:\\ksana2015\\visualmarkup\\src\\trait_internal.js","./trait_intertext":"C:\\ksana2015\\visualmarkup\\src\\trait_intertext.js","./trait_punc":"C:\\ksana2015\\visualmarkup\\src\\trait_punc.js","./trait_simple":"C:\\ksana2015\\visualmarkup\\src\\trait_simple.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\trait_internal.js":[function(require,module,exports){
var Trait_authorexpress=React.createClass({displayName: "Trait_authorexpress",
	mixins:[require("./trait_mixin")]
	,render:function() {
		return React.createElement("div", null, 
			React.createElement("div", {className: "form-group"}, 
				React.createElement("div", {className: "input-group"}, 
	  				React.createElement("span", {className: "input-group-addon"}, "注記"), 
	  					React.createElement("input", {ref: "note", onInput: this.change, type: "text", className: "form-control", placeholder: "解釋"})
				)
			)
			)
	}
});

module.exports=Trait_authorexpress;
},{"./trait_mixin":"C:\\ksana2015\\visualmarkup\\src\\trait_mixin.js"}],"C:\\ksana2015\\visualmarkup\\src\\trait_intertext.js":[function(require,module,exports){
var Trait_readerexpress=React.createClass({displayName: "Trait_readerexpress",
	mixins:[require("./trait_mixin")]
	,render:function() {
		return React.createElement("div", null, 
			React.createElement("div", {className: "form-group"}, 
				React.createElement("div", {className: "input-group"}, 
	  				React.createElement("span", {className: "input-group-addon"}, "注記"), 
	  					React.createElement("input", {ref: "note", onInput: this.change, type: "text", className: "form-control", placeholder: "解釋"})
				), 
				React.createElement("div", {className: "input-group"}, 
	  				React.createElement("span", {className: "input-group-addon"}, "創作者"), 
	  				React.createElement("input", {ref: "owner", type: "text", readOnly: true, className: "form-control"})
				)
			)
			)
	}
});

module.exports=Trait_readerexpress;
},{"./trait_mixin":"C:\\ksana2015\\visualmarkup\\src\\trait_mixin.js"}],"C:\\ksana2015\\visualmarkup\\src\\trait_mixin.js":[function(require,module,exports){
var Reflux=require("reflux");
var store=require("./store_userinfo");

var trait_mixin={
	onUser:function(userinfo) {
		console.log("trait user name",userinfo.name)
		this.setState({username:userinfo.name});
	}
	,propsType:{
		trait:React.PropTypes.object.isRequired
		,onChanged:React.PropTypes.func
	}
	,getInitialState:function() {
		return ({username:store.getUserName() })
	}
	,componentWillReceiveProps:function(nextprops) {
		if (nextprops.trait!=this.props.trait || nextprops.revert) this.copyValue(nextprops);
	}
	,componentDidMount:function() {
		this.unsubscribe=store.listen(this.onUser);
		this.copyValue(this.props);
	}
	,componentWillUnmount:function(){
		this.unsubscribe();
	}
	,copyValue:function(props) {
		var trait=props.trait;
		for (var i in this.refs) {
			this.refs[i].getDOMNode().value=trait[i] ||"";
		}
	}
	,getValue:function() {
		var out={};
		var trait=this.props.trait;
		for (var i in this.refs) {
			out[i]=this.refs[i].getDOMNode().value;
		}
		for (var i in trait) { //copy old value
			if (!out[i]) out[i]=trait[i];
		}
		return out;
	}
	,change:function(e){
		if (this.props.onChanged) this.props.onChanged(e.target.value);
		if (this.onChanged) this.onChanged(e.target.value);
	}
}
module.exports=trait_mixin;
},{"./store_userinfo":"C:\\ksana2015\\visualmarkup\\src\\store_userinfo.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\trait_punc.js":[function(require,module,exports){
var Trait_punc=React.createClass({displayName: "Trait_punc",
	mixins:[require("./trait_mixin")]
	,render:function() {
		return React.createElement("div", null, 
			React.createElement("div", {className: "form-group"}, 
				React.createElement("div", {className: "input-group"}, 
	  				React.createElement("span", {className: "input-group-addon"}, "注記"), 
	  					React.createElement("input", {ref: "note", onInput: this.change, type: "text", className: "form-control", placeholder: "解釋"})
				), 
				React.createElement("div", {className: "input-group"}, 
	  				React.createElement("span", {className: "input-group-addon"}, "創作者"), 
	  				React.createElement("input", {ref: "owner", type: "text", readOnly: true, className: "form-control"})
				)
			)
			)
	}
});

module.exports=Trait_punc;
},{"./trait_mixin":"C:\\ksana2015\\visualmarkup\\src\\trait_mixin.js"}],"C:\\ksana2015\\visualmarkup\\src\\trait_simple.js":[function(require,module,exports){
var Trait_partofspeech=React.createClass({displayName: "Trait_partofspeech",
	mixins:[require("./trait_mixin")]

	,onChanged:function() {
		this.refs.source.getDOMNode().value=this.state.username;
	}
	,render:function() {
		return React.createElement("div", null, 
			React.createElement("div", {className: "form-group"}, 
				React.createElement("div", {className: "input-group"}, 
	  				React.createElement("span", {className: "input-group-addon"}, "標記"), 
	  				React.createElement("input", {ref: "tag", type: "text", readOnly: true, className: "form-control"})
				), 

				React.createElement("div", {className: "input-group"}, 
	  				React.createElement("span", {className: "input-group-addon"}, "來源"), 
	  				React.createElement("input", {ref: "source", type: "text", readOnly: true, className: "form-control"})
				), 

				React.createElement("div", {className: "input-group"}, 
	  				React.createElement("span", {className: "input-group-addon"}, "解釋"), 
	  					React.createElement("textarea", {ref: "explain", onInput: this.change, cols: "10", className: "form-control", placeholder: "解釋"})
				)
			)
			)
	}
});
/*
  dropdown user created defination
*/ 
module.exports=Trait_partofspeech;
},{"./trait_mixin":"C:\\ksana2015\\visualmarkup\\src\\trait_mixin.js"}]},{},["C:\\ksana2015\\visualmarkup\\index.js"])


//# sourceMappingURL=bundle.js.map