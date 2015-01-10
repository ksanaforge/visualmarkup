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

var getfileseg=function(absoluteseg) {
	var fileoffsets=this.get(["fileoffsets"]);
	var segoffsets=this.get(["segoffsets"]);
	var segoffset=segOffsets[absoluteseg];
	var file=bsearch(fileOffsets,segoffset,true)-1;

	var fileStart=fileoffsets[file];
	var start=bsearch(segoffsets,fileStart,true);	

	var seg=absoluteseg-start-1;
	return {file:file,seg:seg};
}
//return array of object of nfile nseg given segname
var findSeg=function(segname) {
	var segnames=this.get("segnames");
	var out=[];
	for (var i=0;i<segnames.length;i++) {
		if (segnames[i]==segname) {
			var fileseg=getfileseg.apply(this,[i]);
			out.push({file:fileseg.file,seg:fileseg.seg,absseg:i});
		}
	}
	return out;
}
var getFileSegOffsets=function(i) {
	var segoffsets=this.get("segoffsets");
	var range=getFileRange.apply(this,[i]);
	return segoffsets.slice(range.start,range.end+1);
}

var getFileSegNames=function(i) {
	var range=getFileRange.apply(this,[i]);
	var segnames=this.get("segnames");
	return segnames.slice(range.start,range.end+1);
}
var localengine_get=function(path,opts,cb) {
	var engine=this;
	if (typeof opts=="function") {
		cb=opts;
		opts={recursive:false};
	}
	if (!path) {
		if (cb) cb(null);
		return null;
	}

	if (typeof cb!="function") {
		return engine.kdb.get(path,opts);
	}

	if (typeof path=="string") {
		return engine.kdb.get([path],opts,cb);
	} else if (typeof path[0] =="string") {
		return engine.kdb.get(path,opts,cb);
	} else if (typeof path[0] =="object") {
		return _gets.apply(engine,[path,opts,cb]);
	} else {
		engine.kdb.get([],opts,function(data){
			cb(data[0]);//return top level keys
		});
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

module.exports={open:openLocal,setPath:setPath, close:closeLocal, enumKdb:enumKdb};
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
						L.sz.map(function(sz){
							o[o.length]=strsep+offset.toString(16)
								   +strsep+sz.toString(16);
							offset+=sz;
						})
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
	var get=function(path,opts,cb) {
		if (typeof path=='undefined') path=[];
		if (typeof path=="string") path=[path];
		//opts.recursive=!!opts.recursive;
		if (typeof opts=="function") {
			cb=opts;node
			opts={};
		}
		var that=this;
		if (typeof cb!='function') return getSync(path);

		reset.apply(this,[function(){
			var o=CACHE;
			if (path.length==0) {
				if (opts.address) {
					cb([0,that.fs.size]);
				} else {
					cb([Object.keys(CACHE)]);
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
							cb.apply(that,[r]); //return empty value
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
				cb.apply(that,[o]);
			} else {
				//last call to child load
				taskqueue.push(function(data,cursz){
					if (opts.address) {
						cb.apply(that,[cursz]);
					} else{
						var key=path[path.length-1];
						o[key]=data; KEY[pathnow]=opts.keys;
						cb.apply(that,[data]);
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
  var r = [], i = 0, v = 0;
  do {
	var shift = 0;
	do {
	  v += ((ar[i] & 0x7F) << shift);
	  shift += 7;	  
	} while (ar[++i] & 0x80);
	r.push(v); if (reset) v=0;
	count--;
  } while (i<ar.length && count);
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
module.exports=require("C:\\ksana2015\\node_modules\\ksana-database\\bsearch.js")
},{"C:\\ksana2015\\node_modules\\ksana-database\\bsearch.js":"C:\\ksana2015\\node_modules\\ksana-database\\bsearch.js"}],"C:\\ksana2015\\node_modules\\ksana-search\\excerpt.js":[function(require,module,exports){
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

var getSeg=function(engine,fileid,segid,cb) {
	var fileOffsets=engine.get("fileoffsets");
	var segpaths=["filecontents",fileid,segid];
	var segnames=engine.getFileSegNames(fileid);

	engine.get(segpaths,function(text){
		cb.apply(engine.context,[{text:text,file:fileid,seg:segid,segname:segnames[segid]}]);
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
var highlightSeg=function(Q,fileid,segid,opts,cb) {
	if (typeof opts=="function") {
		cb=opts;
	}

	if (!Q || !Q.engine) return cb(null);
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
		cb.apply(Q.engine.context,[{text:injectTag(Q,opt),seg:segid,file:fileid,hits:opt.hits,segname:segname}]);
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
	if (engine.analyzer) {
		cb();
		return;
	}
	var analyzer=require("ksana-analyzer");
	var config=engine.get("meta").config;
	engine.analyzer=analyzer.getAPI(config);
	engine.get([["tokens"],["postingslength"]],function(){
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

var _highlightSeg=function(engine,fileid,segid,opts,cb){
	if (!opts.q) opts.q=""; 
	_search(engine,opts.q,opts,function(Q){
		api.excerpt.highlightSeg(Q,fileid,segid,opts,cb);
	});	
}
var _highlightRange=function(engine,start,end,opts,cb){

	if (opts.q) {
		_search(engine,opts.q,opts,function(Q){
			api.excerpt.highlightRange(Q,start,end,opts,cb);
		});
	} else {
		prepareEngineForSearch(engine,function(){
			api.excerpt.getRange(engine,start,end,cb);
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

var vpos2fileseg=function(engine,vpos) {
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
var api={
	search:_search
//	,concordance:require("./concordance")
//	,regex:require("./regex")
	,highlightSeg:_highlightSeg
	,highlightFile:_highlightFile
//	,highlightRange:_highlightRange
	,excerpt:require("./excerpt")
	,vpos2fileseg:vpos2fileseg
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
	while (isSkip(query[i]) && i<query.length) i++;
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
				engine.totaltime=engine.searchtime

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
},{"./boolsearch":"C:\\ksana2015\\node_modules\\ksana-search\\boolsearch.js","./excerpt":"C:\\ksana2015\\node_modules\\ksana-search\\excerpt.js","./plist":"C:\\ksana2015\\node_modules\\ksana-search\\plist.js"}],"C:\\ksana2015\\node_modules\\ksana2015-stacktoc\\index.js":[function(require,module,exports){

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
    return {bar: "world",tocReady:false,cur:this.props.current|0};//403
  },
  buildtoc: function() {
      var toc=this.props.data;
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

  rebuildToc:function() {
    if (!this.state.tocReady && this.props.data && this.props.data.length) {
      this.buildtoc();
      this.setState({tocReady:true});
    }
  },
  componentDidMount:function() {
    this.rebuildToc();
  },
  componentDidUpdate:function() {
    this.rebuildToc();
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
	require("./livereload")();
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
	console.log(ksanajs.files);
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
		var content=fs.readFileSync(ksanajsfile(d),"utf8");
  	content=content.replace("})","}");
  	content=content.replace("jsonp_handler(","");
		var obj= JSON.parse(content);
		obj.dbid=d;
		obj.path=d;
		return obj;
	})
	return JSON.stringify(out);
}



var kfs={readDir:readDir,listApps:listApps};

module.exports=kfs;
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs_html5.js":[function(require,module,exports){
var readDir=function(){
	return [];
}
var listApps=function(){
	return [];
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

if (typeof process!="undefined") {
	var ksanajs=require("fs").readFileSync("./ksana.js","utf8").trim();
	downloader=require("./downloader");
	console.log(ksanajs);
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
  window.jsonp_handler=function(data) {
    //console.log("receive from ksana.js",data);
    if (typeof data=="object") {
      if (typeof data.dbid=="undefined") {
        data.dbid=dbid;
      }
      callback.apply(context,[data]);
    }  
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
    
    if (!to) continue; //cannot reach host
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
          console.log(url);
          jsonp( url ,app.dbid,taskqueue.shift(), context);           
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

var liveupdate={ humanFileSize: humanFileSize, 
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
},{"./src/main.jsx":"C:\\ksana2015\\visualmarkup\\src\\main.jsx","ksana2015-webruntime":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\actions.js":[function(require,module,exports){
module.exports=require("reflux").createActions([
		"openDS",
		"openDSL",
		"goSutra",      //切換原文
		"goLecture"      //切換講義
    ]);
},{"reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\dictionarypanel.js":[function(require,module,exports){
module.exports=React.createClass({displayName: "exports",
	render:function(){
		return React.createElement("div", null, "dictionary")
	}
});
},{}],"C:\\ksana2015\\visualmarkup\\src\\kepanpanel.js":[function(require,module,exports){
var kde=require("ksana-database");
var stackToc=require("ksana2015-stacktoc");
var StackToc=stackToc.component;
var store=require("./stores").ds;
var actions=require("./actions");
var Reflux=require("reflux");
module.exports=React.createClass({displayName: "exports",
	getInitialState:function() {
		var current=parseInt(localStorage.getItem("visualmarkup_kepan_current")||"0");
		return {toc:[],current:current};
	},
	mixins:[Reflux.listenTo(store,"dbOpened")],
	dbOpened:function(db,kepan){
		var toc=stackToc.genToc(kepan,"金剛經講記");
		this.setState({db:db,toc:toc});
	},
	render:function(){
		return React.createElement("div", null, 
			React.createElement(StackToc, {data: this.state.toc, showText: this.props.showText, current: this.state.current})
		)
	}
});
},{"./actions":"C:\\ksana2015\\visualmarkup\\src\\actions.js","./stores":"C:\\ksana2015\\visualmarkup\\src\\stores.js","ksana-database":"C:\\ksana2015\\node_modules\\ksana-database\\index.js","ksana2015-stacktoc":"C:\\ksana2015\\node_modules\\ksana2015-stacktoc\\index.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\main.jsx":[function(require,module,exports){
var Kse=require("ksana-search");
 
var ReferText=require("./refertext");
var MarkupText=require("./markuptext");
var MarkupPanel=require("./markuppanel");
var DictionaryPanel=require("./dictionarypanel");
var KepanPanel=require("./kepanpanel");

var actions=require("./actions");
var maincomponent = React.createClass({displayName: "maincomponent",
	getInitialState:function() {
		return {data:""} 
	},
	componentDidMount:function() { 
		actions.openDS();
		actions.openDSL();
	},
	showText:function(n) {
		console.log(n)
	},
	render: function() {
		return React.createElement("div", null, 
			React.createElement("div", {className: "col-md-3"}, 
				React.createElement(KepanPanel, {showText: this.showText})
			), 
			React.createElement("div", {className: "col-md-6"}, 
				React.createElement(MarkupPanel, null), 
				React.createElement(ReferText, null), 
				React.createElement(MarkupText, null)
			), 
			React.createElement("div", {className: "col-md-3"}, 
				React.createElement(DictionaryPanel, null)
			)

		);
	}
});
module.exports=maincomponent;
},{"./actions":"C:\\ksana2015\\visualmarkup\\src\\actions.js","./dictionarypanel":"C:\\ksana2015\\visualmarkup\\src\\dictionarypanel.js","./kepanpanel":"C:\\ksana2015\\visualmarkup\\src\\kepanpanel.js","./markuppanel":"C:\\ksana2015\\visualmarkup\\src\\markuppanel.js","./markuptext":"C:\\ksana2015\\visualmarkup\\src\\markuptext.js","./refertext":"C:\\ksana2015\\visualmarkup\\src\\refertext.js","ksana-search":"C:\\ksana2015\\node_modules\\ksana-search\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\markuppanel.js":[function(require,module,exports){
module.exports=React.createClass({displayName: "exports",
	render:function(){
		return React.createElement("div", null, "markup buttons")
	}
});
},{}],"C:\\ksana2015\\visualmarkup\\src\\markuptext.js":[function(require,module,exports){
module.exports=React.createClass({displayName: "exports",
	render:function() {
		return React.createElement("div", null, "講記")
	}
})
},{}],"C:\\ksana2015\\visualmarkup\\src\\refertext.js":[function(require,module,exports){
var Reflux=require("reflux");
var store=require("./stores").ds;
var actions=require("./actions");

module.exports=React.createClass({displayName: "exports",
	mixins:[Reflux.listenTo(store,"dbOpened")],
	dbOpened:function(db){
		this.setState({db:db});
		console.log("ds opened");
	},
	render:function() {
		return React.createElement("div", null, "金剛經")
	}
})
},{"./actions":"C:\\ksana2015\\visualmarkup\\src\\actions.js","./stores":"C:\\ksana2015\\visualmarkup\\src\\stores.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}],"C:\\ksana2015\\visualmarkup\\src\\stores.js":[function(require,module,exports){

var kde=require("ksana-database");
var Reflux=require("reflux");



var store_dsl=Reflux.createStore({
	listenables: [require("./actions")],
	onOpenDSL:function(){
		kde.open("dsl_jwn",{preload:[["fields"]]},function(err,db){
			if (!err) {
				console.log(db.get("fields"));
				this.trigger(db);
			}
		},this);
	}
});

var store_ds=Reflux.createStore({
	listenables: [require("./actions")],
	onGoSutra:function() {
		console.log("gosutra")
	},
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
	onOpenDS:function(){
		kde.open("ds",{preload:[["fields"],["extra"]]},function(err,db){
			if (!err) {
				var kepan=this.prepareKepan(db);
				this.trigger(db,kepan);
			}
		},this);
	},

	onGoLecture:function() {
		console.log("golecture")
	}
});

module.exports={ds:store_ds,dsl:store_dsl};

},{"./actions":"C:\\ksana2015\\visualmarkup\\src\\actions.js","ksana-database":"C:\\ksana2015\\node_modules\\ksana-database\\index.js","reflux":"C:\\ksana2015\\node_modules\\reflux\\src\\index.js"}]},{},["C:\\ksana2015\\visualmarkup\\index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uXFxVc2Vyc1xcY2hlYWhzaGVuXFxBcHBEYXRhXFxSb2FtaW5nXFxucG1cXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzXFxrc2FuYS1hbmFseXplclxcY29uZmlncy5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEtYW5hbHl6ZXJcXGluZGV4LmpzIiwibm9kZV9tb2R1bGVzXFxrc2FuYS1hbmFseXplclxcdG9rZW5pemVycy5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEtZGF0YWJhc2VcXGJzZWFyY2guanMiLCJub2RlX21vZHVsZXNcXGtzYW5hLWRhdGFiYXNlXFxpbmRleC5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEtZGF0YWJhc2VcXGtkZS5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEtZGF0YWJhc2VcXGxpc3RrZGIuanMiLCJub2RlX21vZHVsZXNcXGtzYW5hLWRhdGFiYXNlXFxwbGF0Zm9ybS5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEtanNvbnJvbVxcaHRtbDVyZWFkLmpzIiwibm9kZV9tb2R1bGVzXFxrc2FuYS1qc29ucm9tXFxpbmRleC5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEtanNvbnJvbVxca2RiLmpzIiwibm9kZV9tb2R1bGVzXFxrc2FuYS1qc29ucm9tXFxrZGJmcy5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEtanNvbnJvbVxca2RiZnNfYW5kcm9pZC5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEtanNvbnJvbVxca2RiZnNfaW9zLmpzIiwibm9kZV9tb2R1bGVzXFxrc2FuYS1zZWFyY2hcXGJvb2xzZWFyY2guanMiLCJub2RlX21vZHVsZXNcXGtzYW5hLXNlYXJjaFxcYnNlYXJjaC5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEtc2VhcmNoXFxleGNlcnB0LmpzIiwibm9kZV9tb2R1bGVzXFxrc2FuYS1zZWFyY2hcXGluZGV4LmpzIiwibm9kZV9tb2R1bGVzXFxrc2FuYS1zZWFyY2hcXHBsaXN0LmpzIiwibm9kZV9tb2R1bGVzXFxrc2FuYS1zZWFyY2hcXHNlYXJjaC5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXN0YWNrdG9jXFxpbmRleC5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGNoZWNrYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGRvd25sb2FkZXIuanMiLCJub2RlX21vZHVsZXNcXGtzYW5hMjAxNS13ZWJydW50aW1lXFxmaWxlaW5zdGFsbGVyLmpzIiwibm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxcaHRtbDVmcy5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGh0bWxmcy5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGluZGV4LmpzIiwibm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxcaW5zdGFsbGtkYi5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGtmcy5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGtmc19odG1sNS5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGtzYW5hZ2FwLmpzIiwibm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxcbGl2ZXJlbG9hZC5qcyIsIm5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGxpdmV1cGRhdGUuanMiLCJub2RlX21vZHVsZXNcXGtzYW5hMjAxNS13ZWJydW50aW1lXFxta2RpcnAuanMiLCJub2RlX21vZHVsZXNcXHJlZmx1eFxcbm9kZV9tb2R1bGVzXFxldmVudGVtaXR0ZXIzXFxpbmRleC5qcyIsIm5vZGVfbW9kdWxlc1xccmVmbHV4XFxzcmNcXEFjdGlvbk1ldGhvZHMuanMiLCJub2RlX21vZHVsZXNcXHJlZmx1eFxcc3JjXFxLZWVwLmpzIiwibm9kZV9tb2R1bGVzXFxyZWZsdXhcXHNyY1xcTGlzdGVuZXJNZXRob2RzLmpzIiwibm9kZV9tb2R1bGVzXFxyZWZsdXhcXHNyY1xcTGlzdGVuZXJNaXhpbi5qcyIsIm5vZGVfbW9kdWxlc1xccmVmbHV4XFxzcmNcXFB1Ymxpc2hlck1ldGhvZHMuanMiLCJub2RlX21vZHVsZXNcXHJlZmx1eFxcc3JjXFxTdG9yZU1ldGhvZHMuanMiLCJub2RlX21vZHVsZXNcXHJlZmx1eFxcc3JjXFxiaW5kTWV0aG9kcy5qcyIsIm5vZGVfbW9kdWxlc1xccmVmbHV4XFxzcmNcXGNvbm5lY3QuanMiLCJub2RlX21vZHVsZXNcXHJlZmx1eFxcc3JjXFxjcmVhdGVBY3Rpb24uanMiLCJub2RlX21vZHVsZXNcXHJlZmx1eFxcc3JjXFxjcmVhdGVTdG9yZS5qcyIsIm5vZGVfbW9kdWxlc1xccmVmbHV4XFxzcmNcXGluZGV4LmpzIiwibm9kZV9tb2R1bGVzXFxyZWZsdXhcXHNyY1xcam9pbnMuanMiLCJub2RlX21vZHVsZXNcXHJlZmx1eFxcc3JjXFxsaXN0ZW5Uby5qcyIsIm5vZGVfbW9kdWxlc1xccmVmbHV4XFxzcmNcXGxpc3RlblRvTWFueS5qcyIsIm5vZGVfbW9kdWxlc1xccmVmbHV4XFxzcmNcXHV0aWxzLmpzIiwidmlzdWFsbWFya3VwXFxpbmRleC5qcyIsInZpc3VhbG1hcmt1cFxcc3JjXFxhY3Rpb25zLmpzIiwidmlzdWFsbWFya3VwXFxzcmNcXGRpY3Rpb25hcnlwYW5lbC5qcyIsInZpc3VhbG1hcmt1cFxcc3JjXFxrZXBhbnBhbmVsLmpzIiwidmlzdWFsbWFya3VwXFxzcmNcXG1haW4uanN4IiwidmlzdWFsbWFya3VwXFxzcmNcXG1hcmt1cHBhbmVsLmpzIiwidmlzdWFsbWFya3VwXFxzcmNcXG1hcmt1cHRleHQuanMiLCJ2aXN1YWxtYXJrdXBcXHNyY1xccmVmZXJ0ZXh0LmpzIiwidmlzdWFsbWFya3VwXFxzcmNcXHN0b3Jlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgdG9rZW5pemVycz1yZXF1aXJlKCcuL3Rva2VuaXplcnMnKTtcclxudmFyIG5vcm1hbGl6ZVRibD1udWxsO1xyXG52YXIgc2V0Tm9ybWFsaXplVGFibGU9ZnVuY3Rpb24odGJsLG9iaikge1xyXG5cdGlmICghb2JqKSB7XHJcblx0XHRvYmo9e307XHJcblx0XHRmb3IgKHZhciBpPTA7aTx0YmwubGVuZ3RoO2krKykge1xyXG5cdFx0XHR2YXIgYXJyPXRibFtpXS5zcGxpdChcIj1cIik7XHJcblx0XHRcdG9ialthcnJbMF1dPWFyclsxXTtcclxuXHRcdH1cclxuXHR9XHJcblx0bm9ybWFsaXplVGJsPW9iajtcclxuXHRyZXR1cm4gb2JqO1xyXG59XHJcbnZhciBub3JtYWxpemUxPWZ1bmN0aW9uKHRva2VuKSB7XHJcblx0aWYgKCF0b2tlbikgcmV0dXJuIFwiXCI7XHJcblx0dG9rZW49dG9rZW4ucmVwbGFjZSgvWyBcXG5cXC4s77yM44CC77yB77yO44CM44CN77ya77yb44CBXS9nLCcnKS50cmltKCk7XHJcblx0aWYgKCFub3JtYWxpemVUYmwpIHJldHVybiB0b2tlbjtcclxuXHRpZiAodG9rZW4ubGVuZ3RoPT0xKSB7XHJcblx0XHRyZXR1cm4gbm9ybWFsaXplVGJsW3Rva2VuXSB8fCB0b2tlbjtcclxuXHR9IGVsc2Uge1xyXG5cdFx0Zm9yICh2YXIgaT0wO2k8dG9rZW4ubGVuZ3RoO2krKykge1xyXG5cdFx0XHR0b2tlbltpXT1ub3JtYWxpemVUYmxbdG9rZW5baV1dIHx8IHRva2VuW2ldO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRva2VuO1xyXG5cdH1cclxufVxyXG52YXIgaXNTa2lwMT1mdW5jdGlvbih0b2tlbikge1xyXG5cdHZhciB0PXRva2VuLnRyaW0oKTtcclxuXHRyZXR1cm4gKHQ9PVwiXCIgfHwgdD09XCLjgIBcIiB8fCB0PT1cIuKAu1wiIHx8IHQ9PVwiXFxuXCIpO1xyXG59XHJcbnZhciBub3JtYWxpemVfdGliZXRhbj1mdW5jdGlvbih0b2tlbikge1xyXG5cdHJldHVybiB0b2tlbi5yZXBsYWNlKC9b4LyN4LyLIF0vZywnJykudHJpbSgpO1xyXG59XHJcblxyXG52YXIgaXNTa2lwX3RpYmV0YW49ZnVuY3Rpb24odG9rZW4pIHtcclxuXHR2YXIgdD10b2tlbi50cmltKCk7XHJcblx0cmV0dXJuICh0PT1cIlwiIHx8IHQ9PVwi44CAXCIgfHwgIHQ9PVwiXFxuXCIpO1x0XHJcbn1cclxudmFyIHNpbXBsZTE9e1xyXG5cdGZ1bmM6e1xyXG5cdFx0dG9rZW5pemU6dG9rZW5pemVycy5zaW1wbGVcclxuXHRcdCxzZXROb3JtYWxpemVUYWJsZTpzZXROb3JtYWxpemVUYWJsZVxyXG5cdFx0LG5vcm1hbGl6ZTogbm9ybWFsaXplMVxyXG5cdFx0LGlzU2tpcDpcdGlzU2tpcDFcclxuXHR9XHJcblx0XHJcbn1cclxudmFyIHRpYmV0YW4xPXtcclxuXHRmdW5jOntcclxuXHRcdHRva2VuaXplOnRva2VuaXplcnMudGliZXRhblxyXG5cdFx0LHNldE5vcm1hbGl6ZVRhYmxlOnNldE5vcm1hbGl6ZVRhYmxlXHJcblx0XHQsbm9ybWFsaXplOm5vcm1hbGl6ZV90aWJldGFuXHJcblx0XHQsaXNTa2lwOmlzU2tpcF90aWJldGFuXHJcblx0fVxyXG59XHJcbm1vZHVsZS5leHBvcnRzPXtcInNpbXBsZTFcIjpzaW1wbGUxLFwidGliZXRhbjFcIjp0aWJldGFuMX0iLCIvKiBcclxuICBjdXN0b20gZnVuYyBmb3IgYnVpbGRpbmcgYW5kIHNlYXJjaGluZyB5ZGJcclxuXHJcbiAga2VlcCBhbGwgdmVyc2lvblxyXG4gIFxyXG4gIGdldEFQSSh2ZXJzaW9uKTsgLy9yZXR1cm4gaGFzaCBvZiBmdW5jdGlvbnMgLCBpZiB2ZXIgaXMgb21pdCAsIHJldHVybiBsYXN0ZXN0XHJcblx0XHJcbiAgcG9zdGluZ3MyVHJlZSAgICAgIC8vIGlmIHZlcnNpb24gaXMgbm90IHN1cHBseSwgZ2V0IGxhc3Rlc3RcclxuICB0b2tlbml6ZSh0ZXh0LGFwaSkgLy8gY29udmVydCBhIHN0cmluZyBpbnRvIHRva2VucyhkZXBlbmRzIG9uIG90aGVyIGFwaSlcclxuICBub3JtYWxpemVUb2tlbiAgICAgLy8gc3RlbW1pbmcgYW5kIGV0Y1xyXG4gIGlzU3BhY2VDaGFyICAgICAgICAvLyBub3QgYSBzZWFyY2hhYmxlIHRva2VuXHJcbiAgaXNTa2lwQ2hhciAgICAgICAgIC8vIDAgdnBvc1xyXG5cclxuICBmb3IgY2xpZW50IGFuZCBzZXJ2ZXIgc2lkZVxyXG4gIFxyXG4qL1xyXG52YXIgY29uZmlncz1yZXF1aXJlKFwiLi9jb25maWdzXCIpO1xyXG52YXIgY29uZmlnX3NpbXBsZT1cInNpbXBsZTFcIjtcclxudmFyIG9wdGltaXplPWZ1bmN0aW9uKGpzb24sY29uZmlnKSB7XHJcblx0Y29uZmlnPWNvbmZpZ3x8Y29uZmlnX3NpbXBsZTtcclxuXHRyZXR1cm4ganNvbjtcclxufVxyXG5cclxudmFyIGdldEFQST1mdW5jdGlvbihjb25maWcpIHtcclxuXHRjb25maWc9Y29uZmlnfHxjb25maWdfc2ltcGxlO1xyXG5cdHZhciBmdW5jPWNvbmZpZ3NbY29uZmlnXS5mdW5jO1xyXG5cdGZ1bmMub3B0aW1pemU9b3B0aW1pemU7XHJcblx0aWYgKGNvbmZpZz09XCJzaW1wbGUxXCIpIHtcclxuXHRcdC8vYWRkIGNvbW1vbiBjdXN0b20gZnVuY3Rpb24gaGVyZVxyXG5cdH0gZWxzZSBpZiAoY29uZmlnPT1cInRpYmV0YW4xXCIpIHtcclxuXHJcblx0fSBlbHNlIHRocm93IFwiY29uZmlnIFwiK2NvbmZpZyArXCJub3Qgc3VwcG9ydGVkXCI7XHJcblxyXG5cdHJldHVybiBmdW5jO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cz17Z2V0QVBJOmdldEFQSX07IiwidmFyIHRpYmV0YW4gPWZ1bmN0aW9uKHMpIHtcclxuXHQvL2NvbnRpbnVvdXMgdHNoZWcgZ3JvdXBlZCBpbnRvIHNhbWUgdG9rZW5cclxuXHQvL3NoYWQgYW5kIHNwYWNlIGdyb3VwZWQgaW50byBzYW1lIHRva2VuXHJcblx0dmFyIG9mZnNldD0wO1xyXG5cdHZhciB0b2tlbnM9W10sb2Zmc2V0cz1bXTtcclxuXHRzPXMucmVwbGFjZSgvXFxyXFxuL2csJ1xcbicpLnJlcGxhY2UoL1xcci9nLCdcXG4nKTtcclxuXHR2YXIgYXJyPXMuc3BsaXQoJ1xcbicpO1xyXG5cclxuXHRmb3IgKHZhciBpPTA7aTxhcnIubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIGxhc3Q9MDtcclxuXHRcdHZhciBzdHI9YXJyW2ldO1xyXG5cdFx0c3RyLnJlcGxhY2UoL1vgvI3gvIsgXSsvZyxmdW5jdGlvbihtLG0xKXtcclxuXHRcdFx0dG9rZW5zLnB1c2goc3RyLnN1YnN0cmluZyhsYXN0LG0xKSttKTtcclxuXHRcdFx0b2Zmc2V0cy5wdXNoKG9mZnNldCtsYXN0KTtcclxuXHRcdFx0bGFzdD1tMSttLmxlbmd0aDtcclxuXHRcdH0pO1xyXG5cdFx0aWYgKGxhc3Q8c3RyLmxlbmd0aCkge1xyXG5cdFx0XHR0b2tlbnMucHVzaChzdHIuc3Vic3RyaW5nKGxhc3QpKTtcclxuXHRcdFx0b2Zmc2V0cy5wdXNoKGxhc3QpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGk9PT1hcnIubGVuZ3RoLTEpIGJyZWFrO1xyXG5cdFx0dG9rZW5zLnB1c2goJ1xcbicpO1xyXG5cdFx0b2Zmc2V0cy5wdXNoKG9mZnNldCtsYXN0KTtcclxuXHRcdG9mZnNldCs9c3RyLmxlbmd0aCsxO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHt0b2tlbnM6dG9rZW5zLG9mZnNldHM6b2Zmc2V0c307XHJcbn07XHJcbnZhciBpc1NwYWNlPWZ1bmN0aW9uKGMpIHtcclxuXHRyZXR1cm4gKGM9PVwiIFwiKSA7Ly98fCAoYz09XCIsXCIpIHx8IChjPT1cIi5cIik7XHJcbn1cclxudmFyIGlzQ0pLID1mdW5jdGlvbihjKSB7cmV0dXJuICgoYz49MHgzMDAwICYmIGM8PTB4OUZGRikgXHJcbnx8IChjPj0weEQ4MDAgJiYgYzwweERDMDApIHx8IChjPj0weEZGMDApICkgO31cclxudmFyIHNpbXBsZTE9ZnVuY3Rpb24ocykge1xyXG5cdHZhciBvZmZzZXQ9MDtcclxuXHR2YXIgdG9rZW5zPVtdLG9mZnNldHM9W107XHJcblx0cz1zLnJlcGxhY2UoL1xcclxcbi9nLCdcXG4nKS5yZXBsYWNlKC9cXHIvZywnXFxuJyk7XHJcblx0YXJyPXMuc3BsaXQoJ1xcbicpO1xyXG5cclxuXHR2YXIgcHVzaHRva2VuPWZ1bmN0aW9uKHQsb2ZmKSB7XHJcblx0XHR2YXIgaT0wO1xyXG5cdFx0aWYgKHQuY2hhckNvZGVBdCgwKT4yNTUpIHtcclxuXHRcdFx0d2hpbGUgKGk8dC5sZW5ndGgpIHtcclxuXHRcdFx0XHR2YXIgYz10LmNoYXJDb2RlQXQoaSk7XHJcblx0XHRcdFx0b2Zmc2V0cy5wdXNoKG9mZitpKTtcclxuXHRcdFx0XHR0b2tlbnMucHVzaCh0W2ldKTtcclxuXHRcdFx0XHRpZiAoYz49MHhEODAwICYmIGM8PTB4REZGRikge1xyXG5cdFx0XHRcdFx0dG9rZW5zW3Rva2Vucy5sZW5ndGgtMV0rPXRbaV07IC8vZXh0ZW5zaW9uIEIsQyxEXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGkrKztcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dG9rZW5zLnB1c2godCk7XHJcblx0XHRcdG9mZnNldHMucHVzaChvZmYpO1x0XHJcblx0XHR9XHJcblx0fVxyXG5cdGZvciAodmFyIGk9MDtpPGFyci5sZW5ndGg7aSsrKSB7XHJcblx0XHR2YXIgbGFzdD0wLHNwPVwiXCI7XHJcblx0XHRzdHI9YXJyW2ldO1xyXG5cdFx0c3RyLnJlcGxhY2UoL1tfMC05QS1aYS16XSsvZyxmdW5jdGlvbihtLG0xKXtcclxuXHRcdFx0d2hpbGUgKGlzU3BhY2Uoc3A9c3RyW2xhc3RdKSAmJiBsYXN0PHN0ci5sZW5ndGgpIHtcclxuXHRcdFx0XHR0b2tlbnNbdG9rZW5zLmxlbmd0aC0xXSs9c3A7XHJcblx0XHRcdFx0bGFzdCsrO1xyXG5cdFx0XHR9XHJcblx0XHRcdHB1c2h0b2tlbihzdHIuc3Vic3RyaW5nKGxhc3QsbTEpK20gLCBvZmZzZXQrbGFzdCk7XHJcblx0XHRcdG9mZnNldHMucHVzaChvZmZzZXQrbGFzdCk7XHJcblx0XHRcdGxhc3Q9bTErbS5sZW5ndGg7XHJcblx0XHR9KTtcclxuXHJcblx0XHRpZiAobGFzdDxzdHIubGVuZ3RoKSB7XHJcblx0XHRcdHdoaWxlIChpc1NwYWNlKHNwPXN0cltsYXN0XSkgJiYgbGFzdDxzdHIubGVuZ3RoKSB7XHJcblx0XHRcdFx0dG9rZW5zW3Rva2Vucy5sZW5ndGgtMV0rPXNwO1xyXG5cdFx0XHRcdGxhc3QrKztcclxuXHRcdFx0fVxyXG5cdFx0XHRwdXNodG9rZW4oc3RyLnN1YnN0cmluZyhsYXN0KSwgb2Zmc2V0K2xhc3QpO1xyXG5cdFx0XHRcclxuXHRcdH1cdFx0XHJcblx0XHRvZmZzZXRzLnB1c2gob2Zmc2V0K2xhc3QpO1xyXG5cdFx0b2Zmc2V0Kz1zdHIubGVuZ3RoKzE7XHJcblx0XHRpZiAoaT09PWFyci5sZW5ndGgtMSkgYnJlYWs7XHJcblx0XHR0b2tlbnMucHVzaCgnXFxuJyk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4ge3Rva2Vuczp0b2tlbnMsb2Zmc2V0czpvZmZzZXRzfTtcclxuXHJcbn07XHJcblxyXG52YXIgc2ltcGxlPWZ1bmN0aW9uKHMpIHtcclxuXHR2YXIgdG9rZW49Jyc7XHJcblx0dmFyIHRva2Vucz1bXSwgb2Zmc2V0cz1bXSA7XHJcblx0dmFyIGk9MDsgXHJcblx0dmFyIGxhc3RzcGFjZT1mYWxzZTtcclxuXHR2YXIgYWRkdG9rZW49ZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAoIXRva2VuKSByZXR1cm47XHJcblx0XHR0b2tlbnMucHVzaCh0b2tlbik7XHJcblx0XHRvZmZzZXRzLnB1c2goaSk7XHJcblx0XHR0b2tlbj0nJztcclxuXHR9XHJcblx0d2hpbGUgKGk8cy5sZW5ndGgpIHtcclxuXHRcdHZhciBjPXMuY2hhckF0KGkpO1xyXG5cdFx0dmFyIGNvZGU9cy5jaGFyQ29kZUF0KGkpO1xyXG5cdFx0aWYgKGlzQ0pLKGNvZGUpKSB7XHJcblx0XHRcdGFkZHRva2VuKCk7XHJcblx0XHRcdHRva2VuPWM7XHJcblx0XHRcdGlmIChjb2RlPj0weEQ4MDAgJiYgY29kZTwweERDMDApIHsgLy9oaWdoIHNvcnJhZ2F0ZVxyXG5cdFx0XHRcdHRva2VuKz1zLmNoYXJBdChpKzEpO2krKztcclxuXHRcdFx0fVxyXG5cdFx0XHRhZGR0b2tlbigpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKGM9PScmJyB8fCBjPT0nPCcgfHwgYz09Jz8nIHx8IGM9PVwiLFwiIHx8IGM9PVwiLlwiXHJcblx0XHRcdHx8IGM9PSd8JyB8fCBjPT0nficgfHwgYz09J2AnIHx8IGM9PSc7JyBcclxuXHRcdFx0fHwgYz09Jz4nIHx8IGM9PSc6JyBcclxuXHRcdFx0fHwgYz09Jz0nIHx8IGM9PSdAJyAgfHwgYz09XCItXCIgXHJcblx0XHRcdHx8IGM9PSddJyB8fCBjPT0nfScgIHx8IGM9PVwiKVwiIFxyXG5cdFx0XHQvL3x8IGM9PSd7JyB8fCBjPT0nfSd8fCBjPT0nWycgfHwgYz09J10nIHx8IGM9PScoJyB8fCBjPT0nKSdcclxuXHRcdFx0fHwgY29kZT09MHhmMGIgfHwgY29kZT09MHhmMGQgLy8gdGliZXRhbiBzcGFjZVxyXG5cdFx0XHR8fCAoY29kZT49MHgyMDAwICYmIGNvZGU8PTB4MjA2ZikpIHtcclxuXHRcdFx0XHRhZGR0b2tlbigpO1xyXG5cdFx0XHRcdGlmIChjPT0nJicgfHwgYz09JzwnKXsgLy8gfHwgYz09J3snfHwgYz09JygnfHwgYz09J1snKSB7XHJcblx0XHRcdFx0XHR2YXIgZW5kY2hhcj0nPic7XHJcblx0XHRcdFx0XHRpZiAoYz09JyYnKSBlbmRjaGFyPSc7J1xyXG5cdFx0XHRcdFx0Ly9lbHNlIGlmIChjPT0neycpIGVuZGNoYXI9J30nO1xyXG5cdFx0XHRcdFx0Ly9lbHNlIGlmIChjPT0nWycpIGVuZGNoYXI9J10nO1xyXG5cdFx0XHRcdFx0Ly9lbHNlIGlmIChjPT0nKCcpIGVuZGNoYXI9JyknO1xyXG5cclxuXHRcdFx0XHRcdHdoaWxlIChpPHMubGVuZ3RoICYmIHMuY2hhckF0KGkpIT1lbmRjaGFyKSB7XHJcblx0XHRcdFx0XHRcdHRva2VuKz1zLmNoYXJBdChpKTtcclxuXHRcdFx0XHRcdFx0aSsrO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0dG9rZW4rPWVuZGNoYXI7XHJcblx0XHRcdFx0XHRhZGR0b2tlbigpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0b2tlbj1jO1xyXG5cdFx0XHRcdFx0YWRkdG9rZW4oKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dG9rZW49Jyc7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0aWYgKGM9PVwiIFwiKSB7XHJcblx0XHRcdFx0XHR0b2tlbis9YztcclxuXHRcdFx0XHRcdGxhc3RzcGFjZT10cnVlO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRpZiAobGFzdHNwYWNlKSBhZGR0b2tlbigpO1xyXG5cdFx0XHRcdFx0bGFzdHNwYWNlPWZhbHNlO1xyXG5cdFx0XHRcdFx0dG9rZW4rPWM7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpKys7XHJcblx0fVxyXG5cdGFkZHRva2VuKCk7XHJcblx0cmV0dXJuIHt0b2tlbnM6dG9rZW5zLG9mZnNldHM6b2Zmc2V0c307XHJcbn1cclxubW9kdWxlLmV4cG9ydHM9e3NpbXBsZTpzaW1wbGUsdGliZXRhbjp0aWJldGFufTsiLCJ2YXIgaW5kZXhPZlNvcnRlZCA9IGZ1bmN0aW9uIChhcnJheSwgb2JqLCBuZWFyKSB7IFxyXG4gIHZhciBsb3cgPSAwLFxyXG4gIGhpZ2ggPSBhcnJheS5sZW5ndGg7XHJcbiAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcclxuICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4gMTtcclxuICAgIGlmIChhcnJheVttaWRdPT1vYmopIHJldHVybiBtaWQ7XHJcbiAgICBhcnJheVttaWRdIDwgb2JqID8gbG93ID0gbWlkICsgMSA6IGhpZ2ggPSBtaWQ7XHJcbiAgfVxyXG4gIGlmIChuZWFyKSByZXR1cm4gbG93O1xyXG4gIGVsc2UgaWYgKGFycmF5W2xvd109PW9iaikgcmV0dXJuIGxvdztlbHNlIHJldHVybiAtMTtcclxufTtcclxudmFyIGluZGV4T2ZTb3J0ZWRfc3RyID0gZnVuY3Rpb24gKGFycmF5LCBvYmosIG5lYXIpIHsgXHJcbiAgdmFyIGxvdyA9IDAsXHJcbiAgaGlnaCA9IGFycmF5Lmxlbmd0aDtcclxuICB3aGlsZSAobG93IDwgaGlnaCkge1xyXG4gICAgdmFyIG1pZCA9IChsb3cgKyBoaWdoKSA+PiAxO1xyXG4gICAgaWYgKGFycmF5W21pZF09PW9iaikgcmV0dXJuIG1pZDtcclxuICAgIChhcnJheVttaWRdLmxvY2FsZUNvbXBhcmUob2JqKTwwKSA/IGxvdyA9IG1pZCArIDEgOiBoaWdoID0gbWlkO1xyXG4gIH1cclxuICBpZiAobmVhcikgcmV0dXJuIGxvdztcclxuICBlbHNlIGlmIChhcnJheVtsb3ddPT1vYmopIHJldHVybiBsb3c7ZWxzZSByZXR1cm4gLTE7XHJcbn07XHJcblxyXG5cclxudmFyIGJzZWFyY2g9ZnVuY3Rpb24oYXJyYXksdmFsdWUsbmVhcikge1xyXG5cdHZhciBmdW5jPWluZGV4T2ZTb3J0ZWQ7XHJcblx0aWYgKHR5cGVvZiBhcnJheVswXT09XCJzdHJpbmdcIikgZnVuYz1pbmRleE9mU29ydGVkX3N0cjtcclxuXHRyZXR1cm4gZnVuYyhhcnJheSx2YWx1ZSxuZWFyKTtcclxufVxyXG52YXIgYnNlYXJjaE5lYXI9ZnVuY3Rpb24oYXJyYXksdmFsdWUpIHtcclxuXHRyZXR1cm4gYnNlYXJjaChhcnJheSx2YWx1ZSx0cnVlKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHM9YnNlYXJjaDsvL3tic2VhcmNoTmVhcjpic2VhcmNoTmVhcixic2VhcmNoOmJzZWFyY2h9OyIsInZhciBLREU9cmVxdWlyZShcIi4va2RlXCIpO1xyXG4vL2N1cnJlbnRseSBvbmx5IHN1cHBvcnQgbm9kZS5qcyBmcywga3NhbmFnYXAgbmF0aXZlIGZzLCBodG1sNSBmaWxlIHN5c3RlbVxyXG4vL3VzZSBzb2NrZXQuaW8gdG8gcmVhZCBrZGIgZnJvbSByZW1vdGUgc2VydmVyIGluIGZ1dHVyZVxyXG5tb2R1bGUuZXhwb3J0cz1LREU7IiwiLyogS3NhbmEgRGF0YWJhc2UgRW5naW5lXHJcblxyXG4gICAyMDE1LzEvMiAsIFxyXG4gICBtb3ZlIHRvIGtzYW5hLWRhdGFiYXNlXHJcbiAgIHNpbXBsaWZpZWQgYnkgcmVtb3ZpbmcgZG9jdW1lbnQgc3VwcG9ydCBhbmQgc29ja2V0LmlvIHN1cHBvcnRcclxuXHJcblxyXG4qL1xyXG52YXIgcG9vbD17fSxsb2NhbFBvb2w9e307XHJcbnZhciBhcHBwYXRoPVwiXCI7XHJcbnZhciBic2VhcmNoPXJlcXVpcmUoXCIuL2JzZWFyY2hcIik7XHJcbnZhciBLZGI9cmVxdWlyZSgna3NhbmEtanNvbnJvbScpO1xyXG52YXIga2Ricz1bXTsgLy9hdmFpbGFibGUga2RiICwgaWQgYW5kIGFic29sdXRlIHBhdGhcclxudmFyIHN0cnNlcD1cIlxcdWZmZmZcIjtcclxudmFyIGtkYmxpc3RlZD1mYWxzZTtcclxuLypcclxudmFyIF9nZXRTeW5jPWZ1bmN0aW9uKHBhdGhzLG9wdHMpIHtcclxuXHR2YXIgb3V0PVtdO1xyXG5cdGZvciAodmFyIGkgaW4gcGF0aHMpIHtcclxuXHRcdG91dC5wdXNoKHRoaXMuZ2V0U3luYyhwYXRoc1tpXSxvcHRzKSk7XHRcclxuXHR9XHJcblx0cmV0dXJuIG91dDtcclxufVxyXG4qL1xyXG52YXIgX2dldHM9ZnVuY3Rpb24ocGF0aHMsb3B0cyxjYikgeyAvL2dldCBtYW55IGRhdGEgd2l0aCBvbmUgY2FsbFxyXG5cclxuXHRpZiAoIXBhdGhzKSByZXR1cm4gO1xyXG5cdGlmICh0eXBlb2YgcGF0aHM9PSdzdHJpbmcnKSB7XHJcblx0XHRwYXRocz1bcGF0aHNdO1xyXG5cdH1cclxuXHR2YXIgZW5naW5lPXRoaXMsIG91dHB1dD1bXTtcclxuXHJcblx0dmFyIG1ha2VjYj1mdW5jdGlvbihwYXRoKXtcclxuXHRcdHJldHVybiBmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRpZiAoIShkYXRhICYmIHR5cGVvZiBkYXRhID09J29iamVjdCcgJiYgZGF0YS5fX2VtcHR5KSkgb3V0cHV0LnB1c2goZGF0YSk7XHJcblx0XHRcdFx0ZW5naW5lLmdldChwYXRoLG9wdHMsdGFza3F1ZXVlLnNoaWZ0KCkpO1xyXG5cdFx0fTtcclxuXHR9O1xyXG5cclxuXHR2YXIgdGFza3F1ZXVlPVtdO1xyXG5cdGZvciAodmFyIGk9MDtpPHBhdGhzLmxlbmd0aDtpKyspIHtcclxuXHRcdGlmICh0eXBlb2YgcGF0aHNbaV09PVwibnVsbFwiKSB7IC8vdGhpcyBpcyBvbmx5IGEgcGxhY2UgaG9sZGVyIGZvciBrZXkgZGF0YSBhbHJlYWR5IGluIGNsaWVudCBjYWNoZVxyXG5cdFx0XHRvdXRwdXQucHVzaChudWxsKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRhc2txdWV1ZS5wdXNoKG1ha2VjYihwYXRoc1tpXSkpO1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdHRhc2txdWV1ZS5wdXNoKGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0b3V0cHV0LnB1c2goZGF0YSk7XHJcblx0XHRjYi5hcHBseShlbmdpbmUuY29udGV4dHx8ZW5naW5lLFtvdXRwdXQscGF0aHNdKTsgLy9yZXR1cm4gdG8gY2FsbGVyXHJcblx0fSk7XHJcblxyXG5cdHRhc2txdWV1ZS5zaGlmdCgpKHtfX2VtcHR5OnRydWV9KTsgLy9ydW4gdGhlIHRhc2tcclxufVxyXG5cclxudmFyIGdldEZpbGVSYW5nZT1mdW5jdGlvbihpKSB7XHJcblx0dmFyIGVuZ2luZT10aGlzO1xyXG5cclxuXHR2YXIgZmlsZXNlZ2NvdW50PWVuZ2luZS5nZXQoW1wiZmlsZXNlZ2NvdW50XCJdKTtcclxuXHRpZiAoZmlsZXNlZ2NvdW50KSB7XHJcblx0XHRpZiAoaT09MCkge1xyXG5cdFx0XHRyZXR1cm4ge3N0YXJ0OjAsZW5kOmZpbGVzZWdjb3VudFswXS0xfTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiB7c3RhcnQ6ZmlsZXNlZ2NvdW50W2ktMV0sZW5kOmZpbGVzZWdjb3VudFtpXS0xfTtcclxuXHRcdH1cclxuXHR9XHJcblx0Ly9vbGQgYnVnZ3kgY29kZVxyXG5cdHZhciBmaWxlbmFtZXM9ZW5naW5lLmdldChbXCJmaWxlbmFtZXNcIl0pO1xyXG5cdHZhciBmaWxlb2Zmc2V0cz1lbmdpbmUuZ2V0KFtcImZpbGVvZmZzZXRzXCJdKTtcclxuXHR2YXIgc2Vnb2Zmc2V0cz1lbmdpbmUuZ2V0KFtcInNlZ29mZnNldHNcIl0pO1xyXG5cdHZhciBzZWduYW1lcz1lbmdpbmUuZ2V0KFtcInNlZ25hbWVzXCJdKTtcclxuXHR2YXIgZmlsZXN0YXJ0PWZpbGVvZmZzZXRzW2ldLCBmaWxlZW5kPWZpbGVvZmZzZXRzW2krMV0tMTtcclxuXHJcblx0dmFyIHN0YXJ0PWJzZWFyY2goc2Vnb2Zmc2V0cyxmaWxlc3RhcnQsdHJ1ZSk7XHJcblx0Ly9pZiAoc2VnT2Zmc2V0c1tzdGFydF09PWZpbGVTdGFydCkgc3RhcnQtLTtcclxuXHRcclxuXHQvL3dvcmsgYXJvdW5kIGZvciBqaWFuZ2thbmd5dXJcclxuXHR3aGlsZSAoc2VnTmFtZXNbc3RhcnQrMV09PVwiX1wiKSBzdGFydCsrO1xyXG5cclxuICAvL2lmIChpPT0wKSBzdGFydD0wOyAvL3dvcmsgYXJvdW5kIGZvciBmaXJzdCBmaWxlXHJcblx0dmFyIGVuZD1ic2VhcmNoKHNlZ29mZnNldHMsZmlsZWVuZCx0cnVlKTtcclxuXHRyZXR1cm4ge3N0YXJ0OnN0YXJ0LGVuZDplbmR9O1xyXG59XHJcblxyXG52YXIgZ2V0ZmlsZXNlZz1mdW5jdGlvbihhYnNvbHV0ZXNlZykge1xyXG5cdHZhciBmaWxlb2Zmc2V0cz10aGlzLmdldChbXCJmaWxlb2Zmc2V0c1wiXSk7XHJcblx0dmFyIHNlZ29mZnNldHM9dGhpcy5nZXQoW1wic2Vnb2Zmc2V0c1wiXSk7XHJcblx0dmFyIHNlZ29mZnNldD1zZWdPZmZzZXRzW2Fic29sdXRlc2VnXTtcclxuXHR2YXIgZmlsZT1ic2VhcmNoKGZpbGVPZmZzZXRzLHNlZ29mZnNldCx0cnVlKS0xO1xyXG5cclxuXHR2YXIgZmlsZVN0YXJ0PWZpbGVvZmZzZXRzW2ZpbGVdO1xyXG5cdHZhciBzdGFydD1ic2VhcmNoKHNlZ29mZnNldHMsZmlsZVN0YXJ0LHRydWUpO1x0XHJcblxyXG5cdHZhciBzZWc9YWJzb2x1dGVzZWctc3RhcnQtMTtcclxuXHRyZXR1cm4ge2ZpbGU6ZmlsZSxzZWc6c2VnfTtcclxufVxyXG4vL3JldHVybiBhcnJheSBvZiBvYmplY3Qgb2YgbmZpbGUgbnNlZyBnaXZlbiBzZWduYW1lXHJcbnZhciBmaW5kU2VnPWZ1bmN0aW9uKHNlZ25hbWUpIHtcclxuXHR2YXIgc2VnbmFtZXM9dGhpcy5nZXQoXCJzZWduYW1lc1wiKTtcclxuXHR2YXIgb3V0PVtdO1xyXG5cdGZvciAodmFyIGk9MDtpPHNlZ25hbWVzLmxlbmd0aDtpKyspIHtcclxuXHRcdGlmIChzZWduYW1lc1tpXT09c2VnbmFtZSkge1xyXG5cdFx0XHR2YXIgZmlsZXNlZz1nZXRmaWxlc2VnLmFwcGx5KHRoaXMsW2ldKTtcclxuXHRcdFx0b3V0LnB1c2goe2ZpbGU6ZmlsZXNlZy5maWxlLHNlZzpmaWxlc2VnLnNlZyxhYnNzZWc6aX0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gb3V0O1xyXG59XHJcbnZhciBnZXRGaWxlU2VnT2Zmc2V0cz1mdW5jdGlvbihpKSB7XHJcblx0dmFyIHNlZ29mZnNldHM9dGhpcy5nZXQoXCJzZWdvZmZzZXRzXCIpO1xyXG5cdHZhciByYW5nZT1nZXRGaWxlUmFuZ2UuYXBwbHkodGhpcyxbaV0pO1xyXG5cdHJldHVybiBzZWdvZmZzZXRzLnNsaWNlKHJhbmdlLnN0YXJ0LHJhbmdlLmVuZCsxKTtcclxufVxyXG5cclxudmFyIGdldEZpbGVTZWdOYW1lcz1mdW5jdGlvbihpKSB7XHJcblx0dmFyIHJhbmdlPWdldEZpbGVSYW5nZS5hcHBseSh0aGlzLFtpXSk7XHJcblx0dmFyIHNlZ25hbWVzPXRoaXMuZ2V0KFwic2VnbmFtZXNcIik7XHJcblx0cmV0dXJuIHNlZ25hbWVzLnNsaWNlKHJhbmdlLnN0YXJ0LHJhbmdlLmVuZCsxKTtcclxufVxyXG52YXIgbG9jYWxlbmdpbmVfZ2V0PWZ1bmN0aW9uKHBhdGgsb3B0cyxjYikge1xyXG5cdHZhciBlbmdpbmU9dGhpcztcclxuXHRpZiAodHlwZW9mIG9wdHM9PVwiZnVuY3Rpb25cIikge1xyXG5cdFx0Y2I9b3B0cztcclxuXHRcdG9wdHM9e3JlY3Vyc2l2ZTpmYWxzZX07XHJcblx0fVxyXG5cdGlmICghcGF0aCkge1xyXG5cdFx0aWYgKGNiKSBjYihudWxsKTtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH1cclxuXHJcblx0aWYgKHR5cGVvZiBjYiE9XCJmdW5jdGlvblwiKSB7XHJcblx0XHRyZXR1cm4gZW5naW5lLmtkYi5nZXQocGF0aCxvcHRzKTtcclxuXHR9XHJcblxyXG5cdGlmICh0eXBlb2YgcGF0aD09XCJzdHJpbmdcIikge1xyXG5cdFx0cmV0dXJuIGVuZ2luZS5rZGIuZ2V0KFtwYXRoXSxvcHRzLGNiKTtcclxuXHR9IGVsc2UgaWYgKHR5cGVvZiBwYXRoWzBdID09XCJzdHJpbmdcIikge1xyXG5cdFx0cmV0dXJuIGVuZ2luZS5rZGIuZ2V0KHBhdGgsb3B0cyxjYik7XHJcblx0fSBlbHNlIGlmICh0eXBlb2YgcGF0aFswXSA9PVwib2JqZWN0XCIpIHtcclxuXHRcdHJldHVybiBfZ2V0cy5hcHBseShlbmdpbmUsW3BhdGgsb3B0cyxjYl0pO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRlbmdpbmUua2RiLmdldChbXSxvcHRzLGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRjYihkYXRhWzBdKTsvL3JldHVybiB0b3AgbGV2ZWwga2V5c1xyXG5cdFx0fSk7XHJcblx0fVxyXG59O1x0XHJcblxyXG52YXIgZ2V0UHJlbG9hZEZpZWxkPWZ1bmN0aW9uKHVzZXIpIHtcclxuXHR2YXIgcHJlbG9hZD1bW1wibWV0YVwiXSxbXCJmaWxlbmFtZXNcIl0sW1wiZmlsZW9mZnNldHNcIl0sW1wic2VnbmFtZXNcIl0sW1wic2Vnb2Zmc2V0c1wiXSxbXCJmaWxlc2VnY291bnRcIl1dO1xyXG5cdC8vW1widG9rZW5zXCJdLFtcInBvc3RpbmdzbGVuXCJdIGtzZSB3aWxsIGxvYWQgaXRcclxuXHRpZiAodXNlciAmJiB1c2VyLmxlbmd0aCkgeyAvL3VzZXIgc3VwcGx5IHByZWxvYWRcclxuXHRcdGZvciAodmFyIGk9MDtpPHVzZXIubGVuZ3RoO2krKykge1xyXG5cdFx0XHRpZiAocHJlbG9hZC5pbmRleE9mKHVzZXJbaV0pPT0tMSkge1xyXG5cdFx0XHRcdHByZWxvYWQucHVzaCh1c2VyW2ldKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gcHJlbG9hZDtcclxufVxyXG52YXIgY3JlYXRlTG9jYWxFbmdpbmU9ZnVuY3Rpb24oa2RiLG9wdHMsY2IsY29udGV4dCkge1xyXG5cdHZhciBlbmdpbmU9e2tkYjprZGIsIHF1ZXJ5Q2FjaGU6e30sIHBvc3RpbmdDYWNoZTp7fSwgY2FjaGU6e319O1xyXG5cclxuXHRpZiAodHlwZW9mIGNvbnRleHQ9PVwib2JqZWN0XCIpIGVuZ2luZS5jb250ZXh0PWNvbnRleHQ7XHJcblx0ZW5naW5lLmdldD1sb2NhbGVuZ2luZV9nZXQ7XHJcblxyXG5cdGVuZ2luZS5zZWdPZmZzZXQ9c2VnT2Zmc2V0O1xyXG5cdGVuZ2luZS5maWxlT2Zmc2V0PWZpbGVPZmZzZXQ7XHJcblx0ZW5naW5lLmdldEZpbGVTZWdOYW1lcz1nZXRGaWxlU2VnTmFtZXM7XHJcblx0ZW5naW5lLmdldEZpbGVTZWdPZmZzZXRzPWdldEZpbGVTZWdPZmZzZXRzO1xyXG5cdGVuZ2luZS5nZXRGaWxlUmFuZ2U9Z2V0RmlsZVJhbmdlO1xyXG5cdGVuZ2luZS5maW5kU2VnPWZpbmRTZWc7XHJcblx0Ly9vbmx5IGxvY2FsIGVuZ2luZSBhbGxvdyBnZXRTeW5jXHJcblx0Ly9pZiAoa2RiLmZzLmdldFN5bmMpIGVuZ2luZS5nZXRTeW5jPWVuZ2luZS5rZGIuZ2V0U3luYztcclxuXHRcclxuXHQvL3NwZWVkeSBuYXRpdmUgZnVuY3Rpb25zXHJcblx0aWYgKGtkYi5mcy5tZXJnZVBvc3RpbmdzKSB7XHJcblx0XHRlbmdpbmUubWVyZ2VQb3N0aW5ncz1rZGIuZnMubWVyZ2VQb3N0aW5ncy5iaW5kKGtkYi5mcyk7XHJcblx0fVxyXG5cdFxyXG5cdHZhciBzZXRQcmVsb2FkPWZ1bmN0aW9uKHJlcykge1xyXG5cdFx0ZW5naW5lLmRibmFtZT1yZXNbMF0ubmFtZTtcclxuXHRcdC8vZW5naW5lLmN1c3RvbWZ1bmM9Y3VzdG9tZnVuYy5nZXRBUEkocmVzWzBdLmNvbmZpZyk7XHJcblx0XHRlbmdpbmUucmVhZHk9dHJ1ZTtcclxuXHR9XHJcblxyXG5cdHZhciBwcmVsb2FkPWdldFByZWxvYWRGaWVsZChvcHRzLnByZWxvYWQpO1xyXG5cdHZhciBvcHRzPXtyZWN1cnNpdmU6dHJ1ZX07XHJcblx0Ly9pZiAodHlwZW9mIGNiPT1cImZ1bmN0aW9uXCIpIHtcclxuXHRcdF9nZXRzLmFwcGx5KGVuZ2luZSxbIHByZWxvYWQsIG9wdHMsZnVuY3Rpb24ocmVzKXtcclxuXHRcdFx0c2V0UHJlbG9hZChyZXMpO1xyXG5cdFx0XHRjYi5hcHBseShlbmdpbmUuY29udGV4dCxbZW5naW5lXSk7XHJcblx0XHR9XSk7XHJcblx0Ly99IGVsc2Uge1xyXG5cdC8vXHRzZXRQcmVsb2FkKF9nZXRTeW5jLmFwcGx5KGVuZ2luZSxbcHJlbG9hZCxvcHRzXSkpO1xyXG5cdC8vfVxyXG5cdHJldHVybiBlbmdpbmU7XHJcbn1cclxuXHJcbnZhciBzZWdPZmZzZXQ9ZnVuY3Rpb24oc2VnbmFtZSkge1xyXG5cdHZhciBlbmdpbmU9dGhpcztcclxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aD4xKSB0aHJvdyBcImFyZ3VtZW50IDogc2VnbmFtZSBcIjtcclxuXHJcblx0dmFyIHNlZ05hbWVzPWVuZ2luZS5nZXQoXCJzZWduYW1lc1wiKTtcclxuXHR2YXIgc2VnT2Zmc2V0cz1lbmdpbmUuZ2V0KFwic2Vnb2Zmc2V0c1wiKTtcclxuXHJcblx0dmFyIGk9c2VnTmFtZXMuaW5kZXhPZihzZWduYW1lKTtcclxuXHRyZXR1cm4gKGk+LTEpP3NlZ09mZnNldHNbaV06MDtcclxufVxyXG52YXIgZmlsZU9mZnNldD1mdW5jdGlvbihmbikge1xyXG5cdHZhciBlbmdpbmU9dGhpcztcclxuXHR2YXIgZmlsZW5hbWVzPWVuZ2luZS5nZXQoXCJmaWxlbmFtZXNcIik7XHJcblx0dmFyIG9mZnNldHM9ZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpO1xyXG5cdHZhciBpPWZpbGVuYW1lcy5pbmRleE9mKGZuKTtcclxuXHRpZiAoaT09LTEpIHJldHVybiBudWxsO1xyXG5cdHJldHVybiB7c3RhcnQ6IG9mZnNldHNbaV0sIGVuZDpvZmZzZXRzW2krMV19O1xyXG59XHJcblxyXG52YXIgZm9sZGVyT2Zmc2V0PWZ1bmN0aW9uKGZvbGRlcikge1xyXG5cdHZhciBlbmdpbmU9dGhpcztcclxuXHR2YXIgc3RhcnQ9MCxlbmQ9MDtcclxuXHR2YXIgZmlsZW5hbWVzPWVuZ2luZS5nZXQoXCJmaWxlbmFtZXNcIik7XHJcblx0dmFyIG9mZnNldHM9ZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpO1xyXG5cdGZvciAodmFyIGk9MDtpPGZpbGVuYW1lcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRpZiAoZmlsZW5hbWVzW2ldLnN1YnN0cmluZygwLGZvbGRlci5sZW5ndGgpPT1mb2xkZXIpIHtcclxuXHRcdFx0aWYgKCFzdGFydCkgc3RhcnQ9b2Zmc2V0c1tpXTtcclxuXHRcdFx0ZW5kPW9mZnNldHNbaV07XHJcblx0XHR9IGVsc2UgaWYgKHN0YXJ0KSBicmVhaztcclxuXHR9XHJcblx0cmV0dXJuIHtzdGFydDpzdGFydCxlbmQ6ZW5kfTtcclxufVxyXG5cclxuIC8vVE9ETyBkZWxldGUgZGlyZWN0bHkgZnJvbSBrZGIgaW5zdGFuY2VcclxuIC8va2RiLmZyZWUoKTtcclxudmFyIGNsb3NlTG9jYWw9ZnVuY3Rpb24oa2RiaWQpIHtcclxuXHR2YXIgZW5naW5lPWxvY2FsUG9vbFtrZGJpZF07XHJcblx0aWYgKGVuZ2luZSkge1xyXG5cdFx0ZW5naW5lLmtkYi5mcmVlKCk7XHJcblx0XHRkZWxldGUgbG9jYWxQb29sW2tkYmlkXTtcclxuXHR9XHJcbn1cclxudmFyIGNsb3NlPWZ1bmN0aW9uKGtkYmlkKSB7XHJcblx0dmFyIGVuZ2luZT1wb29sW2tkYmlkXTtcclxuXHRpZiAoZW5naW5lKSB7XHJcblx0XHRlbmdpbmUua2RiLmZyZWUoKTtcclxuXHRcdGRlbGV0ZSBwb29sW2tkYmlkXTtcclxuXHR9XHJcbn1cclxuXHJcbnZhciBnZXRMb2NhbFRyaWVzPWZ1bmN0aW9uKGtkYmZuKSB7XHJcblx0aWYgKCFrZGJsaXN0ZWQpIHtcclxuXHRcdGtkYnM9cmVxdWlyZShcIi4vbGlzdGtkYlwiKSgpO1xyXG5cdFx0a2RibGlzdGVkPXRydWU7XHJcblx0fVxyXG5cclxuXHR2YXIga2RiaWQ9a2RiZm4ucmVwbGFjZSgnLmtkYicsJycpO1xyXG5cdHZhciB0cmllcz0gW1wiLi9cIitrZGJpZCtcIi5rZGJcIlxyXG5cdCAgICAgICAgICAgLFwiLi4vXCIra2RiaWQrXCIua2RiXCJcclxuXHRdO1xyXG5cclxuXHRmb3IgKHZhciBpPTA7aTxrZGJzLmxlbmd0aDtpKyspIHtcclxuXHRcdGlmIChrZGJzW2ldWzBdPT1rZGJpZCkge1xyXG5cdFx0XHR0cmllcy5wdXNoKGtkYnNbaV1bMV0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gdHJpZXM7XHJcbn1cclxudmFyIG9wZW5Mb2NhbEtzYW5hZ2FwPWZ1bmN0aW9uKGtkYmlkLG9wdHMsY2IsY29udGV4dCkge1xyXG5cdHZhciBrZGJmbj1rZGJpZDtcclxuXHR2YXIgdHJpZXM9Z2V0TG9jYWxUcmllcyhrZGJmbik7XHJcblxyXG5cdGZvciAodmFyIGk9MDtpPHRyaWVzLmxlbmd0aDtpKyspIHtcclxuXHRcdGlmIChmcy5leGlzdHNTeW5jKHRyaWVzW2ldKSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKFwia2RiIHBhdGg6IFwiK25vZGVSZXF1aXJlKCdwYXRoJykucmVzb2x2ZSh0cmllc1tpXSkpO1xyXG5cdFx0XHR2YXIga2RiPW5ldyBLZGIub3Blbih0cmllc1tpXSxmdW5jdGlvbihlcnIsa2RiKXtcclxuXHRcdFx0XHRpZiAoZXJyKSB7XHJcblx0XHRcdFx0XHRjYi5hcHBseShjb250ZXh0LFtlcnJdKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0Y3JlYXRlTG9jYWxFbmdpbmUoa2RiLG9wdHMsZnVuY3Rpb24oZW5naW5lKXtcclxuXHRcdFx0XHRcdFx0bG9jYWxQb29sW2tkYmlkXT1lbmdpbmU7XHJcblx0XHRcdFx0XHRcdGNiLmFwcGx5KGNvbnRleHR8fGVuZ2luZS5jb250ZXh0LFswLGVuZ2luZV0pO1xyXG5cdFx0XHRcdFx0fSxjb250ZXh0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHR9XHJcblx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtrZGJpZCtcIiBub3QgZm91bmRcIl0pO1xyXG5cdHJldHVybiBudWxsO1xyXG5cclxufVxyXG52YXIgb3BlbkxvY2FsTm9kZT1mdW5jdGlvbihrZGJpZCxvcHRzLGNiLGNvbnRleHQpIHtcclxuXHR2YXIgZnM9cmVxdWlyZSgnZnMnKTtcclxuXHR2YXIgdHJpZXM9Z2V0TG9jYWxUcmllcyhrZGJpZCk7XHJcblxyXG5cdGZvciAodmFyIGk9MDtpPHRyaWVzLmxlbmd0aDtpKyspIHtcclxuXHRcdGlmIChmcy5leGlzdHNTeW5jKHRyaWVzW2ldKSkge1xyXG5cclxuXHRcdFx0bmV3IEtkYi5vcGVuKHRyaWVzW2ldLGZ1bmN0aW9uKGVycixrZGIpe1xyXG5cdFx0XHRcdGlmIChlcnIpIHtcclxuXHRcdFx0XHRcdGNiLmFwcGx5KGNvbnRleHR8fGVuZ2luZS5jb250ZW50LFtlcnJdKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0Y3JlYXRlTG9jYWxFbmdpbmUoa2RiLG9wdHMsZnVuY3Rpb24oZW5naW5lKXtcclxuXHRcdFx0XHRcdFx0XHRsb2NhbFBvb2xba2RiaWRdPWVuZ2luZTtcclxuXHRcdFx0XHRcdFx0XHRjYi5hcHBseShjb250ZXh0fHxlbmdpbmUuY29udGV4dCxbMCxlbmdpbmVdKTtcclxuXHRcdFx0XHRcdH0sY29udGV4dCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9XHJcblx0fVxyXG5cdGlmIChjYikgY2IuYXBwbHkoY29udGV4dCxba2RiaWQrXCIgbm90IGZvdW5kXCJdKTtcclxuXHRyZXR1cm4gbnVsbDtcclxufVxyXG5cclxudmFyIG9wZW5Mb2NhbEh0bWw1PWZ1bmN0aW9uKGtkYmlkLG9wdHMsY2IsY29udGV4dCkge1x0XHJcblx0dmFyIGVuZ2luZT1sb2NhbFBvb2xba2RiaWRdO1xyXG5cdHZhciBrZGJmbj1rZGJpZDtcclxuXHRpZiAoa2RiZm4uaW5kZXhPZihcIi5rZGJcIik9PS0xKSBrZGJmbis9XCIua2RiXCI7XHJcblx0bmV3IEtkYi5vcGVuKGtkYmZuLGZ1bmN0aW9uKGVycixoYW5kbGUpe1xyXG5cdFx0aWYgKGVycikge1xyXG5cdFx0XHRjYi5hcHBseShjb250ZXh0LFtlcnJdKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNyZWF0ZUxvY2FsRW5naW5lKGhhbmRsZSxvcHRzLGZ1bmN0aW9uKGVuZ2luZSl7XHJcblx0XHRcdFx0bG9jYWxQb29sW2tkYmlkXT1lbmdpbmU7XHJcblx0XHRcdFx0Y2IuYXBwbHkoY29udGV4dHx8ZW5naW5lLmNvbnRleHQsWzAsZW5naW5lXSk7XHJcblx0XHRcdH0sY29udGV4dCk7XHJcblx0XHR9XHJcblx0fSk7XHJcbn1cclxuLy9vbWl0IGNiIGZvciBzeW5jcm9uaXplIG9wZW5cclxudmFyIG9wZW5Mb2NhbD1mdW5jdGlvbihrZGJpZCxvcHRzLGNiLGNvbnRleHQpICB7XHJcblx0aWYgKHR5cGVvZiBvcHRzPT1cImZ1bmN0aW9uXCIpIHsgLy9ubyBvcHRzXHJcblx0XHRpZiAodHlwZW9mIGNiPT1cIm9iamVjdFwiKSBjb250ZXh0PWNiO1xyXG5cdFx0Y2I9b3B0cztcclxuXHRcdG9wdHM9e307XHJcblx0fVxyXG5cclxuXHR2YXIgZW5naW5lPWxvY2FsUG9vbFtrZGJpZF07XHJcblx0aWYgKGVuZ2luZSkge1xyXG5cdFx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0fHxlbmdpbmUuY29udGV4dCxbMCxlbmdpbmVdKTtcclxuXHRcdHJldHVybiBlbmdpbmU7XHJcblx0fVxyXG5cclxuXHR2YXIgcGxhdGZvcm09cmVxdWlyZShcIi4vcGxhdGZvcm1cIikuZ2V0UGxhdGZvcm0oKTtcclxuXHRpZiAocGxhdGZvcm09PVwibm9kZS13ZWJraXRcIiB8fCBwbGF0Zm9ybT09XCJub2RlXCIpIHtcclxuXHRcdG9wZW5Mb2NhbE5vZGUoa2RiaWQsb3B0cyxjYixjb250ZXh0KTtcclxuXHR9IGVsc2UgaWYgKHBsYXRmb3JtPT1cImh0bWw1XCIgfHwgcGxhdGZvcm09PVwiY2hyb21lXCIpe1xyXG5cdFx0b3BlbkxvY2FsSHRtbDUoa2RiaWQsb3B0cyxjYixjb250ZXh0KTtcdFx0XHJcblx0fSBlbHNlIHtcclxuXHRcdG9wZW5Mb2NhbEtzYW5hZ2FwKGtkYmlkLG9wdHMsY2IsY29udGV4dCk7XHRcclxuXHR9XHJcbn1cclxudmFyIHNldFBhdGg9ZnVuY3Rpb24ocGF0aCkge1xyXG5cdGFwcHBhdGg9cGF0aDtcclxuXHRjb25zb2xlLmxvZyhcInNldCBwYXRoXCIscGF0aClcclxufVxyXG5cclxudmFyIGVudW1LZGI9ZnVuY3Rpb24oY2IsY29udGV4dCl7XHJcblx0cmV0dXJuIGtkYnMubWFwKGZ1bmN0aW9uKGspe3JldHVybiBrWzBdfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzPXtvcGVuOm9wZW5Mb2NhbCxzZXRQYXRoOnNldFBhdGgsIGNsb3NlOmNsb3NlTG9jYWwsIGVudW1LZGI6ZW51bUtkYn07IiwiLyogcmV0dXJuIGFycmF5IG9mIGRiaWQgYW5kIGFic29sdXRlIHBhdGgqL1xyXG52YXIgbGlzdGtkYl9odG1sNT1mdW5jdGlvbigpIHtcclxuXHR0aHJvdyBcIm5vdCBpbXBsZW1lbnQgeWV0XCI7XHJcblx0cmVxdWlyZShcImtzYW5hLWpzb25yb21cIikuaHRtbDVmcy5yZWFkZGlyKGZ1bmN0aW9uKGtkYnMpe1xyXG5cdFx0XHRjYi5hcHBseSh0aGlzLFtrZGJzXSk7XHJcblx0fSxjb250ZXh0fHx0aGlzKTtcdFx0XHJcblxyXG59XHJcblxyXG52YXIgbGlzdGtkYl9ub2RlPWZ1bmN0aW9uKCl7XHJcblx0dmFyIGZzPXJlcXVpcmUoXCJmc1wiKTtcclxuXHR2YXIgcGF0aD1yZXF1aXJlKFwicGF0aFwiKVxyXG5cdHZhciBwYXJlbnQ9cGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksXCIuLlwiKTtcclxuXHR2YXIgZmlsZXM9ZnMucmVhZGRpclN5bmMocGFyZW50KTtcclxuXHR2YXIgb3V0cHV0PVtdO1xyXG5cdGZpbGVzLm1hcChmdW5jdGlvbihmKXtcclxuXHRcdHZhciBzdWJkaXI9cGFyZW50K3BhdGguc2VwK2Y7XHJcblx0XHR2YXIgc3RhdD1mcy5zdGF0U3luYyhzdWJkaXIgKTtcclxuXHRcdGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcclxuXHRcdFx0dmFyIHN1YmZpbGVzPWZzLnJlYWRkaXJTeW5jKHN1YmRpcik7XHJcblx0XHRcdGZvciAodmFyIGk9MDtpPHN1YmZpbGVzLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0XHR2YXIgZmlsZT1zdWJmaWxlc1tpXTtcclxuXHRcdFx0XHR2YXIgaWR4PWZpbGUuaW5kZXhPZihcIi5rZGJcIik7XHJcblx0XHRcdFx0aWYgKGlkeD4tMSYmaWR4PT1maWxlLmxlbmd0aC00KSB7XHJcblx0XHRcdFx0XHRvdXRwdXQucHVzaChbIGZpbGUuc3Vic3RyKDAsZmlsZS5sZW5ndGgtNCksIHN1YmRpcitwYXRoLnNlcCtmaWxlXSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSlcclxuXHRyZXR1cm4gb3V0cHV0O1xyXG59XHJcbnZhciBmaWxlTmFtZU9ubHk9ZnVuY3Rpb24oZm4pIHtcclxuXHR2YXIgYXQ9Zm4ubGFzdEluZGV4T2YoXCIvXCIpO1xyXG5cdGlmIChhdD4tMSkgcmV0dXJuIGZuLnN1YnN0cihhdCsxKTtcclxuXHRyZXR1cm4gZm47XHJcbn1cclxudmFyIGxpc3RrZGJfa3NhbmFnYXA9ZnVuY3Rpb24oKSB7XHJcblx0dmFyIG91dHB1dD1bXTtcclxuXHR2YXIgYXBwcz1KU09OLnBhcnNlKGtmcy5saXN0QXBwcygpKTtcclxuXHRmb3IgKHZhciBpPTA7aTxhcHBzLmxlbmd0aDtpKyspIHtcclxuXHRcdHZhciBhcHA9YXBwc1tpXTtcclxuXHRcdGlmIChhcHAuZmlsZXMpIGZvciAodmFyIGo9MDtqPGFwcC5maWxlcy5sZW5ndGg7aisrKSB7XHJcblx0XHRcdHZhciBmaWxlPWFwcC5maWxlc1tqXTtcclxuXHRcdFx0aWYgKGZpbGUuc3Vic3RyKGZpbGUubGVuZ3RoLTQpPT1cIi5rZGJcIikge1xyXG5cdFx0XHRcdG91dHB1dC5wdXNoKFthcHAuZGJpZCxmaWxlTmFtZU9ubHkoZmlsZSldKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH07XHJcblx0cmV0dXJuIG91dHB1dDtcclxufVxyXG52YXIgbGlzdGtkYj1mdW5jdGlvbigpIHtcclxuXHR2YXIgcGxhdGZvcm09cmVxdWlyZShcIi4vcGxhdGZvcm1cIikuZ2V0UGxhdGZvcm0oKTtcclxuXHR2YXIgZmlsZXM9W107XHJcblx0aWYgKHBsYXRmb3JtPT1cIm5vZGVcIiB8fCBwbGF0Zm9ybT09XCJub2RlLXdlYmtpdFwiKSB7XHJcblx0XHRmaWxlcz1saXN0a2RiX25vZGUoKTtcclxuXHR9IGVsc2UgaWYgKHR5cGVvZiBrZnMhPVwidW5kZWZpbmVkXCIpIHtcclxuXHRcdGZpbGVzPWxpc3RrZGJfa3NhbmFnYXAoKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0dGhyb3cgXCJub3QgaW1wbGVtZW50IHlldFwiO1xyXG5cdH1cclxuXHRyZXR1cm4gZmlsZXM7XHJcbn1cclxubW9kdWxlLmV4cG9ydHM9bGlzdGtkYjsiLCJ2YXIgZ2V0UGxhdGZvcm09ZnVuY3Rpb24oKSB7XHJcblx0aWYgKHR5cGVvZiBrc2FuYWdhcD09XCJ1bmRlZmluZWRcIikge1xyXG5cdFx0cGxhdGZvcm09XCJub2RlXCI7XHJcblx0fSBlbHNlIHtcclxuXHRcdHBsYXRmb3JtPWtzYW5hZ2FwLnBsYXRmb3JtO1xyXG5cdH1cclxuXHRyZXR1cm4gcGxhdGZvcm07XHJcbn1cclxubW9kdWxlLmV4cG9ydHM9e2dldFBsYXRmb3JtOmdldFBsYXRmb3JtfTsiLCJcclxuLyogZW11bGF0ZSBmaWxlc3lzdGVtIG9uIGh0bWw1IGJyb3dzZXIgKi9cclxuLyogZW11bGF0ZSBmaWxlc3lzdGVtIG9uIGh0bWw1IGJyb3dzZXIgKi9cclxudmFyIHJlYWQ9ZnVuY3Rpb24oaGFuZGxlLGJ1ZmZlcixvZmZzZXQsbGVuZ3RoLHBvc2l0aW9uLGNiKSB7Ly9idWZmZXIgYW5kIG9mZnNldCBpcyBub3QgdXNlZFxyXG5cdHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHR4aHIub3BlbignR0VUJywgaGFuZGxlLnVybCAsIHRydWUpO1xyXG5cdHZhciByYW5nZT1bcG9zaXRpb24sbGVuZ3RoK3Bvc2l0aW9uLTFdO1xyXG5cdHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdSYW5nZScsICdieXRlcz0nK3JhbmdlWzBdKyctJytyYW5nZVsxXSk7XHJcblx0eGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XHJcblx0eGhyLnNlbmQoKTtcclxuXHR4aHIub25sb2FkID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0Y2IoMCx0aGF0LnJlc3BvbnNlLmJ5dGVMZW5ndGgsdGhhdC5yZXNwb25zZSk7XHJcblx0XHR9LDApO1xyXG5cdH07IFxyXG59XHJcbnZhciBjbG9zZT1mdW5jdGlvbihoYW5kbGUpIHt9XHJcbnZhciBmc3RhdFN5bmM9ZnVuY3Rpb24oaGFuZGxlKSB7XHJcblx0dGhyb3cgXCJub3QgaW1wbGVtZW50IHlldFwiO1xyXG59XHJcbnZhciBmc3RhdD1mdW5jdGlvbihoYW5kbGUsY2IpIHtcclxuXHR0aHJvdyBcIm5vdCBpbXBsZW1lbnQgeWV0XCI7XHJcbn1cclxudmFyIF9vcGVuPWZ1bmN0aW9uKGZuX3VybCxjYikge1xyXG5cdFx0dmFyIGhhbmRsZT17fTtcclxuXHRcdGlmIChmbl91cmwuaW5kZXhPZihcImZpbGVzeXN0ZW06XCIpPT0wKXtcclxuXHRcdFx0aGFuZGxlLnVybD1mbl91cmw7XHJcblx0XHRcdGhhbmRsZS5mbj1mbl91cmwuc3Vic3RyKCBmbl91cmwubGFzdEluZGV4T2YoXCIvXCIpKzEpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aGFuZGxlLmZuPWZuX3VybDtcclxuXHRcdFx0dmFyIHVybD1BUEkuZmlsZXMuZmlsdGVyKGZ1bmN0aW9uKGYpeyByZXR1cm4gKGZbMF09PWZuX3VybCl9KTtcclxuXHRcdFx0aWYgKHVybC5sZW5ndGgpIGhhbmRsZS51cmw9dXJsWzBdWzFdO1xyXG5cdFx0XHRlbHNlIGNiKG51bGwpO1xyXG5cdFx0fVxyXG5cdFx0Y2IoaGFuZGxlKTtcclxufVxyXG52YXIgb3Blbj1mdW5jdGlvbihmbl91cmwsY2IpIHtcclxuXHRcdGlmICghQVBJLmluaXRpYWxpemVkKSB7aW5pdCgxMDI0KjEwMjQsZnVuY3Rpb24oKXtcclxuXHRcdFx0X29wZW4uYXBwbHkodGhpcyxbZm5fdXJsLGNiXSk7XHJcblx0XHR9LHRoaXMpfSBlbHNlIF9vcGVuLmFwcGx5KHRoaXMsW2ZuX3VybCxjYl0pO1xyXG59XHJcbnZhciBsb2FkPWZ1bmN0aW9uKGZpbGVuYW1lLG1vZGUsY2IpIHtcclxuXHRvcGVuKGZpbGVuYW1lLG1vZGUsY2IsdHJ1ZSk7XHJcbn1cclxuZnVuY3Rpb24gZXJyb3JIYW5kbGVyKGUpIHtcclxuXHRjb25zb2xlLmVycm9yKCdFcnJvcjogJyArZS5uYW1lKyBcIiBcIitlLm1lc3NhZ2UpO1xyXG59XHJcbnZhciByZWFkZGlyPWZ1bmN0aW9uKGNiLGNvbnRleHQpIHtcclxuXHQgdmFyIGRpclJlYWRlciA9IEFQSS5mcy5yb290LmNyZWF0ZVJlYWRlcigpO1xyXG5cdCB2YXIgb3V0PVtdLHRoYXQ9dGhpcztcclxuXHRcdGRpclJlYWRlci5yZWFkRW50cmllcyhmdW5jdGlvbihlbnRyaWVzKSB7XHJcblx0XHRcdGlmIChlbnRyaWVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBlbnRyeTsgZW50cnkgPSBlbnRyaWVzW2ldOyArK2kpIHtcclxuXHRcdFx0XHRcdGlmIChlbnRyeS5pc0ZpbGUpIHtcclxuXHRcdFx0XHRcdFx0b3V0LnB1c2goW2VudHJ5Lm5hbWUsZW50cnkudG9VUkwgPyBlbnRyeS50b1VSTCgpIDogZW50cnkudG9VUkkoKV0pO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRBUEkuZmlsZXM9b3V0O1xyXG5cdFx0XHRpZiAoY2IpIGNiLmFwcGx5KGNvbnRleHQsW291dF0pO1xyXG5cdFx0fSwgZnVuY3Rpb24oKXtcclxuXHRcdFx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtudWxsXSk7XHJcblx0XHR9KTtcclxufVxyXG52YXIgaW5pdGZzPWZ1bmN0aW9uKGdyYW50ZWRCeXRlcyxjYixjb250ZXh0KSB7XHJcblx0d2Via2l0UmVxdWVzdEZpbGVTeXN0ZW0oUEVSU0lTVEVOVCwgZ3JhbnRlZEJ5dGVzLCAgZnVuY3Rpb24oZnMpIHtcclxuXHRcdEFQSS5mcz1mcztcclxuXHRcdEFQSS5xdW90YT1ncmFudGVkQnl0ZXM7XHJcblx0XHRyZWFkZGlyKGZ1bmN0aW9uKCl7XHJcblx0XHRcdEFQSS5pbml0aWFsaXplZD10cnVlO1xyXG5cdFx0XHRjYi5hcHBseShjb250ZXh0LFtncmFudGVkQnl0ZXMsZnNdKTtcclxuXHRcdH0sY29udGV4dCk7XHJcblx0fSwgZXJyb3JIYW5kbGVyKTtcclxufVxyXG52YXIgaW5pdD1mdW5jdGlvbihxdW90YSxjYixjb250ZXh0KSB7XHJcblx0bmF2aWdhdG9yLndlYmtpdFBlcnNpc3RlbnRTdG9yYWdlLnJlcXVlc3RRdW90YShxdW90YSwgXHJcblx0XHRcdGZ1bmN0aW9uKGdyYW50ZWRCeXRlcykge1xyXG5cdFx0XHRcdGluaXRmcyhncmFudGVkQnl0ZXMsY2IsY29udGV4dCk7XHJcblx0XHR9LCBlcnJvckhhbmRsZXIgXHJcblx0KTtcclxufVxyXG52YXIgQVBJPXtcclxuXHRyZWFkOnJlYWRcclxuXHQscmVhZGRpcjpyZWFkZGlyXHJcblx0LG9wZW46b3BlblxyXG5cdCxjbG9zZTpjbG9zZVxyXG5cdCxmc3RhdFN5bmM6ZnN0YXRTeW5jXHJcblx0LGZzdGF0OmZzdGF0XHJcbn1cclxubW9kdWxlLmV4cG9ydHM9QVBJOyIsIm1vZHVsZS5leHBvcnRzPXtcclxuXHRvcGVuOnJlcXVpcmUoXCIuL2tkYlwiKVxyXG59XHJcbiIsIi8qXHJcblx0S0RCIHZlcnNpb24gMy4wIEdQTFxyXG5cdHlhcGNoZWFoc2hlbkBnbWFpbC5jb21cclxuXHQyMDEzLzEyLzI4XHJcblx0YXN5bmNyb25pemUgdmVyc2lvbiBvZiB5YWRiXHJcblxyXG4gIHJlbW92ZSBkZXBlbmRlbmN5IG9mIFEsIHRoYW5rcyB0b1xyXG4gIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNDIzNDYxOS9ob3ctdG8tYXZvaWQtbG9uZy1uZXN0aW5nLW9mLWFzeW5jaHJvbm91cy1mdW5jdGlvbnMtaW4tbm9kZS1qc1xyXG5cclxuICAyMDE1LzEvMlxyXG4gIG1vdmVkIHRvIGtzYW5hZm9yZ2Uva3NhbmEtanNvbnJvbVxyXG4gIGFkZCBlcnIgaW4gY2FsbGJhY2sgZm9yIG5vZGUuanMgY29tcGxpYW50XHJcbiovXHJcbnZhciBLZnM9bnVsbDtcclxuXHJcbmlmICh0eXBlb2Yga3NhbmFnYXA9PVwidW5kZWZpbmVkXCIpIHtcclxuXHRLZnM9cmVxdWlyZSgnLi9rZGJmcycpO1x0XHRcdFxyXG59IGVsc2Uge1xyXG5cdGlmIChrc2FuYWdhcC5wbGF0Zm9ybT09XCJpb3NcIikge1xyXG5cdFx0S2ZzPXJlcXVpcmUoXCIuL2tkYmZzX2lvc1wiKTtcclxuXHR9IGVsc2UgaWYgKGtzYW5hZ2FwLnBsYXRmb3JtPT1cIm5vZGUtd2Via2l0XCIpIHtcclxuXHRcdEtmcz1yZXF1aXJlKFwiLi9rZGJmc1wiKTtcclxuXHR9IGVsc2UgaWYgKGtzYW5hZ2FwLnBsYXRmb3JtPT1cImNocm9tZVwiKSB7XHJcblx0XHRLZnM9cmVxdWlyZShcIi4va2RiZnNcIik7XHJcblx0fSBlbHNlIHtcclxuXHRcdEtmcz1yZXF1aXJlKFwiLi9rZGJmc19hbmRyb2lkXCIpO1xyXG5cdH1cclxuXHRcdFxyXG59XHJcblxyXG5cclxudmFyIERUPXtcclxuXHR1aW50ODonMScsIC8vdW5zaWduZWQgMSBieXRlIGludGVnZXJcclxuXHRpbnQzMjonNCcsIC8vIHNpZ25lZCA0IGJ5dGVzIGludGVnZXJcclxuXHR1dGY4Oic4JywgIFxyXG5cdHVjczI6JzInLFxyXG5cdGJvb2w6J14nLCBcclxuXHRibG9iOicmJyxcclxuXHR1dGY4YXJyOicqJywgLy9zaGlmdCBvZiA4XHJcblx0dWNzMmFycjonQCcsIC8vc2hpZnQgb2YgMlxyXG5cdHVpbnQ4YXJyOichJywgLy9zaGlmdCBvZiAxXHJcblx0aW50MzJhcnI6JyQnLCAvL3NoaWZ0IG9mIDRcclxuXHR2aW50OidgJyxcclxuXHRwaW50Oid+JyxcdFxyXG5cclxuXHRhcnJheTonXFx1MDAxYicsXHJcblx0b2JqZWN0OidcXHUwMDFhJyBcclxuXHQvL3lkYiBzdGFydCB3aXRoIG9iamVjdCBzaWduYXR1cmUsXHJcblx0Ly90eXBlIGEgeWRiIGluIGNvbW1hbmQgcHJvbXB0IHNob3dzIG5vdGhpbmdcclxufVxyXG52YXIgdmVyYm9zZT0wLCByZWFkTG9nPWZ1bmN0aW9uKCl7fTtcclxudmFyIF9yZWFkTG9nPWZ1bmN0aW9uKHJlYWR0eXBlLGJ5dGVzKSB7XHJcblx0Y29uc29sZS5sb2cocmVhZHR5cGUsYnl0ZXMsXCJieXRlc1wiKTtcclxufVxyXG5pZiAodmVyYm9zZSkgcmVhZExvZz1fcmVhZExvZztcclxudmFyIHN0cnNlcD1cIlxcdWZmZmZcIjtcclxudmFyIENyZWF0ZT1mdW5jdGlvbihwYXRoLG9wdHMsY2IpIHtcclxuXHQvKiBsb2FkeHh4IGZ1bmN0aW9ucyBtb3ZlIGZpbGUgcG9pbnRlciAqL1xyXG5cdC8vIGxvYWQgdmFyaWFibGUgbGVuZ3RoIGludFxyXG5cdGlmICh0eXBlb2Ygb3B0cz09XCJmdW5jdGlvblwiKSB7XHJcblx0XHRjYj1vcHRzO1xyXG5cdFx0b3B0cz17fTtcclxuXHR9XHJcblxyXG5cdFxyXG5cdHZhciBsb2FkVkludCA9ZnVuY3Rpb24ob3B0cyxibG9ja3NpemUsY291bnQsY2IpIHtcclxuXHRcdC8vaWYgKGNvdW50PT0wKSByZXR1cm4gW107XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cclxuXHRcdHRoaXMuZnMucmVhZEJ1Zl9wYWNrZWRpbnQob3B0cy5jdXIsYmxvY2tzaXplLGNvdW50LHRydWUsZnVuY3Rpb24obyl7XHJcblx0XHRcdC8vY29uc29sZS5sb2coXCJ2aW50XCIpO1xyXG5cdFx0XHRvcHRzLmN1cis9by5hZHY7XHJcblx0XHRcdGNiLmFwcGx5KHRoYXQsW28uZGF0YV0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cdHZhciBsb2FkVkludDE9ZnVuY3Rpb24ob3B0cyxjYikge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdGxvYWRWSW50LmFwcGx5KHRoaXMsW29wdHMsNiwxLGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKFwidmludDFcIik7XHJcblx0XHRcdGNiLmFwcGx5KHRoYXQsW2RhdGFbMF1dKTtcclxuXHRcdH1dKVxyXG5cdH1cclxuXHQvL2ZvciBwb3N0aW5nc1xyXG5cdHZhciBsb2FkUEludCA9ZnVuY3Rpb24ob3B0cyxibG9ja3NpemUsY291bnQsY2IpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR0aGlzLmZzLnJlYWRCdWZfcGFja2VkaW50KG9wdHMuY3VyLGJsb2Nrc2l6ZSxjb3VudCxmYWxzZSxmdW5jdGlvbihvKXtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZyhcInBpbnRcIik7XHJcblx0XHRcdG9wdHMuY3VyKz1vLmFkdjtcclxuXHRcdFx0Y2IuYXBwbHkodGhhdCxbby5kYXRhXSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblx0Ly8gaXRlbSBjYW4gYmUgYW55IHR5cGUgKHZhcmlhYmxlIGxlbmd0aClcclxuXHQvLyBtYXhpbXVtIHNpemUgb2YgYXJyYXkgaXMgMVRCIDJeNDBcclxuXHQvLyBzdHJ1Y3R1cmU6XHJcblx0Ly8gc2lnbmF0dXJlLDUgYnl0ZXMgb2Zmc2V0LCBwYXlsb2FkLCBpdGVtbGVuZ3Roc1xyXG5cdHZhciBnZXRBcnJheUxlbmd0aD1mdW5jdGlvbihvcHRzLGNiKSB7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0dmFyIGRhdGFvZmZzZXQ9MDtcclxuXHJcblx0XHR0aGlzLmZzLnJlYWRVSTgob3B0cy5jdXIsZnVuY3Rpb24obGVuKXtcclxuXHRcdFx0dmFyIGxlbmd0aG9mZnNldD1sZW4qNDI5NDk2NzI5NjtcclxuXHRcdFx0b3B0cy5jdXIrKztcclxuXHRcdFx0dGhhdC5mcy5yZWFkVUkzMihvcHRzLmN1cixmdW5jdGlvbihsZW4pe1xyXG5cdFx0XHRcdG9wdHMuY3VyKz00O1xyXG5cdFx0XHRcdGRhdGFvZmZzZXQ9b3B0cy5jdXI7IC8va2VlcCB0aGlzXHJcblx0XHRcdFx0bGVuZ3Rob2Zmc2V0Kz1sZW47XHJcblx0XHRcdFx0b3B0cy5jdXIrPWxlbmd0aG9mZnNldDtcclxuXHJcblx0XHRcdFx0bG9hZFZJbnQxLmFwcGx5KHRoYXQsW29wdHMsZnVuY3Rpb24oY291bnQpe1xyXG5cdFx0XHRcdFx0bG9hZFZJbnQuYXBwbHkodGhhdCxbb3B0cyxjb3VudCo2LGNvdW50LGZ1bmN0aW9uKHN6KXtcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0Y2Ioe2NvdW50OmNvdW50LHN6OnN6LG9mZnNldDpkYXRhb2Zmc2V0fSk7XHJcblx0XHRcdFx0XHR9XSk7XHJcblx0XHRcdFx0fV0pO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0dmFyIGxvYWRBcnJheSA9IGZ1bmN0aW9uKG9wdHMsYmxvY2tzaXplLGNiKSB7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0Z2V0QXJyYXlMZW5ndGguYXBwbHkodGhpcyxbb3B0cyxmdW5jdGlvbihMKXtcclxuXHRcdFx0XHR2YXIgbz1bXTtcclxuXHRcdFx0XHR2YXIgZW5kY3VyPW9wdHMuY3VyO1xyXG5cdFx0XHRcdG9wdHMuY3VyPUwub2Zmc2V0O1xyXG5cclxuXHRcdFx0XHRpZiAob3B0cy5sYXp5KSB7IFxyXG5cdFx0XHRcdFx0XHR2YXIgb2Zmc2V0PUwub2Zmc2V0O1xyXG5cdFx0XHRcdFx0XHRMLnN6Lm1hcChmdW5jdGlvbihzeil7XHJcblx0XHRcdFx0XHRcdFx0b1tvLmxlbmd0aF09c3Ryc2VwK29mZnNldC50b1N0cmluZygxNilcclxuXHRcdFx0XHRcdFx0XHRcdCAgICtzdHJzZXArc3oudG9TdHJpbmcoMTYpO1xyXG5cdFx0XHRcdFx0XHRcdG9mZnNldCs9c3o7XHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHZhciB0YXNrcXVldWU9W107XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpPTA7aTxMLmNvdW50O2krKykge1xyXG5cdFx0XHRcdFx0XHR0YXNrcXVldWUucHVzaChcclxuXHRcdFx0XHRcdFx0XHQoZnVuY3Rpb24oc3ope1xyXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIChcclxuXHRcdFx0XHRcdFx0XHRcdFx0ZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBkYXRhPT0nb2JqZWN0JyAmJiBkYXRhLl9fZW1wdHkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCAvL25vdCBwdXNoaW5nIHRoZSBmaXJzdCBjYWxsXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVx0ZWxzZSBvLnB1c2goZGF0YSk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0b3B0cy5ibG9ja3NpemU9c3o7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0bG9hZC5hcHBseSh0aGF0LFtvcHRzLCB0YXNrcXVldWUuc2hpZnQoKV0pO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0XHRcdH0pKEwuc3pbaV0pXHJcblx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2xhc3QgY2FsbCB0byBjaGlsZCBsb2FkXHJcblx0XHRcdFx0XHR0YXNrcXVldWUucHVzaChmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRcdFx0by5wdXNoKGRhdGEpO1xyXG5cdFx0XHRcdFx0XHRvcHRzLmN1cj1lbmRjdXI7XHJcblx0XHRcdFx0XHRcdGNiLmFwcGx5KHRoYXQsW29dKTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKG9wdHMubGF6eSkgY2IuYXBwbHkodGhhdCxbb10pO1xyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0dGFza3F1ZXVlLnNoaWZ0KCkoe19fZW1wdHk6dHJ1ZX0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XSlcclxuXHR9XHRcdFxyXG5cdC8vIGl0ZW0gY2FuIGJlIGFueSB0eXBlICh2YXJpYWJsZSBsZW5ndGgpXHJcblx0Ly8gc3VwcG9ydCBsYXp5IGxvYWRcclxuXHQvLyBzdHJ1Y3R1cmU6XHJcblx0Ly8gc2lnbmF0dXJlLDUgYnl0ZXMgb2Zmc2V0LCBwYXlsb2FkLCBpdGVtbGVuZ3RocywgXHJcblx0Ly8gICAgICAgICAgICAgICAgICAgIHN0cmluZ2FycmF5X3NpZ25hdHVyZSwga2V5c1xyXG5cdHZhciBsb2FkT2JqZWN0ID0gZnVuY3Rpb24ob3B0cyxibG9ja3NpemUsY2IpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR2YXIgc3RhcnQ9b3B0cy5jdXI7XHJcblx0XHRnZXRBcnJheUxlbmd0aC5hcHBseSh0aGlzLFtvcHRzLGZ1bmN0aW9uKEwpIHtcclxuXHRcdFx0b3B0cy5ibG9ja3NpemU9YmxvY2tzaXplLW9wdHMuY3VyK3N0YXJ0O1xyXG5cdFx0XHRsb2FkLmFwcGx5KHRoYXQsW29wdHMsZnVuY3Rpb24oa2V5cyl7IC8vbG9hZCB0aGUga2V5c1xyXG5cdFx0XHRcdGlmIChvcHRzLmtleXMpIHsgLy9jYWxsZXIgYXNrIGZvciBrZXlzXHJcblx0XHRcdFx0XHRrZXlzLm1hcChmdW5jdGlvbihrKSB7IG9wdHMua2V5cy5wdXNoKGspfSk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR2YXIgbz17fTtcclxuXHRcdFx0XHR2YXIgZW5kY3VyPW9wdHMuY3VyO1xyXG5cdFx0XHRcdG9wdHMuY3VyPUwub2Zmc2V0O1xyXG5cdFx0XHRcdGlmIChvcHRzLmxhenkpIHsgXHJcblx0XHRcdFx0XHR2YXIgb2Zmc2V0PUwub2Zmc2V0O1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaT0wO2k8TC5zei5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdFx0XHRcdC8vcHJlZml4IHdpdGggYSBcXDAsIGltcG9zc2libGUgZm9yIG5vcm1hbCBzdHJpbmdcclxuXHRcdFx0XHRcdFx0b1trZXlzW2ldXT1zdHJzZXArb2Zmc2V0LnRvU3RyaW5nKDE2KVxyXG5cdFx0XHRcdFx0XHRcdCAgICtzdHJzZXArTC5zeltpXS50b1N0cmluZygxNik7XHJcblx0XHRcdFx0XHRcdG9mZnNldCs9TC5zeltpXTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dmFyIHRhc2txdWV1ZT1bXTtcclxuXHRcdFx0XHRcdGZvciAodmFyIGk9MDtpPEwuY291bnQ7aSsrKSB7XHJcblx0XHRcdFx0XHRcdHRhc2txdWV1ZS5wdXNoKFxyXG5cdFx0XHRcdFx0XHRcdChmdW5jdGlvbihzeixrZXkpe1xyXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIChcclxuXHRcdFx0XHRcdFx0XHRcdFx0ZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBkYXRhPT0nb2JqZWN0JyAmJiBkYXRhLl9fZW1wdHkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vbm90IHNhdmluZyB0aGUgZmlyc3QgY2FsbDtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0b1trZXldPWRhdGE7IFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRvcHRzLmJsb2Nrc2l6ZT1zejtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodmVyYm9zZSkgcmVhZExvZyhcImtleVwiLGtleSk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0bG9hZC5hcHBseSh0aGF0LFtvcHRzLCB0YXNrcXVldWUuc2hpZnQoKV0pO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0XHRcdH0pKEwuc3pbaV0sa2V5c1tpLTFdKVxyXG5cclxuXHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vbGFzdCBjYWxsIHRvIGNoaWxkIGxvYWRcclxuXHRcdFx0XHRcdHRhc2txdWV1ZS5wdXNoKGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRcdFx0XHRvW2tleXNba2V5cy5sZW5ndGgtMV1dPWRhdGE7XHJcblx0XHRcdFx0XHRcdG9wdHMuY3VyPWVuZGN1cjtcclxuXHRcdFx0XHRcdFx0Y2IuYXBwbHkodGhhdCxbb10pO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChvcHRzLmxhenkpIGNiLmFwcGx5KHRoYXQsW29dKTtcclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdHRhc2txdWV1ZS5zaGlmdCgpKHtfX2VtcHR5OnRydWV9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1dKTtcclxuXHRcdH1dKTtcclxuXHR9XHJcblxyXG5cdC8vaXRlbSBpcyBzYW1lIGtub3duIHR5cGVcclxuXHR2YXIgbG9hZFN0cmluZ0FycmF5PWZ1bmN0aW9uKG9wdHMsYmxvY2tzaXplLGVuY29kaW5nLGNiKSB7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0dGhpcy5mcy5yZWFkU3RyaW5nQXJyYXkob3B0cy5jdXIsYmxvY2tzaXplLGVuY29kaW5nLGZ1bmN0aW9uKG8pe1xyXG5cdFx0XHRvcHRzLmN1cis9YmxvY2tzaXplO1xyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFtvXSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblx0dmFyIGxvYWRJbnRlZ2VyQXJyYXk9ZnVuY3Rpb24ob3B0cyxibG9ja3NpemUsdW5pdHNpemUsY2IpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRsb2FkVkludDEuYXBwbHkodGhpcyxbb3B0cyxmdW5jdGlvbihjb3VudCl7XHJcblx0XHRcdHZhciBvPXRoYXQuZnMucmVhZEZpeGVkQXJyYXkob3B0cy5jdXIsY291bnQsdW5pdHNpemUsZnVuY3Rpb24obyl7XHJcblx0XHRcdFx0b3B0cy5jdXIrPWNvdW50KnVuaXRzaXplO1xyXG5cdFx0XHRcdGNiLmFwcGx5KHRoYXQsW29dKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XSk7XHJcblx0fVxyXG5cdHZhciBsb2FkQmxvYj1mdW5jdGlvbihibG9ja3NpemUsY2IpIHtcclxuXHRcdHZhciBvPXRoaXMuZnMucmVhZEJ1Zih0aGlzLmN1cixibG9ja3NpemUpO1xyXG5cdFx0dGhpcy5jdXIrPWJsb2Nrc2l6ZTtcclxuXHRcdHJldHVybiBvO1xyXG5cdH1cdFxyXG5cdHZhciBsb2FkYnlzaWduYXR1cmU9ZnVuY3Rpb24ob3B0cyxzaWduYXR1cmUsY2IpIHtcclxuXHRcdCAgdmFyIGJsb2Nrc2l6ZT1vcHRzLmJsb2Nrc2l6ZXx8dGhpcy5mcy5zaXplOyBcclxuXHRcdFx0b3B0cy5jdXIrPXRoaXMuZnMuc2lnbmF0dXJlX3NpemU7XHJcblx0XHRcdHZhciBkYXRhc2l6ZT1ibG9ja3NpemUtdGhpcy5mcy5zaWduYXR1cmVfc2l6ZTtcclxuXHRcdFx0Ly9iYXNpYyB0eXBlc1xyXG5cdFx0XHRpZiAoc2lnbmF0dXJlPT09RFQuaW50MzIpIHtcclxuXHRcdFx0XHRvcHRzLmN1cis9NDtcclxuXHRcdFx0XHR0aGlzLmZzLnJlYWRJMzIob3B0cy5jdXItNCxjYik7XHJcblx0XHRcdH0gZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQudWludDgpIHtcclxuXHRcdFx0XHRvcHRzLmN1cisrO1xyXG5cdFx0XHRcdHRoaXMuZnMucmVhZFVJOChvcHRzLmN1ci0xLGNiKTtcclxuXHRcdFx0fSBlbHNlIGlmIChzaWduYXR1cmU9PT1EVC51dGY4KSB7XHJcblx0XHRcdFx0dmFyIGM9b3B0cy5jdXI7b3B0cy5jdXIrPWRhdGFzaXplO1xyXG5cdFx0XHRcdHRoaXMuZnMucmVhZFN0cmluZyhjLGRhdGFzaXplLCd1dGY4JyxjYik7XHJcblx0XHRcdH0gZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQudWNzMikge1xyXG5cdFx0XHRcdHZhciBjPW9wdHMuY3VyO29wdHMuY3VyKz1kYXRhc2l6ZTtcclxuXHRcdFx0XHR0aGlzLmZzLnJlYWRTdHJpbmcoYyxkYXRhc2l6ZSwndWNzMicsY2IpO1x0XHJcblx0XHRcdH0gZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQuYm9vbCkge1xyXG5cdFx0XHRcdG9wdHMuY3VyKys7XHJcblx0XHRcdFx0dGhpcy5mcy5yZWFkVUk4KG9wdHMuY3VyLTEsZnVuY3Rpb24oZGF0YSl7Y2IoISFkYXRhKX0pO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHNpZ25hdHVyZT09PURULmJsb2IpIHtcclxuXHRcdFx0XHRsb2FkQmxvYihkYXRhc2l6ZSxjYik7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly92YXJpYWJsZSBsZW5ndGggaW50ZWdlcnNcclxuXHRcdFx0ZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQudmludCkge1xyXG5cdFx0XHRcdGxvYWRWSW50LmFwcGx5KHRoaXMsW29wdHMsZGF0YXNpemUsZGF0YXNpemUsY2JdKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChzaWduYXR1cmU9PT1EVC5waW50KSB7XHJcblx0XHRcdFx0bG9hZFBJbnQuYXBwbHkodGhpcyxbb3B0cyxkYXRhc2l6ZSxkYXRhc2l6ZSxjYl0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vc2ltcGxlIGFycmF5XHJcblx0XHRcdGVsc2UgaWYgKHNpZ25hdHVyZT09PURULnV0ZjhhcnIpIHtcclxuXHRcdFx0XHRsb2FkU3RyaW5nQXJyYXkuYXBwbHkodGhpcyxbb3B0cyxkYXRhc2l6ZSwndXRmOCcsY2JdKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChzaWduYXR1cmU9PT1EVC51Y3MyYXJyKSB7XHJcblx0XHRcdFx0bG9hZFN0cmluZ0FycmF5LmFwcGx5KHRoaXMsW29wdHMsZGF0YXNpemUsJ3VjczInLGNiXSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQudWludDhhcnIpIHtcclxuXHRcdFx0XHRsb2FkSW50ZWdlckFycmF5LmFwcGx5KHRoaXMsW29wdHMsZGF0YXNpemUsMSxjYl0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHNpZ25hdHVyZT09PURULmludDMyYXJyKSB7XHJcblx0XHRcdFx0bG9hZEludGVnZXJBcnJheS5hcHBseSh0aGlzLFtvcHRzLGRhdGFzaXplLDQsY2JdKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvL25lc3RlZCBzdHJ1Y3R1cmVcclxuXHRcdFx0ZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQuYXJyYXkpIHtcclxuXHRcdFx0XHRsb2FkQXJyYXkuYXBwbHkodGhpcyxbb3B0cyxkYXRhc2l6ZSxjYl0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHNpZ25hdHVyZT09PURULm9iamVjdCkge1xyXG5cdFx0XHRcdGxvYWRPYmplY3QuYXBwbHkodGhpcyxbb3B0cyxkYXRhc2l6ZSxjYl0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ3Vuc3VwcG9ydGVkIHR5cGUnLHNpZ25hdHVyZSxvcHRzKVxyXG5cdFx0XHRcdGNiLmFwcGx5KHRoaXMsW251bGxdKTsvL21ha2Ugc3VyZSBpdCByZXR1cm5cclxuXHRcdFx0XHQvL3Rocm93ICd1bnN1cHBvcnRlZCB0eXBlICcrc2lnbmF0dXJlO1xyXG5cdFx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgbG9hZD1mdW5jdGlvbihvcHRzLGNiKSB7XHJcblx0XHRvcHRzPW9wdHN8fHt9OyAvLyB0aGlzIHdpbGwgc2VydmVkIGFzIGNvbnRleHQgZm9yIGVudGlyZSBsb2FkIHByb2NlZHVyZVxyXG5cdFx0b3B0cy5jdXI9b3B0cy5jdXJ8fDA7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0dGhpcy5mcy5yZWFkU2lnbmF0dXJlKG9wdHMuY3VyLCBmdW5jdGlvbihzaWduYXR1cmUpe1xyXG5cdFx0XHRsb2FkYnlzaWduYXR1cmUuYXBwbHkodGhhdCxbb3B0cyxzaWduYXR1cmUsY2JdKVxyXG5cdFx0fSk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblx0dmFyIENBQ0hFPW51bGw7XHJcblx0dmFyIEtFWT17fTtcclxuXHR2YXIgQUREUkVTUz17fTtcclxuXHR2YXIgcmVzZXQ9ZnVuY3Rpb24oY2IpIHtcclxuXHRcdGlmICghQ0FDSEUpIHtcclxuXHRcdFx0bG9hZC5hcHBseSh0aGlzLFt7Y3VyOjAsbGF6eTp0cnVlfSxmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRDQUNIRT1kYXRhO1xyXG5cdFx0XHRcdGNiLmNhbGwodGhpcyk7XHJcblx0XHRcdH1dKTtcdFxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y2IuY2FsbCh0aGlzKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciBleGlzdHM9ZnVuY3Rpb24ocGF0aCxjYikge1xyXG5cdFx0aWYgKHBhdGgubGVuZ3RoPT0wKSByZXR1cm4gdHJ1ZTtcclxuXHRcdHZhciBrZXk9cGF0aC5wb3AoKTtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRnZXQuYXBwbHkodGhpcyxbcGF0aCxmYWxzZSxmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0aWYgKCFwYXRoLmpvaW4oc3Ryc2VwKSkgcmV0dXJuICghIUtFWVtrZXldKTtcclxuXHRcdFx0dmFyIGtleXM9S0VZW3BhdGguam9pbihzdHJzZXApXTtcclxuXHRcdFx0cGF0aC5wdXNoKGtleSk7Ly9wdXQgaXQgYmFja1xyXG5cdFx0XHRpZiAoa2V5cykgY2IuYXBwbHkodGhhdCxba2V5cy5pbmRleE9mKGtleSk+LTFdKTtcclxuXHRcdFx0ZWxzZSBjYi5hcHBseSh0aGF0LFtmYWxzZV0pO1xyXG5cdFx0fV0pO1xyXG5cdH1cclxuXHJcblx0dmFyIGdldFN5bmM9ZnVuY3Rpb24ocGF0aCkge1xyXG5cdFx0aWYgKCFDQUNIRSkgcmV0dXJuIHVuZGVmaW5lZDtcdFxyXG5cdFx0dmFyIG89Q0FDSEU7XHJcblx0XHRmb3IgKHZhciBpPTA7aTxwYXRoLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0dmFyIHI9b1twYXRoW2ldXTtcclxuXHRcdFx0aWYgKHR5cGVvZiByPT1cInVuZGVmaW5lZFwiKSByZXR1cm4gbnVsbDtcclxuXHRcdFx0bz1yO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIG87XHJcblx0fVxyXG5cdHZhciBnZXQ9ZnVuY3Rpb24ocGF0aCxvcHRzLGNiKSB7XHJcblx0XHRpZiAodHlwZW9mIHBhdGg9PSd1bmRlZmluZWQnKSBwYXRoPVtdO1xyXG5cdFx0aWYgKHR5cGVvZiBwYXRoPT1cInN0cmluZ1wiKSBwYXRoPVtwYXRoXTtcclxuXHRcdC8vb3B0cy5yZWN1cnNpdmU9ISFvcHRzLnJlY3Vyc2l2ZTtcclxuXHRcdGlmICh0eXBlb2Ygb3B0cz09XCJmdW5jdGlvblwiKSB7XHJcblx0XHRcdGNiPW9wdHM7bm9kZVxyXG5cdFx0XHRvcHRzPXt9O1xyXG5cdFx0fVxyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdGlmICh0eXBlb2YgY2IhPSdmdW5jdGlvbicpIHJldHVybiBnZXRTeW5jKHBhdGgpO1xyXG5cclxuXHRcdHJlc2V0LmFwcGx5KHRoaXMsW2Z1bmN0aW9uKCl7XHJcblx0XHRcdHZhciBvPUNBQ0hFO1xyXG5cdFx0XHRpZiAocGF0aC5sZW5ndGg9PTApIHtcclxuXHRcdFx0XHRpZiAob3B0cy5hZGRyZXNzKSB7XHJcblx0XHRcdFx0XHRjYihbMCx0aGF0LmZzLnNpemVdKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0Y2IoW09iamVjdC5rZXlzKENBQ0hFKV0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH0gXHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgcGF0aG5vdz1cIlwiLHRhc2txdWV1ZT1bXSxuZXdvcHRzPXt9LHI9bnVsbDtcclxuXHRcdFx0dmFyIGxhc3RrZXk9XCJcIjtcclxuXHJcblx0XHRcdGZvciAodmFyIGk9MDtpPHBhdGgubGVuZ3RoO2krKykge1xyXG5cdFx0XHRcdHZhciB0YXNrPShmdW5jdGlvbihrZXksayl7XHJcblxyXG5cdFx0XHRcdFx0cmV0dXJuIChmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRcdFx0aWYgKCEodHlwZW9mIGRhdGE9PSdvYmplY3QnICYmIGRhdGEuX19lbXB0eSkpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIG9bbGFzdGtleV09PSdzdHJpbmcnICYmIG9bbGFzdGtleV1bMF09PXN0cnNlcCkgb1tsYXN0a2V5XT17fTtcclxuXHRcdFx0XHRcdFx0XHRvW2xhc3RrZXldPWRhdGE7IFxyXG5cdFx0XHRcdFx0XHRcdG89b1tsYXN0a2V5XTtcclxuXHRcdFx0XHRcdFx0XHRyPWRhdGFba2V5XTtcclxuXHRcdFx0XHRcdFx0XHRLRVlbcGF0aG5vd109b3B0cy5rZXlzO1x0XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRkYXRhPW9ba2V5XTtcclxuXHRcdFx0XHRcdFx0XHRyPWRhdGE7XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygcj09PVwidW5kZWZpbmVkXCIpIHtcclxuXHRcdFx0XHRcdFx0XHR0YXNrcXVldWU9bnVsbDtcclxuXHRcdFx0XHRcdFx0XHRjYi5hcHBseSh0aGF0LFtyXSk7IC8vcmV0dXJuIGVtcHR5IHZhbHVlXHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHRpZiAocGFyc2VJbnQoaykpIHBhdGhub3crPXN0cnNlcDtcclxuXHRcdFx0XHRcdFx0XHRwYXRobm93Kz1rZXk7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiByPT0nc3RyaW5nJyAmJiByWzBdPT1zdHJzZXApIHsgLy9vZmZzZXQgb2YgZGF0YSB0byBiZSBsb2FkZWRcclxuXHRcdFx0XHRcdFx0XHRcdHZhciBwPXIuc3Vic3RyaW5nKDEpLnNwbGl0KHN0cnNlcCkubWFwKGZ1bmN0aW9uKGl0ZW0pe3JldHVybiBwYXJzZUludChpdGVtLDE2KX0pO1xyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGN1cj1wWzBdLHN6PXBbMV07XHJcblx0XHRcdFx0XHRcdFx0XHRuZXdvcHRzLmxhenk9IW9wdHMucmVjdXJzaXZlIHx8IChrPHBhdGgubGVuZ3RoLTEpIDtcclxuXHRcdFx0XHRcdFx0XHRcdG5ld29wdHMuYmxvY2tzaXplPXN6O25ld29wdHMuY3VyPWN1cixuZXdvcHRzLmtleXM9W107XHJcblx0XHRcdFx0XHRcdFx0XHRsYXN0a2V5PWtleTsgLy9sb2FkIGlzIHN5bmMgaW4gYW5kcm9pZFxyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG9wdHMuYWRkcmVzcyAmJiB0YXNrcXVldWUubGVuZ3RoPT0xKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdEFERFJFU1NbcGF0aG5vd109W2N1cixzel07XHJcblx0XHRcdFx0XHRcdFx0XHRcdHRhc2txdWV1ZS5zaGlmdCgpKG51bGwsQUREUkVTU1twYXRobm93XSk7XHJcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRsb2FkLmFwcGx5KHRoYXQsW25ld29wdHMsIHRhc2txdWV1ZS5zaGlmdCgpXSk7XHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdGlmIChvcHRzLmFkZHJlc3MgJiYgdGFza3F1ZXVlLmxlbmd0aD09MSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR0YXNrcXVldWUuc2hpZnQoKShudWxsLEFERFJFU1NbcGF0aG5vd10pO1xyXG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0dGFza3F1ZXVlLnNoaWZ0KCkuYXBwbHkodGhhdCxbcl0pO1xyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHRcdChwYXRoW2ldLGkpO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHRhc2txdWV1ZS5wdXNoKHRhc2spO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAodGFza3F1ZXVlLmxlbmd0aD09MCkge1xyXG5cdFx0XHRcdGNiLmFwcGx5KHRoYXQsW29dKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHQvL2xhc3QgY2FsbCB0byBjaGlsZCBsb2FkXHJcblx0XHRcdFx0dGFza3F1ZXVlLnB1c2goZnVuY3Rpb24oZGF0YSxjdXJzeil7XHJcblx0XHRcdFx0XHRpZiAob3B0cy5hZGRyZXNzKSB7XHJcblx0XHRcdFx0XHRcdGNiLmFwcGx5KHRoYXQsW2N1cnN6XSk7XHJcblx0XHRcdFx0XHR9IGVsc2V7XHJcblx0XHRcdFx0XHRcdHZhciBrZXk9cGF0aFtwYXRoLmxlbmd0aC0xXTtcclxuXHRcdFx0XHRcdFx0b1trZXldPWRhdGE7IEtFWVtwYXRobm93XT1vcHRzLmtleXM7XHJcblx0XHRcdFx0XHRcdGNiLmFwcGx5KHRoYXQsW2RhdGFdKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHR0YXNrcXVldWUuc2hpZnQoKSh7X19lbXB0eTp0cnVlfSk7XHRcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHR9XSk7IC8vcmVzZXRcclxuXHR9XHJcblx0Ly8gZ2V0IGFsbCBrZXlzIGluIGdpdmVuIHBhdGhcclxuXHR2YXIgZ2V0a2V5cz1mdW5jdGlvbihwYXRoLGNiKSB7XHJcblx0XHRpZiAoIXBhdGgpIHBhdGg9W11cclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblxyXG5cdFx0Z2V0LmFwcGx5KHRoaXMsW3BhdGgsZmFsc2UsZnVuY3Rpb24oKXtcclxuXHRcdFx0aWYgKHBhdGggJiYgcGF0aC5sZW5ndGgpIHtcclxuXHRcdFx0XHRjYi5hcHBseSh0aGF0LFtLRVlbcGF0aC5qb2luKHN0cnNlcCldXSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y2IuYXBwbHkodGhhdCxbT2JqZWN0LmtleXMoQ0FDSEUpXSk7IFxyXG5cdFx0XHRcdC8vdG9wIGxldmVsLCBub3JtYWxseSBpdCBpcyB2ZXJ5IHNtYWxsXHJcblx0XHRcdH1cclxuXHRcdH1dKTtcclxuXHR9XHJcblxyXG5cdHZhciBzZXR1cGFwaT1mdW5jdGlvbigpIHtcclxuXHRcdHRoaXMubG9hZD1sb2FkO1xyXG4vL1x0XHR0aGlzLmN1cj0wO1xyXG5cdFx0dGhpcy5jYWNoZT1mdW5jdGlvbigpIHtyZXR1cm4gQ0FDSEV9O1xyXG5cdFx0dGhpcy5rZXk9ZnVuY3Rpb24oKSB7cmV0dXJuIEtFWX07XHJcblx0XHR0aGlzLmZyZWU9ZnVuY3Rpb24oKSB7XHJcblx0XHRcdENBQ0hFPW51bGw7XHJcblx0XHRcdEtFWT1udWxsO1xyXG5cdFx0XHR0aGlzLmZzLmZyZWUoKTtcclxuXHRcdH1cclxuXHRcdHRoaXMuc2V0Q2FjaGU9ZnVuY3Rpb24oYykge0NBQ0hFPWN9O1xyXG5cdFx0dGhpcy5rZXlzPWdldGtleXM7XHJcblx0XHR0aGlzLmdldD1nZXQ7ICAgLy8gZ2V0IGEgZmllbGQsIGxvYWQgaWYgbmVlZGVkXHJcblx0XHR0aGlzLmV4aXN0cz1leGlzdHM7XHJcblx0XHR0aGlzLkRUPURUO1xyXG5cdFx0XHJcblx0XHQvL2luc3RhbGwgdGhlIHN5bmMgdmVyc2lvbiBmb3Igbm9kZVxyXG5cdFx0Ly9pZiAodHlwZW9mIHByb2Nlc3MhPVwidW5kZWZpbmVkXCIpIHJlcXVpcmUoXCIuL2tkYl9zeW5jXCIpKHRoaXMpO1xyXG5cdFx0Ly9pZiAoY2IpIHNldFRpbWVvdXQoY2IuYmluZCh0aGlzKSwwKTtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR2YXIgZXJyPTA7XHJcblx0XHRpZiAoY2IpIHtcclxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGNiKGVycix0aGF0KTtcdFxyXG5cdFx0XHR9LDApO1xyXG5cdFx0fVxyXG5cdH1cclxuXHR2YXIgdGhhdD10aGlzO1xyXG5cdHZhciBrZnM9bmV3IEtmcyhwYXRoLG9wdHMsZnVuY3Rpb24oZXJyKXtcclxuXHRcdGlmIChlcnIpIHtcclxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGNiKGVyciwwKTtcclxuXHRcdFx0fSwwKTtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGF0LnNpemU9dGhpcy5zaXplO1xyXG5cdFx0XHRzZXR1cGFwaS5jYWxsKHRoYXQpO1x0XHRcdFxyXG5cdFx0fVxyXG5cdH0pO1xyXG5cdHRoaXMuZnM9a2ZzO1xyXG5cdHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5DcmVhdGUuZGF0YXR5cGVzPURUO1xyXG5cclxuaWYgKG1vZHVsZSkgbW9kdWxlLmV4cG9ydHM9Q3JlYXRlO1xyXG4vL3JldHVybiBDcmVhdGU7XHJcbiIsIi8qIG5vZGUuanMgYW5kIGh0bWw1IGZpbGUgc3lzdGVtIGFic3RyYWN0aW9uIGxheWVyKi9cclxudHJ5IHtcclxuXHR2YXIgZnM9cmVxdWlyZShcImZzXCIpO1xyXG5cdHZhciBCdWZmZXI9cmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXI7XHJcbn0gY2F0Y2ggKGUpIHtcclxuXHR2YXIgZnM9cmVxdWlyZSgnLi9odG1sNXJlYWQnKTtcclxuXHR2YXIgQnVmZmVyPWZ1bmN0aW9uKCl7IHJldHVybiBcIlwifTtcclxuXHR2YXIgaHRtbDVmcz10cnVlOyBcdFxyXG59XHJcbnZhciBzaWduYXR1cmVfc2l6ZT0xO1xyXG52YXIgdmVyYm9zZT0wLCByZWFkTG9nPWZ1bmN0aW9uKCl7fTtcclxudmFyIF9yZWFkTG9nPWZ1bmN0aW9uKHJlYWR0eXBlLGJ5dGVzKSB7XHJcblx0Y29uc29sZS5sb2cocmVhZHR5cGUsYnl0ZXMsXCJieXRlc1wiKTtcclxufVxyXG5pZiAodmVyYm9zZSkgcmVhZExvZz1fcmVhZExvZztcclxuXHJcbnZhciB1bnBhY2tfaW50ID0gZnVuY3Rpb24gKGFyLCBjb3VudCAsIHJlc2V0KSB7XHJcbiAgIGNvdW50PWNvdW50fHxhci5sZW5ndGg7XHJcbiAgdmFyIHIgPSBbXSwgaSA9IDAsIHYgPSAwO1xyXG4gIGRvIHtcclxuXHR2YXIgc2hpZnQgPSAwO1xyXG5cdGRvIHtcclxuXHQgIHYgKz0gKChhcltpXSAmIDB4N0YpIDw8IHNoaWZ0KTtcclxuXHQgIHNoaWZ0ICs9IDc7XHQgIFxyXG5cdH0gd2hpbGUgKGFyWysraV0gJiAweDgwKTtcclxuXHRyLnB1c2godik7IGlmIChyZXNldCkgdj0wO1xyXG5cdGNvdW50LS07XHJcbiAgfSB3aGlsZSAoaTxhci5sZW5ndGggJiYgY291bnQpO1xyXG4gIHJldHVybiB7ZGF0YTpyLCBhZHY6aSB9O1xyXG59XHJcbnZhciBPcGVuPWZ1bmN0aW9uKHBhdGgsb3B0cyxjYikge1xyXG5cdG9wdHM9b3B0c3x8e307XHJcblxyXG5cdHZhciByZWFkU2lnbmF0dXJlPWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdFx0dmFyIGJ1Zj1uZXcgQnVmZmVyKHNpZ25hdHVyZV9zaXplKTtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLGJ1ZiwwLHNpZ25hdHVyZV9zaXplLHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdGlmIChodG1sNWZzKSB2YXIgc2lnbmF0dXJlPVN0cmluZy5mcm9tQ2hhckNvZGUoKG5ldyBVaW50OEFycmF5KGJ1ZmZlcikpWzBdKVxyXG5cdFx0XHRlbHNlIHZhciBzaWduYXR1cmU9YnVmZmVyLnRvU3RyaW5nKCd1dGY4JywwLHNpZ25hdHVyZV9zaXplKTtcclxuXHRcdFx0Y2IuYXBwbHkodGhhdCxbc2lnbmF0dXJlXSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdC8vdGhpcyBpcyBxdWl0ZSBzbG93XHJcblx0Ly93YWl0IGZvciBTdHJpbmdWaWV3ICtBcnJheUJ1ZmZlciB0byBzb2x2ZSB0aGUgcHJvYmxlbVxyXG5cdC8vaHR0cHM6Ly9ncm91cHMuZ29vZ2xlLmNvbS9hL2Nocm9taXVtLm9yZy9mb3J1bS8jIXRvcGljL2JsaW5rLWRldi95bGdpTllfWlNWMFxyXG5cdC8vaWYgdGhlIHN0cmluZyBpcyBhbHdheXMgdWNzMlxyXG5cdC8vY2FuIHVzZSBVaW50MTYgdG8gcmVhZCBpdC5cclxuXHQvL2h0dHA6Ly91cGRhdGVzLmh0bWw1cm9ja3MuY29tLzIwMTIvMDYvSG93LXRvLWNvbnZlcnQtQXJyYXlCdWZmZXItdG8tYW5kLWZyb20tU3RyaW5nXHJcblx0dmFyIGRlY29kZXV0ZjggPSBmdW5jdGlvbiAodXRmdGV4dCkge1xyXG5cdFx0dmFyIHN0cmluZyA9IFwiXCI7XHJcblx0XHR2YXIgaSA9IDA7XHJcblx0XHR2YXIgYz0wLGMxID0gMCwgYzIgPSAwICwgYzM9MDtcclxuXHRcdGZvciAodmFyIGk9MDtpPHV0ZnRleHQubGVuZ3RoO2krKykge1xyXG5cdFx0XHRpZiAodXRmdGV4dC5jaGFyQ29kZUF0KGkpPjEyNykgYnJlYWs7XHJcblx0XHR9XHJcblx0XHRpZiAoaT49dXRmdGV4dC5sZW5ndGgpIHJldHVybiB1dGZ0ZXh0O1xyXG5cclxuXHRcdHdoaWxlICggaSA8IHV0ZnRleHQubGVuZ3RoICkge1xyXG5cdFx0XHRjID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkpO1xyXG5cdFx0XHRpZiAoYyA8IDEyOCkge1xyXG5cdFx0XHRcdHN0cmluZyArPSB1dGZ0ZXh0W2ldO1xyXG5cdFx0XHRcdGkrKztcclxuXHRcdFx0fSBlbHNlIGlmKChjID4gMTkxKSAmJiAoYyA8IDIyNCkpIHtcclxuXHRcdFx0XHRjMiA9IHV0ZnRleHQuY2hhckNvZGVBdChpKzEpO1xyXG5cdFx0XHRcdHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDMxKSA8PCA2KSB8IChjMiAmIDYzKSk7XHJcblx0XHRcdFx0aSArPSAyO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGMyID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMSk7XHJcblx0XHRcdFx0YzMgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSsyKTtcclxuXHRcdFx0XHRzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoKGMgJiAxNSkgPDwgMTIpIHwgKChjMiAmIDYzKSA8PCA2KSB8IChjMyAmIDYzKSk7XHJcblx0XHRcdFx0aSArPSAzO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gc3RyaW5nO1xyXG5cdH1cclxuXHJcblx0dmFyIHJlYWRTdHJpbmc9IGZ1bmN0aW9uKHBvcyxibG9ja3NpemUsZW5jb2RpbmcsY2IpIHtcclxuXHRcdGVuY29kaW5nPWVuY29kaW5nfHwndXRmOCc7XHJcblx0XHR2YXIgYnVmZmVyPW5ldyBCdWZmZXIoYmxvY2tzaXplKTtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLGJ1ZmZlciwwLGJsb2Nrc2l6ZSxwb3MsZnVuY3Rpb24oZXJyLGxlbixidWZmZXIpe1xyXG5cdFx0XHRyZWFkTG9nKFwic3RyaW5nXCIsbGVuKTtcclxuXHRcdFx0aWYgKGh0bWw1ZnMpIHtcclxuXHRcdFx0XHRpZiAoZW5jb2Rpbmc9PSd1dGY4Jykge1xyXG5cdFx0XHRcdFx0dmFyIHN0cj1kZWNvZGV1dGY4KFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKSkpXHJcblx0XHRcdFx0fSBlbHNlIHsgLy91Y3MyIGlzIDMgdGltZXMgZmFzdGVyXHJcblx0XHRcdFx0XHR2YXIgc3RyPVN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgbmV3IFVpbnQxNkFycmF5KGJ1ZmZlcikpXHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Y2IuYXBwbHkodGhhdCxbc3RyXSk7XHJcblx0XHRcdH0gXHJcblx0XHRcdGVsc2UgY2IuYXBwbHkodGhhdCxbYnVmZmVyLnRvU3RyaW5nKGVuY29kaW5nKV0pO1x0XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdC8vd29yayBhcm91bmQgZm9yIGNocm9tZSBmcm9tQ2hhckNvZGUgY2Fubm90IGFjY2VwdCBodWdlIGFycmF5XHJcblx0Ly9odHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9NTY1ODhcclxuXHR2YXIgYnVmMnN0cmluZ2Fycj1mdW5jdGlvbihidWYsZW5jKSB7XHJcblx0XHRpZiAoZW5jPT1cInV0ZjhcIikgXHR2YXIgYXJyPW5ldyBVaW50OEFycmF5KGJ1Zik7XHJcblx0XHRlbHNlIHZhciBhcnI9bmV3IFVpbnQxNkFycmF5KGJ1Zik7XHJcblx0XHR2YXIgaT0wLGNvZGVzPVtdLG91dD1bXSxzPVwiXCI7XHJcblx0XHR3aGlsZSAoaTxhcnIubGVuZ3RoKSB7XHJcblx0XHRcdGlmIChhcnJbaV0pIHtcclxuXHRcdFx0XHRjb2Rlc1tjb2Rlcy5sZW5ndGhdPWFycltpXTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRzPVN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxjb2Rlcyk7XHJcblx0XHRcdFx0aWYgKGVuYz09XCJ1dGY4XCIpIG91dFtvdXQubGVuZ3RoXT1kZWNvZGV1dGY4KHMpO1xyXG5cdFx0XHRcdGVsc2Ugb3V0W291dC5sZW5ndGhdPXM7XHJcblx0XHRcdFx0Y29kZXM9W107XHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0XHRpKys7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdHM9U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLGNvZGVzKTtcclxuXHRcdGlmIChlbmM9PVwidXRmOFwiKSBvdXRbb3V0Lmxlbmd0aF09ZGVjb2RldXRmOChzKTtcclxuXHRcdGVsc2Ugb3V0W291dC5sZW5ndGhdPXM7XHJcblxyXG5cdFx0cmV0dXJuIG91dDtcclxuXHR9XHJcblx0dmFyIHJlYWRTdHJpbmdBcnJheSA9IGZ1bmN0aW9uKHBvcyxibG9ja3NpemUsZW5jb2RpbmcsY2IpIHtcclxuXHRcdHZhciB0aGF0PXRoaXMsb3V0PW51bGw7XHJcblx0XHRpZiAoYmxvY2tzaXplPT0wKSByZXR1cm4gW107XHJcblx0XHRlbmNvZGluZz1lbmNvZGluZ3x8J3V0ZjgnO1xyXG5cdFx0dmFyIGJ1ZmZlcj1uZXcgQnVmZmVyKGJsb2Nrc2l6ZSk7XHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLGJ1ZmZlciwwLGJsb2Nrc2l6ZSxwb3MsZnVuY3Rpb24oZXJyLGxlbixidWZmZXIpe1xyXG5cdFx0XHRpZiAoaHRtbDVmcykge1xyXG5cdFx0XHRcdHJlYWRMb2coXCJzdHJpbmdBcnJheVwiLGJ1ZmZlci5ieXRlTGVuZ3RoKTtcclxuXHJcblx0XHRcdFx0aWYgKGVuY29kaW5nPT0ndXRmOCcpIHtcclxuXHRcdFx0XHRcdG91dD1idWYyc3RyaW5nYXJyKGJ1ZmZlcixcInV0ZjhcIik7XHJcblx0XHRcdFx0fSBlbHNlIHsgLy91Y3MyIGlzIDMgdGltZXMgZmFzdGVyXHJcblx0XHRcdFx0XHRvdXQ9YnVmMnN0cmluZ2FycihidWZmZXIsXCJ1Y3MyXCIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZWFkTG9nKFwic3RyaW5nQXJyYXlcIixidWZmZXIubGVuZ3RoKTtcclxuXHRcdFx0XHRvdXQ9YnVmZmVyLnRvU3RyaW5nKGVuY29kaW5nKS5zcGxpdCgnXFwwJyk7XHJcblx0XHRcdH0gXHRcclxuXHRcdFx0Y2IuYXBwbHkodGhhdCxbb3V0XSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblx0dmFyIHJlYWRVSTMyPWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdFx0dmFyIGJ1ZmZlcj1uZXcgQnVmZmVyKDQpO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdGZzLnJlYWQodGhpcy5oYW5kbGUsYnVmZmVyLDAsNCxwb3MsZnVuY3Rpb24oZXJyLGxlbixidWZmZXIpe1xyXG5cdFx0XHRyZWFkTG9nKFwidWkzMlwiLGxlbik7XHJcblx0XHRcdGlmIChodG1sNWZzKXtcclxuXHRcdFx0XHQvL3Y9KG5ldyBVaW50MzJBcnJheShidWZmZXIpKVswXTtcclxuXHRcdFx0XHR2YXIgdj1uZXcgRGF0YVZpZXcoYnVmZmVyKS5nZXRVaW50MzIoMCwgZmFsc2UpXHJcblx0XHRcdFx0Y2Iodik7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBjYi5hcHBseSh0aGF0LFtidWZmZXIucmVhZEludDMyQkUoMCldKTtcdFxyXG5cdFx0fSk7XHRcdFxyXG5cdH1cclxuXHJcblx0dmFyIHJlYWRJMzI9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0XHR2YXIgYnVmZmVyPW5ldyBCdWZmZXIoNCk7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0ZnMucmVhZCh0aGlzLmhhbmRsZSxidWZmZXIsMCw0LHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdHJlYWRMb2coXCJpMzJcIixsZW4pO1xyXG5cdFx0XHRpZiAoaHRtbDVmcyl7XHJcblx0XHRcdFx0dmFyIHY9bmV3IERhdGFWaWV3KGJ1ZmZlcikuZ2V0SW50MzIoMCwgZmFsc2UpXHJcblx0XHRcdFx0Y2Iodik7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSAgXHRjYi5hcHBseSh0aGF0LFtidWZmZXIucmVhZEludDMyQkUoMCldKTtcdFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cdHZhciByZWFkVUk4PWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdFx0dmFyIGJ1ZmZlcj1uZXcgQnVmZmVyKDEpO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLGJ1ZmZlciwwLDEscG9zLGZ1bmN0aW9uKGVycixsZW4sYnVmZmVyKXtcclxuXHRcdFx0cmVhZExvZyhcInVpOFwiLGxlbik7XHJcblx0XHRcdGlmIChodG1sNWZzKWNiKCAobmV3IFVpbnQ4QXJyYXkoYnVmZmVyKSlbMF0pIDtcclxuXHRcdFx0ZWxzZSAgXHRcdFx0Y2IuYXBwbHkodGhhdCxbYnVmZmVyLnJlYWRVSW50OCgwKV0pO1x0XHJcblx0XHRcdFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cdHZhciByZWFkQnVmPWZ1bmN0aW9uKHBvcyxibG9ja3NpemUsY2IpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR2YXIgYnVmPW5ldyBCdWZmZXIoYmxvY2tzaXplKTtcclxuXHRcdGZzLnJlYWQodGhpcy5oYW5kbGUsYnVmLDAsYmxvY2tzaXplLHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdHJlYWRMb2coXCJidWZcIixsZW4pO1xyXG5cdFx0XHR2YXIgYnVmZj1uZXcgVWludDhBcnJheShidWZmZXIpXHJcblx0XHRcdGNiLmFwcGx5KHRoYXQsW2J1ZmZdKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHR2YXIgcmVhZEJ1Zl9wYWNrZWRpbnQ9ZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxjb3VudCxyZXNldCxjYikge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHJlYWRCdWYuYXBwbHkodGhpcyxbcG9zLGJsb2Nrc2l6ZSxmdW5jdGlvbihidWZmZXIpe1xyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFt1bnBhY2tfaW50KGJ1ZmZlcixjb3VudCxyZXNldCldKTtcdFxyXG5cdFx0fV0pO1xyXG5cdFx0XHJcblx0fVxyXG5cdHZhciByZWFkRml4ZWRBcnJheV9odG1sNWZzPWZ1bmN0aW9uKHBvcyxjb3VudCx1bml0c2l6ZSxjYikge1xyXG5cdFx0dmFyIGZ1bmM9bnVsbDtcclxuXHRcdGlmICh1bml0c2l6ZT09PTEpIHtcclxuXHRcdFx0ZnVuYz0nZ2V0VWludDgnOy8vVWludDhBcnJheTtcclxuXHRcdH0gZWxzZSBpZiAodW5pdHNpemU9PT0yKSB7XHJcblx0XHRcdGZ1bmM9J2dldFVpbnQxNic7Ly9VaW50MTZBcnJheTtcclxuXHRcdH0gZWxzZSBpZiAodW5pdHNpemU9PT00KSB7XHJcblx0XHRcdGZ1bmM9J2dldFVpbnQzMic7Ly9VaW50MzJBcnJheTtcclxuXHRcdH0gZWxzZSB0aHJvdyAndW5zdXBwb3J0ZWQgaW50ZWdlciBzaXplJztcclxuXHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLG51bGwsMCx1bml0c2l6ZSpjb3VudCxwb3MsZnVuY3Rpb24oZXJyLGxlbixidWZmZXIpe1xyXG5cdFx0XHRyZWFkTG9nKFwiZml4IGFycmF5XCIsbGVuKTtcclxuXHRcdFx0dmFyIG91dD1bXTtcclxuXHRcdFx0aWYgKHVuaXRzaXplPT0xKSB7XHJcblx0XHRcdFx0b3V0PW5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW4gLyB1bml0c2l6ZTsgaSsrKSB7IC8vZW5kaWFuIHByb2JsZW1cclxuXHRcdFx0XHQvL1x0b3V0LnB1c2goIGZ1bmMoYnVmZmVyLGkqdW5pdHNpemUpKTtcclxuXHRcdFx0XHRcdG91dC5wdXNoKCB2PW5ldyBEYXRhVmlldyhidWZmZXIpW2Z1bmNdKGksZmFsc2UpICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFtvdXRdKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHQvLyBzaWduYXR1cmUsIGl0ZW1jb3VudCwgcGF5bG9hZFxyXG5cdHZhciByZWFkRml4ZWRBcnJheSA9IGZ1bmN0aW9uKHBvcyAsY291bnQsIHVuaXRzaXplLGNiKSB7XHJcblx0XHR2YXIgZnVuYz1udWxsO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdFxyXG5cdFx0aWYgKHVuaXRzaXplKiBjb3VudD50aGlzLnNpemUgJiYgdGhpcy5zaXplKSAge1xyXG5cdFx0XHRjb25zb2xlLmxvZyhcImFycmF5IHNpemUgZXhjZWVkIGZpbGUgc2l6ZVwiLHRoaXMuc2l6ZSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRpZiAoaHRtbDVmcykgcmV0dXJuIHJlYWRGaXhlZEFycmF5X2h0bWw1ZnMuYXBwbHkodGhpcyxbcG9zLGNvdW50LHVuaXRzaXplLGNiXSk7XHJcblxyXG5cdFx0dmFyIGl0ZW1zPW5ldyBCdWZmZXIoIHVuaXRzaXplKiBjb3VudCk7XHJcblx0XHRpZiAodW5pdHNpemU9PT0xKSB7XHJcblx0XHRcdGZ1bmM9aXRlbXMucmVhZFVJbnQ4O1xyXG5cdFx0fSBlbHNlIGlmICh1bml0c2l6ZT09PTIpIHtcclxuXHRcdFx0ZnVuYz1pdGVtcy5yZWFkVUludDE2QkU7XHJcblx0XHR9IGVsc2UgaWYgKHVuaXRzaXplPT09NCkge1xyXG5cdFx0XHRmdW5jPWl0ZW1zLnJlYWRVSW50MzJCRTtcclxuXHRcdH0gZWxzZSB0aHJvdyAndW5zdXBwb3J0ZWQgaW50ZWdlciBzaXplJztcclxuXHRcdC8vY29uc29sZS5sb2coJ2l0ZW1jb3VudCcsaXRlbWNvdW50LCdidWZmZXInLGJ1ZmZlcik7XHJcblxyXG5cdFx0ZnMucmVhZCh0aGlzLmhhbmRsZSxpdGVtcywwLHVuaXRzaXplKmNvdW50LHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdHJlYWRMb2coXCJmaXggYXJyYXlcIixsZW4pO1xyXG5cdFx0XHR2YXIgb3V0PVtdO1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aCAvIHVuaXRzaXplOyBpKyspIHtcclxuXHRcdFx0XHRvdXQucHVzaCggZnVuYy5hcHBseShpdGVtcyxbaSp1bml0c2l6ZV0pKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFtvdXRdKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0dmFyIGZyZWU9ZnVuY3Rpb24oKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdjbG9zaW5nICcsaGFuZGxlKTtcclxuXHRcdGZzLmNsb3NlU3luYyh0aGlzLmhhbmRsZSk7XHJcblx0fVxyXG5cdHZhciBzZXR1cGFwaT1mdW5jdGlvbigpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR0aGlzLnJlYWRTaWduYXR1cmU9cmVhZFNpZ25hdHVyZTtcclxuXHRcdHRoaXMucmVhZEkzMj1yZWFkSTMyO1xyXG5cdFx0dGhpcy5yZWFkVUkzMj1yZWFkVUkzMjtcclxuXHRcdHRoaXMucmVhZFVJOD1yZWFkVUk4O1xyXG5cdFx0dGhpcy5yZWFkQnVmPXJlYWRCdWY7XHJcblx0XHR0aGlzLnJlYWRCdWZfcGFja2VkaW50PXJlYWRCdWZfcGFja2VkaW50O1xyXG5cdFx0dGhpcy5yZWFkRml4ZWRBcnJheT1yZWFkRml4ZWRBcnJheTtcclxuXHRcdHRoaXMucmVhZFN0cmluZz1yZWFkU3RyaW5nO1xyXG5cdFx0dGhpcy5yZWFkU3RyaW5nQXJyYXk9cmVhZFN0cmluZ0FycmF5O1xyXG5cdFx0dGhpcy5zaWduYXR1cmVfc2l6ZT1zaWduYXR1cmVfc2l6ZTtcclxuXHRcdHRoaXMuZnJlZT1mcmVlO1xyXG5cdFx0aWYgKGh0bWw1ZnMpIHtcclxuXHRcdFx0dmFyIGZuPXBhdGg7XHJcblx0XHRcdGlmIChwYXRoLmluZGV4T2YoXCJmaWxlc3lzdGVtOlwiKT09MCkgZm49cGF0aC5zdWJzdHIocGF0aC5sYXN0SW5kZXhPZihcIi9cIikpO1xyXG5cdFx0XHRmcy5mcy5yb290LmdldEZpbGUoZm4se30sZnVuY3Rpb24oZW50cnkpe1xyXG5cdFx0XHQgIGVudHJ5LmdldE1ldGFkYXRhKGZ1bmN0aW9uKG1ldGFkYXRhKSB7IFxyXG5cdFx0XHRcdHRoYXQuc2l6ZT1tZXRhZGF0YS5zaXplO1xyXG5cdFx0XHRcdGlmIChjYikgc2V0VGltZW91dChjYi5iaW5kKHRoYXQpLDApO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHZhciBzdGF0PWZzLmZzdGF0U3luYyh0aGlzLmhhbmRsZSk7XHJcblx0XHRcdHRoaXMuc3RhdD1zdGF0O1xyXG5cdFx0XHR0aGlzLnNpemU9c3RhdC5zaXplO1x0XHRcclxuXHRcdFx0aWYgKGNiKVx0c2V0VGltZW91dChjYi5iaW5kKHRoaXMsMCksMCk7XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciB0aGF0PXRoaXM7XHJcblx0aWYgKGh0bWw1ZnMpIHtcclxuXHRcdGZzLm9wZW4ocGF0aCxmdW5jdGlvbihoKXtcclxuXHRcdFx0aWYgKCFoKSB7XHJcblx0XHRcdFx0aWYgKGNiKVx0c2V0VGltZW91dChjYi5iaW5kKG51bGwsXCJmaWxlIG5vdCBmb3VuZDpcIitwYXRoKSwwKTtcdFxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoYXQuaGFuZGxlPWg7XHJcblx0XHRcdFx0dGhhdC5odG1sNWZzPXRydWU7XHJcblx0XHRcdFx0c2V0dXBhcGkuY2FsbCh0aGF0KTtcclxuXHRcdFx0XHR0aGF0Lm9wZW5lZD10cnVlO1x0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0fSBlbHNlIHtcclxuXHRcdGlmIChmcy5leGlzdHNTeW5jKHBhdGgpKXtcclxuXHRcdFx0dGhpcy5oYW5kbGU9ZnMub3BlblN5bmMocGF0aCwncicpOy8vLGZ1bmN0aW9uKGVycixoYW5kbGUpe1xyXG5cdFx0XHR0aGlzLm9wZW5lZD10cnVlO1xyXG5cdFx0XHRzZXR1cGFwaS5jYWxsKHRoaXMpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKGNiKVx0c2V0VGltZW91dChjYi5iaW5kKG51bGwsXCJmaWxlIG5vdCBmb3VuZDpcIitwYXRoKSwwKTtcdFxyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIHRoaXM7XHJcbn1cclxubW9kdWxlLmV4cG9ydHM9T3BlbjsiLCIvKlxyXG4gIEpBVkEgY2FuIG9ubHkgcmV0dXJuIE51bWJlciBhbmQgU3RyaW5nXHJcblx0YXJyYXkgYW5kIGJ1ZmZlciByZXR1cm4gaW4gc3RyaW5nIGZvcm1hdFxyXG5cdG5lZWQgSlNPTi5wYXJzZVxyXG4qL1xyXG52YXIgdmVyYm9zZT0wO1xyXG5cclxudmFyIHJlYWRTaWduYXR1cmU9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJyZWFkIHNpZ25hdHVyZVwiKTtcclxuXHR2YXIgc2lnbmF0dXJlPWtmcy5yZWFkVVRGOFN0cmluZyh0aGlzLmhhbmRsZSxwb3MsMSk7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoc2lnbmF0dXJlLHNpZ25hdHVyZS5jaGFyQ29kZUF0KDApKTtcclxuXHRjYi5hcHBseSh0aGlzLFtzaWduYXR1cmVdKTtcclxufVxyXG52YXIgcmVhZEkzMj1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcInJlYWQgaTMyIGF0IFwiK3Bvcyk7XHJcblx0dmFyIGkzMj1rZnMucmVhZEludDMyKHRoaXMuaGFuZGxlLHBvcyk7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoaTMyKTtcclxuXHRjYi5hcHBseSh0aGlzLFtpMzJdKTtcdFxyXG59XHJcbnZhciByZWFkVUkzMj1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcInJlYWQgdWkzMiBhdCBcIitwb3MpO1xyXG5cdHZhciB1aTMyPWtmcy5yZWFkVUludDMyKHRoaXMuaGFuZGxlLHBvcyk7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcodWkzMik7XHJcblx0Y2IuYXBwbHkodGhpcyxbdWkzMl0pO1xyXG59XHJcbnZhciByZWFkVUk4PWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwicmVhZCB1aTggYXQgXCIrcG9zKTsgXHJcblx0dmFyIHVpOD1rZnMucmVhZFVJbnQ4KHRoaXMuaGFuZGxlLHBvcyk7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcodWk4KTtcclxuXHRjYi5hcHBseSh0aGlzLFt1aThdKTtcclxufVxyXG52YXIgcmVhZEJ1Zj1mdW5jdGlvbihwb3MsYmxvY2tzaXplLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJyZWFkIGJ1ZmZlciBhdCBcIitwb3MrIFwiIGJsb2Nrc2l6ZSBcIitibG9ja3NpemUpO1xyXG5cdHZhciBidWY9a2ZzLnJlYWRCdWYodGhpcy5oYW5kbGUscG9zLGJsb2Nrc2l6ZSk7XHJcblx0dmFyIGJ1ZmY9SlNPTi5wYXJzZShidWYpO1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwiYnVmZmVyIGxlbmd0aFwiK2J1ZmYubGVuZ3RoKTtcclxuXHRjYi5hcHBseSh0aGlzLFtidWZmXSk7XHRcclxufVxyXG52YXIgcmVhZEJ1Zl9wYWNrZWRpbnQ9ZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxjb3VudCxyZXNldCxjYikge1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwicmVhZCBwYWNrZWQgaW50IGF0IFwiK3BvcytcIiBibG9ja3NpemUgXCIrYmxvY2tzaXplK1wiIGNvdW50IFwiK2NvdW50KTtcclxuXHR2YXIgYnVmPWtmcy5yZWFkQnVmX3BhY2tlZGludCh0aGlzLmhhbmRsZSxwb3MsYmxvY2tzaXplLGNvdW50LHJlc2V0KTtcclxuXHR2YXIgYWR2PXBhcnNlSW50KGJ1Zik7XHJcblx0dmFyIGJ1ZmY9SlNPTi5wYXJzZShidWYuc3Vic3RyKGJ1Zi5pbmRleE9mKFwiW1wiKSkpO1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwicGFja2VkSW50IGxlbmd0aCBcIitidWZmLmxlbmd0aCtcIiBmaXJzdCBpdGVtPVwiK2J1ZmZbMF0pO1xyXG5cdGNiLmFwcGx5KHRoaXMsW3tkYXRhOmJ1ZmYsYWR2OmFkdn1dKTtcdFxyXG59XHJcblxyXG5cclxudmFyIHJlYWRTdHJpbmc9IGZ1bmN0aW9uKHBvcyxibG9ja3NpemUsZW5jb2RpbmcsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcInJlYWRzdHJpbmcgYXQgXCIrcG9zK1wiIGJsb2Nrc2l6ZSBcIiArYmxvY2tzaXplK1wiIGVuYzpcIitlbmNvZGluZyk7XHJcblx0aWYgKGVuY29kaW5nPT1cInVjczJcIikge1xyXG5cdFx0dmFyIHN0cj1rZnMucmVhZFVMRTE2U3RyaW5nKHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHR2YXIgc3RyPWtmcy5yZWFkVVRGOFN0cmluZyh0aGlzLmhhbmRsZSxwb3MsYmxvY2tzaXplKTtcdFxyXG5cdH1cdCBcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhzdHIpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW3N0cl0pO1x0XHJcbn1cclxuXHJcbnZhciByZWFkRml4ZWRBcnJheSA9IGZ1bmN0aW9uKHBvcyAsY291bnQsIHVuaXRzaXplLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJyZWFkIGZpeGVkIGFycmF5IGF0IFwiK3BvcytcIiBjb3VudCBcIitjb3VudCtcIiB1bml0c2l6ZSBcIit1bml0c2l6ZSk7IFxyXG5cdHZhciBidWY9a2ZzLnJlYWRGaXhlZEFycmF5KHRoaXMuaGFuZGxlLHBvcyxjb3VudCx1bml0c2l6ZSk7XHJcblx0dmFyIGJ1ZmY9SlNPTi5wYXJzZShidWYpO1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwiYXJyYXkgbGVuZ3RoXCIrYnVmZi5sZW5ndGgpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW2J1ZmZdKTtcdFxyXG59XHJcbnZhciByZWFkU3RyaW5nQXJyYXkgPSBmdW5jdGlvbihwb3MsYmxvY2tzaXplLGVuY29kaW5nLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUubG9nKFwicmVhZCBTdHJpbmcgYXJyYXkgYXQgXCIrcG9zK1wiIGJsb2Nrc2l6ZSBcIitibG9ja3NpemUgK1wiIGVuYyBcIitlbmNvZGluZyk7IFxyXG5cdGVuY29kaW5nID0gZW5jb2Rpbmd8fFwidXRmOFwiO1xyXG5cdHZhciBidWY9a2ZzLnJlYWRTdHJpbmdBcnJheSh0aGlzLmhhbmRsZSxwb3MsYmxvY2tzaXplLGVuY29kaW5nKTtcclxuXHQvL3ZhciBidWZmPUpTT04ucGFyc2UoYnVmKTtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcInJlYWQgc3RyaW5nIGFycmF5XCIpO1xyXG5cdHZhciBidWZmPWJ1Zi5zcGxpdChcIlxcdWZmZmZcIik7IC8vY2Fubm90IHJldHVybiBzdHJpbmcgd2l0aCAwXHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJhcnJheSBsZW5ndGhcIitidWZmLmxlbmd0aCk7XHJcblx0Y2IuYXBwbHkodGhpcyxbYnVmZl0pO1x0XHJcbn1cclxudmFyIG1lcmdlUG9zdGluZ3M9ZnVuY3Rpb24ocG9zaXRpb25zLGNiKSB7XHJcblx0dmFyIGJ1Zj1rZnMubWVyZ2VQb3N0aW5ncyh0aGlzLmhhbmRsZSxKU09OLnN0cmluZ2lmeShwb3NpdGlvbnMpKTtcclxuXHRpZiAoIWJ1ZiB8fCBidWYubGVuZ3RoPT0wKSByZXR1cm4gW107XHJcblx0ZWxzZSByZXR1cm4gSlNPTi5wYXJzZShidWYpO1xyXG59XHJcblxyXG52YXIgZnJlZT1mdW5jdGlvbigpIHtcclxuXHQvL2NvbnNvbGUubG9nKCdjbG9zaW5nICcsaGFuZGxlKTtcclxuXHRrZnMuY2xvc2UodGhpcy5oYW5kbGUpO1xyXG59XHJcbnZhciBPcGVuPWZ1bmN0aW9uKHBhdGgsb3B0cyxjYikge1xyXG5cdG9wdHM9b3B0c3x8e307XHJcblx0dmFyIHNpZ25hdHVyZV9zaXplPTE7XHJcblx0dmFyIHNldHVwYXBpPWZ1bmN0aW9uKCkgeyBcclxuXHRcdHRoaXMucmVhZFNpZ25hdHVyZT1yZWFkU2lnbmF0dXJlO1xyXG5cdFx0dGhpcy5yZWFkSTMyPXJlYWRJMzI7XHJcblx0XHR0aGlzLnJlYWRVSTMyPXJlYWRVSTMyO1xyXG5cdFx0dGhpcy5yZWFkVUk4PXJlYWRVSTg7XHJcblx0XHR0aGlzLnJlYWRCdWY9cmVhZEJ1ZjtcclxuXHRcdHRoaXMucmVhZEJ1Zl9wYWNrZWRpbnQ9cmVhZEJ1Zl9wYWNrZWRpbnQ7XHJcblx0XHR0aGlzLnJlYWRGaXhlZEFycmF5PXJlYWRGaXhlZEFycmF5O1xyXG5cdFx0dGhpcy5yZWFkU3RyaW5nPXJlYWRTdHJpbmc7XHJcblx0XHR0aGlzLnJlYWRTdHJpbmdBcnJheT1yZWFkU3RyaW5nQXJyYXk7XHJcblx0XHR0aGlzLnNpZ25hdHVyZV9zaXplPXNpZ25hdHVyZV9zaXplO1xyXG5cdFx0dGhpcy5tZXJnZVBvc3RpbmdzPW1lcmdlUG9zdGluZ3M7XHJcblx0XHR0aGlzLmZyZWU9ZnJlZTtcclxuXHRcdHRoaXMuc2l6ZT1rZnMuZ2V0RmlsZVNpemUodGhpcy5oYW5kbGUpO1xyXG5cdFx0aWYgKHZlcmJvc2UpIGNvbnNvbGUubG9nKFwiZmlsZXNpemUgIFwiK3RoaXMuc2l6ZSk7XHJcblx0XHRpZiAoY2IpXHRjYi5jYWxsKHRoaXMpO1xyXG5cdH1cclxuXHJcblx0dGhpcy5oYW5kbGU9a2ZzLm9wZW4ocGF0aCk7XHJcblx0dGhpcy5vcGVuZWQ9dHJ1ZTtcclxuXHRzZXR1cGFwaS5jYWxsKHRoaXMpO1xyXG5cdHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1PcGVuOyIsIi8qXHJcbiAgSlNDb250ZXh0IGNhbiByZXR1cm4gYWxsIEphdmFzY3JpcHQgdHlwZXMuXHJcbiovXHJcbnZhciB2ZXJib3NlPTE7XHJcblxyXG52YXIgcmVhZFNpZ25hdHVyZT1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJlYWQgc2lnbmF0dXJlIGF0IFwiK3Bvcyk7XHJcblx0dmFyIHNpZ25hdHVyZT1rZnMucmVhZFVURjhTdHJpbmcodGhpcy5oYW5kbGUscG9zLDEpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKHNpZ25hdHVyZStcIiBcIitzaWduYXR1cmUuY2hhckNvZGVBdCgwKSk7XHJcblx0Y2IuYXBwbHkodGhpcyxbc2lnbmF0dXJlXSk7XHJcbn1cclxudmFyIHJlYWRJMzI9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkIGkzMiBhdCBcIitwb3MpO1xyXG5cdHZhciBpMzI9a2ZzLnJlYWRJbnQzMih0aGlzLmhhbmRsZSxwb3MpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKGkzMik7XHJcblx0Y2IuYXBwbHkodGhpcyxbaTMyXSk7XHRcclxufVxyXG52YXIgcmVhZFVJMzI9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkIHVpMzIgYXQgXCIrcG9zKTtcclxuXHR2YXIgdWkzMj1rZnMucmVhZFVJbnQzMih0aGlzLmhhbmRsZSxwb3MpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKHVpMzIpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW3VpMzJdKTtcclxufVxyXG52YXIgcmVhZFVJOD1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJlYWQgdWk4IGF0IFwiK3Bvcyk7IFxyXG5cdHZhciB1aTg9a2ZzLnJlYWRVSW50OCh0aGlzLmhhbmRsZSxwb3MpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKHVpOCk7XHJcblx0Y2IuYXBwbHkodGhpcyxbdWk4XSk7XHJcbn1cclxudmFyIHJlYWRCdWY9ZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxjYikge1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwicmVhZCBidWZmZXIgYXQgXCIrcG9zKTtcclxuXHR2YXIgYnVmPWtmcy5yZWFkQnVmKHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwiYnVmZmVyIGxlbmd0aFwiK2J1Zi5sZW5ndGgpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW2J1Zl0pO1x0XHJcbn1cclxudmFyIHJlYWRCdWZfcGFja2VkaW50PWZ1bmN0aW9uKHBvcyxibG9ja3NpemUsY291bnQscmVzZXQsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJlYWQgcGFja2VkIGludCBmYXN0LCBibG9ja3NpemUgXCIrYmxvY2tzaXplK1wiIGF0IFwiK3Bvcyk7dmFyIHQ9bmV3IERhdGUoKTtcclxuXHR2YXIgYnVmPWtmcy5yZWFkQnVmX3BhY2tlZGludCh0aGlzLmhhbmRsZSxwb3MsYmxvY2tzaXplLGNvdW50LHJlc2V0KTtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJldHVybiBmcm9tIHBhY2tlZGludCwgdGltZVwiICsgKG5ldyBEYXRlKCktdCkpO1xyXG5cdGlmICh0eXBlb2YgYnVmLmRhdGE9PVwic3RyaW5nXCIpIHtcclxuXHRcdGJ1Zi5kYXRhPWV2YWwoXCJbXCIrYnVmLmRhdGEuc3Vic3RyKDAsYnVmLmRhdGEubGVuZ3RoLTEpK1wiXVwiKTtcclxuXHR9XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJ1bnBhY2tlZCBsZW5ndGhcIitidWYuZGF0YS5sZW5ndGgrXCIgdGltZVwiICsgKG5ldyBEYXRlKCktdCkgKTtcclxuXHRjYi5hcHBseSh0aGlzLFtidWZdKTtcclxufVxyXG5cclxuXHJcbnZhciByZWFkU3RyaW5nPSBmdW5jdGlvbihwb3MsYmxvY2tzaXplLGVuY29kaW5nLGNiKSB7XHJcblxyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwicmVhZHN0cmluZyBhdCBcIitwb3MrXCIgYmxvY2tzaXplIFwiK2Jsb2Nrc2l6ZStcIiBcIitlbmNvZGluZyk7dmFyIHQ9bmV3IERhdGUoKTtcclxuXHRpZiAoZW5jb2Rpbmc9PVwidWNzMlwiKSB7XHJcblx0XHR2YXIgc3RyPWtmcy5yZWFkVUxFMTZTdHJpbmcodGhpcy5oYW5kbGUscG9zLGJsb2Nrc2l6ZSk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHZhciBzdHI9a2ZzLnJlYWRVVEY4U3RyaW5nKHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUpO1x0XHJcblx0fVxyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKHN0citcIiB0aW1lXCIrKG5ldyBEYXRlKCktdCkpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW3N0cl0pO1x0XHJcbn1cclxuXHJcbnZhciByZWFkRml4ZWRBcnJheSA9IGZ1bmN0aW9uKHBvcyAsY291bnQsIHVuaXRzaXplLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkIGZpeGVkIGFycmF5IGF0IFwiK3Bvcyk7IHZhciB0PW5ldyBEYXRlKCk7XHJcblx0dmFyIGJ1Zj1rZnMucmVhZEZpeGVkQXJyYXkodGhpcy5oYW5kbGUscG9zLGNvdW50LHVuaXRzaXplKTtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcImFycmF5IGxlbmd0aCBcIitidWYubGVuZ3RoK1wiIHRpbWVcIisobmV3IERhdGUoKS10KSk7XHJcblx0Y2IuYXBwbHkodGhpcyxbYnVmXSk7XHRcclxufVxyXG52YXIgcmVhZFN0cmluZ0FycmF5ID0gZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxlbmNvZGluZyxjYikge1xyXG5cdC8vaWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkIFN0cmluZyBhcnJheSBcIitibG9ja3NpemUgK1wiIFwiK2VuY29kaW5nKTsgXHJcblx0ZW5jb2RpbmcgPSBlbmNvZGluZ3x8XCJ1dGY4XCI7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkIHN0cmluZyBhcnJheSBhdCBcIitwb3MpO3ZhciB0PW5ldyBEYXRlKCk7XHJcblx0dmFyIGJ1Zj1rZnMucmVhZFN0cmluZ0FycmF5KHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUsZW5jb2RpbmcpO1xyXG5cdGlmICh0eXBlb2YgYnVmPT1cInN0cmluZ1wiKSBidWY9YnVmLnNwbGl0KFwiXFwwXCIpO1xyXG5cdC8vdmFyIGJ1ZmY9SlNPTi5wYXJzZShidWYpO1xyXG5cdC8vdmFyIGJ1ZmY9YnVmLnNwbGl0KFwiXFx1ZmZmZlwiKTsgLy9jYW5ub3QgcmV0dXJuIHN0cmluZyB3aXRoIDBcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInN0cmluZyBhcnJheSBsZW5ndGhcIitidWYubGVuZ3RoK1wiIHRpbWVcIisobmV3IERhdGUoKS10KSk7XHJcblx0Y2IuYXBwbHkodGhpcyxbYnVmXSk7XHJcbn1cclxuXHJcbnZhciBtZXJnZVBvc3RpbmdzPWZ1bmN0aW9uKHBvc2l0aW9ucykge1xyXG5cdHZhciBidWY9a2ZzLm1lcmdlUG9zdGluZ3ModGhpcy5oYW5kbGUscG9zaXRpb25zKTtcclxuXHRpZiAodHlwZW9mIGJ1Zj09XCJzdHJpbmdcIikge1xyXG5cdFx0YnVmPWV2YWwoXCJbXCIrYnVmLnN1YnN0cigwLGJ1Zi5sZW5ndGgtMSkrXCJdXCIpO1xyXG5cdH1cclxuXHRyZXR1cm4gYnVmO1xyXG59XHJcbnZhciBmcmVlPWZ1bmN0aW9uKCkge1xyXG5cdC8vLy9pZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZygnY2xvc2luZyAnLGhhbmRsZSk7XHJcblx0a2ZzLmNsb3NlKHRoaXMuaGFuZGxlKTtcclxufVxyXG52YXIgT3Blbj1mdW5jdGlvbihwYXRoLG9wdHMsY2IpIHtcclxuXHRvcHRzPW9wdHN8fHt9O1xyXG5cdHZhciBzaWduYXR1cmVfc2l6ZT0xO1xyXG5cdHZhciBzZXR1cGFwaT1mdW5jdGlvbigpIHsgXHJcblx0XHR0aGlzLnJlYWRTaWduYXR1cmU9cmVhZFNpZ25hdHVyZTtcclxuXHRcdHRoaXMucmVhZEkzMj1yZWFkSTMyO1xyXG5cdFx0dGhpcy5yZWFkVUkzMj1yZWFkVUkzMjtcclxuXHRcdHRoaXMucmVhZFVJOD1yZWFkVUk4O1xyXG5cdFx0dGhpcy5yZWFkQnVmPXJlYWRCdWY7XHJcblx0XHR0aGlzLnJlYWRCdWZfcGFja2VkaW50PXJlYWRCdWZfcGFja2VkaW50O1xyXG5cdFx0dGhpcy5yZWFkRml4ZWRBcnJheT1yZWFkRml4ZWRBcnJheTtcclxuXHRcdHRoaXMucmVhZFN0cmluZz1yZWFkU3RyaW5nO1xyXG5cdFx0dGhpcy5yZWFkU3RyaW5nQXJyYXk9cmVhZFN0cmluZ0FycmF5O1xyXG5cdFx0dGhpcy5zaWduYXR1cmVfc2l6ZT1zaWduYXR1cmVfc2l6ZTtcclxuXHRcdHRoaXMubWVyZ2VQb3N0aW5ncz1tZXJnZVBvc3RpbmdzO1xyXG5cdFx0dGhpcy5mcmVlPWZyZWU7XHJcblx0XHR0aGlzLnNpemU9a2ZzLmdldEZpbGVTaXplKHRoaXMuaGFuZGxlKTtcclxuXHRcdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwiZmlsZXNpemUgIFwiK3RoaXMuc2l6ZSk7XHJcblx0XHRpZiAoY2IpXHRjYi5jYWxsKHRoaXMpO1xyXG5cdH1cclxuXHJcblx0dGhpcy5oYW5kbGU9a2ZzLm9wZW4ocGF0aCk7XHJcblx0dGhpcy5vcGVuZWQ9dHJ1ZTtcclxuXHRzZXR1cGFwaS5jYWxsKHRoaXMpO1xyXG5cdHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1PcGVuOyIsIi8qXHJcbiAgVE9ET1xyXG4gIGFuZCBub3RcclxuXHJcbiovXHJcblxyXG4vLyBodHRwOi8vanNmaWRkbGUubmV0L25lb3N3Zi9hWHpXdy9cclxudmFyIHBsaXN0PXJlcXVpcmUoJy4vcGxpc3QnKTtcclxuZnVuY3Rpb24gaW50ZXJzZWN0KEksIEopIHtcclxuICB2YXIgaSA9IGogPSAwO1xyXG4gIHZhciByZXN1bHQgPSBbXTtcclxuXHJcbiAgd2hpbGUoIGkgPCBJLmxlbmd0aCAmJiBqIDwgSi5sZW5ndGggKXtcclxuICAgICBpZiAgICAgIChJW2ldIDwgSltqXSkgaSsrOyBcclxuICAgICBlbHNlIGlmIChJW2ldID4gSltqXSkgaisrOyBcclxuICAgICBlbHNlIHtcclxuICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXT1sW2ldO1xyXG4gICAgICAgaSsrO2orKztcclxuICAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbi8qIHJldHVybiBhbGwgaXRlbXMgaW4gSSBidXQgbm90IGluIEogKi9cclxuZnVuY3Rpb24gc3VidHJhY3QoSSwgSikge1xyXG4gIHZhciBpID0gaiA9IDA7XHJcbiAgdmFyIHJlc3VsdCA9IFtdO1xyXG5cclxuICB3aGlsZSggaSA8IEkubGVuZ3RoICYmIGogPCBKLmxlbmd0aCApe1xyXG4gICAgaWYgKElbaV09PUpbal0pIHtcclxuICAgICAgaSsrO2orKztcclxuICAgIH0gZWxzZSBpZiAoSVtpXTxKW2pdKSB7XHJcbiAgICAgIHdoaWxlIChJW2ldPEpbal0pIHJlc3VsdFtyZXN1bHQubGVuZ3RoXT0gSVtpKytdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2hpbGUoSltqXTxJW2ldKSBqKys7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAoaj09Si5sZW5ndGgpIHtcclxuICAgIHdoaWxlIChpPEkubGVuZ3RoKSByZXN1bHRbcmVzdWx0Lmxlbmd0aF09SVtpKytdO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxudmFyIHVuaW9uPWZ1bmN0aW9uKGEsYikge1xyXG5cdGlmICghYSB8fCAhYS5sZW5ndGgpIHJldHVybiBiO1xyXG5cdGlmICghYiB8fCAhYi5sZW5ndGgpIHJldHVybiBhO1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgdmFyIGFpID0gMDtcclxuICAgIHZhciBiaSA9IDA7XHJcbiAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgIGlmICggYWkgPCBhLmxlbmd0aCAmJiBiaSA8IGIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlmIChhW2FpXSA8IGJbYmldKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF09YVthaV07XHJcbiAgICAgICAgICAgICAgICBhaSsrO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFbYWldID4gYltiaV0pIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXT1iW2JpXTtcclxuICAgICAgICAgICAgICAgIGJpKys7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF09YVthaV07XHJcbiAgICAgICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF09YltiaV07XHJcbiAgICAgICAgICAgICAgICBhaSsrO1xyXG4gICAgICAgICAgICAgICAgYmkrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoYWkgPCBhLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIGEuc2xpY2UoYWksIGEubGVuZ3RoKSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoYmkgPCBiLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIGIuc2xpY2UoYmksIGIubGVuZ3RoKSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxudmFyIE9QRVJBVElPTj17J2luY2x1ZGUnOmludGVyc2VjdCwgJ3VuaW9uJzp1bmlvbiwgJ2V4Y2x1ZGUnOnN1YnRyYWN0fTtcclxuXHJcbnZhciBib29sU2VhcmNoPWZ1bmN0aW9uKG9wdHMpIHtcclxuICBvcHRzPW9wdHN8fHt9O1xyXG4gIG9wcz1vcHRzLm9wfHx0aGlzLm9wdHMub3A7XHJcbiAgdGhpcy5kb2NzPVtdO1xyXG5cdGlmICghdGhpcy5waHJhc2VzLmxlbmd0aCkgcmV0dXJuO1xyXG5cdHZhciByPXRoaXMucGhyYXNlc1swXS5kb2NzO1xyXG4gIC8qIGlnbm9yZSBvcGVyYXRvciBvZiBmaXJzdCBwaHJhc2UgKi9cclxuXHRmb3IgKHZhciBpPTE7aTx0aGlzLnBocmFzZXMubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIG9wPSBvcHNbaV0gfHwgJ3VuaW9uJztcclxuXHRcdHI9T1BFUkFUSU9OW29wXShyLHRoaXMucGhyYXNlc1tpXS5kb2NzKTtcclxuXHR9XHJcblx0dGhpcy5kb2NzPXBsaXN0LnVuaXF1ZShyKTtcclxuXHRyZXR1cm4gdGhpcztcclxufVxyXG5tb2R1bGUuZXhwb3J0cz17c2VhcmNoOmJvb2xTZWFyY2h9IiwibW9kdWxlLmV4cG9ydHM9cmVxdWlyZShcIkM6XFxcXGtzYW5hMjAxNVxcXFxub2RlX21vZHVsZXNcXFxca3NhbmEtZGF0YWJhc2VcXFxcYnNlYXJjaC5qc1wiKSIsInZhciBwbGlzdD1yZXF1aXJlKFwiLi9wbGlzdFwiKTtcclxuXHJcbnZhciBnZXRQaHJhc2VXaWR0aHM9ZnVuY3Rpb24gKFEscGhyYXNlaWQsdnBvc3MpIHtcclxuXHR2YXIgcmVzPVtdO1xyXG5cdGZvciAodmFyIGkgaW4gdnBvc3MpIHtcclxuXHRcdHJlcy5wdXNoKGdldFBocmFzZVdpZHRoKFEscGhyYXNlaWQsdnBvc3NbaV0pKTtcclxuXHR9XHJcblx0cmV0dXJuIHJlcztcclxufVxyXG52YXIgZ2V0UGhyYXNlV2lkdGg9ZnVuY3Rpb24gKFEscGhyYXNlaWQsdnBvcykge1xyXG5cdHZhciBQPVEucGhyYXNlc1twaHJhc2VpZF07XHJcblx0dmFyIHdpZHRoPTAsdmFyd2lkdGg9ZmFsc2U7XHJcblx0aWYgKFAud2lkdGgpIHJldHVybiBQLndpZHRoOyAvLyBubyB3aWxkY2FyZFxyXG5cdGlmIChQLnRlcm1pZC5sZW5ndGg8MikgcmV0dXJuIFAudGVybWxlbmd0aFswXTtcclxuXHR2YXIgbGFzdHRlcm1wb3N0aW5nPVEudGVybXNbUC50ZXJtaWRbUC50ZXJtaWQubGVuZ3RoLTFdXS5wb3N0aW5nO1xyXG5cclxuXHRmb3IgKHZhciBpIGluIFAudGVybWlkKSB7XHJcblx0XHR2YXIgVD1RLnRlcm1zW1AudGVybWlkW2ldXTtcclxuXHRcdGlmIChULm9wPT0nd2lsZGNhcmQnKSB7XHJcblx0XHRcdHdpZHRoKz1ULndpZHRoO1xyXG5cdFx0XHRpZiAoVC53aWxkY2FyZD09JyonKSB2YXJ3aWR0aD10cnVlO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0d2lkdGgrPVAudGVybWxlbmd0aFtpXTtcclxuXHRcdH1cclxuXHR9XHJcblx0aWYgKHZhcndpZHRoKSB7IC8vd2lkdGggbWlnaHQgYmUgc21hbGxlciBkdWUgdG8gKiB3aWxkY2FyZFxyXG5cdFx0dmFyIGF0PXBsaXN0LmluZGV4T2ZTb3J0ZWQobGFzdHRlcm1wb3N0aW5nLHZwb3MpO1xyXG5cdFx0dmFyIGVuZHBvcz1sYXN0dGVybXBvc3RpbmdbYXRdO1xyXG5cdFx0aWYgKGVuZHBvcy12cG9zPHdpZHRoKSB3aWR0aD1lbmRwb3MtdnBvcysxO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHdpZHRoO1xyXG59XHJcbi8qIHJldHVybiBbdnBvcywgcGhyYXNlaWQsIHBocmFzZXdpZHRoLCBvcHRpb25hbF90YWduYW1lXSBieSBzbG90IHJhbmdlKi9cclxudmFyIGhpdEluUmFuZ2U9ZnVuY3Rpb24oUSxzdGFydHZwb3MsZW5kdnBvcykge1xyXG5cdHZhciByZXM9W107XHJcblx0aWYgKCFRIHx8ICFRLnJhd3Jlc3VsdCB8fCAhUS5yYXdyZXN1bHQubGVuZ3RoKSByZXR1cm4gcmVzO1xyXG5cdGZvciAodmFyIGk9MDtpPFEucGhyYXNlcy5sZW5ndGg7aSsrKSB7XHJcblx0XHR2YXIgUD1RLnBocmFzZXNbaV07XHJcblx0XHRpZiAoIVAucG9zdGluZykgY29udGludWU7XHJcblx0XHR2YXIgcz1wbGlzdC5pbmRleE9mU29ydGVkKFAucG9zdGluZyxzdGFydHZwb3MpO1xyXG5cdFx0dmFyIGU9cGxpc3QuaW5kZXhPZlNvcnRlZChQLnBvc3RpbmcsZW5kdnBvcyk7XHJcblx0XHR2YXIgcj1QLnBvc3Rpbmcuc2xpY2UocyxlKzEpO1xyXG5cdFx0dmFyIHdpZHRoPWdldFBocmFzZVdpZHRocyhRLGkscik7XHJcblxyXG5cdFx0cmVzPXJlcy5jb25jYXQoci5tYXAoZnVuY3Rpb24odnBvcyxpZHgpeyByZXR1cm4gW3Zwb3Msd2lkdGhbaWR4XSxpXSB9KSk7XHJcblx0fVxyXG5cdC8vIG9yZGVyIGJ5IHZwb3MsIGlmIHZwb3MgaXMgdGhlIHNhbWUsIGxhcmdlciB3aWR0aCBjb21lIGZpcnN0LlxyXG5cdC8vIHNvIHRoZSBvdXRwdXQgd2lsbCBiZVxyXG5cdC8vIDx0YWcxPjx0YWcyPm9uZTwvdGFnMj50d288L3RhZzE+XHJcblx0Ly9UT0RPLCBtaWdodCBjYXVzZSBvdmVybGFwIGlmIHNhbWUgdnBvcyBhbmQgc2FtZSB3aWR0aFxyXG5cdC8vbmVlZCB0byBjaGVjayB0YWcgbmFtZVxyXG5cdHJlcy5zb3J0KGZ1bmN0aW9uKGEsYil7cmV0dXJuIGFbMF09PWJbMF0/IGJbMV0tYVsxXSA6YVswXS1iWzBdfSk7XHJcblxyXG5cdHJldHVybiByZXM7XHJcbn1cclxuXHJcbnZhciB0YWdzSW5SYW5nZT1mdW5jdGlvbihRLHJlbmRlclRhZ3Msc3RhcnR2cG9zLGVuZHZwb3MpIHtcclxuXHR2YXIgcmVzPVtdO1xyXG5cdGlmICh0eXBlb2YgcmVuZGVyVGFncz09XCJzdHJpbmdcIikgcmVuZGVyVGFncz1bcmVuZGVyVGFnc107XHJcblxyXG5cdHJlbmRlclRhZ3MubWFwKGZ1bmN0aW9uKHRhZyl7XHJcblx0XHR2YXIgc3RhcnRzPVEuZW5naW5lLmdldChbXCJmaWVsZHNcIix0YWcrXCJfc3RhcnRcIl0pO1xyXG5cdFx0dmFyIGVuZHM9US5lbmdpbmUuZ2V0KFtcImZpZWxkc1wiLHRhZytcIl9lbmRcIl0pO1xyXG5cdFx0aWYgKCFzdGFydHMpIHJldHVybjtcclxuXHJcblx0XHR2YXIgcz1wbGlzdC5pbmRleE9mU29ydGVkKHN0YXJ0cyxzdGFydHZwb3MpO1xyXG5cdFx0dmFyIGU9cztcclxuXHRcdHdoaWxlIChlPHN0YXJ0cy5sZW5ndGggJiYgc3RhcnRzW2VdPGVuZHZwb3MpIGUrKztcclxuXHRcdHZhciBvcGVudGFncz1zdGFydHMuc2xpY2UocyxlKTtcclxuXHJcblx0XHRzPXBsaXN0LmluZGV4T2ZTb3J0ZWQoZW5kcyxzdGFydHZwb3MpO1xyXG5cdFx0ZT1zO1xyXG5cdFx0d2hpbGUgKGU8ZW5kcy5sZW5ndGggJiYgZW5kc1tlXTxlbmR2cG9zKSBlKys7XHJcblx0XHR2YXIgY2xvc2V0YWdzPWVuZHMuc2xpY2UocyxlKTtcclxuXHJcblx0XHRvcGVudGFncy5tYXAoZnVuY3Rpb24oc3RhcnQsaWR4KSB7XHJcblx0XHRcdHJlcy5wdXNoKFtzdGFydCxjbG9zZXRhZ3NbaWR4XS1zdGFydCx0YWddKTtcclxuXHRcdH0pXHJcblx0fSk7XHJcblx0Ly8gb3JkZXIgYnkgdnBvcywgaWYgdnBvcyBpcyB0aGUgc2FtZSwgbGFyZ2VyIHdpZHRoIGNvbWUgZmlyc3QuXHJcblx0cmVzLnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gYVswXT09YlswXT8gYlsxXS1hWzFdIDphWzBdLWJbMF19KTtcclxuXHJcblx0cmV0dXJuIHJlcztcclxufVxyXG5cclxuLypcclxuZ2l2ZW4gYSB2cG9zIHJhbmdlIHN0YXJ0LCBmaWxlLCBjb252ZXJ0IHRvIGZpbGVzdGFydCwgZmlsZWVuZFxyXG4gICBmaWxlc3RhcnQgOiBzdGFydGluZyBmaWxlXHJcbiAgIHN0YXJ0ICAgOiB2cG9zIHN0YXJ0XHJcbiAgIHNob3dmaWxlOiBob3cgbWFueSBmaWxlcyB0byBkaXNwbGF5XHJcbiAgIHNob3dwYWdlOiBob3cgbWFueSBwYWdlcyB0byBkaXNwbGF5XHJcblxyXG5vdXRwdXQ6XHJcbiAgIGFycmF5IG9mIGZpbGVpZCB3aXRoIGhpdHNcclxuKi9cclxudmFyIGdldEZpbGVXaXRoSGl0cz1mdW5jdGlvbihlbmdpbmUsUSxyYW5nZSkge1xyXG5cdHZhciBmaWxlT2Zmc2V0cz1lbmdpbmUuZ2V0KFwiZmlsZW9mZnNldHNcIik7XHJcblx0dmFyIG91dD1bXSxmaWxlY291bnQ9MTAwO1xyXG5cdHZhciBzdGFydD0wICwgZW5kPVEuYnlGaWxlLmxlbmd0aDtcclxuXHRRLmV4Y2VycHRPdmVyZmxvdz1mYWxzZTtcclxuXHRpZiAocmFuZ2Uuc3RhcnQpIHtcclxuXHRcdHZhciBmaXJzdD1yYW5nZS5zdGFydCA7XHJcblx0XHR2YXIgbGFzdD1yYW5nZS5lbmQ7XHJcblx0XHRpZiAoIWxhc3QpIGxhc3Q9TnVtYmVyLk1BWF9TQUZFX0lOVEVHRVI7XHJcblx0XHRmb3IgKHZhciBpPTA7aTxmaWxlT2Zmc2V0cy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdC8vaWYgKGZpbGVPZmZzZXRzW2ldPmZpcnN0KSBicmVhaztcclxuXHRcdFx0aWYgKGZpbGVPZmZzZXRzW2ldPmxhc3QpIHtcclxuXHRcdFx0XHRlbmQ9aTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZmlsZU9mZnNldHNbaV08Zmlyc3QpIHN0YXJ0PWk7XHJcblx0XHR9XHRcdFxyXG5cdH0gZWxzZSB7XHJcblx0XHRzdGFydD1yYW5nZS5maWxlc3RhcnQgfHwgMDtcclxuXHRcdGlmIChyYW5nZS5tYXhmaWxlKSB7XHJcblx0XHRcdGZpbGVjb3VudD1yYW5nZS5tYXhmaWxlO1xyXG5cdFx0fSBlbHNlIGlmIChyYW5nZS5zaG93c2VnKSB7XHJcblx0XHRcdHRocm93IFwibm90IGltcGxlbWVudCB5ZXRcIlxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIGZpbGVXaXRoSGl0cz1bXSx0b3RhbGhpdD0wO1xyXG5cdHJhbmdlLm1heGhpdD1yYW5nZS5tYXhoaXR8fDEwMDA7XHJcblxyXG5cdGZvciAodmFyIGk9c3RhcnQ7aTxlbmQ7aSsrKSB7XHJcblx0XHRpZihRLmJ5RmlsZVtpXS5sZW5ndGg+MCkge1xyXG5cdFx0XHR0b3RhbGhpdCs9US5ieUZpbGVbaV0ubGVuZ3RoO1xyXG5cdFx0XHRmaWxlV2l0aEhpdHMucHVzaChpKTtcclxuXHRcdFx0cmFuZ2UubmV4dEZpbGVTdGFydD1pO1xyXG5cdFx0XHRpZiAoZmlsZVdpdGhIaXRzLmxlbmd0aD49ZmlsZWNvdW50KSB7XHJcblx0XHRcdFx0US5leGNlcnB0T3ZlcmZsb3c9dHJ1ZTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodG90YWxoaXQ+cmFuZ2UubWF4aGl0KSB7XHJcblx0XHRcdFx0US5leGNlcnB0T3ZlcmZsb3c9dHJ1ZTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRpZiAoaT49ZW5kKSB7IC8vbm8gbW9yZSBmaWxlXHJcblx0XHRRLmV4Y2VycHRTdG9wPXRydWU7XHJcblx0fVxyXG5cdHJldHVybiBmaWxlV2l0aEhpdHM7XHJcbn1cclxudmFyIHJlc3VsdGxpc3Q9ZnVuY3Rpb24oZW5naW5lLFEsb3B0cyxjYikge1xyXG5cdHZhciBvdXRwdXQ9W107XHJcblx0aWYgKCFRLnJhd3Jlc3VsdCB8fCAhUS5yYXdyZXN1bHQubGVuZ3RoKSB7XHJcblx0XHRjYihvdXRwdXQpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0aWYgKG9wdHMucmFuZ2UpIHtcclxuXHRcdGlmIChvcHRzLnJhbmdlLm1heGhpdCAmJiAhb3B0cy5yYW5nZS5tYXhmaWxlKSB7XHJcblx0XHRcdG9wdHMucmFuZ2UubWF4ZmlsZT1vcHRzLnJhbmdlLm1heGhpdDtcclxuXHRcdFx0b3B0cy5yYW5nZS5tYXhzZWc9b3B0cy5yYW5nZS5tYXhoaXQ7XHJcblx0XHR9XHJcblx0XHRpZiAoIW9wdHMucmFuZ2UubWF4c2VnKSBvcHRzLnJhbmdlLm1heHNlZz0xMDA7XHJcblx0XHRpZiAoIW9wdHMucmFuZ2UuZW5kKSB7XHJcblx0XHRcdG9wdHMucmFuZ2UuZW5kPU51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xyXG5cdFx0fVxyXG5cdH1cclxuXHR2YXIgZmlsZVdpdGhIaXRzPWdldEZpbGVXaXRoSGl0cyhlbmdpbmUsUSxvcHRzLnJhbmdlKTtcclxuXHRpZiAoIWZpbGVXaXRoSGl0cy5sZW5ndGgpIHtcclxuXHRcdGNiKG91dHB1dCk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHR2YXIgb3V0cHV0PVtdLGZpbGVzPVtdOy8vdGVtcG9yYXJ5IGhvbGRlciBmb3Igc2VnbmFtZXNcclxuXHRmb3IgKHZhciBpPTA7aTxmaWxlV2l0aEhpdHMubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIG5maWxlPWZpbGVXaXRoSGl0c1tpXTtcclxuXHRcdHZhciBzZWdvZmZzZXRzPWVuZ2luZS5nZXRGaWxlU2VnT2Zmc2V0cyhuZmlsZSk7XHJcblx0XHR2YXIgc2VnbmFtZXM9ZW5naW5lLmdldEZpbGVTZWdOYW1lcyhuZmlsZSk7XHJcblx0XHRmaWxlc1tuZmlsZV09e3NlZ29mZnNldHM6c2Vnb2Zmc2V0c307XHJcblx0XHR2YXIgc2Vnd2l0aGhpdD1wbGlzdC5ncm91cGJ5cG9zdGluZzIoUS5ieUZpbGVbIG5maWxlIF0sICBzZWdvZmZzZXRzKTtcclxuXHRcdC8vaWYgKHNlZ29mZnNldHNbMF09PTEpXHJcblx0XHQvL3NlZ3dpdGhoaXQuc2hpZnQoKTsgLy90aGUgZmlyc3QgaXRlbSBpcyBub3QgdXNlZCAoMH5RLmJ5RmlsZVswXSApXHJcblxyXG5cdFx0Zm9yICh2YXIgaj0wOyBqPHNlZ3dpdGhoaXQubGVuZ3RoO2orKykge1xyXG5cdFx0XHRpZiAoIXNlZ3dpdGhoaXRbal0ubGVuZ3RoKSBjb250aW51ZTtcclxuXHRcdFx0Ly92YXIgb2Zmc2V0cz1zZWd3aXRoaGl0W2pdLm1hcChmdW5jdGlvbihwKXtyZXR1cm4gcC0gZmlsZU9mZnNldHNbaV19KTtcclxuXHRcdFx0aWYgKHNlZ29mZnNldHNbal0+b3B0cy5yYW5nZS5lbmQpIGJyZWFrO1xyXG5cdFx0XHRvdXRwdXQucHVzaCggIHtmaWxlOiBuZmlsZSwgc2VnOmosICBzZWduYW1lOnNlZ25hbWVzW2pdfSk7XHJcblx0XHRcdGlmIChvdXRwdXQubGVuZ3RoPm9wdHMucmFuZ2UubWF4c2VnKSBicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciBzZWdwYXRocz1vdXRwdXQubWFwKGZ1bmN0aW9uKHApe1xyXG5cdFx0cmV0dXJuIFtcImZpbGVjb250ZW50c1wiLHAuZmlsZSxwLnNlZ107XHJcblx0fSk7XHJcblx0Ly9wcmVwYXJlIHRoZSB0ZXh0XHJcblx0ZW5naW5lLmdldChzZWdwYXRocyxmdW5jdGlvbihzZWdzKXtcclxuXHRcdHZhciBzZXE9MDtcclxuXHRcdGlmIChzZWdzKSBmb3IgKHZhciBpPTA7aTxzZWdzLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0dmFyIHN0YXJ0dnBvcz1maWxlc1tvdXRwdXRbaV0uZmlsZV0uc2Vnb2Zmc2V0c1tvdXRwdXRbaV0uc2VnLTFdIHx8MDtcclxuXHRcdFx0dmFyIGVuZHZwb3M9ZmlsZXNbb3V0cHV0W2ldLmZpbGVdLnNlZ29mZnNldHNbb3V0cHV0W2ldLnNlZ107XHJcblx0XHRcdHZhciBobD17fTtcclxuXHJcblx0XHRcdGlmIChvcHRzLnJhbmdlICYmIG9wdHMucmFuZ2Uuc3RhcnQgICkge1xyXG5cdFx0XHRcdGlmICggc3RhcnR2cG9zPG9wdHMucmFuZ2Uuc3RhcnQpIHN0YXJ0dnBvcz1vcHRzLnJhbmdlLnN0YXJ0O1xyXG5cdFx0XHQvL1x0aWYgKGVuZHZwb3M+b3B0cy5yYW5nZS5lbmQpIGVuZHZwb3M9b3B0cy5yYW5nZS5lbmQ7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdGlmIChvcHRzLm5vaGlnaGxpZ2h0KSB7XHJcblx0XHRcdFx0aGwudGV4dD1zZWdzW2ldO1xyXG5cdFx0XHRcdGhsLmhpdHM9aGl0SW5SYW5nZShRLHN0YXJ0dnBvcyxlbmR2cG9zKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR2YXIgbz17bm9jcmxmOnRydWUsbm9zcGFuOnRydWUsXHJcblx0XHRcdFx0XHR0ZXh0OnNlZ3NbaV0sc3RhcnR2cG9zOnN0YXJ0dnBvcywgZW5kdnBvczogZW5kdnBvcywgXHJcblx0XHRcdFx0XHRROlEsZnVsbHRleHQ6b3B0cy5mdWxsdGV4dH07XHJcblx0XHRcdFx0aGw9aGlnaGxpZ2h0KFEsbyk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGhsLnRleHQpIHtcclxuXHRcdFx0XHRvdXRwdXRbaV0udGV4dD1obC50ZXh0O1xyXG5cdFx0XHRcdG91dHB1dFtpXS5oaXRzPWhsLmhpdHM7XHJcblx0XHRcdFx0b3V0cHV0W2ldLnNlcT1zZXE7XHJcblx0XHRcdFx0c2VxKz1obC5oaXRzLmxlbmd0aDtcclxuXHJcblx0XHRcdFx0b3V0cHV0W2ldLnN0YXJ0PXN0YXJ0dnBvcztcdFx0XHRcdFxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG91dHB1dFtpXT1udWxsOyAvL3JlbW92ZSBpdGVtIHZwb3MgbGVzcyB0aGFuIG9wdHMucmFuZ2Uuc3RhcnRcclxuXHRcdFx0fVxyXG5cdFx0fSBcclxuXHRcdG91dHB1dD1vdXRwdXQuZmlsdGVyKGZ1bmN0aW9uKG8pe3JldHVybiBvIT1udWxsfSk7XHJcblx0XHRjYihvdXRwdXQpO1xyXG5cdH0pO1xyXG59XHJcbnZhciBpbmplY3RUYWc9ZnVuY3Rpb24oUSxvcHRzKXtcclxuXHR2YXIgaGl0cz1vcHRzLmhpdHM7XHJcblx0dmFyIHRhZ3M9b3B0cy50YWdzO1xyXG5cdGlmICghdGFncykgdGFncz1bXTtcclxuXHR2YXIgaGl0Y2xhc3M9b3B0cy5oaXRjbGFzc3x8J2hsJztcclxuXHR2YXIgb3V0cHV0PScnLE89W10saj0wLGs9MDtcclxuXHR2YXIgc3Vycm91bmQ9b3B0cy5zdXJyb3VuZHx8NTtcclxuXHJcblx0dmFyIHRva2Vucz1RLnRva2VuaXplKG9wdHMudGV4dCkudG9rZW5zO1xyXG5cdHZhciB2cG9zPW9wdHMudnBvcztcclxuXHR2YXIgaT0wLHByZXZpbnJhbmdlPSEhb3B0cy5mdWxsdGV4dCAsaW5yYW5nZT0hIW9wdHMuZnVsbHRleHQ7XHJcblx0dmFyIGhpdHN0YXJ0PTAsaGl0ZW5kPTAsdGFnc3RhcnQ9MCx0YWdlbmQ9MCx0YWdjbGFzcz1cIlwiO1xyXG5cdHdoaWxlIChpPHRva2Vucy5sZW5ndGgpIHtcclxuXHRcdHZhciBza2lwPVEuaXNTa2lwKHRva2Vuc1tpXSk7XHJcblx0XHR2YXIgaGFzaGl0PWZhbHNlO1xyXG5cdFx0aW5yYW5nZT1vcHRzLmZ1bGx0ZXh0IHx8IChqPGhpdHMubGVuZ3RoICYmIHZwb3Mrc3Vycm91bmQ+PWhpdHNbal1bMF0gfHxcclxuXHRcdFx0XHQoaj4wICYmIGo8PWhpdHMubGVuZ3RoICYmICBoaXRzW2otMV1bMF0rc3Vycm91bmQqMj49dnBvcykpO1x0XHJcblxyXG5cdFx0aWYgKHByZXZpbnJhbmdlIT1pbnJhbmdlKSB7XHJcblx0XHRcdG91dHB1dCs9b3B0cy5hYnJpZGdlfHxcIi4uLlwiO1xyXG5cdFx0fVxyXG5cdFx0cHJldmlucmFuZ2U9aW5yYW5nZTtcclxuXHRcdHZhciB0b2tlbj10b2tlbnNbaV07XHJcblx0XHRpZiAob3B0cy5ub2NybGYgJiYgdG9rZW49PVwiXFxuXCIpIHRva2VuPVwiXCI7XHJcblxyXG5cdFx0aWYgKGlucmFuZ2UgJiYgaTx0b2tlbnMubGVuZ3RoKSB7XHJcblx0XHRcdGlmIChza2lwKSB7XHJcblx0XHRcdFx0b3V0cHV0Kz10b2tlbjtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR2YXIgY2xhc3Nlcz1cIlwiO1x0XHJcblxyXG5cdFx0XHRcdC8vY2hlY2sgaGl0XHJcblx0XHRcdFx0aWYgKGo8aGl0cy5sZW5ndGggJiYgdnBvcz09aGl0c1tqXVswXSkge1xyXG5cdFx0XHRcdFx0dmFyIG5waHJhc2U9aGl0c1tqXVsyXSAlIDEwLCB3aWR0aD1oaXRzW2pdWzFdO1xyXG5cdFx0XHRcdFx0aGl0c3RhcnQ9aGl0c1tqXVswXTtcclxuXHRcdFx0XHRcdGhpdGVuZD1oaXRzdGFydCt3aWR0aDtcclxuXHRcdFx0XHRcdGorKztcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vY2hlY2sgdGFnXHJcblx0XHRcdFx0aWYgKGs8dGFncy5sZW5ndGggJiYgdnBvcz09dGFnc1trXVswXSkge1xyXG5cdFx0XHRcdFx0dmFyIHdpZHRoPXRhZ3Nba11bMV07XHJcblx0XHRcdFx0XHR0YWdzdGFydD10YWdzW2tdWzBdO1xyXG5cdFx0XHRcdFx0dGFnZW5kPXRhZ3N0YXJ0K3dpZHRoO1xyXG5cdFx0XHRcdFx0dGFnY2xhc3M9dGFnc1trXVsyXTtcclxuXHRcdFx0XHRcdGsrKztcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmICh2cG9zPj1oaXRzdGFydCAmJiB2cG9zPGhpdGVuZCkgY2xhc3Nlcz1oaXRjbGFzcytcIiBcIitoaXRjbGFzcytucGhyYXNlO1xyXG5cdFx0XHRcdGlmICh2cG9zPj10YWdzdGFydCAmJiB2cG9zPHRhZ2VuZCkgY2xhc3Nlcys9XCIgXCIrdGFnY2xhc3M7XHJcblxyXG5cdFx0XHRcdGlmIChjbGFzc2VzIHx8ICFvcHRzLm5vc3Bhbikge1xyXG5cdFx0XHRcdFx0b3V0cHV0Kz0nPHNwYW4gdnBvcz1cIicrdnBvcysnXCInO1xyXG5cdFx0XHRcdFx0aWYgKGNsYXNzZXMpIGNsYXNzZXM9JyBjbGFzcz1cIicrY2xhc3NlcysnXCInO1xyXG5cdFx0XHRcdFx0b3V0cHV0Kz1jbGFzc2VzKyc+JztcclxuXHRcdFx0XHRcdG91dHB1dCs9dG9rZW4rJzwvc3Bhbj4nO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRvdXRwdXQrPXRva2VuO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKCFza2lwKSB2cG9zKys7XHJcblx0XHRpKys7IFxyXG5cdH1cclxuXHJcblx0Ty5wdXNoKG91dHB1dCk7XHJcblx0b3V0cHV0PVwiXCI7XHJcblxyXG5cdHJldHVybiBPLmpvaW4oXCJcIik7XHJcbn1cclxudmFyIGhpZ2hsaWdodD1mdW5jdGlvbihRLG9wdHMpIHtcclxuXHRpZiAoIW9wdHMudGV4dCkgcmV0dXJuIHt0ZXh0OlwiXCIsaGl0czpbXX07XHJcblx0dmFyIG9wdD17dGV4dDpvcHRzLnRleHQsXHJcblx0XHRoaXRzOm51bGwsYWJyaWRnZTpvcHRzLmFicmlkZ2UsdnBvczpvcHRzLnN0YXJ0dnBvcyxcclxuXHRcdGZ1bGx0ZXh0Om9wdHMuZnVsbHRleHQscmVuZGVyVGFnczpvcHRzLnJlbmRlclRhZ3Msbm9zcGFuOm9wdHMubm9zcGFuLG5vY3JsZjpvcHRzLm5vY3JsZixcclxuXHR9O1xyXG5cclxuXHRvcHQuaGl0cz1oaXRJblJhbmdlKG9wdHMuUSxvcHRzLnN0YXJ0dnBvcyxvcHRzLmVuZHZwb3MpO1xyXG5cdHJldHVybiB7dGV4dDppbmplY3RUYWcoUSxvcHQpLGhpdHM6b3B0LmhpdHN9O1xyXG59XHJcblxyXG52YXIgZ2V0U2VnPWZ1bmN0aW9uKGVuZ2luZSxmaWxlaWQsc2VnaWQsY2IpIHtcclxuXHR2YXIgZmlsZU9mZnNldHM9ZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpO1xyXG5cdHZhciBzZWdwYXRocz1bXCJmaWxlY29udGVudHNcIixmaWxlaWQsc2VnaWRdO1xyXG5cdHZhciBzZWduYW1lcz1lbmdpbmUuZ2V0RmlsZVNlZ05hbWVzKGZpbGVpZCk7XHJcblxyXG5cdGVuZ2luZS5nZXQoc2VncGF0aHMsZnVuY3Rpb24odGV4dCl7XHJcblx0XHRjYi5hcHBseShlbmdpbmUuY29udGV4dCxbe3RleHQ6dGV4dCxmaWxlOmZpbGVpZCxzZWc6c2VnaWQsc2VnbmFtZTpzZWduYW1lc1tzZWdpZF19XSk7XHJcblx0fSk7XHJcbn1cclxuXHJcbnZhciBnZXRTZWdTeW5jPWZ1bmN0aW9uKGVuZ2luZSxmaWxlaWQsc2VnaWQpIHtcclxuXHR2YXIgZmlsZU9mZnNldHM9ZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpO1xyXG5cdHZhciBzZWdwYXRocz1bXCJmaWxlY29udGVudHNcIixmaWxlaWQsc2VnaWRdO1xyXG5cdHZhciBzZWduYW1lcz1lbmdpbmUuZ2V0RmlsZVNlZ05hbWVzKGZpbGVpZCk7XHJcblxyXG5cdHZhciB0ZXh0PWVuZ2luZS5nZXQoc2VncGF0aHMpO1xyXG5cdHJldHVybiB7dGV4dDp0ZXh0LGZpbGU6ZmlsZWlkLHNlZzpzZWdpZCxzZWduYW1lOnNlZ25hbWVzW3NlZ2lkXX07XHJcbn1cclxuXHJcbnZhciBnZXRSYW5nZT1mdW5jdGlvbihlbmdpbmUsc3RhcnQsZW5kLGNiKSB7XHJcblx0dmFyIGZpbGVvZmZzZXRzPWVuZ2luZS5nZXQoXCJmaWxlb2Zmc2V0c1wiKTtcclxuXHQvL3ZhciBwYWdlcGF0aHM9W1wiZmlsZUNvbnRlbnRzXCIsXTtcclxuXHQvL2ZpbmQgZmlyc3QgcGFnZSBhbmQgbGFzdCBwYWdlXHJcblx0Ly9jcmVhdGUgZ2V0IHBhdGhzXHJcblxyXG59XHJcblxyXG52YXIgZ2V0RmlsZT1mdW5jdGlvbihlbmdpbmUsZmlsZWlkLGNiKSB7XHJcblx0dmFyIGZpbGVuYW1lPWVuZ2luZS5nZXQoXCJmaWxlbmFtZXNcIilbZmlsZWlkXTtcclxuXHR2YXIgc2VnbmFtZXM9ZW5naW5lLmdldEZpbGVTZWdOYW1lcyhmaWxlaWQpO1xyXG5cdHZhciBmaWxlc3RhcnQ9ZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpW2ZpbGVpZF07XHJcblx0dmFyIG9mZnNldHM9ZW5naW5lLmdldEZpbGVTZWdPZmZzZXRzKGZpbGVpZCk7XHJcblx0dmFyIHBjPTA7XHJcblx0ZW5naW5lLmdldChbXCJmaWxlQ29udGVudHNcIixmaWxlaWRdLHRydWUsZnVuY3Rpb24oZGF0YSl7XHJcblx0XHR2YXIgdGV4dD1kYXRhLm1hcChmdW5jdGlvbih0LGlkeCkge1xyXG5cdFx0XHRpZiAoaWR4PT0wKSByZXR1cm4gXCJcIjsgXHJcblx0XHRcdHZhciBwYj0nPHBiIG49XCInK3NlZ25hbWVzW2lkeF0rJ1wiPjwvcGI+JztcclxuXHRcdFx0cmV0dXJuIHBiK3Q7XHJcblx0XHR9KTtcclxuXHRcdGNiKHt0ZXh0czpkYXRhLHRleHQ6dGV4dC5qb2luKFwiXCIpLHNlZ25hbWVzOnNlZ25hbWVzLGZpbGVzdGFydDpmaWxlc3RhcnQsb2Zmc2V0czpvZmZzZXRzLGZpbGU6ZmlsZWlkLGZpbGVuYW1lOmZpbGVuYW1lfSk7IC8vZm9yY2UgZGlmZmVyZW50IHRva2VuXHJcblx0fSk7XHJcbn1cclxuXHJcbnZhciBoaWdobGlnaHRSYW5nZT1mdW5jdGlvbihRLHN0YXJ0dnBvcyxlbmR2cG9zLG9wdHMsY2Ipe1xyXG5cdC8vbm90IGltcGxlbWVudCB5ZXRcclxufVxyXG5cclxudmFyIGhpZ2hsaWdodEZpbGU9ZnVuY3Rpb24oUSxmaWxlaWQsb3B0cyxjYikge1xyXG5cdGlmICh0eXBlb2Ygb3B0cz09XCJmdW5jdGlvblwiKSB7XHJcblx0XHRjYj1vcHRzO1xyXG5cdH1cclxuXHJcblx0aWYgKCFRIHx8ICFRLmVuZ2luZSkgcmV0dXJuIGNiKG51bGwpO1xyXG5cclxuXHR2YXIgc2Vnb2Zmc2V0cz1RLmVuZ2luZS5nZXRGaWxlU2VnT2Zmc2V0cyhmaWxlaWQpO1xyXG5cdHZhciBvdXRwdXQ9W107XHRcclxuXHQvL2NvbnNvbGUubG9nKHN0YXJ0dnBvcyxlbmR2cG9zKVxyXG5cdFEuZW5naW5lLmdldChbXCJmaWxlQ29udGVudHNcIixmaWxlaWRdLHRydWUsZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRpZiAoIWRhdGEpIHtcclxuXHRcdFx0Y29uc29sZS5lcnJvcihcIndyb25nIGZpbGUgaWRcIixmaWxlaWQpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Zm9yICh2YXIgaT0wO2k8ZGF0YS5sZW5ndGgtMTtpKysgKXtcclxuXHRcdFx0XHR2YXIgc3RhcnR2cG9zPXNlZ29mZnNldHNbaV07XHJcblx0XHRcdFx0dmFyIGVuZHZwb3M9c2Vnb2Zmc2V0c1tpKzFdO1xyXG5cdFx0XHRcdHZhciBzZWduYW1lcz1RLmVuZ2luZS5nZXRGaWxlU2VnTmFtZXMoZmlsZWlkKTtcclxuXHRcdFx0XHR2YXIgc2VnPWdldFNlZ1N5bmMoUS5lbmdpbmUsIGZpbGVpZCxpKzEpO1xyXG5cdFx0XHRcdFx0dmFyIG9wdD17dGV4dDpzZWcudGV4dCxoaXRzOm51bGwsdGFnOidobCcsdnBvczpzdGFydHZwb3MsXHJcblx0XHRcdFx0XHRmdWxsdGV4dDp0cnVlLG5vc3BhbjpvcHRzLm5vc3Bhbixub2NybGY6b3B0cy5ub2NybGZ9O1xyXG5cdFx0XHRcdHZhciBzZWduYW1lPXNlZ25hbWVzW2krMV07XHJcblx0XHRcdFx0b3B0LmhpdHM9aGl0SW5SYW5nZShRLHN0YXJ0dnBvcyxlbmR2cG9zKTtcclxuXHRcdFx0XHR2YXIgcGI9JzxwYiBuPVwiJytzZWduYW1lKydcIj48L3BiPic7XHJcblx0XHRcdFx0dmFyIHdpdGh0YWc9aW5qZWN0VGFnKFEsb3B0KTtcclxuXHRcdFx0XHRvdXRwdXQucHVzaChwYit3aXRodGFnKTtcclxuXHRcdFx0fVx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdGNiLmFwcGx5KFEuZW5naW5lLmNvbnRleHQsW3t0ZXh0Om91dHB1dC5qb2luKFwiXCIpLGZpbGU6ZmlsZWlkfV0pO1xyXG5cdH0pXHJcbn1cclxudmFyIGhpZ2hsaWdodFNlZz1mdW5jdGlvbihRLGZpbGVpZCxzZWdpZCxvcHRzLGNiKSB7XHJcblx0aWYgKHR5cGVvZiBvcHRzPT1cImZ1bmN0aW9uXCIpIHtcclxuXHRcdGNiPW9wdHM7XHJcblx0fVxyXG5cclxuXHRpZiAoIVEgfHwgIVEuZW5naW5lKSByZXR1cm4gY2IobnVsbCk7XHJcblx0dmFyIHNlZ29mZnNldHM9US5lbmdpbmUuZ2V0RmlsZVNlZ09mZnNldHMoZmlsZWlkKTtcclxuXHR2YXIgc3RhcnR2cG9zPXNlZ29mZnNldHNbc2VnaWQtMV07XHJcblx0dmFyIGVuZHZwb3M9c2Vnb2Zmc2V0c1tzZWdpZF07XHJcblx0dmFyIHNlZ25hbWVzPVEuZW5naW5lLmdldEZpbGVTZWdOYW1lcyhmaWxlaWQpO1xyXG5cclxuXHR0aGlzLmdldFNlZyhRLmVuZ2luZSxmaWxlaWQsc2VnaWQsZnVuY3Rpb24ocmVzKXtcclxuXHRcdHZhciBvcHQ9e3RleHQ6cmVzLnRleHQsaGl0czpudWxsLHZwb3M6c3RhcnR2cG9zLGZ1bGx0ZXh0OnRydWUsXHJcblx0XHRcdG5vc3BhbjpvcHRzLm5vc3Bhbixub2NybGY6b3B0cy5ub2NybGZ9O1xyXG5cdFx0b3B0LmhpdHM9aGl0SW5SYW5nZShRLHN0YXJ0dnBvcyxlbmR2cG9zKTtcclxuXHRcdGlmIChvcHRzLnJlbmRlclRhZ3MpIHtcclxuXHRcdFx0b3B0LnRhZ3M9dGFnc0luUmFuZ2UoUSxvcHRzLnJlbmRlclRhZ3Msc3RhcnR2cG9zLGVuZHZwb3MpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBzZWduYW1lPXNlZ25hbWVzW3NlZ2lkXTtcclxuXHRcdGNiLmFwcGx5KFEuZW5naW5lLmNvbnRleHQsW3t0ZXh0OmluamVjdFRhZyhRLG9wdCksc2VnOnNlZ2lkLGZpbGU6ZmlsZWlkLGhpdHM6b3B0LmhpdHMsc2VnbmFtZTpzZWduYW1lfV0pO1xyXG5cdH0pO1xyXG59XHJcbm1vZHVsZS5leHBvcnRzPXtyZXN1bHRsaXN0OnJlc3VsdGxpc3QsIFxyXG5cdGhpdEluUmFuZ2U6aGl0SW5SYW5nZSwgXHJcblx0aGlnaGxpZ2h0U2VnOmhpZ2hsaWdodFNlZyxcclxuXHRnZXRTZWc6Z2V0U2VnLFxyXG5cdGhpZ2hsaWdodEZpbGU6aGlnaGxpZ2h0RmlsZSxcclxuXHRnZXRGaWxlOmdldEZpbGVcclxuXHQvL2hpZ2hsaWdodFJhbmdlOmhpZ2hsaWdodFJhbmdlLFxyXG4gIC8vZ2V0UmFuZ2U6Z2V0UmFuZ2UsXHJcbn07IiwiLypcclxuICBLc2FuYSBTZWFyY2ggRW5naW5lLlxyXG5cclxuICBuZWVkIGEgS0RFIGluc3RhbmNlIHRvIGJlIGZ1bmN0aW9uYWxcclxuICBcclxuKi9cclxudmFyIGJzZWFyY2g9cmVxdWlyZShcIi4vYnNlYXJjaFwiKTtcclxudmFyIGRvc2VhcmNoPXJlcXVpcmUoXCIuL3NlYXJjaFwiKTtcclxuXHJcbnZhciBwcmVwYXJlRW5naW5lRm9yU2VhcmNoPWZ1bmN0aW9uKGVuZ2luZSxjYil7XHJcblx0aWYgKGVuZ2luZS5hbmFseXplcikge1xyXG5cdFx0Y2IoKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0dmFyIGFuYWx5emVyPXJlcXVpcmUoXCJrc2FuYS1hbmFseXplclwiKTtcclxuXHR2YXIgY29uZmlnPWVuZ2luZS5nZXQoXCJtZXRhXCIpLmNvbmZpZztcclxuXHRlbmdpbmUuYW5hbHl6ZXI9YW5hbHl6ZXIuZ2V0QVBJKGNvbmZpZyk7XHJcblx0ZW5naW5lLmdldChbW1widG9rZW5zXCJdLFtcInBvc3RpbmdzbGVuZ3RoXCJdXSxmdW5jdGlvbigpe1xyXG5cdFx0Y2IoKTtcclxuXHR9KTtcclxufVxyXG5cclxudmFyIF9zZWFyY2g9ZnVuY3Rpb24oZW5naW5lLHEsb3B0cyxjYixjb250ZXh0KSB7XHJcblx0aWYgKHR5cGVvZiBlbmdpbmU9PVwic3RyaW5nXCIpIHsvL2Jyb3dzZXIgb25seVxyXG5cdFx0dmFyIGtkZT1yZXF1aXJlKFwia3NhbmEtZGF0YWJhc2VcIik7XHJcblx0XHRpZiAodHlwZW9mIG9wdHM9PVwiZnVuY3Rpb25cIikgeyAvL3VzZXIgZGlkbid0IHN1cHBseSBvcHRpb25zXHJcblx0XHRcdGlmICh0eXBlb2YgY2I9PVwib2JqZWN0XCIpY29udGV4dD1jYjtcclxuXHRcdFx0Y2I9b3B0cztcclxuXHRcdFx0b3B0cz17fTtcclxuXHRcdH1cclxuXHRcdG9wdHMucT1xO1xyXG5cdFx0b3B0cy5kYmlkPWVuZ2luZTtcclxuXHRcdGtkZS5vcGVuKG9wdHMuZGJpZCxmdW5jdGlvbihlcnIsZGIpe1xyXG5cdFx0XHRpZiAoZXJyKSB7XHJcblx0XHRcdFx0Y2IoZXJyKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Y29uc29sZS5sb2coXCJvcGVuZWRcIixvcHRzLmRiaWQpXHJcblx0XHRcdHByZXBhcmVFbmdpbmVGb3JTZWFyY2goZGIsZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRyZXR1cm4gZG9zZWFyY2goZGIscSxvcHRzLGNiKTtcdFxyXG5cdFx0XHR9KTtcclxuXHRcdH0sY29udGV4dCk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHByZXBhcmVFbmdpbmVGb3JTZWFyY2goZW5naW5lLGZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBkb3NlYXJjaChlbmdpbmUscSxvcHRzLGNiKTtcdFxyXG5cdFx0fSk7XHJcblx0fVxyXG59XHJcblxyXG52YXIgX2hpZ2hsaWdodFNlZz1mdW5jdGlvbihlbmdpbmUsZmlsZWlkLHNlZ2lkLG9wdHMsY2Ipe1xyXG5cdGlmICghb3B0cy5xKSBvcHRzLnE9XCJcIjsgXHJcblx0X3NlYXJjaChlbmdpbmUsb3B0cy5xLG9wdHMsZnVuY3Rpb24oUSl7XHJcblx0XHRhcGkuZXhjZXJwdC5oaWdobGlnaHRTZWcoUSxmaWxlaWQsc2VnaWQsb3B0cyxjYik7XHJcblx0fSk7XHRcclxufVxyXG52YXIgX2hpZ2hsaWdodFJhbmdlPWZ1bmN0aW9uKGVuZ2luZSxzdGFydCxlbmQsb3B0cyxjYil7XHJcblxyXG5cdGlmIChvcHRzLnEpIHtcclxuXHRcdF9zZWFyY2goZW5naW5lLG9wdHMucSxvcHRzLGZ1bmN0aW9uKFEpe1xyXG5cdFx0XHRhcGkuZXhjZXJwdC5oaWdobGlnaHRSYW5nZShRLHN0YXJ0LGVuZCxvcHRzLGNiKTtcclxuXHRcdH0pO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRwcmVwYXJlRW5naW5lRm9yU2VhcmNoKGVuZ2luZSxmdW5jdGlvbigpe1xyXG5cdFx0XHRhcGkuZXhjZXJwdC5nZXRSYW5nZShlbmdpbmUsc3RhcnQsZW5kLGNiKTtcclxuXHRcdH0pO1xyXG5cdH1cclxufVxyXG52YXIgX2hpZ2hsaWdodEZpbGU9ZnVuY3Rpb24oZW5naW5lLGZpbGVpZCxvcHRzLGNiKXtcclxuXHRpZiAoIW9wdHMucSkgb3B0cy5xPVwiXCI7IFxyXG5cdF9zZWFyY2goZW5naW5lLG9wdHMucSxvcHRzLGZ1bmN0aW9uKFEpe1xyXG5cdFx0YXBpLmV4Y2VycHQuaGlnaGxpZ2h0RmlsZShRLGZpbGVpZCxvcHRzLGNiKTtcclxuXHR9KTtcclxuXHQvKlxyXG5cdH0gZWxzZSB7XHJcblx0XHRhcGkuZXhjZXJwdC5nZXRGaWxlKGVuZ2luZSxmaWxlaWQsZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHRjYi5hcHBseShlbmdpbmUuY29udGV4dCxbZGF0YV0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cdCovXHJcbn1cclxuXHJcbnZhciB2cG9zMmZpbGVzZWc9ZnVuY3Rpb24oZW5naW5lLHZwb3MpIHtcclxuICAgIHZhciBzZWdvZmZzZXRzPWVuZ2luZS5nZXQoXCJzZWdvZmZzZXRzXCIpO1xyXG4gICAgdmFyIGZpbGVvZmZzZXRzPWVuZ2luZS5nZXQoW1wiZmlsZW9mZnNldHNcIl0pO1xyXG4gICAgdmFyIHNlZ25hbWVzPWVuZ2luZS5nZXQoXCJzZWduYW1lc1wiKTtcclxuICAgIHZhciBmaWxlaWQ9YnNlYXJjaChmaWxlb2Zmc2V0cyx2cG9zKzEsdHJ1ZSk7XHJcbiAgICBmaWxlaWQtLTtcclxuICAgIHZhciBzZWdpZD1ic2VhcmNoKHNlZ29mZnNldHMsdnBvcysxLHRydWUpO1xyXG5cdHZhciByYW5nZT1lbmdpbmUuZ2V0RmlsZVJhbmdlKGZpbGVpZCk7XHJcblx0c2VnaWQtPXJhbmdlLnN0YXJ0O1xyXG4gICAgcmV0dXJuIHtmaWxlOmZpbGVpZCxzZWc6c2VnaWR9O1xyXG59XHJcbnZhciBhcGk9e1xyXG5cdHNlYXJjaDpfc2VhcmNoXHJcbi8vXHQsY29uY29yZGFuY2U6cmVxdWlyZShcIi4vY29uY29yZGFuY2VcIilcclxuLy9cdCxyZWdleDpyZXF1aXJlKFwiLi9yZWdleFwiKVxyXG5cdCxoaWdobGlnaHRTZWc6X2hpZ2hsaWdodFNlZ1xyXG5cdCxoaWdobGlnaHRGaWxlOl9oaWdobGlnaHRGaWxlXHJcbi8vXHQsaGlnaGxpZ2h0UmFuZ2U6X2hpZ2hsaWdodFJhbmdlXHJcblx0LGV4Y2VycHQ6cmVxdWlyZShcIi4vZXhjZXJwdFwiKVxyXG5cdCx2cG9zMmZpbGVzZWc6dnBvczJmaWxlc2VnXHJcbn1cclxubW9kdWxlLmV4cG9ydHM9YXBpOyIsIlxyXG52YXIgdW5wYWNrID0gZnVuY3Rpb24gKGFyKSB7IC8vIHVucGFjayB2YXJpYWJsZSBsZW5ndGggaW50ZWdlciBsaXN0XHJcbiAgdmFyIHIgPSBbXSxcclxuICBpID0gMCxcclxuICB2ID0gMDtcclxuICBkbyB7XHJcblx0dmFyIHNoaWZ0ID0gMDtcclxuXHRkbyB7XHJcblx0ICB2ICs9ICgoYXJbaV0gJiAweDdGKSA8PCBzaGlmdCk7XHJcblx0ICBzaGlmdCArPSA3O1xyXG5cdH0gd2hpbGUgKGFyWysraV0gJiAweDgwKTtcclxuXHRyW3IubGVuZ3RoXT12O1xyXG4gIH0gd2hpbGUgKGkgPCBhci5sZW5ndGgpO1xyXG4gIHJldHVybiByO1xyXG59XHJcblxyXG4vKlxyXG4gICBhcnI6ICBbMSwxLDEsMSwxLDEsMSwxLDFdXHJcbiAgIGxldmVsczogWzAsMSwxLDIsMiwwLDEsMl1cclxuICAgb3V0cHV0OiBbNSwxLDMsMSwxLDMsMSwxXVxyXG4qL1xyXG5cclxudmFyIGdyb3Vwc3VtPWZ1bmN0aW9uKGFycixsZXZlbHMpIHtcclxuICBpZiAoYXJyLmxlbmd0aCE9bGV2ZWxzLmxlbmd0aCsxKSByZXR1cm4gbnVsbDtcclxuICB2YXIgc3RhY2s9W107XHJcbiAgdmFyIG91dHB1dD1uZXcgQXJyYXkobGV2ZWxzLmxlbmd0aCk7XHJcbiAgZm9yICh2YXIgaT0wO2k8bGV2ZWxzLmxlbmd0aDtpKyspIG91dHB1dFtpXT0wO1xyXG4gIGZvciAodmFyIGk9MTtpPGFyci5sZW5ndGg7aSsrKSB7IC8vZmlyc3Qgb25lIG91dCBvZiB0b2Mgc2NvcGUsIGlnbm9yZWRcclxuICAgIGlmIChzdGFjay5sZW5ndGg+bGV2ZWxzW2ktMV0pIHtcclxuICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aD5sZXZlbHNbaS0xXSkgc3RhY2sucG9wKCk7XHJcbiAgICB9XHJcbiAgICBzdGFjay5wdXNoKGktMSk7XHJcbiAgICBmb3IgKHZhciBqPTA7ajxzdGFjay5sZW5ndGg7aisrKSB7XHJcbiAgICAgIG91dHB1dFtzdGFja1tqXV0rPWFycltpXTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIG91dHB1dDtcclxufVxyXG4vKiBhcnI9IDEgLCAyICwgMyAsNCAsNSw2LDcgLy90b2tlbiBwb3N0aW5nXHJcbiAgcG9zdGluZz0gMyAsIDUgIC8vdGFnIHBvc3RpbmdcclxuICBvdXQgPSAzICwgMiwgMlxyXG4qL1xyXG52YXIgY291bnRieXBvc3RpbmcgPSBmdW5jdGlvbiAoYXJyLCBwb3N0aW5nKSB7XHJcbiAgaWYgKCFwb3N0aW5nLmxlbmd0aCkgcmV0dXJuIFthcnIubGVuZ3RoXTtcclxuICB2YXIgb3V0PVtdO1xyXG4gIGZvciAodmFyIGk9MDtpPHBvc3RpbmcubGVuZ3RoO2krKykgb3V0W2ldPTA7XHJcbiAgb3V0W3Bvc3RpbmcubGVuZ3RoXT0wO1xyXG4gIHZhciBwPTAsaT0wLGxhc3RpPTA7XHJcbiAgd2hpbGUgKGk8YXJyLmxlbmd0aCAmJiBwPHBvc3RpbmcubGVuZ3RoKSB7XHJcbiAgICBpZiAoYXJyW2ldPD1wb3N0aW5nW3BdKSB7XHJcbiAgICAgIHdoaWxlIChwPHBvc3RpbmcubGVuZ3RoICYmIGk8YXJyLmxlbmd0aCAmJiBhcnJbaV08PXBvc3RpbmdbcF0pIHtcclxuICAgICAgICBvdXRbcF0rKztcclxuICAgICAgICBpKys7XHJcbiAgICAgIH0gICAgICBcclxuICAgIH0gXHJcbiAgICBwKys7XHJcbiAgfVxyXG4gIG91dFtwb3N0aW5nLmxlbmd0aF0gPSBhcnIubGVuZ3RoLWk7IC8vcmVtYWluaW5nXHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxudmFyIGdyb3VwYnlwb3N0aW5nPWZ1bmN0aW9uKGFycixncG9zdGluZykgeyAvL3JlbGF0aXZlIHZwb3NcclxuICBpZiAoIWdwb3N0aW5nLmxlbmd0aCkgcmV0dXJuIFthcnIubGVuZ3RoXTtcclxuICB2YXIgb3V0PVtdO1xyXG4gIGZvciAodmFyIGk9MDtpPD1ncG9zdGluZy5sZW5ndGg7aSsrKSBvdXRbaV09W107XHJcbiAgXHJcbiAgdmFyIHA9MCxpPTAsbGFzdGk9MDtcclxuICB3aGlsZSAoaTxhcnIubGVuZ3RoICYmIHA8Z3Bvc3RpbmcubGVuZ3RoKSB7XHJcbiAgICBpZiAoYXJyW2ldPGdwb3N0aW5nW3BdKSB7XHJcbiAgICAgIHdoaWxlIChwPGdwb3N0aW5nLmxlbmd0aCAmJiBpPGFyci5sZW5ndGggJiYgYXJyW2ldPGdwb3N0aW5nW3BdKSB7XHJcbiAgICAgICAgdmFyIHN0YXJ0PTA7XHJcbiAgICAgICAgaWYgKHA+MCkgc3RhcnQ9Z3Bvc3RpbmdbcC0xXTtcclxuICAgICAgICBvdXRbcF0ucHVzaChhcnJbaSsrXS1zdGFydCk7ICAvLyByZWxhdGl2ZVxyXG4gICAgICB9ICAgICAgXHJcbiAgICB9IFxyXG4gICAgcCsrO1xyXG4gIH1cclxuICAvL3JlbWFpbmluZ1xyXG4gIHdoaWxlKGk8YXJyLmxlbmd0aCkgb3V0W291dC5sZW5ndGgtMV0ucHVzaChhcnJbaSsrXS1ncG9zdGluZ1tncG9zdGluZy5sZW5ndGgtMV0pO1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxudmFyIGdyb3VwYnlwb3N0aW5nMj1mdW5jdGlvbihhcnIsZ3Bvc3RpbmcpIHsgLy9hYnNvbHV0ZSB2cG9zXHJcbiAgaWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHJldHVybiBbXTtcclxuICBpZiAoIWdwb3N0aW5nLmxlbmd0aCkgcmV0dXJuIFthcnIubGVuZ3RoXTtcclxuICB2YXIgb3V0PVtdO1xyXG4gIGZvciAodmFyIGk9MDtpPD1ncG9zdGluZy5sZW5ndGg7aSsrKSBvdXRbaV09W107XHJcbiAgXHJcbiAgdmFyIHA9MCxpPTAsbGFzdGk9MDtcclxuICB3aGlsZSAoaTxhcnIubGVuZ3RoICYmIHA8Z3Bvc3RpbmcubGVuZ3RoKSB7XHJcbiAgICBpZiAoYXJyW2ldPGdwb3N0aW5nW3BdKSB7XHJcbiAgICAgIHdoaWxlIChwPGdwb3N0aW5nLmxlbmd0aCAmJiBpPGFyci5sZW5ndGggJiYgYXJyW2ldPGdwb3N0aW5nW3BdKSB7XHJcbiAgICAgICAgdmFyIHN0YXJ0PTA7XHJcbiAgICAgICAgaWYgKHA+MCkgc3RhcnQ9Z3Bvc3RpbmdbcC0xXTsgLy9hYnNvbHV0ZVxyXG4gICAgICAgIG91dFtwXS5wdXNoKGFycltpKytdKTtcclxuICAgICAgfSAgICAgIFxyXG4gICAgfSBcclxuICAgIHArKztcclxuICB9XHJcbiAgLy9yZW1haW5pbmdcclxuICB3aGlsZShpPGFyci5sZW5ndGgpIG91dFtvdXQubGVuZ3RoLTFdLnB1c2goYXJyW2krK10tZ3Bvc3RpbmdbZ3Bvc3RpbmcubGVuZ3RoLTFdKTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcbnZhciBncm91cGJ5YmxvY2syID0gZnVuY3Rpb24oYXIsIG50b2tlbixzbG90c2hpZnQsb3B0cykge1xyXG4gIGlmICghYXIubGVuZ3RoKSByZXR1cm4gW3t9LHt9XTtcclxuICBcclxuICBzbG90c2hpZnQgPSBzbG90c2hpZnQgfHwgMTY7XHJcbiAgdmFyIGcgPSBNYXRoLnBvdygyLHNsb3RzaGlmdCk7XHJcbiAgdmFyIGkgPSAwO1xyXG4gIHZhciByID0ge30sIG50b2tlbnM9e307XHJcbiAgdmFyIGdyb3VwY291bnQ9MDtcclxuICBkbyB7XHJcbiAgICB2YXIgZ3JvdXAgPSBNYXRoLmZsb29yKGFyW2ldIC8gZykgO1xyXG4gICAgaWYgKCFyW2dyb3VwXSkge1xyXG4gICAgICByW2dyb3VwXSA9IFtdO1xyXG4gICAgICBudG9rZW5zW2dyb3VwXT1bXTtcclxuICAgICAgZ3JvdXBjb3VudCsrO1xyXG4gICAgfVxyXG4gICAgcltncm91cF0ucHVzaChhcltpXSAlIGcpO1xyXG4gICAgbnRva2Vuc1tncm91cF0ucHVzaChudG9rZW5baV0pO1xyXG4gICAgaSsrO1xyXG4gIH0gd2hpbGUgKGkgPCBhci5sZW5ndGgpO1xyXG4gIGlmIChvcHRzKSBvcHRzLmdyb3VwY291bnQ9Z3JvdXBjb3VudDtcclxuICByZXR1cm4gW3IsbnRva2Vuc107XHJcbn1cclxudmFyIGdyb3VwYnlzbG90ID0gZnVuY3Rpb24gKGFyLCBzbG90c2hpZnQsIG9wdHMpIHtcclxuICBpZiAoIWFyLmxlbmd0aClcclxuXHRyZXR1cm4ge307XHJcbiAgXHJcbiAgc2xvdHNoaWZ0ID0gc2xvdHNoaWZ0IHx8IDE2O1xyXG4gIHZhciBnID0gTWF0aC5wb3coMixzbG90c2hpZnQpO1xyXG4gIHZhciBpID0gMDtcclxuICB2YXIgciA9IHt9O1xyXG4gIHZhciBncm91cGNvdW50PTA7XHJcbiAgZG8ge1xyXG5cdHZhciBncm91cCA9IE1hdGguZmxvb3IoYXJbaV0gLyBnKSA7XHJcblx0aWYgKCFyW2dyb3VwXSkge1xyXG5cdCAgcltncm91cF0gPSBbXTtcclxuXHQgIGdyb3VwY291bnQrKztcclxuXHR9XHJcblx0cltncm91cF0ucHVzaChhcltpXSAlIGcpO1xyXG5cdGkrKztcclxuICB9IHdoaWxlIChpIDwgYXIubGVuZ3RoKTtcclxuICBpZiAob3B0cykgb3B0cy5ncm91cGNvdW50PWdyb3VwY291bnQ7XHJcbiAgcmV0dXJuIHI7XHJcbn1cclxuLypcclxudmFyIGlkZW50aXR5ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgcmV0dXJuIHZhbHVlO1xyXG59O1xyXG52YXIgc29ydGVkSW5kZXggPSBmdW5jdGlvbiAoYXJyYXksIG9iaiwgaXRlcmF0b3IpIHsgLy90YWtlbiBmcm9tIHVuZGVyc2NvcmVcclxuICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBpZGVudGl0eSk7XHJcbiAgdmFyIGxvdyA9IDAsXHJcbiAgaGlnaCA9IGFycmF5Lmxlbmd0aDtcclxuICB3aGlsZSAobG93IDwgaGlnaCkge1xyXG5cdHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4gMTtcclxuXHRpdGVyYXRvcihhcnJheVttaWRdKSA8IGl0ZXJhdG9yKG9iaikgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcclxuICB9XHJcbiAgcmV0dXJuIGxvdztcclxufTsqL1xyXG5cclxudmFyIGluZGV4T2ZTb3J0ZWQgPSBmdW5jdGlvbiAoYXJyYXksIG9iaikgeyBcclxuICB2YXIgbG93ID0gMCxcclxuICBoaWdoID0gYXJyYXkubGVuZ3RoLTE7XHJcbiAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcclxuICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4gMTtcclxuICAgIGFycmF5W21pZF0gPCBvYmogPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcclxuICB9XHJcbiAgcmV0dXJuIGxvdztcclxufTtcclxudmFyIHBsaGVhZD1mdW5jdGlvbihwbCwgcGx0YWcsIG9wdHMpIHtcclxuICBvcHRzPW9wdHN8fHt9O1xyXG4gIG9wdHMubWF4PW9wdHMubWF4fHwxO1xyXG4gIHZhciBvdXQ9W107XHJcbiAgaWYgKHBsdGFnLmxlbmd0aDxwbC5sZW5ndGgpIHtcclxuICAgIGZvciAodmFyIGk9MDtpPHBsdGFnLmxlbmd0aDtpKyspIHtcclxuICAgICAgIGsgPSBpbmRleE9mU29ydGVkKHBsLCBwbHRhZ1tpXSk7XHJcbiAgICAgICBpZiAoaz4tMSAmJiBrPHBsLmxlbmd0aCkge1xyXG4gICAgICAgIGlmIChwbFtrXT09cGx0YWdbaV0pIHtcclxuICAgICAgICAgIG91dFtvdXQubGVuZ3RoXT1wbHRhZ1tpXTtcclxuICAgICAgICAgIGlmIChvdXQubGVuZ3RoPj1vcHRzLm1heCkgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIGZvciAodmFyIGk9MDtpPHBsLmxlbmd0aDtpKyspIHtcclxuICAgICAgIGsgPSBpbmRleE9mU29ydGVkKHBsdGFnLCBwbFtpXSk7XHJcbiAgICAgICBpZiAoaz4tMSAmJiBrPHBsdGFnLmxlbmd0aCkge1xyXG4gICAgICAgIGlmIChwbHRhZ1trXT09cGxbaV0pIHtcclxuICAgICAgICAgIG91dFtvdXQubGVuZ3RoXT1wbHRhZ1trXTtcclxuICAgICAgICAgIGlmIChvdXQubGVuZ3RoPj1vcHRzLm1heCkgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuLypcclxuIHBsMiBvY2N1ciBhZnRlciBwbDEsIFxyXG4gcGwyPj1wbDErbWluZGlzXHJcbiBwbDI8PXBsMSttYXhkaXNcclxuKi9cclxudmFyIHBsZm9sbG93MiA9IGZ1bmN0aW9uIChwbDEsIHBsMiwgbWluZGlzLCBtYXhkaXMpIHtcclxuICB2YXIgciA9IFtdLGk9MDtcclxuICB2YXIgc3dhcCA9IDA7XHJcbiAgXHJcbiAgd2hpbGUgKGk8cGwxLmxlbmd0aCl7XHJcbiAgICB2YXIgayA9IGluZGV4T2ZTb3J0ZWQocGwyLCBwbDFbaV0gKyBtaW5kaXMpO1xyXG4gICAgdmFyIHQgPSAocGwyW2tdID49IChwbDFbaV0gK21pbmRpcykgJiYgcGwyW2tdPD0ocGwxW2ldK21heGRpcykpID8gayA6IC0xO1xyXG4gICAgaWYgKHQgPiAtMSkge1xyXG4gICAgICByW3IubGVuZ3RoXT1wbDFbaV07XHJcbiAgICAgIGkrKztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChrPj1wbDIubGVuZ3RoKSBicmVhaztcclxuICAgICAgdmFyIGsyPWluZGV4T2ZTb3J0ZWQgKHBsMSxwbDJba10tbWF4ZGlzKTtcclxuICAgICAgaWYgKGsyPmkpIHtcclxuICAgICAgICB2YXIgdCA9IChwbDJba10gPj0gKHBsMVtpXSArbWluZGlzKSAmJiBwbDJba108PShwbDFbaV0rbWF4ZGlzKSkgPyBrIDogLTE7XHJcbiAgICAgICAgaWYgKHQ+LTEpIHJbci5sZW5ndGhdPXBsMVtrMl07XHJcbiAgICAgICAgaT1rMjtcclxuICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcjtcclxufVxyXG5cclxudmFyIHBsbm90Zm9sbG93MiA9IGZ1bmN0aW9uIChwbDEsIHBsMiwgbWluZGlzLCBtYXhkaXMpIHtcclxuICB2YXIgciA9IFtdLGk9MDtcclxuICBcclxuICB3aGlsZSAoaTxwbDEubGVuZ3RoKXtcclxuICAgIHZhciBrID0gaW5kZXhPZlNvcnRlZChwbDIsIHBsMVtpXSArIG1pbmRpcyk7XHJcbiAgICB2YXIgdCA9IChwbDJba10gPj0gKHBsMVtpXSArbWluZGlzKSAmJiBwbDJba108PShwbDFbaV0rbWF4ZGlzKSkgPyBrIDogLTE7XHJcbiAgICBpZiAodCA+IC0xKSB7XHJcbiAgICAgIGkrKztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChrPj1wbDIubGVuZ3RoKSB7XHJcbiAgICAgICAgcj1yLmNvbmNhdChwbDEuc2xpY2UoaSkpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBrMj1pbmRleE9mU29ydGVkIChwbDEscGwyW2tdLW1heGRpcyk7XHJcbiAgICAgICAgaWYgKGsyPmkpIHtcclxuICAgICAgICAgIHI9ci5jb25jYXQocGwxLnNsaWNlKGksazIpKTtcclxuICAgICAgICAgIGk9azI7XHJcbiAgICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByO1xyXG59XHJcbi8qIHRoaXMgaXMgaW5jb3JyZWN0ICovXHJcbnZhciBwbGZvbGxvdyA9IGZ1bmN0aW9uIChwbDEsIHBsMiwgZGlzdGFuY2UpIHtcclxuICB2YXIgciA9IFtdLGk9MDtcclxuXHJcbiAgd2hpbGUgKGk8cGwxLmxlbmd0aCl7XHJcbiAgICB2YXIgayA9IGluZGV4T2ZTb3J0ZWQocGwyLCBwbDFbaV0gKyBkaXN0YW5jZSk7XHJcbiAgICB2YXIgdCA9IChwbDJba10gPT09IChwbDFbaV0gKyBkaXN0YW5jZSkpID8gayA6IC0xO1xyXG4gICAgaWYgKHQgPiAtMSkge1xyXG4gICAgICByLnB1c2gocGwxW2ldKTtcclxuICAgICAgaSsrO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKGs+PXBsMi5sZW5ndGgpIGJyZWFrO1xyXG4gICAgICB2YXIgazI9aW5kZXhPZlNvcnRlZCAocGwxLHBsMltrXS1kaXN0YW5jZSk7XHJcbiAgICAgIGlmIChrMj5pKSB7XHJcbiAgICAgICAgdCA9IChwbDJba10gPT09IChwbDFbazJdICsgZGlzdGFuY2UpKSA/IGsgOiAtMTtcclxuICAgICAgICBpZiAodD4tMSkge1xyXG4gICAgICAgICAgIHIucHVzaChwbDFbazJdKTtcclxuICAgICAgICAgICBrMisrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpPWsyO1xyXG4gICAgICB9IGVsc2UgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByO1xyXG59XHJcbnZhciBwbG5vdGZvbGxvdyA9IGZ1bmN0aW9uIChwbDEsIHBsMiwgZGlzdGFuY2UpIHtcclxuICB2YXIgciA9IFtdO1xyXG4gIHZhciByID0gW10saT0wO1xyXG4gIHZhciBzd2FwID0gMDtcclxuICBcclxuICB3aGlsZSAoaTxwbDEubGVuZ3RoKXtcclxuICAgIHZhciBrID0gaW5kZXhPZlNvcnRlZChwbDIsIHBsMVtpXSArIGRpc3RhbmNlKTtcclxuICAgIHZhciB0ID0gKHBsMltrXSA9PT0gKHBsMVtpXSArIGRpc3RhbmNlKSkgPyBrIDogLTE7XHJcbiAgICBpZiAodCA+IC0xKSB7IFxyXG4gICAgICBpKys7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoaz49cGwyLmxlbmd0aCkge1xyXG4gICAgICAgIHI9ci5jb25jYXQocGwxLnNsaWNlKGkpKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgazI9aW5kZXhPZlNvcnRlZCAocGwxLHBsMltrXS1kaXN0YW5jZSk7XHJcbiAgICAgICAgaWYgKGsyPmkpIHtcclxuICAgICAgICAgIHI9ci5jb25jYXQocGwxLnNsaWNlKGksazIpKTtcclxuICAgICAgICAgIGk9azI7XHJcbiAgICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByO1xyXG59XHJcbnZhciBwbGFuZCA9IGZ1bmN0aW9uIChwbDEsIHBsMiwgZGlzdGFuY2UpIHtcclxuICB2YXIgciA9IFtdO1xyXG4gIHZhciBzd2FwID0gMDtcclxuICBcclxuICBpZiAocGwxLmxlbmd0aCA+IHBsMi5sZW5ndGgpIHsgLy9zd2FwIGZvciBmYXN0ZXIgY29tcGFyZVxyXG4gICAgdmFyIHQgPSBwbDI7XHJcbiAgICBwbDIgPSBwbDE7XHJcbiAgICBwbDEgPSB0O1xyXG4gICAgc3dhcCA9IGRpc3RhbmNlO1xyXG4gICAgZGlzdGFuY2UgPSAtZGlzdGFuY2U7XHJcbiAgfVxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGwxLmxlbmd0aDsgaSsrKSB7XHJcbiAgICB2YXIgayA9IGluZGV4T2ZTb3J0ZWQocGwyLCBwbDFbaV0gKyBkaXN0YW5jZSk7XHJcbiAgICB2YXIgdCA9IChwbDJba10gPT09IChwbDFbaV0gKyBkaXN0YW5jZSkpID8gayA6IC0xO1xyXG4gICAgaWYgKHQgPiAtMSkge1xyXG4gICAgICByLnB1c2gocGwxW2ldIC0gc3dhcCk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByO1xyXG59XHJcbnZhciBjb21iaW5lPWZ1bmN0aW9uIChwb3N0aW5ncykge1xyXG4gIHZhciBvdXQ9W107XHJcbiAgZm9yICh2YXIgaSBpbiBwb3N0aW5ncykge1xyXG4gICAgb3V0PW91dC5jb25jYXQocG9zdGluZ3NbaV0pO1xyXG4gIH1cclxuICBvdXQuc29ydChmdW5jdGlvbihhLGIpe3JldHVybiBhLWJ9KTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG52YXIgdW5pcXVlID0gZnVuY3Rpb24oYXIpe1xyXG4gICBpZiAoIWFyIHx8ICFhci5sZW5ndGgpIHJldHVybiBbXTtcclxuICAgdmFyIHUgPSB7fSwgYSA9IFtdO1xyXG4gICBmb3IodmFyIGkgPSAwLCBsID0gYXIubGVuZ3RoOyBpIDwgbDsgKytpKXtcclxuICAgIGlmKHUuaGFzT3duUHJvcGVydHkoYXJbaV0pKSBjb250aW51ZTtcclxuICAgIGEucHVzaChhcltpXSk7XHJcbiAgICB1W2FyW2ldXSA9IDE7XHJcbiAgIH1cclxuICAgcmV0dXJuIGE7XHJcbn1cclxuXHJcblxyXG5cclxudmFyIHBscGhyYXNlID0gZnVuY3Rpb24gKHBvc3RpbmdzLG9wcykge1xyXG4gIHZhciByID0gW107XHJcbiAgZm9yICh2YXIgaT0wO2k8cG9zdGluZ3MubGVuZ3RoO2krKykge1xyXG4gIFx0aWYgKCFwb3N0aW5nc1tpXSkgIHJldHVybiBbXTtcclxuICBcdGlmICgwID09PSBpKSB7XHJcbiAgXHQgIHIgPSBwb3N0aW5nc1swXTtcclxuICBcdH0gZWxzZSB7XHJcbiAgICAgIGlmIChvcHNbaV09PSdhbmRub3QnKSB7XHJcbiAgICAgICAgciA9IHBsbm90Zm9sbG93KHIsIHBvc3RpbmdzW2ldLCBpKTsgIFxyXG4gICAgICB9ZWxzZSB7XHJcbiAgICAgICAgciA9IHBsYW5kKHIsIHBvc3RpbmdzW2ldLCBpKTsgIFxyXG4gICAgICB9XHJcbiAgXHR9XHJcbiAgfVxyXG4gIFxyXG4gIHJldHVybiByO1xyXG59XHJcbi8vcmV0dXJuIGFuIGFycmF5IG9mIGdyb3VwIGhhdmluZyBhbnkgb2YgcGwgaXRlbVxyXG52YXIgbWF0Y2hQb3N0aW5nPWZ1bmN0aW9uKHBsLGd1cGwsc3RhcnQsZW5kKSB7XHJcbiAgc3RhcnQ9c3RhcnR8fDA7XHJcbiAgZW5kPWVuZHx8LTE7XHJcbiAgaWYgKGVuZD09LTEpIGVuZD1NYXRoLnBvdygyLCA1Myk7IC8vIG1heCBpbnRlZ2VyIHZhbHVlXHJcblxyXG4gIHZhciBjb3VudD0wLCBpID0gaj0gMCwgIHJlc3VsdCA9IFtdICx2PTA7XHJcbiAgdmFyIGRvY3M9W10sIGZyZXE9W107XHJcbiAgaWYgKCFwbCkgcmV0dXJuIHtkb2NzOltdLGZyZXE6W119O1xyXG4gIHdoaWxlKCBpIDwgcGwubGVuZ3RoICYmIGogPCBndXBsLmxlbmd0aCApe1xyXG4gICAgIGlmIChwbFtpXSA8IGd1cGxbal0gKXsgXHJcbiAgICAgICBjb3VudCsrO1xyXG4gICAgICAgdj1wbFtpXTtcclxuICAgICAgIGkrKzsgXHJcbiAgICAgfSBlbHNlIHtcclxuICAgICAgIGlmIChjb3VudCkge1xyXG4gICAgICAgIGlmICh2Pj1zdGFydCAmJiB2PGVuZCkge1xyXG4gICAgICAgICAgZG9jcy5wdXNoKGopO1xyXG4gICAgICAgICAgZnJlcS5wdXNoKGNvdW50KTsgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgfVxyXG4gICAgICAgaisrO1xyXG4gICAgICAgY291bnQ9MDtcclxuICAgICB9XHJcbiAgfVxyXG4gIGlmIChjb3VudCAmJiBqPGd1cGwubGVuZ3RoICYmIHY+PXN0YXJ0ICYmIHY8ZW5kKSB7XHJcbiAgICBkb2NzLnB1c2goaik7XHJcbiAgICBmcmVxLnB1c2goY291bnQpO1xyXG4gICAgY291bnQ9MDtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICB3aGlsZSAoaj09Z3VwbC5sZW5ndGggJiYgaTxwbC5sZW5ndGggJiYgcGxbaV0gPj0gZ3VwbFtndXBsLmxlbmd0aC0xXSkge1xyXG4gICAgICBpKys7XHJcbiAgICAgIGNvdW50Kys7XHJcbiAgICB9XHJcbiAgICBpZiAodj49c3RhcnQgJiYgdjxlbmQpIHtcclxuICAgICAgZG9jcy5wdXNoKGopO1xyXG4gICAgICBmcmVxLnB1c2goY291bnQpOyAgICAgIFxyXG4gICAgfVxyXG4gIH0gXHJcbiAgcmV0dXJuIHtkb2NzOmRvY3MsZnJlcTpmcmVxfTtcclxufVxyXG5cclxudmFyIHRyaW09ZnVuY3Rpb24oYXJyLHN0YXJ0LGVuZCkge1xyXG4gIHZhciBzPWluZGV4T2ZTb3J0ZWQoYXJyLHN0YXJ0KTtcclxuICB2YXIgZT1pbmRleE9mU29ydGVkKGFycixlbmQpO1xyXG4gIHJldHVybiBhcnIuc2xpY2UocyxlKzEpO1xyXG59XHJcbnZhciBwbGlzdD17fTtcclxucGxpc3QudW5wYWNrPXVucGFjaztcclxucGxpc3QucGxwaHJhc2U9cGxwaHJhc2U7XHJcbnBsaXN0LnBsaGVhZD1wbGhlYWQ7XHJcbnBsaXN0LnBsZm9sbG93Mj1wbGZvbGxvdzI7XHJcbnBsaXN0LnBsbm90Zm9sbG93Mj1wbG5vdGZvbGxvdzI7XHJcbnBsaXN0LnBsZm9sbG93PXBsZm9sbG93O1xyXG5wbGlzdC5wbG5vdGZvbGxvdz1wbG5vdGZvbGxvdztcclxucGxpc3QudW5pcXVlPXVuaXF1ZTtcclxucGxpc3QuaW5kZXhPZlNvcnRlZD1pbmRleE9mU29ydGVkO1xyXG5wbGlzdC5tYXRjaFBvc3Rpbmc9bWF0Y2hQb3N0aW5nO1xyXG5wbGlzdC50cmltPXRyaW07XHJcblxyXG5wbGlzdC5ncm91cGJ5c2xvdD1ncm91cGJ5c2xvdDtcclxucGxpc3QuZ3JvdXBieWJsb2NrMj1ncm91cGJ5YmxvY2syO1xyXG5wbGlzdC5jb3VudGJ5cG9zdGluZz1jb3VudGJ5cG9zdGluZztcclxucGxpc3QuZ3JvdXBieXBvc3Rpbmc9Z3JvdXBieXBvc3Rpbmc7XHJcbnBsaXN0Lmdyb3VwYnlwb3N0aW5nMj1ncm91cGJ5cG9zdGluZzI7XHJcbnBsaXN0Lmdyb3Vwc3VtPWdyb3Vwc3VtO1xyXG5wbGlzdC5jb21iaW5lPWNvbWJpbmU7XHJcbm1vZHVsZS5leHBvcnRzPXBsaXN0OyIsIi8qXHJcbnZhciBkb3NlYXJjaDI9ZnVuY3Rpb24oZW5naW5lLG9wdHMsY2IsY29udGV4dCkge1xyXG5cdG9wdHNcclxuXHRcdG5maWxlLG5wYWdlICAvL3JldHVybiBhIGhpZ2hsaWdodGVkIHBhZ2VcclxuXHRcdG5maWxlLFtwYWdlc10gLy9yZXR1cm4gaGlnaGxpZ2h0ZWQgcGFnZXMgXHJcblx0XHRuZmlsZSAgICAgICAgLy9yZXR1cm4gZW50aXJlIGhpZ2hsaWdodGVkIGZpbGVcclxuXHRcdGFic19ucGFnZVxyXG5cdFx0W2Fic19wYWdlc10gIC8vcmV0dXJuIHNldCBvZiBoaWdobGlnaHRlZCBwYWdlcyAobWF5IGNyb3NzIGZpbGUpXHJcblxyXG5cdFx0ZmlsZW5hbWUsIHBhZ2VuYW1lXHJcblx0XHRmaWxlbmFtZSxbcGFnZW5hbWVzXVxyXG5cclxuXHRcdGV4Y2VycHQgICAgICAvL1xyXG5cdCAgICBzb3J0QnkgICAgICAgLy9kZWZhdWx0IG5hdHVyYWwsIHNvcnRieSBieSB2c20gcmFua2luZ1xyXG5cclxuXHQvL3JldHVybiBlcnIsYXJyYXlfb2Zfc3RyaW5nICxRICAoUSBjb250YWlucyBsb3cgbGV2ZWwgc2VhcmNoIHJlc3VsdClcclxufVxyXG5cclxuKi9cclxuLyogVE9ETyBzb3J0ZWQgdG9rZW5zICovXHJcbnZhciBwbGlzdD1yZXF1aXJlKFwiLi9wbGlzdFwiKTtcclxudmFyIGJvb2xzZWFyY2g9cmVxdWlyZShcIi4vYm9vbHNlYXJjaFwiKTtcclxudmFyIGV4Y2VycHQ9cmVxdWlyZShcIi4vZXhjZXJwdFwiKTtcclxudmFyIHBhcnNlVGVybSA9IGZ1bmN0aW9uKGVuZ2luZSxyYXcsb3B0cykge1xyXG5cdGlmICghcmF3KSByZXR1cm47XHJcblx0dmFyIHJlcz17cmF3OnJhdyx2YXJpYW50czpbXSx0ZXJtOicnLG9wOicnfTtcclxuXHR2YXIgdGVybT1yYXcsIG9wPTA7XHJcblx0dmFyIGZpcnN0Y2hhcj10ZXJtWzBdO1xyXG5cdHZhciB0ZXJtcmVnZXg9XCJcIjtcclxuXHRpZiAoZmlyc3RjaGFyPT0nLScpIHtcclxuXHRcdHRlcm09dGVybS5zdWJzdHJpbmcoMSk7XHJcblx0XHRmaXJzdGNoYXI9dGVybVswXTtcclxuXHRcdHJlcy5leGNsdWRlPXRydWU7IC8vZXhjbHVkZVxyXG5cdH1cclxuXHR0ZXJtPXRlcm0udHJpbSgpO1xyXG5cdHZhciBsYXN0Y2hhcj10ZXJtW3Rlcm0ubGVuZ3RoLTFdO1xyXG5cdHRlcm09ZW5naW5lLmFuYWx5emVyLm5vcm1hbGl6ZSh0ZXJtKTtcclxuXHRcclxuXHRpZiAodGVybS5pbmRleE9mKFwiJVwiKT4tMSkge1xyXG5cdFx0dmFyIHRlcm1yZWdleD1cIl5cIit0ZXJtLnJlcGxhY2UoLyUrL2csXCIuK1wiKStcIiRcIjtcclxuXHRcdGlmIChmaXJzdGNoYXI9PVwiJVwiKSBcdHRlcm1yZWdleD1cIi4rXCIrdGVybXJlZ2V4LnN1YnN0cigxKTtcclxuXHRcdGlmIChsYXN0Y2hhcj09XCIlXCIpIFx0dGVybXJlZ2V4PXRlcm1yZWdleC5zdWJzdHIoMCx0ZXJtcmVnZXgubGVuZ3RoLTEpK1wiLitcIjtcclxuXHR9XHJcblxyXG5cdGlmICh0ZXJtcmVnZXgpIHtcclxuXHRcdHJlcy52YXJpYW50cz1leHBhbmRUZXJtKGVuZ2luZSx0ZXJtcmVnZXgpO1xyXG5cdH1cclxuXHJcblx0cmVzLmtleT10ZXJtO1xyXG5cdHJldHVybiByZXM7XHJcbn1cclxudmFyIGV4cGFuZFRlcm09ZnVuY3Rpb24oZW5naW5lLHJlZ2V4KSB7XHJcblx0dmFyIHI9bmV3IFJlZ0V4cChyZWdleCk7XHJcblx0dmFyIHRva2Vucz1lbmdpbmUuZ2V0KFwidG9rZW5zXCIpO1xyXG5cdHZhciBwb3N0aW5nc0xlbmd0aD1lbmdpbmUuZ2V0KFwicG9zdGluZ3NsZW5ndGhcIik7XHJcblx0aWYgKCFwb3N0aW5nc0xlbmd0aCkgcG9zdGluZ3NMZW5ndGg9W107XHJcblx0dmFyIG91dD1bXTtcclxuXHRmb3IgKHZhciBpPTA7aTx0b2tlbnMubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIG09dG9rZW5zW2ldLm1hdGNoKHIpO1xyXG5cdFx0aWYgKG0pIHtcclxuXHRcdFx0b3V0LnB1c2goW21bMF0scG9zdGluZ3NMZW5ndGhbaV18fDFdKTtcclxuXHRcdH1cclxuXHR9XHJcblx0b3V0LnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gYlsxXS1hWzFdfSk7XHJcblx0cmV0dXJuIG91dDtcclxufVxyXG52YXIgaXNXaWxkY2FyZD1mdW5jdGlvbihyYXcpIHtcclxuXHRyZXR1cm4gISFyYXcubWF0Y2goL1tcXCpcXD9dLyk7XHJcbn1cclxuXHJcbnZhciBpc09yVGVybT1mdW5jdGlvbih0ZXJtKSB7XHJcblx0dGVybT10ZXJtLnRyaW0oKTtcclxuXHRyZXR1cm4gKHRlcm1bdGVybS5sZW5ndGgtMV09PT0nLCcpO1xyXG59XHJcbnZhciBvcnRlcm09ZnVuY3Rpb24oZW5naW5lLHRlcm0sa2V5KSB7XHJcblx0XHR2YXIgdD17dGV4dDprZXl9O1xyXG5cdFx0aWYgKGVuZ2luZS5hbmFseXplci5zaW1wbGlmaWVkVG9rZW4pIHtcclxuXHRcdFx0dC5zaW1wbGlmaWVkPWVuZ2luZS5hbmFseXplci5zaW1wbGlmaWVkVG9rZW4oa2V5KTtcclxuXHRcdH1cclxuXHRcdHRlcm0udmFyaWFudHMucHVzaCh0KTtcclxufVxyXG52YXIgb3JUZXJtcz1mdW5jdGlvbihlbmdpbmUsdG9rZW5zLG5vdykge1xyXG5cdHZhciByYXc9dG9rZW5zW25vd107XHJcblx0dmFyIHRlcm09cGFyc2VUZXJtKGVuZ2luZSxyYXcpO1xyXG5cdGlmICghdGVybSkgcmV0dXJuO1xyXG5cdG9ydGVybShlbmdpbmUsdGVybSx0ZXJtLmtleSk7XHJcblx0d2hpbGUgKGlzT3JUZXJtKHJhdykpICB7XHJcblx0XHRyYXc9dG9rZW5zWysrbm93XTtcclxuXHRcdHZhciB0ZXJtMj1wYXJzZVRlcm0oZW5naW5lLHJhdyk7XHJcblx0XHRvcnRlcm0oZW5naW5lLHRlcm0sdGVybTIua2V5KTtcclxuXHRcdGZvciAodmFyIGkgaW4gdGVybTIudmFyaWFudHMpe1xyXG5cdFx0XHR0ZXJtLnZhcmlhbnRzW2ldPXRlcm0yLnZhcmlhbnRzW2ldO1xyXG5cdFx0fVxyXG5cdFx0dGVybS5rZXkrPScsJyt0ZXJtMi5rZXk7XHJcblx0fVxyXG5cdHJldHVybiB0ZXJtO1xyXG59XHJcblxyXG52YXIgZ2V0T3BlcmF0b3I9ZnVuY3Rpb24ocmF3KSB7XHJcblx0dmFyIG9wPScnO1xyXG5cdGlmIChyYXdbMF09PScrJykgb3A9J2luY2x1ZGUnO1xyXG5cdGlmIChyYXdbMF09PSctJykgb3A9J2V4Y2x1ZGUnO1xyXG5cdHJldHVybiBvcDtcclxufVxyXG52YXIgcGFyc2VQaHJhc2U9ZnVuY3Rpb24ocSkge1xyXG5cdHZhciBtYXRjaD1xLm1hdGNoKC8oXCIuKz9cInwnLis/J3xcXFMrKS9nKVxyXG5cdG1hdGNoPW1hdGNoLm1hcChmdW5jdGlvbihzdHIpe1xyXG5cdFx0dmFyIG49c3RyLmxlbmd0aCwgaD1zdHIuY2hhckF0KDApLCB0PXN0ci5jaGFyQXQobi0xKVxyXG5cdFx0aWYgKGg9PT10JiYoaD09PSdcIid8aD09PVwiJ1wiKSkgc3RyPXN0ci5zdWJzdHIoMSxuLTIpXHJcblx0XHRyZXR1cm4gc3RyO1xyXG5cdH0pXHJcblx0cmV0dXJuIG1hdGNoO1xyXG59XHJcbnZhciB0aWJldGFuTnVtYmVyPXtcclxuXHRcIlxcdTBmMjBcIjpcIjBcIixcIlxcdTBmMjFcIjpcIjFcIixcIlxcdTBmMjJcIjpcIjJcIixcdFwiXFx1MGYyM1wiOlwiM1wiLFx0XCJcXHUwZjI0XCI6XCI0XCIsXHJcblx0XCJcXHUwZjI1XCI6XCI1XCIsXCJcXHUwZjI2XCI6XCI2XCIsXCJcXHUwZjI3XCI6XCI3XCIsXCJcXHUwZjI4XCI6XCI4XCIsXCJcXHUwZjI5XCI6XCI5XCJcclxufVxyXG52YXIgcGFyc2VOdW1iZXI9ZnVuY3Rpb24ocmF3KSB7XHJcblx0dmFyIG49cGFyc2VJbnQocmF3LDEwKTtcclxuXHRpZiAoaXNOYU4obikpe1xyXG5cdFx0dmFyIGNvbnZlcnRlZD1bXTtcclxuXHRcdGZvciAodmFyIGk9MDtpPHJhdy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdHZhciBubj10aWJldGFuTnVtYmVyW3Jhd1tpXV07XHJcblx0XHRcdGlmICh0eXBlb2Ygbm4gIT1cInVuZGVmaW5lZFwiKSBjb252ZXJ0ZWRbaV09bm47XHJcblx0XHRcdGVsc2UgYnJlYWs7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcGFyc2VJbnQoY29udmVydGVkLDEwKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0cmV0dXJuIG47XHJcblx0fVxyXG59XHJcbnZhciBwYXJzZVdpbGRjYXJkPWZ1bmN0aW9uKHJhdykge1xyXG5cdHZhciBuPXBhcnNlTnVtYmVyKHJhdykgfHwgMTtcclxuXHR2YXIgcWNvdW50PXJhdy5zcGxpdCgnPycpLmxlbmd0aC0xO1xyXG5cdHZhciBzY291bnQ9cmF3LnNwbGl0KCcqJykubGVuZ3RoLTE7XHJcblx0dmFyIHR5cGU9Jyc7XHJcblx0aWYgKHFjb3VudCkgdHlwZT0nPyc7XHJcblx0ZWxzZSBpZiAoc2NvdW50KSB0eXBlPScqJztcclxuXHRyZXR1cm4ge3dpbGRjYXJkOnR5cGUsIHdpZHRoOiBuICwgb3A6J3dpbGRjYXJkJ307XHJcbn1cclxuXHJcbnZhciBuZXdQaHJhc2U9ZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIHt0ZXJtaWQ6W10scG9zdGluZzpbXSxyYXc6JycsdGVybWxlbmd0aDpbXX07XHJcbn0gXHJcbnZhciBwYXJzZVF1ZXJ5PWZ1bmN0aW9uKHEsc2VwKSB7XHJcblx0aWYgKHNlcCAmJiBxLmluZGV4T2Yoc2VwKT4tMSkge1xyXG5cdFx0dmFyIG1hdGNoPXEuc3BsaXQoc2VwKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0dmFyIG1hdGNoPXEubWF0Y2goLyhcIi4rP1wifCcuKz8nfFxcUyspL2cpXHJcblx0XHRtYXRjaD1tYXRjaC5tYXAoZnVuY3Rpb24oc3RyKXtcclxuXHRcdFx0dmFyIG49c3RyLmxlbmd0aCwgaD1zdHIuY2hhckF0KDApLCB0PXN0ci5jaGFyQXQobi0xKVxyXG5cdFx0XHRpZiAoaD09PXQmJihoPT09J1wiJ3xoPT09XCInXCIpKSBzdHI9c3RyLnN1YnN0cigxLG4tMilcclxuXHRcdFx0cmV0dXJuIHN0clxyXG5cdFx0fSlcclxuXHRcdC8vY29uc29sZS5sb2coaW5wdXQsJz09PicsbWF0Y2gpXHRcdFxyXG5cdH1cclxuXHRyZXR1cm4gbWF0Y2g7XHJcbn1cclxudmFyIGxvYWRQaHJhc2U9ZnVuY3Rpb24ocGhyYXNlKSB7XHJcblx0LyogcmVtb3ZlIGxlYWRpbmcgYW5kIGVuZGluZyB3aWxkY2FyZCAqL1xyXG5cdHZhciBRPXRoaXM7XHJcblx0dmFyIGNhY2hlPVEuZW5naW5lLnBvc3RpbmdDYWNoZTtcclxuXHRpZiAoY2FjaGVbcGhyYXNlLmtleV0pIHtcclxuXHRcdHBocmFzZS5wb3N0aW5nPWNhY2hlW3BocmFzZS5rZXldO1xyXG5cdFx0cmV0dXJuIFE7XHJcblx0fVxyXG5cdGlmIChwaHJhc2UudGVybWlkLmxlbmd0aD09MSkge1xyXG5cdFx0aWYgKCFRLnRlcm1zLmxlbmd0aCl7XHJcblx0XHRcdHBocmFzZS5wb3N0aW5nPVtdO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y2FjaGVbcGhyYXNlLmtleV09cGhyYXNlLnBvc3Rpbmc9US50ZXJtc1twaHJhc2UudGVybWlkWzBdXS5wb3N0aW5nO1x0XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gUTtcclxuXHR9XHJcblxyXG5cdHZhciBpPTAsIHI9W10sZGlzPTA7XHJcblx0d2hpbGUoaTxwaHJhc2UudGVybWlkLmxlbmd0aCkge1xyXG5cdCAgdmFyIFQ9US50ZXJtc1twaHJhc2UudGVybWlkW2ldXTtcclxuXHRcdGlmICgwID09PSBpKSB7XHJcblx0XHRcdHIgPSBULnBvc3Rpbmc7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0ICAgIGlmIChULm9wPT0nd2lsZGNhcmQnKSB7XHJcblx0XHQgICAgXHRUPVEudGVybXNbcGhyYXNlLnRlcm1pZFtpKytdXTtcclxuXHRcdCAgICBcdHZhciB3aWR0aD1ULndpZHRoO1xyXG5cdFx0ICAgIFx0dmFyIHdpbGRjYXJkPVQud2lsZGNhcmQ7XHJcblx0XHQgICAgXHRUPVEudGVybXNbcGhyYXNlLnRlcm1pZFtpXV07XHJcblx0XHQgICAgXHR2YXIgbWluZGlzPWRpcztcclxuXHRcdCAgICBcdGlmICh3aWxkY2FyZD09Jz8nKSBtaW5kaXM9ZGlzK3dpZHRoO1xyXG5cdFx0ICAgIFx0aWYgKFQuZXhjbHVkZSkgciA9IHBsaXN0LnBsbm90Zm9sbG93MihyLCBULnBvc3RpbmcsIG1pbmRpcywgZGlzK3dpZHRoKTtcclxuXHRcdCAgICBcdGVsc2UgciA9IHBsaXN0LnBsZm9sbG93MihyLCBULnBvc3RpbmcsIG1pbmRpcywgZGlzK3dpZHRoKTtcdFx0ICAgIFx0XHJcblx0XHQgICAgXHRkaXMrPSh3aWR0aC0xKTtcclxuXHRcdCAgICB9ZWxzZSB7XHJcblx0XHQgICAgXHRpZiAoVC5wb3N0aW5nKSB7XHJcblx0XHQgICAgXHRcdGlmIChULmV4Y2x1ZGUpIHIgPSBwbGlzdC5wbG5vdGZvbGxvdyhyLCBULnBvc3RpbmcsIGRpcyk7XHJcblx0XHQgICAgXHRcdGVsc2UgciA9IHBsaXN0LnBsZm9sbG93KHIsIFQucG9zdGluZywgZGlzKTtcclxuXHRcdCAgICBcdH1cclxuXHRcdCAgICB9XHJcblx0XHR9XHJcblx0XHRkaXMgKz0gcGhyYXNlLnRlcm1sZW5ndGhbaV07XHJcblx0XHRpKys7XHJcblx0XHRpZiAoIXIpIHJldHVybiBRO1xyXG4gIH1cclxuICBwaHJhc2UucG9zdGluZz1yO1xyXG4gIGNhY2hlW3BocmFzZS5rZXldPXI7XHJcbiAgcmV0dXJuIFE7XHJcbn1cclxudmFyIHRyaW1TcGFjZT1mdW5jdGlvbihlbmdpbmUscXVlcnkpIHtcclxuXHRpZiAoIXF1ZXJ5KSByZXR1cm4gXCJcIjtcclxuXHR2YXIgaT0wO1xyXG5cdHZhciBpc1NraXA9ZW5naW5lLmFuYWx5emVyLmlzU2tpcDtcclxuXHR3aGlsZSAoaXNTa2lwKHF1ZXJ5W2ldKSAmJiBpPHF1ZXJ5Lmxlbmd0aCkgaSsrO1xyXG5cdHJldHVybiBxdWVyeS5zdWJzdHJpbmcoaSk7XHJcbn1cclxudmFyIGdldFNlZ1dpdGhIaXQ9ZnVuY3Rpb24oZmlsZWlkLG9mZnNldHMpIHtcclxuXHR2YXIgUT10aGlzLGVuZ2luZT1RLmVuZ2luZTtcclxuXHR2YXIgc2VnV2l0aEhpdD1wbGlzdC5ncm91cGJ5cG9zdGluZzIoUS5ieUZpbGVbZmlsZWlkIF0sIG9mZnNldHMpO1xyXG5cdGlmIChzZWdXaXRoSGl0Lmxlbmd0aCkgc2VnV2l0aEhpdC5zaGlmdCgpOyAvL3RoZSBmaXJzdCBpdGVtIGlzIG5vdCB1c2VkICgwflEuYnlGaWxlWzBdIClcclxuXHR2YXIgb3V0PVtdO1xyXG5cdHNlZ1dpdGhIaXQubWFwKGZ1bmN0aW9uKHAsaWR4KXtpZiAocC5sZW5ndGgpIG91dC5wdXNoKGlkeCl9KTtcclxuXHRyZXR1cm4gb3V0O1xyXG59XHJcbnZhciBzZWdXaXRoSGl0PWZ1bmN0aW9uKGZpbGVpZCkge1xyXG5cdHZhciBRPXRoaXMsZW5naW5lPVEuZW5naW5lO1xyXG5cdHZhciBvZmZzZXRzPWVuZ2luZS5nZXRGaWxlU2VnT2Zmc2V0cyhmaWxlaWQpO1xyXG5cdHJldHVybiBnZXRTZWdXaXRoSGl0LmFwcGx5KHRoaXMsW2ZpbGVpZCxvZmZzZXRzXSk7XHJcbn1cclxudmFyIGlzU2ltcGxlUGhyYXNlPWZ1bmN0aW9uKHBocmFzZSkge1xyXG5cdHZhciBtPXBocmFzZS5tYXRjaCgvW1xcPyVeXS8pO1xyXG5cdHJldHVybiAhbTtcclxufVxyXG5cclxuLy8g55m86I+p5o+Q5b+DICAgPT0+IOeZvOiPqSAg5o+Q5b+DICAgICAgIDIgMiAgIFxyXG4vLyDoj6nmj5Dlv4MgICAgID09PiDoj6nmj5AgIOaPkOW/gyAgICAgICAxIDJcclxuLy8g5Yqr5YqrICAgICAgID09PiDliqsgICAg5YqrICAgICAgICAgMSAxICAgLy8gaW52YWxpZFxyXG4vLyDlm6Dnt6PmiYDnlJ/pgZMgID09PiDlm6Dnt6MgIOaJgOeUnyAgIOmBkyAgIDIgMiAxXHJcbnZhciBzcGxpdFBocmFzZT1mdW5jdGlvbihlbmdpbmUsc2ltcGxlcGhyYXNlLGJpZ3JhbSkge1xyXG5cdHZhciBiaWdyYW09YmlncmFtfHxlbmdpbmUuZ2V0KFwibWV0YVwiKS5iaWdyYW18fFtdO1xyXG5cdHZhciB0b2tlbnM9ZW5naW5lLmFuYWx5emVyLnRva2VuaXplKHNpbXBsZXBocmFzZSkudG9rZW5zO1xyXG5cdHZhciBsb2FkdG9rZW5zPVtdLGxlbmd0aHM9W10saj0wLGxhc3RiaWdyYW1wb3M9LTE7XHJcblx0d2hpbGUgKGorMTx0b2tlbnMubGVuZ3RoKSB7XHJcblx0XHR2YXIgdG9rZW49ZW5naW5lLmFuYWx5emVyLm5vcm1hbGl6ZSh0b2tlbnNbal0pO1xyXG5cdFx0dmFyIG5leHR0b2tlbj1lbmdpbmUuYW5hbHl6ZXIubm9ybWFsaXplKHRva2Vuc1tqKzFdKTtcclxuXHRcdHZhciBiaT10b2tlbituZXh0dG9rZW47XHJcblx0XHR2YXIgaT1wbGlzdC5pbmRleE9mU29ydGVkKGJpZ3JhbSxiaSk7XHJcblx0XHRpZiAoYmlncmFtW2ldPT1iaSkge1xyXG5cdFx0XHRsb2FkdG9rZW5zLnB1c2goYmkpO1xyXG5cdFx0XHRpZiAoaiszPHRva2Vucy5sZW5ndGgpIHtcclxuXHRcdFx0XHRsYXN0YmlncmFtcG9zPWo7XHJcblx0XHRcdFx0aisrO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGlmIChqKzI9PXRva2Vucy5sZW5ndGgpeyBcclxuXHRcdFx0XHRcdGlmIChsYXN0YmlncmFtcG9zKzE9PWogKSB7XHJcblx0XHRcdFx0XHRcdGxlbmd0aHNbbGVuZ3Rocy5sZW5ndGgtMV0tLTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGxhc3RiaWdyYW1wb3M9ajtcclxuXHRcdFx0XHRcdGorKztcclxuXHRcdFx0XHR9ZWxzZSB7XHJcblx0XHRcdFx0XHRsYXN0YmlncmFtcG9zPWo7XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0bGVuZ3Rocy5wdXNoKDIpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKCFiaWdyYW0gfHwgbGFzdGJpZ3JhbXBvcz09LTEgfHwgbGFzdGJpZ3JhbXBvcysxIT1qKSB7XHJcblx0XHRcdFx0bG9hZHRva2Vucy5wdXNoKHRva2VuKTtcclxuXHRcdFx0XHRsZW5ndGhzLnB1c2goMSk7XHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aisrO1xyXG5cdH1cclxuXHJcblx0d2hpbGUgKGo8dG9rZW5zLmxlbmd0aCkge1xyXG5cdFx0dmFyIHRva2VuPWVuZ2luZS5hbmFseXplci5ub3JtYWxpemUodG9rZW5zW2pdKTtcclxuXHRcdGxvYWR0b2tlbnMucHVzaCh0b2tlbik7XHJcblx0XHRsZW5ndGhzLnB1c2goMSk7XHJcblx0XHRqKys7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4ge3Rva2Vuczpsb2FkdG9rZW5zLCBsZW5ndGhzOiBsZW5ndGhzICwgdG9rZW5sZW5ndGg6IHRva2Vucy5sZW5ndGh9O1xyXG59XHJcbi8qIGhvc3QgaGFzIGZhc3QgbmF0aXZlIGZ1bmN0aW9uICovXHJcbnZhciBmYXN0UGhyYXNlPWZ1bmN0aW9uKGVuZ2luZSxwaHJhc2UpIHtcclxuXHR2YXIgcGhyYXNlX3Rlcm09bmV3UGhyYXNlKCk7XHJcblx0Ly92YXIgdG9rZW5zPWVuZ2luZS5hbmFseXplci50b2tlbml6ZShwaHJhc2UpLnRva2VucztcclxuXHR2YXIgc3BsaXR0ZWQ9c3BsaXRQaHJhc2UoZW5naW5lLHBocmFzZSk7XHJcblxyXG5cdHZhciBwYXRocz1wb3N0aW5nUGF0aEZyb21Ub2tlbnMoZW5naW5lLHNwbGl0dGVkLnRva2Vucyk7XHJcbi8vY3JlYXRlIHdpbGRjYXJkXHJcblxyXG5cdHBocmFzZV90ZXJtLndpZHRoPXNwbGl0dGVkLnRva2VubGVuZ3RoOyAvL2ZvciBleGNlcnB0LmpzIHRvIGdldFBocmFzZVdpZHRoXHJcblxyXG5cdGVuZ2luZS5nZXQocGF0aHMse2FkZHJlc3M6dHJ1ZX0sZnVuY3Rpb24ocG9zdGluZ0FkZHJlc3MpeyAvL3RoaXMgaXMgc3luY1xyXG5cdFx0cGhyYXNlX3Rlcm0ua2V5PXBocmFzZTtcclxuXHRcdHZhciBwb3N0aW5nQWRkcmVzc1dpdGhXaWxkY2FyZD1bXTtcclxuXHRcdGZvciAodmFyIGk9MDtpPHBvc3RpbmdBZGRyZXNzLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0cG9zdGluZ0FkZHJlc3NXaXRoV2lsZGNhcmQucHVzaChwb3N0aW5nQWRkcmVzc1tpXSk7XHJcblx0XHRcdGlmIChzcGxpdHRlZC5sZW5ndGhzW2ldPjEpIHtcclxuXHRcdFx0XHRwb3N0aW5nQWRkcmVzc1dpdGhXaWxkY2FyZC5wdXNoKFtzcGxpdHRlZC5sZW5ndGhzW2ldLDBdKTsgLy93aWxkY2FyZCBoYXMgYmxvY2tzaXplPT0wIFxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbmdpbmUucG9zdGluZ0NhY2hlW3BocmFzZV09ZW5naW5lLm1lcmdlUG9zdGluZ3MocG9zdGluZ0FkZHJlc3NXaXRoV2lsZGNhcmQpO1xyXG5cdH0pO1xyXG5cdHJldHVybiBwaHJhc2VfdGVybTtcclxuXHQvLyBwdXQgcG9zdGluZyBpbnRvIGNhY2hlW3BocmFzZS5rZXldXHJcbn1cclxudmFyIHNsb3dQaHJhc2U9ZnVuY3Rpb24oZW5naW5lLHRlcm1zLHBocmFzZSkge1xyXG5cdHZhciBqPTAsdG9rZW5zPWVuZ2luZS5hbmFseXplci50b2tlbml6ZShwaHJhc2UpLnRva2VucztcclxuXHR2YXIgcGhyYXNlX3Rlcm09bmV3UGhyYXNlKCk7XHJcblx0dmFyIHRlcm1pZD0wO1xyXG5cdHdoaWxlIChqPHRva2Vucy5sZW5ndGgpIHtcclxuXHRcdHZhciByYXc9dG9rZW5zW2pdLCB0ZXJtbGVuZ3RoPTE7XHJcblx0XHRpZiAoaXNXaWxkY2FyZChyYXcpKSB7XHJcblx0XHRcdGlmIChwaHJhc2VfdGVybS50ZXJtaWQubGVuZ3RoPT0wKSAgeyAvL3NraXAgbGVhZGluZyB3aWxkIGNhcmRcclxuXHRcdFx0XHRqKytcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0ZXJtcy5wdXNoKHBhcnNlV2lsZGNhcmQocmF3KSk7XHJcblx0XHRcdHRlcm1pZD10ZXJtcy5sZW5ndGgtMTtcclxuXHRcdFx0cGhyYXNlX3Rlcm0udGVybWlkLnB1c2godGVybWlkKTtcclxuXHRcdFx0cGhyYXNlX3Rlcm0udGVybWxlbmd0aC5wdXNoKHRlcm1sZW5ndGgpO1xyXG5cdFx0fSBlbHNlIGlmIChpc09yVGVybShyYXcpKXtcclxuXHRcdFx0dmFyIHRlcm09b3JUZXJtcy5hcHBseSh0aGlzLFt0b2tlbnMsal0pO1xyXG5cdFx0XHRpZiAodGVybSkge1xyXG5cdFx0XHRcdHRlcm1zLnB1c2godGVybSk7XHJcblx0XHRcdFx0dGVybWlkPXRlcm1zLmxlbmd0aC0xO1xyXG5cdFx0XHRcdGorPXRlcm0ua2V5LnNwbGl0KCcsJykubGVuZ3RoLTE7XHRcdFx0XHRcdFxyXG5cdFx0XHR9XHJcblx0XHRcdGorKztcclxuXHRcdFx0cGhyYXNlX3Rlcm0udGVybWlkLnB1c2godGVybWlkKTtcclxuXHRcdFx0cGhyYXNlX3Rlcm0udGVybWxlbmd0aC5wdXNoKHRlcm1sZW5ndGgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dmFyIHBocmFzZT1cIlwiO1xyXG5cdFx0XHR3aGlsZSAoajx0b2tlbnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0aWYgKCEoaXNXaWxkY2FyZCh0b2tlbnNbal0pIHx8IGlzT3JUZXJtKHRva2Vuc1tqXSkpKSB7XHJcblx0XHRcdFx0XHRwaHJhc2UrPXRva2Vuc1tqXTtcclxuXHRcdFx0XHRcdGorKztcclxuXHRcdFx0XHR9IGVsc2UgYnJlYWs7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBzcGxpdHRlZD1zcGxpdFBocmFzZShlbmdpbmUscGhyYXNlKTtcclxuXHRcdFx0Zm9yICh2YXIgaT0wO2k8c3BsaXR0ZWQudG9rZW5zLmxlbmd0aDtpKyspIHtcclxuXHJcblx0XHRcdFx0dmFyIHRlcm09cGFyc2VUZXJtKGVuZ2luZSxzcGxpdHRlZC50b2tlbnNbaV0pO1xyXG5cdFx0XHRcdHZhciB0ZXJtaWR4PXRlcm1zLm1hcChmdW5jdGlvbihhKXtyZXR1cm4gYS5rZXl9KS5pbmRleE9mKHRlcm0ua2V5KTtcclxuXHRcdFx0XHRpZiAodGVybWlkeD09LTEpIHtcclxuXHRcdFx0XHRcdHRlcm1zLnB1c2godGVybSk7XHJcblx0XHRcdFx0XHR0ZXJtaWQ9dGVybXMubGVuZ3RoLTE7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHRlcm1pZD10ZXJtaWR4O1xyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdHBocmFzZV90ZXJtLnRlcm1pZC5wdXNoKHRlcm1pZCk7XHJcblx0XHRcdFx0cGhyYXNlX3Rlcm0udGVybWxlbmd0aC5wdXNoKHNwbGl0dGVkLmxlbmd0aHNbaV0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRqKys7XHJcblx0fVxyXG5cdHBocmFzZV90ZXJtLmtleT1waHJhc2U7XHJcblx0Ly9yZW1vdmUgZW5kaW5nIHdpbGRjYXJkXHJcblx0dmFyIFA9cGhyYXNlX3Rlcm0gLCBUPW51bGw7XHJcblx0ZG8ge1xyXG5cdFx0VD10ZXJtc1tQLnRlcm1pZFtQLnRlcm1pZC5sZW5ndGgtMV1dO1xyXG5cdFx0aWYgKCFUKSBicmVhaztcclxuXHRcdGlmIChULndpbGRjYXJkKSBQLnRlcm1pZC5wb3AoKTsgZWxzZSBicmVhaztcclxuXHR9IHdoaWxlKFQpO1x0XHRcclxuXHRyZXR1cm4gcGhyYXNlX3Rlcm07XHJcbn1cclxudmFyIG5ld1F1ZXJ5ID1mdW5jdGlvbihlbmdpbmUscXVlcnksb3B0cykge1xyXG5cdC8vaWYgKCFxdWVyeSkgcmV0dXJuO1xyXG5cdG9wdHM9b3B0c3x8e307XHJcblx0cXVlcnk9dHJpbVNwYWNlKGVuZ2luZSxxdWVyeSk7XHJcblxyXG5cdHZhciBwaHJhc2VzPXF1ZXJ5LHBocmFzZXM9W107XHJcblx0aWYgKHR5cGVvZiBxdWVyeT09J3N0cmluZycgJiYgcXVlcnkpIHtcclxuXHRcdHBocmFzZXM9cGFyc2VRdWVyeShxdWVyeSxvcHRzLnBocmFzZV9zZXAgfHwgXCJcIik7XHJcblx0fVxyXG5cdFxyXG5cdHZhciBwaHJhc2VfdGVybXM9W10sIHRlcm1zPVtdLHZhcmlhbnRzPVtdLG9wZXJhdG9ycz1bXTtcclxuXHR2YXIgcGM9MDsvL3BocmFzZSBjb3VudFxyXG5cdGZvciAgKHZhciBpPTA7aTxwaHJhc2VzLmxlbmd0aDtpKyspIHtcclxuXHRcdHZhciBvcD1nZXRPcGVyYXRvcihwaHJhc2VzW3BjXSk7XHJcblx0XHRpZiAob3ApIHBocmFzZXNbcGNdPXBocmFzZXNbcGNdLnN1YnN0cmluZygxKTtcclxuXHJcblx0XHQvKiBhdXRvIGFkZCArIGZvciBuYXR1cmFsIG9yZGVyID8qL1xyXG5cdFx0Ly9pZiAoIW9wdHMucmFuayAmJiBvcCE9J2V4Y2x1ZGUnICYmaSkgb3A9J2luY2x1ZGUnO1xyXG5cdFx0b3BlcmF0b3JzLnB1c2gob3ApO1xyXG5cclxuXHRcdGlmIChpc1NpbXBsZVBocmFzZShwaHJhc2VzW3BjXSkgJiYgZW5naW5lLm1lcmdlUG9zdGluZ3MgKSB7XHJcblx0XHRcdHZhciBwaHJhc2VfdGVybT1mYXN0UGhyYXNlKGVuZ2luZSxwaHJhc2VzW3BjXSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR2YXIgcGhyYXNlX3Rlcm09c2xvd1BocmFzZShlbmdpbmUsdGVybXMscGhyYXNlc1twY10pO1xyXG5cdFx0fVxyXG5cdFx0cGhyYXNlX3Rlcm1zLnB1c2gocGhyYXNlX3Rlcm0pO1xyXG5cclxuXHRcdGlmICghZW5naW5lLm1lcmdlUG9zdGluZ3MgJiYgcGhyYXNlX3Rlcm1zW3BjXS50ZXJtaWQubGVuZ3RoPT0wKSB7XHJcblx0XHRcdHBocmFzZV90ZXJtcy5wb3AoKTtcclxuXHRcdH0gZWxzZSBwYysrO1xyXG5cdH1cclxuXHRvcHRzLm9wPW9wZXJhdG9ycztcclxuXHJcblx0dmFyIFE9e2RibmFtZTplbmdpbmUuZGJuYW1lLGVuZ2luZTplbmdpbmUsb3B0czpvcHRzLHF1ZXJ5OnF1ZXJ5LFxyXG5cdFx0cGhyYXNlczpwaHJhc2VfdGVybXMsdGVybXM6dGVybXNcclxuXHR9O1xyXG5cdFEudG9rZW5pemU9ZnVuY3Rpb24oKSB7cmV0dXJuIGVuZ2luZS5hbmFseXplci50b2tlbml6ZS5hcHBseShlbmdpbmUsYXJndW1lbnRzKTt9XHJcblx0US5pc1NraXA9ZnVuY3Rpb24oKSB7cmV0dXJuIGVuZ2luZS5hbmFseXplci5pc1NraXAuYXBwbHkoZW5naW5lLGFyZ3VtZW50cyk7fVxyXG5cdFEubm9ybWFsaXplPWZ1bmN0aW9uKCkge3JldHVybiBlbmdpbmUuYW5hbHl6ZXIubm9ybWFsaXplLmFwcGx5KGVuZ2luZSxhcmd1bWVudHMpO31cclxuXHRRLnNlZ1dpdGhIaXQ9c2VnV2l0aEhpdDtcclxuXHJcblx0Ly9RLmdldFJhbmdlPWZ1bmN0aW9uKCkge3JldHVybiB0aGF0LmdldFJhbmdlLmFwcGx5KHRoYXQsYXJndW1lbnRzKX07XHJcblx0Ly9BUEkucXVlcnlpZD0nUScrKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSoxMDAwMDAwMCkpLnRvU3RyaW5nKDE2KTtcclxuXHRyZXR1cm4gUTtcclxufVxyXG52YXIgcG9zdGluZ1BhdGhGcm9tVG9rZW5zPWZ1bmN0aW9uKGVuZ2luZSx0b2tlbnMpIHtcclxuXHR2YXIgYWxsdG9rZW5zPWVuZ2luZS5nZXQoXCJ0b2tlbnNcIik7XHJcblxyXG5cdHZhciB0b2tlbklkcz10b2tlbnMubWFwKGZ1bmN0aW9uKHQpeyByZXR1cm4gMSthbGx0b2tlbnMuaW5kZXhPZih0KX0pO1xyXG5cdHZhciBwb3N0aW5naWQ9W107XHJcblx0Zm9yICh2YXIgaT0wO2k8dG9rZW5JZHMubGVuZ3RoO2krKykge1xyXG5cdFx0cG9zdGluZ2lkLnB1c2goIHRva2VuSWRzW2ldKTsgLy8gdG9rZW5JZD09MCAsIGVtcHR5IHRva2VuXHJcblx0fVxyXG5cdHJldHVybiBwb3N0aW5naWQubWFwKGZ1bmN0aW9uKHQpe3JldHVybiBbXCJwb3N0aW5nc1wiLHRdfSk7XHJcbn1cclxudmFyIGxvYWRQb3N0aW5ncz1mdW5jdGlvbihlbmdpbmUsdG9rZW5zLGNiKSB7XHJcblx0dmFyIHRvbG9hZHRva2Vucz10b2tlbnMuZmlsdGVyKGZ1bmN0aW9uKHQpe1xyXG5cdFx0cmV0dXJuICFlbmdpbmUucG9zdGluZ0NhY2hlW3Qua2V5XTsgLy9hbHJlYWR5IGluIGNhY2hlXHJcblx0fSk7XHJcblx0aWYgKHRvbG9hZHRva2Vucy5sZW5ndGg9PTApIHtcclxuXHRcdGNiKCk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHZhciBwb3N0aW5nUGF0aHM9cG9zdGluZ1BhdGhGcm9tVG9rZW5zKGVuZ2luZSx0b2tlbnMubWFwKGZ1bmN0aW9uKHQpe3JldHVybiB0LmtleX0pKTtcclxuXHRlbmdpbmUuZ2V0KHBvc3RpbmdQYXRocyxmdW5jdGlvbihwb3N0aW5ncyl7XHJcblx0XHRwb3N0aW5ncy5tYXAoZnVuY3Rpb24ocCxpKSB7IHRva2Vuc1tpXS5wb3N0aW5nPXAgfSk7XHJcblx0XHRpZiAoY2IpIGNiKCk7XHJcblx0fSk7XHJcbn1cclxudmFyIGdyb3VwQnk9ZnVuY3Rpb24oUSxwb3N0aW5nKSB7XHJcblx0cGhyYXNlcy5mb3JFYWNoKGZ1bmN0aW9uKFApe1xyXG5cdFx0dmFyIGtleT1QLmtleTtcclxuXHRcdHZhciBkb2NmcmVxPWRvY2ZyZXFjYWNoZVtrZXldO1xyXG5cdFx0aWYgKCFkb2NmcmVxKSBkb2NmcmVxPWRvY2ZyZXFjYWNoZVtrZXldPXt9O1xyXG5cdFx0aWYgKCFkb2NmcmVxW3RoYXQuZ3JvdXB1bml0XSkge1xyXG5cdFx0XHRkb2NmcmVxW3RoYXQuZ3JvdXB1bml0XT17ZG9jbGlzdDpudWxsLGZyZXE6bnVsbH07XHJcblx0XHR9XHRcdFxyXG5cdFx0aWYgKFAucG9zdGluZykge1xyXG5cdFx0XHR2YXIgcmVzPW1hdGNoUG9zdGluZyhlbmdpbmUsUC5wb3N0aW5nKTtcclxuXHRcdFx0UC5mcmVxPXJlcy5mcmVxO1xyXG5cdFx0XHRQLmRvY3M9cmVzLmRvY3M7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRQLmRvY3M9W107XHJcblx0XHRcdFAuZnJlcT1bXTtcclxuXHRcdH1cclxuXHRcdGRvY2ZyZXFbdGhhdC5ncm91cHVuaXRdPXtkb2NsaXN0OlAuZG9jcyxmcmVxOlAuZnJlcX07XHJcblx0fSk7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn1cclxudmFyIGdyb3VwQnlGb2xkZXI9ZnVuY3Rpb24oZW5naW5lLGZpbGVoaXRzKSB7XHJcblx0dmFyIGZpbGVzPWVuZ2luZS5nZXQoXCJmaWxlbmFtZXNcIik7XHJcblx0dmFyIHByZXZmb2xkZXI9XCJcIixoaXRzPTAsb3V0PVtdO1xyXG5cdGZvciAodmFyIGk9MDtpPGZpbGVoaXRzLmxlbmd0aDtpKyspIHtcclxuXHRcdHZhciBmbj1maWxlc1tpXTtcclxuXHRcdHZhciBmb2xkZXI9Zm4uc3Vic3RyaW5nKDAsZm4uaW5kZXhPZignLycpKTtcclxuXHRcdGlmIChwcmV2Zm9sZGVyICYmIHByZXZmb2xkZXIhPWZvbGRlcikge1xyXG5cdFx0XHRvdXQucHVzaChoaXRzKTtcclxuXHRcdFx0aGl0cz0wO1xyXG5cdFx0fVxyXG5cdFx0aGl0cys9ZmlsZWhpdHNbaV0ubGVuZ3RoO1xyXG5cdFx0cHJldmZvbGRlcj1mb2xkZXI7XHJcblx0fVxyXG5cdG91dC5wdXNoKGhpdHMpO1xyXG5cdHJldHVybiBvdXQ7XHJcbn1cclxudmFyIHBocmFzZV9pbnRlcnNlY3Q9ZnVuY3Rpb24oZW5naW5lLFEpIHtcclxuXHR2YXIgaW50ZXJzZWN0ZWQ9bnVsbDtcclxuXHR2YXIgZmlsZW9mZnNldHM9US5lbmdpbmUuZ2V0KFwiZmlsZW9mZnNldHNcIik7XHJcblx0dmFyIGVtcHR5PVtdLGVtcHR5Y291bnQ9MCxoYXNoaXQ9MDtcclxuXHRmb3IgKHZhciBpPTA7aTxRLnBocmFzZXMubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIGJ5ZmlsZT1wbGlzdC5ncm91cGJ5cG9zdGluZzIoUS5waHJhc2VzW2ldLnBvc3RpbmcsZmlsZW9mZnNldHMpO1xyXG5cdFx0aWYgKGJ5ZmlsZS5sZW5ndGgpIGJ5ZmlsZS5zaGlmdCgpO1xyXG5cdFx0aWYgKGJ5ZmlsZS5sZW5ndGgpIGJ5ZmlsZS5wb3AoKTtcclxuXHRcdGJ5ZmlsZS5wb3AoKTtcclxuXHRcdGlmIChpbnRlcnNlY3RlZD09bnVsbCkge1xyXG5cdFx0XHRpbnRlcnNlY3RlZD1ieWZpbGU7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRmb3IgKHZhciBqPTA7ajxieWZpbGUubGVuZ3RoO2orKykge1xyXG5cdFx0XHRcdGlmICghKGJ5ZmlsZVtqXS5sZW5ndGggJiYgaW50ZXJzZWN0ZWRbal0ubGVuZ3RoKSkge1xyXG5cdFx0XHRcdFx0aW50ZXJzZWN0ZWRbal09ZW1wdHk7IC8vcmV1c2UgZW1wdHkgYXJyYXlcclxuXHRcdFx0XHRcdGVtcHR5Y291bnQrKztcclxuXHRcdFx0XHR9IGVsc2UgaGFzaGl0Kys7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdFEuYnlGaWxlPWludGVyc2VjdGVkO1xyXG5cdFEuYnlGb2xkZXI9Z3JvdXBCeUZvbGRlcihlbmdpbmUsUS5ieUZpbGUpO1xyXG5cdHZhciBvdXQ9W107XHJcblx0Ly9jYWxjdWxhdGUgbmV3IHJhd3Bvc3RpbmdcclxuXHRmb3IgKHZhciBpPTA7aTxRLmJ5RmlsZS5sZW5ndGg7aSsrKSB7XHJcblx0XHRpZiAoUS5ieUZpbGVbaV0ubGVuZ3RoKSBvdXQ9b3V0LmNvbmNhdChRLmJ5RmlsZVtpXSk7XHJcblx0fVxyXG5cdFEucmF3cmVzdWx0PW91dDtcclxuXHRjb3VudEZvbGRlckZpbGUoUSk7XHJcbn1cclxudmFyIGNvdW50Rm9sZGVyRmlsZT1mdW5jdGlvbihRKSB7XHJcblx0US5maWxlV2l0aEhpdENvdW50PTA7XHJcblx0US5ieUZpbGUubWFwKGZ1bmN0aW9uKGYpe2lmIChmLmxlbmd0aCkgUS5maWxlV2l0aEhpdENvdW50Kyt9KTtcclxuXHRcdFx0XHJcblx0US5mb2xkZXJXaXRoSGl0Q291bnQ9MDtcclxuXHRRLmJ5Rm9sZGVyLm1hcChmdW5jdGlvbihmKXtpZiAoZikgUS5mb2xkZXJXaXRoSGl0Q291bnQrK30pO1xyXG59XHJcblxyXG52YXIgbWFpbj1mdW5jdGlvbihlbmdpbmUscSxvcHRzLGNiKXtcclxuXHR2YXIgc3RhcnR0aW1lPW5ldyBEYXRlKCk7XHJcblx0dmFyIG1ldGE9ZW5naW5lLmdldChcIm1ldGFcIik7XHJcblx0aWYgKG1ldGEubm9ybWFsaXplICYmIGVuZ2luZS5hbmFseXplci5zZXROb3JtYWxpemVUYWJsZSkge1xyXG5cdFx0bWV0YS5ub3JtYWxpemVPYmo9ZW5naW5lLmFuYWx5emVyLnNldE5vcm1hbGl6ZVRhYmxlKG1ldGEubm9ybWFsaXplLG1ldGEubm9ybWFsaXplT2JqKTtcclxuXHR9XHJcblx0aWYgKHR5cGVvZiBvcHRzPT1cImZ1bmN0aW9uXCIpIGNiPW9wdHM7XHJcblx0b3B0cz1vcHRzfHx7fTtcclxuXHR2YXIgUT1lbmdpbmUucXVlcnlDYWNoZVtxXTtcclxuXHRpZiAoIVEpIFE9bmV3UXVlcnkoZW5naW5lLHEsb3B0cyk7IFxyXG5cdGlmICghUSkge1xyXG5cdFx0ZW5naW5lLnNlYXJjaHRpbWU9bmV3IERhdGUoKS1zdGFydHRpbWU7XHJcblx0XHRlbmdpbmUudG90YWx0aW1lPWVuZ2luZS5zZWFyY2h0aW1lO1xyXG5cdFx0aWYgKGVuZ2luZS5jb250ZXh0KSBjYi5hcHBseShlbmdpbmUuY29udGV4dCxbXCJlbXB0eSByZXN1bHRcIix7cmF3cmVzdWx0OltdfV0pO1xyXG5cdFx0ZWxzZSBjYihcImVtcHR5IHJlc3VsdFwiLHtyYXdyZXN1bHQ6W119KTtcclxuXHRcdHJldHVybjtcclxuXHR9O1xyXG5cdGVuZ2luZS5xdWVyeUNhY2hlW3FdPVE7XHJcblx0aWYgKFEucGhyYXNlcy5sZW5ndGgpIHtcclxuXHRcdGxvYWRQb3N0aW5ncyhlbmdpbmUsUS50ZXJtcyxmdW5jdGlvbigpe1xyXG5cdFx0XHRpZiAoIVEucGhyYXNlc1swXS5wb3N0aW5nKSB7XHJcblx0XHRcdFx0ZW5naW5lLnNlYXJjaHRpbWU9bmV3IERhdGUoKS1zdGFydHRpbWU7XHJcblx0XHRcdFx0ZW5naW5lLnRvdGFsdGltZT1lbmdpbmUuc2VhcmNodGltZVxyXG5cclxuXHRcdFx0XHRjYi5hcHBseShlbmdpbmUuY29udGV4dCxbXCJubyBzdWNoIHBvc3RpbmdcIix7cmF3cmVzdWx0OltdfV0pO1xyXG5cdFx0XHRcdHJldHVybjtcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0aWYgKCFRLnBocmFzZXNbMF0ucG9zdGluZy5sZW5ndGgpIHsgLy9cclxuXHRcdFx0XHRRLnBocmFzZXMuZm9yRWFjaChsb2FkUGhyYXNlLmJpbmQoUSkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChRLnBocmFzZXMubGVuZ3RoPT0xKSB7XHJcblx0XHRcdFx0US5yYXdyZXN1bHQ9US5waHJhc2VzWzBdLnBvc3Rpbmc7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cGhyYXNlX2ludGVyc2VjdChlbmdpbmUsUSk7XHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIGZpbGVvZmZzZXRzPVEuZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpO1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKFwic2VhcmNoIG9wdHMgXCIrSlNPTi5zdHJpbmdpZnkob3B0cykpO1xyXG5cclxuXHRcdFx0aWYgKCFRLmJ5RmlsZSAmJiBRLnJhd3Jlc3VsdCAmJiAhb3B0cy5ub2dyb3VwKSB7XHJcblx0XHRcdFx0US5ieUZpbGU9cGxpc3QuZ3JvdXBieXBvc3RpbmcyKFEucmF3cmVzdWx0LCBmaWxlb2Zmc2V0cyk7XHJcblx0XHRcdFx0US5ieUZpbGUuc2hpZnQoKTtRLmJ5RmlsZS5wb3AoKTtcclxuXHRcdFx0XHRRLmJ5Rm9sZGVyPWdyb3VwQnlGb2xkZXIoZW5naW5lLFEuYnlGaWxlKTtcclxuXHJcblx0XHRcdFx0Y291bnRGb2xkZXJGaWxlKFEpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAob3B0cy5yYW5nZSkge1xyXG5cdFx0XHRcdGVuZ2luZS5zZWFyY2h0aW1lPW5ldyBEYXRlKCktc3RhcnR0aW1lO1xyXG5cdFx0XHRcdGV4Y2VycHQucmVzdWx0bGlzdChlbmdpbmUsUSxvcHRzLGZ1bmN0aW9uKGRhdGEpIHsgXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiZXhjZXJwdCBva1wiKTtcclxuXHRcdFx0XHRcdFEuZXhjZXJwdD1kYXRhO1xyXG5cdFx0XHRcdFx0ZW5naW5lLnRvdGFsdGltZT1uZXcgRGF0ZSgpLXN0YXJ0dGltZTtcclxuXHRcdFx0XHRcdGNiLmFwcGx5KGVuZ2luZS5jb250ZXh0LFswLFFdKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRlbmdpbmUuc2VhcmNodGltZT1uZXcgRGF0ZSgpLXN0YXJ0dGltZTtcclxuXHRcdFx0XHRlbmdpbmUudG90YWx0aW1lPW5ldyBEYXRlKCktc3RhcnR0aW1lO1xyXG5cdFx0XHRcdGNiLmFwcGx5KGVuZ2luZS5jb250ZXh0LFswLFFdKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fSBlbHNlIHsgLy9lbXB0eSBzZWFyY2hcclxuXHRcdGVuZ2luZS5zZWFyY2h0aW1lPW5ldyBEYXRlKCktc3RhcnR0aW1lO1xyXG5cdFx0ZW5naW5lLnRvdGFsdGltZT1uZXcgRGF0ZSgpLXN0YXJ0dGltZTtcclxuXHRcdGNiLmFwcGx5KGVuZ2luZS5jb250ZXh0LFswLFFdKTtcclxuXHR9O1xyXG59XHJcblxyXG5tYWluLnNwbGl0UGhyYXNlPXNwbGl0UGhyYXNlOyAvL2p1c3QgZm9yIGRlYnVnXHJcbm1vZHVsZS5leHBvcnRzPW1haW47IiwiXHJcbnZhciBFPVJlYWN0LmNyZWF0ZUVsZW1lbnQ7XHJcbnZhciB0cmltSGl0PWZ1bmN0aW9uKGhpdCkge1xyXG4gIGlmIChoaXQ+OTk5KSB7IFxyXG4gICAgcmV0dXJuIChNYXRoLmZsb29yKGhpdC8xMDAwKSkudG9TdHJpbmcoKStcIksrXCI7XHJcbiAgfSBlbHNlIHJldHVybiBoaXQudG9TdHJpbmcoKTtcclxufVxyXG52YXIgdHJpbVRleHQ9ZnVuY3Rpb24odGV4dCxvcHRzKSB7XHJcbiAgICBpZiAob3B0cy5tYXhpdGVtbGVuZ3RoICYmIHRleHQubGVuZ3RoPm9wdHMubWF4aXRlbWxlbmd0aCkge1xyXG4gICAgICB2YXIgc3RvcEF0PW9wdHMuc3RvcEF0fHxcIlwiO1xyXG4gICAgICBpZiAoc3RvcEF0KSB7XHJcbiAgICAgICAgdmFyIGF0PW9wdHMubWF4aXRlbWxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoYXQ+MTApIHtcclxuICAgICAgICAgIGlmICh0ZXh0LmNoYXJBdChhdCk9PXN0b3BBdCkgcmV0dXJuIHRleHQuc3Vic3RyKDAsYXQpK1wiLi4uXCI7XHJcbiAgICAgICAgICBhdC0tO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGV4dC5zdWJzdHIoMCxvcHRzLm1heGl0ZW1sZW5ndGgpK1wiLi4uXCI7XHJcbiAgICAgIH1cclxuICAgIH0gXHJcbiAgICByZXR1cm4gdGV4dDtcclxufVxyXG52YXIgcmVuZGVyRGVwdGg9ZnVuY3Rpb24oZGVwdGgsb3B0cyxub2RldHlwZSkge1xyXG4gIHZhciBvdXQ9W107XHJcbiAgaWYgKG9wdHMudG9jc3R5bGU9PVwidmVydGljYWxfbGluZVwiKSB7XHJcbiAgICBmb3IgKHZhciBpPTA7aTxkZXB0aDtpKyspIHtcclxuICAgICAgaWYgKGk9PWRlcHRoLTEpIHtcclxuICAgICAgICBvdXQucHVzaChFKFwiaW1nXCIsIHtzcmM6IG9wdHMudG9jYmFyX3N0YXJ0fSkpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG91dC5wdXNoKEUoXCJpbWdcIiwge3NyYzogb3B0cy50b2NiYXJ9KSk7ICBcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG91dDsgICAgXHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChkZXB0aCkgcmV0dXJuIEUoXCJzcGFuXCIsIG51bGwsIGRlcHRoLCBcIi5cIilcclxuICAgIGVsc2UgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG4gIHJldHVybiBudWxsO1xyXG59O1xyXG5cclxudmFyIEFuY2VzdG9ycz1SZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgZ29iYWNrOmZ1bmN0aW9uKGUpIHtcclxuICAgIHZhciBuPWUudGFyZ2V0LmRhdGFzZXRbXCJuXCJdOyAgXHJcbiAgICBpZiAodHlwZW9mIG49PVwidW5kZWZpbmVkXCIpIG49ZS50YXJnZXQucGFyZW50Tm9kZS5kYXRhc2V0W1wiblwiXTtcclxuICAgIHRoaXMucHJvcHMuc2V0Q3VycmVudChuKTsgXHJcbiAgfSxcclxuICBzaG93RXhjZXJwdDpmdW5jdGlvbihlKSB7XHJcbiAgICB2YXIgbj1wYXJzZUludChlLnRhcmdldC5wYXJlbnROb2RlLmRhdGFzZXRbXCJuXCJdKTtcclxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzLnByb3BzLnNob3dFeGNlcnB0KG4pO1xyXG4gIH0sIFxyXG4gIHNob3dIaXQ6ZnVuY3Rpb24oaGl0KSB7XHJcbiAgICBpZiAoaGl0KSAgcmV0dXJuIEUoXCJhXCIsIHtocmVmOiBcIiNcIiwgb25DbGljazogdGhpcy5zaG93RXhjZXJwdCwgY2xhc3NOYW1lOiBcInB1bGwtcmlnaHQgYmFkZ2UgaGl0YmFkZ2VcIn0sIHRyaW1IaXQoaGl0KSlcclxuICAgIGVsc2UgcmV0dXJuIEUoXCJzcGFuXCIsIG51bGwpO1xyXG4gIH0sXHJcbiAgcmVuZGVyQW5jZXN0b3I6ZnVuY3Rpb24obixpZHgpIHtcclxuICAgIHZhciBoaXQ9dGhpcy5wcm9wcy50b2Nbbl0uaGl0O1xyXG4gICAgdmFyIHRleHQ9dGhpcy5wcm9wcy50b2Nbbl0udGV4dC50cmltKCk7XHJcbiAgICB0ZXh0PXRyaW1UZXh0KHRleHQsdGhpcy5wcm9wcy5vcHRzKTtcclxuICAgIGlmICh0aGlzLnByb3BzLnRleHRDb252ZXJ0ZXIpIHRleHQ9dGhpcy5wcm9wcy50ZXh0Q29udmVydGVyKHRleHQpO1xyXG4gICAgcmV0dXJuIEUoXCJkaXZcIiwge2tleTogXCJhXCIrbiwgY2xhc3NOYW1lOiBcIm5vZGUgcGFyZW50XCIsIFwiZGF0YS1uXCI6IG4sIG9uQ2xpY2s6IHRoaXMuZ29iYWNrfSwgcmVuZGVyRGVwdGgoaWR4LHRoaXMucHJvcHMub3B0cyxcImFuY2VzdG9yXCIpLFxyXG4gICAgICAgICAgICAgIEUoXCJhXCIsIHtjbGFzc05hbWU6IFwidGV4dFwiLCBocmVmOiBcIiNcIn0sIHRleHQpLCB0aGlzLnNob3dIaXQoaGl0KSlcclxuICB9LFxyXG4gIHJlbmRlcjpmdW5jdGlvbigpIHtcclxuICAgIGlmICghdGhpcy5wcm9wcy5kYXRhIHx8ICF0aGlzLnByb3BzLmRhdGEubGVuZ3RoKSByZXR1cm4gRShcImRpdlwiLG51bGwpO1xyXG4gICAgcmV0dXJuIEUoXCJkaXZcIiwgbnVsbCwgdGhpcy5wcm9wcy5kYXRhLm1hcCh0aGlzLnJlbmRlckFuY2VzdG9yKSlcclxuICB9IFxyXG59KTsgXHJcbnZhciBDaGlsZHJlbj1SZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgZ2V0SW5pdGlhbFN0YXRlOmZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtzZWxlY3RlZDowfTtcclxuICB9LFxyXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTpmdW5jdGlvbihuZXh0UHJvcHMsbmV4dFN0YXRlKSB7XHJcbiAgICBpZiAobmV4dFByb3BzLmRhdGEuam9pbigpIT10aGlzLnByb3BzLmRhdGEuam9pbigpICkge1xyXG4gICAgICBuZXh0U3RhdGUuc2VsZWN0ZWQ9cGFyc2VJbnQobmV4dFByb3BzLmRhdGFbMF0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSxcclxuICBvcGVuOmZ1bmN0aW9uKGUpIHtcclxuICAgIHZhciBuPWUudGFyZ2V0LnBhcmVudE5vZGUuZGF0YXNldFtcIm5cIl07XHJcbiAgICBpZiAodHlwZW9mIG4hPT1cInVuZGVmaW5lZFwiKSB0aGlzLnByb3BzLnNldEN1cnJlbnQocGFyc2VJbnQobikpO1xyXG4gIH0sIFxyXG4gIHNob3dIaXQ6ZnVuY3Rpb24oaGl0KSB7XHJcbiAgICBpZiAoaGl0KSAgcmV0dXJuIEUoXCJhXCIsIHtocmVmOiBcIiNcIiwgb25DbGljazogdGhpcy5zaG93RXhjZXJwdCwgXHJcbiAgICAgIGNsYXNzTmFtZTogXCJwdWxsLXJpZ2h0IGJhZGdlIGhpdGJhZGdlXCJ9LCB0cmltSGl0KGhpdCkpXHJcbiAgICBlbHNlIHJldHVybiBFKFwic3BhblwiLG51bGwpO1xyXG4gIH0sXHJcbiAgc2hvd0V4Y2VycHQ6ZnVuY3Rpb24oZSkge1xyXG4gICAgdmFyIG49cGFyc2VJbnQoZS50YXJnZXQucGFyZW50Tm9kZS5kYXRhc2V0W1wiblwiXSk7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdGhpcy5wcm9wcy5oaXRDbGljayhuKTtcclxuICB9LCBcclxuICBub2RlQ2xpY2tlZDpmdW5jdGlvbihlKSB7XHJcbiAgICB2YXIgdGFyZ2V0PWUudGFyZ2V0O1xyXG4gICAgd2hpbGUgKHRhcmdldCAmJiB0eXBlb2YgdGFyZ2V0LmRhdGFzZXQubj09XCJ1bmRlZmluZWRcIil0YXJnZXQ9dGFyZ2V0LnBhcmVudE5vZGU7XHJcbiAgICBpZiAoIXRhcmdldCkgcmV0dXJuO1xyXG4gICAgdmFyIG49cGFyc2VJbnQodGFyZ2V0LmRhdGFzZXQubik7XHJcbiAgICB2YXIgY2hpbGQ9dGhpcy5wcm9wcy50b2Nbbl07XHJcbiAgICBpZiAodGhpcy5wcm9wcy5zaG93VGV4dE9uTGVhZk5vZGVPbmx5KSB7XHJcbiAgICAgIGlmIChjaGlsZC5oYXNDaGlsZCkge1xyXG4gICAgICAgIHRoaXMub3BlbihlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnNob3dUZXh0KGUpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAobj09dGhpcy5zdGF0ZS5zZWxlY3RlZCkge1xyXG4gICAgICAgIGlmIChjaGlsZC5oYXNDaGlsZCkgdGhpcy5vcGVuKGUpO1xyXG4gICAgICAgIGVsc2UgdGhpcy5zaG93VGV4dChlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnNob3dUZXh0KGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZDpufSk7XHJcbiAgfSxcclxuICByZW5kZXJDaGlsZDpmdW5jdGlvbihuKSB7XHJcbiAgICB2YXIgY2hpbGQ9dGhpcy5wcm9wcy50b2Nbbl07XHJcbiAgICB2YXIgaGl0PXRoaXMucHJvcHMudG9jW25dLmhpdDtcclxuICAgIHZhciBjbGFzc2VzPVwibm9kZSBjaGlsZFwiLGhhc2NoaWxkPWZhbHNlOyAgXHJcbiAgICAvL2lmIChjaGlsZC5leHRyYSkgZXh0cmE9XCI8ZXh0cmE+XCIrY2hpbGQuZXh0cmErXCI8L2V4dHJhPlwiO1xyXG4gICAgaWYgKCFjaGlsZC5oYXNDaGlsZCkgY2xhc3Nlcys9XCIgbm9jaGlsZFwiO1xyXG4gICAgZWxzZSBoYXNjaGlsZD10cnVlO1xyXG4gICAgdmFyIHNlbGVjdGVkPXRoaXMuc3RhdGUuc2VsZWN0ZWQ7XHJcbiAgICBpZiAodGhpcy5wcm9wcy5zaG93VGV4dE9uTGVhZk5vZGVPbmx5KSB7XHJcbiAgICAgIHNlbGVjdGVkPW47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNsYXNzZXM9XCJidG4gYnRuLWxpbmtcIjtcclxuICAgIGlmIChuPT1zZWxlY3RlZCkge1xyXG4gICAgICBpZiAoaGFzY2hpbGQpIGNsYXNzZXM9XCJidG4gYnRuLWRlZmF1bHQgZXhwYW5kYWJsZVwiO1xyXG4gICAgICBlbHNlIGNsYXNzZXM9XCJidG4gYnRuLWxpbmsgbGluay1zZWxlY3RlZFwiO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0ZXh0PXRoaXMucHJvcHMudG9jW25dLnRleHQudHJpbSgpO1xyXG4gICAgdmFyIGRlcHRoPXRoaXMucHJvcHMudG9jW25dLmRlcHRoO1xyXG4gICAgdGV4dD10cmltVGV4dCh0ZXh0LHRoaXMucHJvcHMub3B0cylcclxuICAgIGlmICh0aGlzLnByb3BzLnRleHRDb252ZXJ0ZXIpIHRleHQ9dGhpcy5wcm9wcy50ZXh0Q29udmVydGVyKHRleHQpO1xyXG4gICAgcmV0dXJuIEUoXCJkaXZcIiwge2tleTogXCJjaGlsZFwiK24sIFwiZGF0YS1uXCI6IG59LCByZW5kZXJEZXB0aChkZXB0aCx0aGlzLnByb3BzLm9wdHMsXCJjaGlsZFwiKSwgXHJcbiAgICAgICAgICAgRShcImFcIiwge1wiZGF0YS1uXCI6IG4sIGNsYXNzTmFtZTogY2xhc3NlcyArXCIgdG9jaXRlbSB0ZXh0XCIsIG9uQ2xpY2s6IHRoaXMubm9kZUNsaWNrZWR9LCB0ZXh0K1wiIFwiKSwgdGhpcy5zaG93SGl0KGhpdClcclxuICAgICAgICAgICApXHJcbiAgfSxcclxuICBzaG93VGV4dDpmdW5jdGlvbihlKSB7IFxyXG4gICAgdmFyIHRhcmdldD1lLnRhcmdldDtcclxuICAgIHZhciBuPWUudGFyZ2V0LmRhdGFzZXQubjtcclxuICAgIHdoaWxlICh0YXJnZXQgJiYgdHlwZW9mIHRhcmdldC5kYXRhc2V0Lm49PVwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGFyZ2V0PXRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgfVxyXG4gICAgaWYgKHRhcmdldCAmJiB0YXJnZXQuZGF0YXNldC5uICYmIHRoaXMucHJvcHMuc2hvd1RleHQpIHtcclxuICAgICAgdGhpcy5wcm9wcy5zaG93VGV4dChwYXJzZUludCh0YXJnZXQuZGF0YXNldC5uKSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICByZW5kZXI6ZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAoIXRoaXMucHJvcHMuZGF0YSB8fCAhdGhpcy5wcm9wcy5kYXRhLmxlbmd0aCkgcmV0dXJuIEUoXCJkaXZcIiwgbnVsbCk7XHJcbiAgICByZXR1cm4gRShcImRpdlwiLCBudWxsLCB0aGlzLnByb3BzLmRhdGEubWFwKHRoaXMucmVuZGVyQ2hpbGQpKVxyXG4gIH1cclxufSk7IFxyXG5cclxudmFyIHN0YWNrdG9jID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge2JhcjogXCJ3b3JsZFwiLHRvY1JlYWR5OmZhbHNlLGN1cjp0aGlzLnByb3BzLmN1cnJlbnR8MH07Ly80MDNcclxuICB9LFxyXG4gIGJ1aWxkdG9jOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHRvYz10aGlzLnByb3BzLmRhdGE7XHJcbiAgICAgIGlmICghdG9jIHx8ICF0b2MubGVuZ3RoKSByZXR1cm47ICBcclxuICAgICAgdmFyIGRlcHRocz1bXTtcclxuICAgICAgdmFyIHByZXY9MDtcclxuICAgICAgZm9yICh2YXIgaT0wO2k8dG9jLmxlbmd0aDtpKyspIHtcclxuICAgICAgICB2YXIgZGVwdGg9dG9jW2ldLmRlcHRoO1xyXG4gICAgICAgIGlmIChwcmV2PmRlcHRoKSB7IC8vbGluayB0byBwcmV2IHNpYmxpbmdcclxuICAgICAgICAgIGlmIChkZXB0aHNbZGVwdGhdKSB0b2NbZGVwdGhzW2RlcHRoXV0ubmV4dCA9IGk7XHJcbiAgICAgICAgICBmb3IgKHZhciBqPWRlcHRoO2o8cHJldjtqKyspIGRlcHRoc1tqXT0wO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaTx0b2MubGVuZ3RoLTEgJiYgdG9jW2krMV0uZGVwdGg+ZGVwdGgpIHtcclxuICAgICAgICAgIHRvY1tpXS5oYXNDaGlsZD10cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkZXB0aHNbZGVwdGhdPWk7XHJcbiAgICAgICAgcHJldj1kZXB0aDtcclxuICAgICAgfSBcclxuICB9LCBcclxuXHJcbiAgcmVidWlsZFRvYzpmdW5jdGlvbigpIHtcclxuICAgIGlmICghdGhpcy5zdGF0ZS50b2NSZWFkeSAmJiB0aGlzLnByb3BzLmRhdGEgJiYgdGhpcy5wcm9wcy5kYXRhLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLmJ1aWxkdG9jKCk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3RvY1JlYWR5OnRydWV9KTtcclxuICAgIH1cclxuICB9LFxyXG4gIGNvbXBvbmVudERpZE1vdW50OmZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5yZWJ1aWxkVG9jKCk7XHJcbiAgfSxcclxuICBjb21wb25lbnREaWRVcGRhdGU6ZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnJlYnVpbGRUb2MoKTtcclxuICB9LCAgIFxyXG4gIHNldEN1cnJlbnQ6ZnVuY3Rpb24obikge1xyXG4gICAgbj1wYXJzZUludChuKTtcclxuICAgIHRoaXMuc2V0U3RhdGUoe2N1cjpufSk7XHJcbiAgICB2YXIgY2hpbGQ9dGhpcy5wcm9wcy5kYXRhW25dO1xyXG4gICAgaWYgKCEoY2hpbGQuaGFzQ2hpbGQgJiYgdGhpcy5wcm9wcy5zaG93VGV4dE9uTGVhZk5vZGVPbmx5KSkge1xyXG5cdFx0ICBpZiAodGhpcy5wcm9wcy5zaG93VGV4dCkgIHRoaXMucHJvcHMuc2hvd1RleHQobik7XHJcbiAgICB9XHJcbiAgfSxcclxuICBmaW5kQnlWb2ZmOmZ1bmN0aW9uKHZvZmYpIHtcclxuICAgIGZvciAodmFyIGk9MDtpPHRoaXMucHJvcHMuZGF0YS5sZW5ndGg7aSsrKSB7XHJcbiAgICAgIHZhciB0PXRoaXMucHJvcHMuZGF0YVtpXTtcclxuICAgICAgaWYgKHQudm9mZj52b2ZmKSByZXR1cm4gaS0xO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDA7IC8vcmV0dXJuIHJvb3Qgbm9kZVxyXG4gIH0sXHJcbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOmZ1bmN0aW9uKG5leHRQcm9wcyxuZXh0U3RhdGUpIHtcclxuICAgIGlmIChuZXh0UHJvcHMuZ29Wb2ZmJiZuZXh0UHJvcHMuZ29Wb2ZmICE9dGhpcy5wcm9wcy5nb1ZvZmYpIHtcclxuICAgICAgbmV4dFN0YXRlLmN1cj10aGlzLmZpbmRCeVZvZmYobmV4dFByb3BzLmdvVm9mZik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9LFxyXG4gIGZpbGxIaXQ6ZnVuY3Rpb24obm9kZUlkcykge1xyXG4gICAgaWYgKHR5cGVvZiBub2RlSWRzPT1cInVuZGVmaW5lZFwiKSByZXR1cm47XHJcbiAgICBpZiAodHlwZW9mIG5vZGVJZHM9PVwibnVtYmVyXCIpIG5vZGVJZHM9W25vZGVJZHNdO1xyXG4gICAgdmFyIHRvYz10aGlzLnByb3BzLmRhdGE7XHJcbiAgICB2YXIgaGl0cz10aGlzLnByb3BzLmhpdHM7XHJcbiAgICBpZiAodG9jLmxlbmd0aDwyKSByZXR1cm47XHJcbiAgICB2YXIgZ2V0UmFuZ2U9ZnVuY3Rpb24obikge1xyXG4gICAgICBpZiAobisxPj10b2MubGVuZ3RoKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcImV4Y2VlZCB0b2MgbGVuZ3RoXCIsbik7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBkZXB0aD10b2Nbbl0uZGVwdGggLCBuZXh0ZGVwdGg9dG9jW24rMV0uZGVwdGg7XHJcbiAgICAgIGlmIChuPT10b2MubGVuZ3RoLTEgfHwgbj09MCkge1xyXG4gICAgICAgICAgdG9jW25dLmVuZD1NYXRoLnBvdygyLCA0OCk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgIH0gZWxzZSAgaWYgKG5leHRkZXB0aD5kZXB0aCl7XHJcbiAgICAgICAgaWYgKHRvY1tuXS5uZXh0KSB7XHJcbiAgICAgICAgICB0b2Nbbl0uZW5kPSB0b2NbdG9jW25dLm5leHRdLnZvZmY7ICBcclxuICAgICAgICB9IGVsc2UgeyAvL2xhc3Qgc2libGluZ1xyXG4gICAgICAgICAgdmFyIG5leHQ9bisxO1xyXG4gICAgICAgICAgd2hpbGUgKG5leHQ8dG9jLmxlbmd0aCAmJiB0b2NbbmV4dF0uZGVwdGg+ZGVwdGgpIG5leHQrKztcclxuICAgICAgICAgIGlmIChuZXh0PT10b2MubGVuZ3RoKSB0b2Nbbl0uZW5kPU1hdGgucG93KDIsNDgpO1xyXG4gICAgICAgICAgZWxzZSB0b2Nbbl0uZW5kPXRvY1tuZXh0XS52b2ZmO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHsgLy9zYW1lIGxldmVsIG9yIGVuZCBvZiBzaWJsaW5nXHJcbiAgICAgICAgdG9jW25dLmVuZD10b2NbbisxXS52b2ZmO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgZ2V0SGl0PWZ1bmN0aW9uKG4pIHtcclxuICAgICAgdmFyIHN0YXJ0PXRvY1tuXS52b2ZmO1xyXG4gICAgICB2YXIgZW5kPXRvY1tuXS5lbmQ7XHJcbiAgICAgIGlmIChuPT0wKSB7XHJcbiAgICAgICAgdG9jWzBdLmhpdD1oaXRzLmxlbmd0aDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgaGl0PTA7XHJcbiAgICAgICAgZm9yICh2YXIgaT0wO2k8aGl0cy5sZW5ndGg7aSsrKSB7XHJcbiAgICAgICAgICBpZiAoaGl0c1tpXT49c3RhcnQgJiYgaGl0c1tpXTxlbmQpIGhpdCsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0b2Nbbl0uaGl0PWhpdDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgbm9kZUlkcy5mb3JFYWNoKGZ1bmN0aW9uKG4pe2dldFJhbmdlKG4pfSk7XHJcbiAgICBub2RlSWRzLmZvckVhY2goZnVuY3Rpb24obil7Z2V0SGl0KG4pfSk7XHJcbiAgfSxcclxuICBmaWxsSGl0czpmdW5jdGlvbihhbmNlc3RvcnMsY2hpbGRyZW4pIHtcclxuICAgICAgdGhpcy5maWxsSGl0KGFuY2VzdG9ycyk7XHJcbiAgICAgIHRoaXMuZmlsbEhpdChjaGlsZHJlbik7XHJcbiAgICAgIHRoaXMuZmlsbEhpdCh0aGlzLnN0YXRlLmN1cik7XHJcbiAgfSxcclxuICBoaXRDbGljazpmdW5jdGlvbihuKSB7XHJcbiAgICBpZiAodGhpcy5wcm9wcy5zaG93RXhjZXJwdCkgIHRoaXMucHJvcHMuc2hvd0V4Y2VycHQobik7XHJcbiAgfSxcclxuICBvbkhpdENsaWNrOmZ1bmN0aW9uKGUpIHtcclxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzLmhpdENsaWNrKHRoaXMuc3RhdGUuY3VyKTtcclxuICB9LFxyXG4gIHNob3dIaXQ6ZnVuY3Rpb24oaGl0KSB7XHJcbiAgICBpZiAoaGl0KSAgcmV0dXJuIEUoXCJhXCIsIHtocmVmOiBcIiNcIiwgb25DbGljazogdGhpcy5vbkhpdENsaWNrLCBjbGFzc05hbWU6IFwicHVsbC1yaWdodCBiYWRnZSBoaXRiYWRnZVwifSwgdHJpbUhpdChoaXQpKVxyXG4gICAgZWxzZSByZXR1cm4gRShcInNwYW5cIixudWxsKTtcclxuICB9LFxyXG4gIHNob3dUZXh0OmZ1bmN0aW9uKGUpIHtcclxuICAgIHZhciB0YXJnZXQ9ZS50YXJnZXQ7XHJcbiAgICB2YXIgbj1lLnRhcmdldC5kYXRhc2V0Lm47XHJcbiAgICB3aGlsZSAodGFyZ2V0ICYmIHR5cGVvZiB0YXJnZXQuZGF0YXNldC5uPT1cInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRhcmdldD10YXJnZXQucGFyZW50Tm9kZTtcclxuICAgIH1cclxuICAgIGlmICh0YXJnZXQgJiYgdGFyZ2V0LmRhdGFzZXQubiAmJiB0aGlzLnByb3BzLnNob3dUZXh0KSB7XHJcbiAgICAgIHRoaXMucHJvcHMuc2hvd1RleHQocGFyc2VJbnQodGFyZ2V0LmRhdGFzZXQubikpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIGlmICghdGhpcy5wcm9wcy5kYXRhIHx8ICF0aGlzLnByb3BzLmRhdGEubGVuZ3RoKSByZXR1cm4gRShcImRpdlwiLG51bGwpO1xyXG4gICAgdmFyIGRlcHRoPXRoaXMucHJvcHMuZGF0YVt0aGlzLnN0YXRlLmN1cl0uZGVwdGgrMTtcclxuICAgIHZhciBhbmNlc3RvcnM9ZW51bUFuY2VzdG9ycyh0aGlzLnByb3BzLmRhdGEsdGhpcy5zdGF0ZS5jdXIpO1xyXG4gICAgdmFyIGNoaWxkcmVuPWVudW1DaGlsZHJlbih0aGlzLnByb3BzLmRhdGEsdGhpcy5zdGF0ZS5jdXIpO1xyXG4gICAgdmFyIG9wdHM9dGhpcy5wcm9wcy5vcHRzfHx7fTtcclxuICAgIHZhciBjdXJyZW50PXRoaXMucHJvcHMuZGF0YVt0aGlzLnN0YXRlLmN1cl07XHJcbiAgICBpZiAodGhpcy5wcm9wcy5oaXRzICYmIHRoaXMucHJvcHMuaGl0cy5sZW5ndGgpIHtcclxuICAgICAgdGhpcy5maWxsSGl0cyhhbmNlc3RvcnMsY2hpbGRyZW4pO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0ZXh0PWN1cnJlbnQudGV4dC50cmltKCk7XHJcbiAgICB0ZXh0PXRyaW1UZXh0KHRleHQsb3B0cyk7XHJcbiAgICBpZiAodGhpcy5wcm9wcy50ZXh0Q29udmVydGVyKSB0ZXh0PXRoaXMucHJvcHMudGV4dENvbnZlcnRlcih0ZXh0KTtcclxuICAgIHJldHVybiAoIFxyXG4gICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwic3RhY2t0b2NcIn0sIFxyXG4gICAgICAgIEUoQW5jZXN0b3JzLCB7b3B0czogb3B0cywgdGV4dENvbnZlcnRlcjogdGhpcy5wcm9wcy50ZXh0Q29udmVydGVyLCBzaG93RXhjZXJwdDogdGhpcy5oaXRDbGljaywgc2V0Q3VycmVudDogdGhpcy5zZXRDdXJyZW50LCB0b2M6IHRoaXMucHJvcHMuZGF0YSwgZGF0YTogYW5jZXN0b3JzfSksIFxyXG4gICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJub2RlIGN1cnJlbnRcIn0sIHJlbmRlckRlcHRoKGRlcHRoLTEsb3B0cyxcImN1cnJlbnRcIiksIEUoXCJhXCIsIHtocmVmOiBcIiNcIiwgb25DbGljazogdGhpcy5zaG93VGV4dCwgXCJkYXRhLW5cIjogdGhpcy5zdGF0ZS5jdXJ9LCBFKFwic3BhblwiLCB7Y2xhc3NOYW1lOiBcInRleHRcIn0sIHRleHQpKSwgdGhpcy5zaG93SGl0KGN1cnJlbnQuaGl0KSksIFxyXG4gICAgICAgIEUoQ2hpbGRyZW4sIHtvcHRzOiBvcHRzLCB0ZXh0Q29udmVydGVyOiB0aGlzLnByb3BzLnRleHRDb252ZXJ0ZXIsIHNob3dUZXh0T25MZWFmTm9kZU9ubHk6IHRoaXMucHJvcHMuc2hvd1RleHRPbkxlYWZOb2RlT25seSwgXHJcbiAgICAgICAgICAgICAgICAgIHNob3dUZXh0OiB0aGlzLnByb3BzLnNob3dUZXh0LCBoaXRDbGljazogdGhpcy5oaXRDbGljaywgc2V0Q3VycmVudDogdGhpcy5zZXRDdXJyZW50LCB0b2M6IHRoaXMucHJvcHMuZGF0YSwgZGF0YTogY2hpbGRyZW59KVxyXG4gICAgICApXHJcbiAgICApOyBcclxuICB9XHJcbn0pO1xyXG52YXIgZW51bUFuY2VzdG9ycz1mdW5jdGlvbih0b2MsY3VyKSB7XHJcbiAgICBpZiAoIXRvYyB8fCAhdG9jLmxlbmd0aCkgcmV0dXJuO1xyXG4gICAgaWYgKGN1cj09MCkgcmV0dXJuIFtdO1xyXG4gICAgdmFyIG49Y3VyLTE7XHJcbiAgICB2YXIgZGVwdGg9dG9jW2N1cl0uZGVwdGggLSAxO1xyXG4gICAgdmFyIHBhcmVudHM9W107XHJcbiAgICB3aGlsZSAobj49MCAmJiBkZXB0aD4wKSB7XHJcbiAgICAgIGlmICh0b2Nbbl0uZGVwdGg9PWRlcHRoKSB7XHJcbiAgICAgICAgcGFyZW50cy51bnNoaWZ0KG4pO1xyXG4gICAgICAgIGRlcHRoLS07XHJcbiAgICAgIH1cclxuICAgICAgbi0tO1xyXG4gICAgfVxyXG4gICAgcGFyZW50cy51bnNoaWZ0KDApOyAvL2ZpcnN0IGFuY2VzdG9yIGlzIHJvb3Qgbm9kZVxyXG4gICAgcmV0dXJuIHBhcmVudHM7XHJcbn1cclxuXHJcbnZhciBlbnVtQ2hpbGRyZW49ZnVuY3Rpb24odG9jLGN1cikge1xyXG4gICAgdmFyIGNoaWxkcmVuPVtdO1xyXG4gICAgaWYgKCF0b2MgfHwgIXRvYy5sZW5ndGggfHwgdG9jLmxlbmd0aD09MSkgcmV0dXJuIGNoaWxkcmVuO1xyXG5cclxuICAgIGlmICh0b2NbY3VyKzFdLmRlcHRoIT0gMSt0b2NbY3VyXS5kZXB0aCkgcmV0dXJuIGNoaWxkcmVuOyAgLy8gbm8gY2hpbGRyZW4gbm9kZVxyXG4gICAgdmFyIG49Y3VyKzE7XHJcbiAgICB2YXIgY2hpbGQ9dG9jW25dO1xyXG4gICAgd2hpbGUgKGNoaWxkKSB7XHJcbiAgICAgIGNoaWxkcmVuLnB1c2gobik7XHJcbiAgICAgIHZhciBuZXh0PXRvY1tuKzFdO1xyXG4gICAgICBpZiAoIW5leHQpIGJyZWFrO1xyXG4gICAgICBpZiAobmV4dC5kZXB0aD09Y2hpbGQuZGVwdGgpIHtcclxuICAgICAgICBuKys7XHJcbiAgICAgIH0gZWxzZSBpZiAobmV4dC5kZXB0aD5jaGlsZC5kZXB0aCkge1xyXG4gICAgICAgIG49Y2hpbGQubmV4dDtcclxuICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgICBpZiAobikgY2hpbGQ9dG9jW25dO2Vsc2UgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2hpbGRyZW47XHJcbn1cclxudmFyIGdlblRvYz1mdW5jdGlvbih0b2MsdGl0bGUpIHtcclxuICAgIHZhciBvdXQ9W3tkZXB0aDowLHRleHQ6dGl0bGV8fGtzYW5hLmpzLnRpdGxlfV07XHJcbiAgICBpZiAodG9jLnRleHRzKSBmb3IgKHZhciBpPTA7aTx0b2MudGV4dHMubGVuZ3RoO2krKykge1xyXG4gICAgICBvdXQucHVzaCh7dGV4dDp0b2MudGV4dHNbaV0sZGVwdGg6dG9jLmRlcHRoc1tpXSwgdm9mZjp0b2MudnBvc1tpXX0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG91dDsgXHJcbn1cclxubW9kdWxlLmV4cG9ydHM9e2NvbXBvbmVudDpzdGFja3RvYyxnZW5Ub2M6Z2VuVG9jLGVudW1DaGlsZHJlbjplbnVtQ2hpbGRyZW4sZW51bUFuY2VzdG9yczplbnVtQW5jZXN0b3JzfTtcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qXHJcbmNvbnZlcnQgdG8gcHVyZSBqc1xyXG5zYXZlIC1nIHJlYWN0aWZ5XHJcbiovXHJcbnZhciBFPVJlYWN0LmNyZWF0ZUVsZW1lbnQ7XHJcblxyXG52YXIgaGFza3NhbmFnYXA9KHR5cGVvZiBrc2FuYWdhcCE9XCJ1bmRlZmluZWRcIik7XHJcbmlmIChoYXNrc2FuYWdhcCAmJiAodHlwZW9mIGNvbnNvbGU9PVwidW5kZWZpbmVkXCIgfHwgdHlwZW9mIGNvbnNvbGUubG9nPT1cInVuZGVmaW5lZFwiKSkge1xyXG5cdFx0d2luZG93LmNvbnNvbGU9e2xvZzprc2FuYWdhcC5sb2csZXJyb3I6a3NhbmFnYXAuZXJyb3IsZGVidWc6a3NhbmFnYXAuZGVidWcsd2Fybjprc2FuYWdhcC53YXJufTtcclxuXHRcdGNvbnNvbGUubG9nKFwiaW5zdGFsbCBjb25zb2xlIG91dHB1dCBmdW5jaXRvblwiKTtcclxufVxyXG5cclxudmFyIGNoZWNrZnM9ZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIChuYXZpZ2F0b3IgJiYgbmF2aWdhdG9yLndlYmtpdFBlcnNpc3RlbnRTdG9yYWdlKSB8fCBoYXNrc2FuYWdhcDtcclxufVxyXG52YXIgZmVhdHVyZWNoZWNrcz17XHJcblx0XCJmc1wiOmNoZWNrZnNcclxufVxyXG52YXIgY2hlY2ticm93c2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG5cdGdldEluaXRpYWxTdGF0ZTpmdW5jdGlvbigpIHtcclxuXHJcblx0XHR2YXIgbWlzc2luZ0ZlYXR1cmVzPXRoaXMuZ2V0TWlzc2luZ0ZlYXR1cmVzKCk7XHJcblx0XHRyZXR1cm4ge3JlYWR5OmZhbHNlLCBtaXNzaW5nOm1pc3NpbmdGZWF0dXJlc307XHJcblx0fSxcclxuXHRnZXRNaXNzaW5nRmVhdHVyZXM6ZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgZmVhdHVyZT10aGlzLnByb3BzLmZlYXR1cmUuc3BsaXQoXCIsXCIpO1xyXG5cdFx0dmFyIHN0YXR1cz1bXTtcclxuXHRcdGZlYXR1cmUubWFwKGZ1bmN0aW9uKGYpe1xyXG5cdFx0XHR2YXIgY2hlY2tlcj1mZWF0dXJlY2hlY2tzW2ZdO1xyXG5cdFx0XHRpZiAoY2hlY2tlcikgY2hlY2tlcj1jaGVja2VyKCk7XHJcblx0XHRcdHN0YXR1cy5wdXNoKFtmLGNoZWNrZXJdKTtcclxuXHRcdH0pO1xyXG5cdFx0cmV0dXJuIHN0YXR1cy5maWx0ZXIoZnVuY3Rpb24oZil7cmV0dXJuICFmWzFdfSk7XHJcblx0fSxcclxuXHRkb3dubG9hZGJyb3dzZXI6ZnVuY3Rpb24oKSB7XHJcblx0XHR3aW5kb3cubG9jYXRpb249XCJodHRwczovL3d3dy5nb29nbGUuY29tL2Nocm9tZS9cIlxyXG5cdH0sXHJcblx0cmVuZGVyTWlzc2luZzpmdW5jdGlvbigpIHtcclxuXHRcdHZhciBzaG93TWlzc2luZz1mdW5jdGlvbihtKSB7XHJcblx0XHRcdHJldHVybiBFKFwiZGl2XCIsIG51bGwsIG0pO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIChcclxuXHRcdCBFKFwiZGl2XCIsIHtyZWY6IFwiZGlhbG9nMVwiLCBjbGFzc05hbWU6IFwibW9kYWwgZmFkZVwiLCBcImRhdGEtYmFja2Ryb3BcIjogXCJzdGF0aWNcIn0sIFxyXG5cdFx0ICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1kaWFsb2dcIn0sIFxyXG5cdFx0ICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWNvbnRlbnRcIn0sIFxyXG5cdFx0ICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtaGVhZGVyXCJ9LCBcclxuXHRcdCAgICAgICAgICBFKFwiYnV0dG9uXCIsIHt0eXBlOiBcImJ1dHRvblwiLCBjbGFzc05hbWU6IFwiY2xvc2VcIiwgXCJkYXRhLWRpc21pc3NcIjogXCJtb2RhbFwiLCBcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwifSwgXCLDl1wiKSwgXHJcblx0XHQgICAgICAgICAgRShcImg0XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtdGl0bGVcIn0sIFwiQnJvd3NlciBDaGVja1wiKVxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWJvZHlcIn0sIFxyXG5cdFx0ICAgICAgICAgIEUoXCJwXCIsIG51bGwsIFwiU29ycnkgYnV0IHRoZSBmb2xsb3dpbmcgZmVhdHVyZSBpcyBtaXNzaW5nXCIpLCBcclxuXHRcdCAgICAgICAgICB0aGlzLnN0YXRlLm1pc3NpbmcubWFwKHNob3dNaXNzaW5nKVxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWZvb3RlclwifSwgXHJcblx0XHQgICAgICAgICAgRShcImJ1dHRvblwiLCB7b25DbGljazogdGhpcy5kb3dubG9hZGJyb3dzZXIsIHR5cGU6IFwiYnV0dG9uXCIsIGNsYXNzTmFtZTogXCJidG4gYnRuLXByaW1hcnlcIn0sIFwiRG93bmxvYWQgR29vZ2xlIENocm9tZVwiKVxyXG5cdFx0ICAgICAgICApXHJcblx0XHQgICAgICApXHJcblx0XHQgICAgKVxyXG5cdFx0ICApXHJcblx0XHQgKTtcclxuXHR9LFxyXG5cdHJlbmRlclJlYWR5OmZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIEUoXCJzcGFuXCIsIG51bGwsIFwiYnJvd3NlciBva1wiKVxyXG5cdH0sXHJcblx0cmVuZGVyOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gICh0aGlzLnN0YXRlLm1pc3NpbmcubGVuZ3RoKT90aGlzLnJlbmRlck1pc3NpbmcoKTp0aGlzLnJlbmRlclJlYWR5KCk7XHJcblx0fSxcclxuXHRjb21wb25lbnREaWRNb3VudDpmdW5jdGlvbigpIHtcclxuXHRcdGlmICghdGhpcy5zdGF0ZS5taXNzaW5nLmxlbmd0aCkge1xyXG5cdFx0XHR0aGlzLnByb3BzLm9uUmVhZHkoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdCQodGhpcy5yZWZzLmRpYWxvZzEuZ2V0RE9NTm9kZSgpKS5tb2RhbCgnc2hvdycpO1xyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1jaGVja2Jyb3dzZXI7IiwiXHJcbnZhciB1c2VyQ2FuY2VsPWZhbHNlO1xyXG52YXIgZmlsZXM9W107XHJcbnZhciB0b3RhbERvd25sb2FkQnl0ZT0wO1xyXG52YXIgdGFyZ2V0UGF0aD1cIlwiO1xyXG52YXIgdGVtcFBhdGg9XCJcIjtcclxudmFyIG5maWxlPTA7XHJcbnZhciBiYXNldXJsPVwiXCI7XHJcbnZhciByZXN1bHQ9XCJcIjtcclxudmFyIGRvd25sb2FkaW5nPWZhbHNlO1xyXG52YXIgc3RhcnREb3dubG9hZD1mdW5jdGlvbihkYmlkLF9iYXNldXJsLF9maWxlcykgeyAvL3JldHVybiBkb3dubG9hZCBpZFxyXG5cdHZhciBmcyAgICAgPSByZXF1aXJlKFwiZnNcIik7XHJcblx0dmFyIHBhdGggICA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG5cclxuXHRcclxuXHRmaWxlcz1fZmlsZXMuc3BsaXQoXCJcXHVmZmZmXCIpO1xyXG5cdGlmIChkb3dubG9hZGluZykgcmV0dXJuIGZhbHNlOyAvL29ubHkgb25lIHNlc3Npb25cclxuXHR1c2VyQ2FuY2VsPWZhbHNlO1xyXG5cdHRvdGFsRG93bmxvYWRCeXRlPTA7XHJcblx0bmV4dEZpbGUoKTtcclxuXHRkb3dubG9hZGluZz10cnVlO1xyXG5cdGJhc2V1cmw9X2Jhc2V1cmw7XHJcblx0aWYgKGJhc2V1cmxbYmFzZXVybC5sZW5ndGgtMV0hPScvJyliYXNldXJsKz0nLyc7XHJcblx0dGFyZ2V0UGF0aD1rc2FuYWdhcC5yb290UGF0aCtkYmlkKycvJztcclxuXHR0ZW1wUGF0aD1rc2FuYWdhcC5yb290UGF0aCtcIi50bXAvXCI7XHJcblx0cmVzdWx0PVwiXCI7XHJcblx0cmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbnZhciBuZXh0RmlsZT1mdW5jdGlvbigpIHtcclxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRpZiAobmZpbGU9PWZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRuZmlsZSsrO1xyXG5cdFx0XHRlbmREb3dubG9hZCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0ZG93bmxvYWRGaWxlKG5maWxlKyspO1x0XHJcblx0XHR9XHJcblx0fSwxMDApO1xyXG59XHJcblxyXG52YXIgZG93bmxvYWRGaWxlPWZ1bmN0aW9uKG5maWxlKSB7XHJcblx0dmFyIHVybD1iYXNldXJsK2ZpbGVzW25maWxlXTtcclxuXHR2YXIgdG1wZmlsZW5hbWU9dGVtcFBhdGgrZmlsZXNbbmZpbGVdO1xyXG5cdHZhciBta2RpcnAgPSByZXF1aXJlKFwiLi9ta2RpcnBcIik7XHJcblx0dmFyIGZzICAgICA9IHJlcXVpcmUoXCJmc1wiKTtcclxuXHR2YXIgaHR0cCAgID0gcmVxdWlyZShcImh0dHBcIik7XHJcblxyXG5cdG1rZGlycC5zeW5jKHBhdGguZGlybmFtZSh0bXBmaWxlbmFtZSkpO1xyXG5cdHZhciB3cml0ZVN0cmVhbSA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKHRtcGZpbGVuYW1lKTtcclxuXHR2YXIgZGF0YWxlbmd0aD0wO1xyXG5cdHZhciByZXF1ZXN0ID0gaHR0cC5nZXQodXJsLCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG5cdFx0cmVzcG9uc2Uub24oJ2RhdGEnLGZ1bmN0aW9uKGNodW5rKXtcclxuXHRcdFx0d3JpdGVTdHJlYW0ud3JpdGUoY2h1bmspO1xyXG5cdFx0XHR0b3RhbERvd25sb2FkQnl0ZSs9Y2h1bmsubGVuZ3RoO1xyXG5cdFx0XHRpZiAodXNlckNhbmNlbCkge1xyXG5cdFx0XHRcdHdyaXRlU3RyZWFtLmVuZCgpO1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtuZXh0RmlsZSgpO30sMTAwKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0XHRyZXNwb25zZS5vbihcImVuZFwiLGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR3cml0ZVN0cmVhbS5lbmQoKTtcclxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe25leHRGaWxlKCk7fSwxMDApO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcbn1cclxuXHJcbnZhciBjYW5jZWxEb3dubG9hZD1mdW5jdGlvbigpIHtcclxuXHR1c2VyQ2FuY2VsPXRydWU7XHJcblx0ZW5kRG93bmxvYWQoKTtcclxufVxyXG52YXIgdmVyaWZ5PWZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiB0cnVlO1xyXG59XHJcbnZhciBlbmREb3dubG9hZD1mdW5jdGlvbigpIHtcclxuXHRuZmlsZT1maWxlcy5sZW5ndGgrMTsvL3N0b3BcclxuXHRyZXN1bHQ9XCJjYW5jZWxsZWRcIjtcclxuXHRkb3dubG9hZGluZz1mYWxzZTtcclxuXHRpZiAodXNlckNhbmNlbCkgcmV0dXJuO1xyXG5cdHZhciBmcyAgICAgPSByZXF1aXJlKFwiZnNcIik7XHJcblx0dmFyIG1rZGlycCA9IHJlcXVpcmUoXCIuL21rZGlycFwiKTtcclxuXHJcblx0Zm9yICh2YXIgaT0wO2k8ZmlsZXMubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIHRhcmdldGZpbGVuYW1lPXRhcmdldFBhdGgrZmlsZXNbaV07XHJcblx0XHR2YXIgdG1wZmlsZW5hbWUgICA9dGVtcFBhdGgrZmlsZXNbaV07XHJcblx0XHRta2RpcnAuc3luYyhwYXRoLmRpcm5hbWUodGFyZ2V0ZmlsZW5hbWUpKTtcclxuXHRcdGZzLnJlbmFtZVN5bmModG1wZmlsZW5hbWUsdGFyZ2V0ZmlsZW5hbWUpO1xyXG5cdH1cclxuXHRpZiAodmVyaWZ5KCkpIHtcclxuXHRcdHJlc3VsdD1cInN1Y2Nlc3NcIjtcclxuXHR9IGVsc2Uge1xyXG5cdFx0cmVzdWx0PVwiZXJyb3JcIjtcclxuXHR9XHJcbn1cclxuXHJcbnZhciBkb3dubG9hZGVkQnl0ZT1mdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gdG90YWxEb3dubG9hZEJ5dGU7XHJcbn1cclxudmFyIGRvbmVEb3dubG9hZD1mdW5jdGlvbigpIHtcclxuXHRpZiAobmZpbGU+ZmlsZXMubGVuZ3RoKSByZXR1cm4gcmVzdWx0O1xyXG5cdGVsc2UgcmV0dXJuIFwiXCI7XHJcbn1cclxudmFyIGRvd25sb2FkaW5nRmlsZT1mdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gbmZpbGUtMTtcclxufVxyXG5cclxudmFyIGRvd25sb2FkZXI9e3N0YXJ0RG93bmxvYWQ6c3RhcnREb3dubG9hZCwgZG93bmxvYWRlZEJ5dGU6ZG93bmxvYWRlZEJ5dGUsXHJcblx0ZG93bmxvYWRpbmdGaWxlOmRvd25sb2FkaW5nRmlsZSwgY2FuY2VsRG93bmxvYWQ6Y2FuY2VsRG93bmxvYWQsZG9uZURvd25sb2FkOmRvbmVEb3dubG9hZH07XHJcbm1vZHVsZS5leHBvcnRzPWRvd25sb2FkZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblxyXG4vKiB0b2RvICwgb3B0aW9uYWwga2RiICovXHJcblxyXG52YXIgSHRtbEZTPXJlcXVpcmUoXCIuL2h0bWxmc1wiKTtcclxudmFyIGh0bWw1ZnM9cmVxdWlyZShcIi4vaHRtbDVmc1wiKTtcclxudmFyIENoZWNrQnJvd3Nlcj1yZXF1aXJlKFwiLi9jaGVja2Jyb3dzZXJcIik7XHJcbnZhciBFPVJlYWN0LmNyZWF0ZUVsZW1lbnQ7XHJcbiAgXHJcblxyXG52YXIgRmlsZUxpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcblx0Z2V0SW5pdGlhbFN0YXRlOmZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIHtkb3dubG9hZGluZzpmYWxzZSxwcm9ncmVzczowfTtcclxuXHR9LFxyXG5cdHVwZGF0YWJsZTpmdW5jdGlvbihmKSB7XHJcbiAgICAgICAgdmFyIGNsYXNzZXM9XCJidG4gYnRuLXdhcm5pbmdcIjtcclxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kb3dubG9hZGluZykgY2xhc3Nlcys9XCIgZGlzYWJsZWRcIjtcclxuXHRcdGlmIChmLmhhc1VwZGF0ZSkgcmV0dXJuICAgRShcImJ1dHRvblwiLCB7Y2xhc3NOYW1lOiBjbGFzc2VzLCBcclxuXHRcdFx0XCJkYXRhLWZpbGVuYW1lXCI6IGYuZmlsZW5hbWUsIFwiZGF0YS11cmxcIjogZi51cmwsIFxyXG5cdCAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMuZG93bmxvYWRcclxuXHQgICAgICAgfSwgXCJVcGRhdGVcIilcclxuXHRcdGVsc2UgcmV0dXJuIG51bGw7XHJcblx0fSxcclxuXHRzaG93TG9jYWw6ZnVuY3Rpb24oZikge1xyXG4gICAgICAgIHZhciBjbGFzc2VzPVwiYnRuIGJ0bi1kYW5nZXJcIjtcclxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5kb3dubG9hZGluZykgY2xhc3Nlcys9XCIgZGlzYWJsZWRcIjtcclxuXHQgIHJldHVybiBFKFwidHJcIiwgbnVsbCwgRShcInRkXCIsIG51bGwsIGYuZmlsZW5hbWUpLCBcclxuXHQgICAgICBFKFwidGRcIiwgbnVsbCksIFxyXG5cdCAgICAgIEUoXCJ0ZFwiLCB7Y2xhc3NOYW1lOiBcInB1bGwtcmlnaHRcIn0sIFxyXG5cdCAgICAgIHRoaXMudXBkYXRhYmxlKGYpLCBFKFwiYnV0dG9uXCIsIHtjbGFzc05hbWU6IGNsYXNzZXMsIFxyXG5cdCAgICAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMuZGVsZXRlRmlsZSwgXCJkYXRhLWZpbGVuYW1lXCI6IGYuZmlsZW5hbWV9LCBcIkRlbGV0ZVwiKVxyXG5cdCAgICAgICAgXHJcblx0ICAgICAgKVxyXG5cdCAgKVxyXG5cdH0sICBcclxuXHRzaG93UmVtb3RlOmZ1bmN0aW9uKGYpIHsgXHJcblx0ICB2YXIgY2xhc3Nlcz1cImJ0biBidG4td2FybmluZ1wiO1xyXG5cdCAgaWYgKHRoaXMuc3RhdGUuZG93bmxvYWRpbmcpIGNsYXNzZXMrPVwiIGRpc2FibGVkXCI7XHJcblx0ICByZXR1cm4gKEUoXCJ0clwiLCB7XCJkYXRhLWlkXCI6IGYuZmlsZW5hbWV9LCBFKFwidGRcIiwgbnVsbCwgXHJcblx0ICAgICAgZi5maWxlbmFtZSksIFxyXG5cdCAgICAgIEUoXCJ0ZFwiLCBudWxsLCBmLmRlc2MpLCBcclxuXHQgICAgICBFKFwidGRcIiwgbnVsbCwgXHJcblx0ICAgICAgRShcInNwYW5cIiwge1wiZGF0YS1maWxlbmFtZVwiOiBmLmZpbGVuYW1lLCBcImRhdGEtdXJsXCI6IGYudXJsLCBcclxuXHQgICAgICAgICAgICBjbGFzc05hbWU6IGNsYXNzZXMsIFxyXG5cdCAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMuZG93bmxvYWR9LCBcIkRvd25sb2FkXCIpXHJcblx0ICAgICAgKVxyXG5cdCAgKSk7XHJcblx0fSxcclxuXHRzaG93RmlsZTpmdW5jdGlvbihmKSB7XHJcblx0Ly9cdHJldHVybiA8c3BhbiBkYXRhLWlkPXtmLmZpbGVuYW1lfT57Zi51cmx9PC9zcGFuPlxyXG5cdFx0cmV0dXJuIChmLnJlYWR5KT90aGlzLnNob3dMb2NhbChmKTp0aGlzLnNob3dSZW1vdGUoZik7XHJcblx0fSxcclxuXHRyZWxvYWREaXI6ZnVuY3Rpb24oKSB7XHJcblx0XHR0aGlzLnByb3BzLmFjdGlvbihcInJlbG9hZFwiKTtcclxuXHR9LFxyXG5cdGRvd25sb2FkOmZ1bmN0aW9uKGUpIHtcclxuXHRcdHZhciB1cmw9ZS50YXJnZXQuZGF0YXNldFtcInVybFwiXTtcclxuXHRcdHZhciBmaWxlbmFtZT1lLnRhcmdldC5kYXRhc2V0W1wiZmlsZW5hbWVcIl07XHJcblx0XHR0aGlzLnNldFN0YXRlKHtkb3dubG9hZGluZzp0cnVlLHByb2dyZXNzOjAsdXJsOnVybH0pO1xyXG5cdFx0dGhpcy51c2VyYnJlYWs9ZmFsc2U7XHJcblx0XHRodG1sNWZzLmRvd25sb2FkKHVybCxmaWxlbmFtZSxmdW5jdGlvbigpe1xyXG5cdFx0XHR0aGlzLnJlbG9hZERpcigpO1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtkb3dubG9hZGluZzpmYWxzZSxwcm9ncmVzczoxfSk7XHJcblx0XHRcdH0sZnVuY3Rpb24ocHJvZ3Jlc3MsdG90YWwpe1xyXG5cdFx0XHRcdGlmIChwcm9ncmVzcz09MCkge1xyXG5cdFx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7bWVzc2FnZTpcInRvdGFsIFwiK3RvdGFsfSlcclxuXHRcdFx0IFx0fVxyXG5cdFx0XHQgXHR0aGlzLnNldFN0YXRlKHtwcm9ncmVzczpwcm9ncmVzc30pO1xyXG5cdFx0XHQgXHQvL2lmIHVzZXIgcHJlc3MgYWJvcnQgcmV0dXJuIHRydWVcclxuXHRcdFx0IFx0cmV0dXJuIHRoaXMudXNlcmJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHQsdGhpcyk7XHJcblx0fSxcclxuXHRkZWxldGVGaWxlOmZ1bmN0aW9uKCBlKSB7XHJcblx0XHR2YXIgZmlsZW5hbWU9ZS50YXJnZXQuYXR0cmlidXRlc1tcImRhdGEtZmlsZW5hbWVcIl0udmFsdWU7XHJcblx0XHR0aGlzLnByb3BzLmFjdGlvbihcImRlbGV0ZVwiLGZpbGVuYW1lKTtcclxuXHR9LFxyXG5cdGFsbEZpbGVzUmVhZHk6ZnVuY3Rpb24oZSkge1xyXG5cdFx0cmV0dXJuIHRoaXMucHJvcHMuZmlsZXMuZXZlcnkoZnVuY3Rpb24oZil7IHJldHVybiBmLnJlYWR5fSk7XHJcblx0fSxcclxuXHRkaXNtaXNzOmZ1bmN0aW9uKCkge1xyXG5cdFx0JCh0aGlzLnJlZnMuZGlhbG9nMS5nZXRET01Ob2RlKCkpLm1vZGFsKCdoaWRlJyk7XHJcblx0XHR0aGlzLnByb3BzLmFjdGlvbihcImRpc21pc3NcIik7XHJcblx0fSxcclxuXHRhYm9ydGRvd25sb2FkOmZ1bmN0aW9uKCkge1xyXG5cdFx0dGhpcy51c2VyYnJlYWs9dHJ1ZTtcclxuXHR9LFxyXG5cdHNob3dQcm9ncmVzczpmdW5jdGlvbigpIHtcclxuXHQgICAgIGlmICh0aGlzLnN0YXRlLmRvd25sb2FkaW5nKSB7XHJcblx0ICAgICAgdmFyIHByb2dyZXNzPU1hdGgucm91bmQodGhpcy5zdGF0ZS5wcm9ncmVzcyoxMDApO1xyXG5cdCAgICAgIHJldHVybiAoXHJcblx0ICAgICAgXHRFKFwiZGl2XCIsIG51bGwsIFxyXG5cdCAgICAgIFx0XCJEb3dubG9hZGluZyBmcm9tIFwiLCB0aGlzLnN0YXRlLnVybCwgXHJcblx0ICAgICAgRShcImRpdlwiLCB7a2V5OiBcInByb2dyZXNzXCIsIGNsYXNzTmFtZTogXCJwcm9ncmVzcyBjb2wtbWQtOFwifSwgXHJcblx0ICAgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJwcm9ncmVzcy1iYXJcIiwgcm9sZTogXCJwcm9ncmVzc2JhclwiLCBcclxuXHQgICAgICAgICAgICAgIFwiYXJpYS12YWx1ZW5vd1wiOiBwcm9ncmVzcywgXCJhcmlhLXZhbHVlbWluXCI6IFwiMFwiLCBcclxuXHQgICAgICAgICAgICAgIFwiYXJpYS12YWx1ZW1heFwiOiBcIjEwMFwiLCBzdHlsZToge3dpZHRoOiBwcm9ncmVzcytcIiVcIn19LCBcclxuXHQgICAgICAgICAgICBwcm9ncmVzcywgXCIlXCJcclxuXHQgICAgICAgICAgKVxyXG5cdCAgICAgICAgKSwgXHJcblx0ICAgICAgICBFKFwiYnV0dG9uXCIsIHtvbkNsaWNrOiB0aGlzLmFib3J0ZG93bmxvYWQsIFxyXG5cdCAgICAgICAgXHRjbGFzc05hbWU6IFwiYnRuIGJ0bi1kYW5nZXIgY29sLW1kLTRcIn0sIFwiQWJvcnRcIilcclxuXHQgICAgICAgIClcclxuXHQgICAgICAgICk7XHJcblx0ICAgICAgfSBlbHNlIHtcclxuXHQgICAgICBcdFx0aWYgKCB0aGlzLmFsbEZpbGVzUmVhZHkoKSApIHtcclxuXHQgICAgICBcdFx0XHRyZXR1cm4gRShcImJ1dHRvblwiLCB7b25DbGljazogdGhpcy5kaXNtaXNzLCBjbGFzc05hbWU6IFwiYnRuIGJ0bi1zdWNjZXNzXCJ9LCBcIk9rXCIpXHJcblx0ICAgICAgXHRcdH0gZWxzZSByZXR1cm4gbnVsbDtcclxuXHQgICAgICBcdFx0XHJcblx0ICAgICAgfVxyXG5cdH0sXHJcblx0c2hvd1VzYWdlOmZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHBlcmNlbnQ9dGhpcy5wcm9wcy5yZW1haW5QZXJjZW50O1xyXG4gICAgICAgICAgIHJldHVybiAoRShcImRpdlwiLCBudWxsLCBFKFwic3BhblwiLCB7Y2xhc3NOYW1lOiBcInB1bGwtbGVmdFwifSwgXCJVc2FnZTpcIiksIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJwcm9ncmVzc1wifSwgXHJcblx0XHQgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJwcm9ncmVzcy1iYXIgcHJvZ3Jlc3MtYmFyLXN1Y2Nlc3MgcHJvZ3Jlc3MtYmFyLXN0cmlwZWRcIiwgcm9sZTogXCJwcm9ncmVzc2JhclwiLCBzdHlsZToge3dpZHRoOiBwZXJjZW50K1wiJVwifX0sIFxyXG5cdFx0ICAgIFx0cGVyY2VudCtcIiVcIlxyXG5cdFx0ICApXHJcblx0XHQpKSk7XHJcblx0fSxcclxuXHRyZW5kZXI6ZnVuY3Rpb24oKSB7XHJcblx0ICBcdHJldHVybiAoXHJcblx0XHRFKFwiZGl2XCIsIHtyZWY6IFwiZGlhbG9nMVwiLCBjbGFzc05hbWU6IFwibW9kYWwgZmFkZVwiLCBcImRhdGEtYmFja2Ryb3BcIjogXCJzdGF0aWNcIn0sIFxyXG5cdFx0ICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1kaWFsb2dcIn0sIFxyXG5cdFx0ICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWNvbnRlbnRcIn0sIFxyXG5cdFx0ICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtaGVhZGVyXCJ9LCBcclxuXHRcdCAgICAgICAgICBFKFwiaDRcIiwge2NsYXNzTmFtZTogXCJtb2RhbC10aXRsZVwifSwgXCJGaWxlIEluc3RhbGxlclwiKVxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWJvZHlcIn0sIFxyXG5cdFx0ICAgICAgICBcdEUoXCJ0YWJsZVwiLCB7Y2xhc3NOYW1lOiBcInRhYmxlXCJ9LCBcclxuXHRcdCAgICAgICAgXHRFKFwidGJvZHlcIiwgbnVsbCwgXHJcblx0XHQgICAgICAgICAgXHR0aGlzLnByb3BzLmZpbGVzLm1hcCh0aGlzLnNob3dGaWxlKVxyXG5cdFx0ICAgICAgICAgIFx0KVxyXG5cdFx0ICAgICAgICAgIClcclxuXHRcdCAgICAgICAgKSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1mb290ZXJcIn0sIFxyXG5cdFx0ICAgICAgICBcdHRoaXMuc2hvd1VzYWdlKCksIFxyXG5cdFx0ICAgICAgICAgICB0aGlzLnNob3dQcm9ncmVzcygpXHJcblx0XHQgICAgICAgIClcclxuXHRcdCAgICAgIClcclxuXHRcdCAgICApXHJcblx0XHQgIClcclxuXHRcdCk7XHJcblx0fSxcdFxyXG5cdGNvbXBvbmVudERpZE1vdW50OmZ1bmN0aW9uKCkge1xyXG5cdFx0JCh0aGlzLnJlZnMuZGlhbG9nMS5nZXRET01Ob2RlKCkpLm1vZGFsKCdzaG93Jyk7XHJcblx0fVxyXG59KTtcclxuLypUT0RPIGtkYiBjaGVjayB2ZXJzaW9uKi9cclxudmFyIEZpbGVtYW5hZ2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG5cdGdldEluaXRpYWxTdGF0ZTpmdW5jdGlvbigpIHtcclxuXHRcdHZhciBxdW90YT10aGlzLmdldFF1b3RhKCk7XHJcblx0XHRyZXR1cm4ge2Jyb3dzZXJSZWFkeTpmYWxzZSxub3VwZGF0ZTp0cnVlLFx0cmVxdWVzdFF1b3RhOnF1b3RhLHJlbWFpbjowfTtcclxuXHR9LFxyXG5cdGdldFF1b3RhOmZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHE9dGhpcy5wcm9wcy5xdW90YXx8XCIxMjhNXCI7XHJcblx0XHR2YXIgdW5pdD1xW3EubGVuZ3RoLTFdO1xyXG5cdFx0dmFyIHRpbWVzPTE7XHJcblx0XHRpZiAodW5pdD09XCJNXCIpIHRpbWVzPTEwMjQqMTAyNDtcclxuXHRcdGVsc2UgaWYgKHVuaXQ9XCJLXCIpIHRpbWVzPTEwMjQ7XHJcblx0XHRyZXR1cm4gcGFyc2VJbnQocSkgKiB0aW1lcztcclxuXHR9LFxyXG5cdG1pc3NpbmdLZGI6ZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAoa3NhbmFnYXAucGxhdGZvcm0hPVwiY2hyb21lXCIpIHJldHVybiBbXTtcclxuXHRcdHZhciBtaXNzaW5nPXRoaXMucHJvcHMubmVlZGVkLmZpbHRlcihmdW5jdGlvbihrZGIpe1xyXG5cdFx0XHRmb3IgKHZhciBpIGluIGh0bWw1ZnMuZmlsZXMpIHtcclxuXHRcdFx0XHRpZiAoaHRtbDVmcy5maWxlc1tpXVswXT09a2RiLmZpbGVuYW1lKSByZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9LHRoaXMpO1xyXG5cdFx0cmV0dXJuIG1pc3Npbmc7XHJcblx0fSxcclxuXHRnZXRSZW1vdGVVcmw6ZnVuY3Rpb24oZm4pIHtcclxuXHRcdHZhciBmPXRoaXMucHJvcHMubmVlZGVkLmZpbHRlcihmdW5jdGlvbihmKXtyZXR1cm4gZi5maWxlbmFtZT09Zm59KTtcclxuXHRcdGlmIChmLmxlbmd0aCApIHJldHVybiBmWzBdLnVybDtcclxuXHR9LFxyXG5cdGdlbkZpbGVMaXN0OmZ1bmN0aW9uKGV4aXN0aW5nLG1pc3Npbmcpe1xyXG5cdFx0dmFyIG91dD1bXTtcclxuXHRcdGZvciAodmFyIGkgaW4gZXhpc3RpbmcpIHtcclxuXHRcdFx0dmFyIHVybD10aGlzLmdldFJlbW90ZVVybChleGlzdGluZ1tpXVswXSk7XHJcblx0XHRcdG91dC5wdXNoKHtmaWxlbmFtZTpleGlzdGluZ1tpXVswXSwgdXJsIDp1cmwsIHJlYWR5OnRydWUgfSk7XHJcblx0XHR9XHJcblx0XHRmb3IgKHZhciBpIGluIG1pc3NpbmcpIHtcclxuXHRcdFx0b3V0LnB1c2gobWlzc2luZ1tpXSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gb3V0O1xyXG5cdH0sXHJcblx0cmVsb2FkOmZ1bmN0aW9uKCkge1xyXG5cdFx0aHRtbDVmcy5yZWFkZGlyKGZ1bmN0aW9uKGZpbGVzKXtcclxuICBcdFx0XHR0aGlzLnNldFN0YXRlKHtmaWxlczp0aGlzLmdlbkZpbGVMaXN0KGZpbGVzLHRoaXMubWlzc2luZ0tkYigpKX0pO1xyXG4gIFx0XHR9LHRoaXMpO1xyXG5cdCB9LFxyXG5cdGRlbGV0ZUZpbGU6ZnVuY3Rpb24oZm4pIHtcclxuXHQgIGh0bWw1ZnMucm0oZm4sZnVuY3Rpb24oKXtcclxuXHQgIFx0dGhpcy5yZWxvYWQoKTtcclxuXHQgIH0sdGhpcyk7XHJcblx0fSxcclxuXHRvblF1b3RlT2s6ZnVuY3Rpb24ocXVvdGEsdXNhZ2UpIHtcclxuXHRcdGlmIChrc2FuYWdhcC5wbGF0Zm9ybSE9XCJjaHJvbWVcIikge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKFwib25xdW90ZW9rXCIpO1xyXG5cdFx0XHR0aGlzLnNldFN0YXRlKHtub3VwZGF0ZTp0cnVlLG1pc3Npbmc6W10sZmlsZXM6W10sYXV0b2Nsb3NlOnRydWVcclxuXHRcdFx0XHQscXVvdGE6cXVvdGEscmVtYWluOnF1b3RhLXVzYWdlLHVzYWdlOnVzYWdlfSk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdC8vY29uc29sZS5sb2coXCJxdW90ZSBva1wiKTtcclxuXHRcdHZhciBmaWxlcz10aGlzLmdlbkZpbGVMaXN0KGh0bWw1ZnMuZmlsZXMsdGhpcy5taXNzaW5nS2RiKCkpO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHRoYXQuY2hlY2tJZlVwZGF0ZShmaWxlcyxmdW5jdGlvbihoYXN1cGRhdGUpIHtcclxuXHRcdFx0dmFyIG1pc3Npbmc9dGhpcy5taXNzaW5nS2RiKCk7XHJcblx0XHRcdHZhciBhdXRvY2xvc2U9dGhpcy5wcm9wcy5hdXRvY2xvc2U7XHJcblx0XHRcdGlmIChtaXNzaW5nLmxlbmd0aCkgYXV0b2Nsb3NlPWZhbHNlO1xyXG5cdFx0XHR0aGF0LnNldFN0YXRlKHthdXRvY2xvc2U6YXV0b2Nsb3NlLFxyXG5cdFx0XHRcdHF1b3RhOnF1b3RhLHVzYWdlOnVzYWdlLGZpbGVzOmZpbGVzLFxyXG5cdFx0XHRcdG1pc3Npbmc6bWlzc2luZyxcclxuXHRcdFx0XHRub3VwZGF0ZTohaGFzdXBkYXRlLFxyXG5cdFx0XHRcdHJlbWFpbjpxdW90YS11c2FnZX0pO1xyXG5cdFx0fSk7XHJcblx0fSwgIFxyXG5cdG9uQnJvd3Nlck9rOmZ1bmN0aW9uKCkge1xyXG5cdCAgdGhpcy50b3RhbERvd25sb2FkU2l6ZSgpO1xyXG5cdH0sIFxyXG5cdGRpc21pc3M6ZnVuY3Rpb24oKSB7XHJcblx0XHR0aGlzLnByb3BzLm9uUmVhZHkodGhpcy5zdGF0ZS51c2FnZSx0aGlzLnN0YXRlLnF1b3RhKTtcclxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0dmFyIG1vZGFsaW49JChcIi5tb2RhbC5pblwiKTtcclxuXHRcdFx0aWYgKG1vZGFsaW4ubW9kYWwpIG1vZGFsaW4ubW9kYWwoJ2hpZGUnKTtcclxuXHRcdH0sNTAwKTtcclxuXHR9LCBcclxuXHR0b3RhbERvd25sb2FkU2l6ZTpmdW5jdGlvbigpIHtcclxuXHRcdHZhciBmaWxlcz10aGlzLm1pc3NpbmdLZGIoKTtcclxuXHRcdHZhciB0YXNrcXVldWU9W10sdG90YWxzaXplPTA7XHJcblx0XHRmb3IgKHZhciBpPTA7aTxmaWxlcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdHRhc2txdWV1ZS5wdXNoKFxyXG5cdFx0XHRcdChmdW5jdGlvbihpZHgpe1xyXG5cdFx0XHRcdFx0cmV0dXJuIChmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRcdFx0aWYgKCEodHlwZW9mIGRhdGE9PSdvYmplY3QnICYmIGRhdGEuX19lbXB0eSkpIHRvdGFsc2l6ZSs9ZGF0YTtcclxuXHRcdFx0XHRcdFx0aHRtbDVmcy5nZXREb3dubG9hZFNpemUoZmlsZXNbaWR4XS51cmwsdGFza3F1ZXVlLnNoaWZ0KCkpO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fSkoaSlcclxuXHRcdFx0KTtcclxuXHRcdH1cclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR0YXNrcXVldWUucHVzaChmdW5jdGlvbihkYXRhKXtcdFxyXG5cdFx0XHR0b3RhbHNpemUrPWRhdGE7XHJcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXt0aGF0LnNldFN0YXRlKHtyZXF1aXJlU3BhY2U6dG90YWxzaXplLGJyb3dzZXJSZWFkeTp0cnVlfSl9LDApO1xyXG5cdFx0fSk7XHJcblx0XHR0YXNrcXVldWUuc2hpZnQoKSh7X19lbXB0eTp0cnVlfSk7XHJcblx0fSxcclxuXHRjaGVja0lmVXBkYXRlOmZ1bmN0aW9uKGZpbGVzLGNiKSB7XHJcblx0XHR2YXIgdGFza3F1ZXVlPVtdO1xyXG5cdFx0Zm9yICh2YXIgaT0wO2k8ZmlsZXMubGVuZ3RoO2krKykge1xyXG5cdFx0XHR0YXNrcXVldWUucHVzaChcclxuXHRcdFx0XHQoZnVuY3Rpb24oaWR4KXtcclxuXHRcdFx0XHRcdHJldHVybiAoZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0XHRcdGlmICghKHR5cGVvZiBkYXRhPT0nb2JqZWN0JyAmJiBkYXRhLl9fZW1wdHkpKSBmaWxlc1tpZHgtMV0uaGFzVXBkYXRlPWRhdGE7XHJcblx0XHRcdFx0XHRcdGh0bWw1ZnMuY2hlY2tVcGRhdGUoZmlsZXNbaWR4XS51cmwsZmlsZXNbaWR4XS5maWxlbmFtZSx0YXNrcXVldWUuc2hpZnQoKSk7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KShpKVxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHRhc2txdWV1ZS5wdXNoKGZ1bmN0aW9uKGRhdGEpe1x0XHJcblx0XHRcdGZpbGVzW2ZpbGVzLmxlbmd0aC0xXS5oYXNVcGRhdGU9ZGF0YTtcclxuXHRcdFx0dmFyIGhhc3VwZGF0ZT1maWxlcy5zb21lKGZ1bmN0aW9uKGYpe3JldHVybiBmLmhhc1VwZGF0ZX0pO1xyXG5cdFx0XHRpZiAoY2IpIGNiLmFwcGx5KHRoYXQsW2hhc3VwZGF0ZV0pO1xyXG5cdFx0fSk7XHJcblx0XHR0YXNrcXVldWUuc2hpZnQoKSh7X19lbXB0eTp0cnVlfSk7XHJcblx0fSxcclxuXHRyZW5kZXI6ZnVuY3Rpb24oKXtcclxuICAgIFx0XHRpZiAoIXRoaXMuc3RhdGUuYnJvd3NlclJlYWR5KSB7ICAgXHJcbiAgICAgIFx0XHRcdHJldHVybiBFKENoZWNrQnJvd3Nlciwge2ZlYXR1cmU6IFwiZnNcIiwgb25SZWFkeTogdGhpcy5vbkJyb3dzZXJPa30pXHJcbiAgICBcdFx0fSBpZiAoIXRoaXMuc3RhdGUucXVvdGEgfHwgdGhpcy5zdGF0ZS5yZW1haW48dGhpcy5zdGF0ZS5yZXF1aXJlU3BhY2UpIHsgIFxyXG4gICAgXHRcdFx0dmFyIHF1b3RhPXRoaXMuc3RhdGUucmVxdWVzdFF1b3RhO1xyXG4gICAgXHRcdFx0aWYgKHRoaXMuc3RhdGUudXNhZ2UrdGhpcy5zdGF0ZS5yZXF1aXJlU3BhY2U+cXVvdGEpIHtcclxuICAgIFx0XHRcdFx0cXVvdGE9KHRoaXMuc3RhdGUudXNhZ2UrdGhpcy5zdGF0ZS5yZXF1aXJlU3BhY2UpKjEuNTtcclxuICAgIFx0XHRcdH1cclxuICAgICAgXHRcdFx0cmV0dXJuIEUoSHRtbEZTLCB7cXVvdGE6IHF1b3RhLCBhdXRvY2xvc2U6IFwidHJ1ZVwiLCBvblJlYWR5OiB0aGlzLm9uUXVvdGVPa30pXHJcbiAgICAgIFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRpZiAoIXRoaXMuc3RhdGUubm91cGRhdGUgfHwgdGhpcy5taXNzaW5nS2RiKCkubGVuZ3RoIHx8ICF0aGlzLnN0YXRlLmF1dG9jbG9zZSkge1xyXG5cdFx0XHRcdHZhciByZW1haW49TWF0aC5yb3VuZCgodGhpcy5zdGF0ZS51c2FnZS90aGlzLnN0YXRlLnF1b3RhKSoxMDApO1x0XHRcdFx0XHJcblx0XHRcdFx0cmV0dXJuIEUoRmlsZUxpc3QsIHthY3Rpb246IHRoaXMuYWN0aW9uLCBmaWxlczogdGhpcy5zdGF0ZS5maWxlcywgcmVtYWluUGVyY2VudDogcmVtYWlufSlcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRzZXRUaW1lb3V0KCB0aGlzLmRpc21pc3MgLDApO1xyXG5cdFx0XHRcdHJldHVybiBFKFwic3BhblwiLCBudWxsLCBcIlN1Y2Nlc3NcIik7XHJcblx0XHRcdH1cclxuICAgICAgXHRcdH1cclxuXHR9LFxyXG5cdGFjdGlvbjpmdW5jdGlvbigpIHtcclxuXHQgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuXHQgIHZhciB0eXBlPWFyZ3Muc2hpZnQoKTtcclxuXHQgIHZhciByZXM9bnVsbCwgdGhhdD10aGlzO1xyXG5cdCAgaWYgKHR5cGU9PVwiZGVsZXRlXCIpIHtcclxuXHQgICAgdGhpcy5kZWxldGVGaWxlKGFyZ3NbMF0pO1xyXG5cdCAgfSAgZWxzZSBpZiAodHlwZT09XCJyZWxvYWRcIikge1xyXG5cdCAgXHR0aGlzLnJlbG9hZCgpO1xyXG5cdCAgfSBlbHNlIGlmICh0eXBlPT1cImRpc21pc3NcIikge1xyXG5cdCAgXHR0aGlzLmRpc21pc3MoKTtcclxuXHQgIH1cclxuXHR9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHM9RmlsZW1hbmFnZXI7IiwiLyogZW11bGF0ZSBmaWxlc3lzdGVtIG9uIGh0bWw1IGJyb3dzZXIgKi9cclxudmFyIGdldF9oZWFkPWZ1bmN0aW9uKHVybCxmaWVsZCxjYil7XHJcblx0dmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdHhoci5vcGVuKFwiSEVBRFwiLCB1cmwsIHRydWUpO1xyXG5cdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0aWYgKHRoaXMucmVhZHlTdGF0ZSA9PSB0aGlzLkRPTkUpIHtcclxuXHRcdFx0XHRjYih4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoZmllbGQpKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRpZiAodGhpcy5zdGF0dXMhPT0yMDAmJnRoaXMuc3RhdHVzIT09MjA2KSB7XHJcblx0XHRcdFx0XHRjYihcIlwiKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gXHJcblx0fTtcclxuXHR4aHIuc2VuZCgpO1x0XHJcbn1cclxudmFyIGdldF9kYXRlPWZ1bmN0aW9uKHVybCxjYikge1xyXG5cdGdldF9oZWFkKHVybCxcIkxhc3QtTW9kaWZpZWRcIixmdW5jdGlvbih2YWx1ZSl7XHJcblx0XHRjYih2YWx1ZSk7XHJcblx0fSk7XHJcbn1cclxudmFyIGdldF9zaXplPWZ1bmN0aW9uKHVybCwgY2IpIHtcclxuXHRnZXRfaGVhZCh1cmwsXCJDb250ZW50LUxlbmd0aFwiLGZ1bmN0aW9uKHZhbHVlKXtcclxuXHRcdGNiKHBhcnNlSW50KHZhbHVlKSk7XHJcblx0fSk7XHJcbn07XHJcbnZhciBjaGVja1VwZGF0ZT1mdW5jdGlvbih1cmwsZm4sY2IpIHtcclxuXHRpZiAoIXVybCkge1xyXG5cdFx0Y2IoZmFsc2UpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRnZXRfZGF0ZSh1cmwsZnVuY3Rpb24oZCl7XHJcblx0XHRBUEkuZnMucm9vdC5nZXRGaWxlKGZuLCB7Y3JlYXRlOiBmYWxzZSwgZXhjbHVzaXZlOiBmYWxzZX0sIGZ1bmN0aW9uKGZpbGVFbnRyeSkge1xyXG5cdFx0XHRmaWxlRW50cnkuZ2V0TWV0YWRhdGEoZnVuY3Rpb24obWV0YWRhdGEpe1xyXG5cdFx0XHRcdHZhciBsb2NhbERhdGU9RGF0ZS5wYXJzZShtZXRhZGF0YS5tb2RpZmljYXRpb25UaW1lKTtcclxuXHRcdFx0XHR2YXIgdXJsRGF0ZT1EYXRlLnBhcnNlKGQpO1xyXG5cdFx0XHRcdGNiKHVybERhdGU+bG9jYWxEYXRlKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9LGZ1bmN0aW9uKCl7XHJcblx0XHRcdGNiKGZhbHNlKTtcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG59XHJcbnZhciBkb3dubG9hZD1mdW5jdGlvbih1cmwsZm4sY2Isc3RhdHVzY2IsY29udGV4dCkge1xyXG5cdCB2YXIgdG90YWxzaXplPTAsYmF0Y2hlcz1udWxsLHdyaXR0ZW49MDtcclxuXHQgdmFyIGZpbGVFbnRyeT0wLCBmaWxlV3JpdGVyPTA7XHJcblx0IHZhciBjcmVhdGVCYXRjaGVzPWZ1bmN0aW9uKHNpemUpIHtcclxuXHRcdHZhciBieXRlcz0xMDI0KjEwMjQsIG91dD1bXTtcclxuXHRcdHZhciBiPU1hdGguZmxvb3Ioc2l6ZSAvIGJ5dGVzKTtcclxuXHRcdHZhciBsYXN0PXNpemUgJWJ5dGVzO1xyXG5cdFx0Zm9yICh2YXIgaT0wO2k8PWI7aSsrKSB7XHJcblx0XHRcdG91dC5wdXNoKGkqYnl0ZXMpO1xyXG5cdFx0fVxyXG5cdFx0b3V0LnB1c2goYipieXRlcytsYXN0KTtcclxuXHRcdHJldHVybiBvdXQ7XHJcblx0IH1cclxuXHQgdmFyIGZpbmlzaD1mdW5jdGlvbigpIHtcclxuXHRcdCBybShmbixmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGZpbGVFbnRyeS5tb3ZlVG8oZmlsZUVudHJ5LmZpbGVzeXN0ZW0ucm9vdCwgZm4sZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdHNldFRpbWVvdXQoIGNiLmJpbmQoY29udGV4dCxmYWxzZSkgLCAwKSA7IFxyXG5cdFx0XHRcdH0sZnVuY3Rpb24oZSl7XHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcImZhaWxlZFwiLGUpXHJcblx0XHRcdFx0fSk7XHJcblx0XHQgfSx0aGlzKTsgXHJcblx0IH07XHJcblx0XHR2YXIgdGVtcGZuPVwidGVtcC5rZGJcIjtcclxuXHRcdHZhciBiYXRjaD1mdW5jdGlvbihiKSB7XHJcblx0XHR2YXIgYWJvcnQ9ZmFsc2U7XHJcblx0XHR2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0XHR2YXIgcmVxdWVzdHVybD11cmwrXCI/XCIrTWF0aC5yYW5kb20oKTtcclxuXHRcdHhoci5vcGVuKCdnZXQnLCByZXF1ZXN0dXJsLCB0cnVlKTtcclxuXHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdSYW5nZScsICdieXRlcz0nK2JhdGNoZXNbYl0rJy0nKyhiYXRjaGVzW2IrMV0tMSkpO1xyXG5cdFx0eGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJzsgICAgXHJcblx0XHR4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgYmxvYj10aGlzLnJlc3BvbnNlO1xyXG5cdFx0XHRmaWxlRW50cnkuY3JlYXRlV3JpdGVyKGZ1bmN0aW9uKGZpbGVXcml0ZXIpIHtcclxuXHRcdFx0XHRmaWxlV3JpdGVyLnNlZWsoZmlsZVdyaXRlci5sZW5ndGgpO1xyXG5cdFx0XHRcdGZpbGVXcml0ZXIud3JpdGUoYmxvYik7XHJcblx0XHRcdFx0d3JpdHRlbis9YmxvYi5zaXplO1xyXG5cdFx0XHRcdGZpbGVXcml0ZXIub253cml0ZWVuZCA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0XHRcdGlmIChzdGF0dXNjYikge1xyXG5cdFx0XHRcdFx0XHRhYm9ydD1zdGF0dXNjYi5hcHBseShjb250ZXh0LFsgZmlsZVdyaXRlci5sZW5ndGggLyB0b3RhbHNpemUsdG90YWxzaXplIF0pO1xyXG5cdFx0XHRcdFx0XHRpZiAoYWJvcnQpIHNldFRpbWVvdXQoIGNiLmJpbmQoY29udGV4dCxmYWxzZSkgLCAwKSA7XHJcblx0XHRcdFx0IFx0fVxyXG5cdFx0XHRcdFx0YisrO1xyXG5cdFx0XHRcdFx0aWYgKCFhYm9ydCkge1xyXG5cdFx0XHRcdFx0XHRpZiAoYjxiYXRjaGVzLmxlbmd0aC0xKSBzZXRUaW1lb3V0KGJhdGNoLmJpbmQoY29udGV4dCxiKSwwKTtcclxuXHRcdFx0XHRcdFx0ZWxzZSAgICAgICAgICAgICAgICAgICAgZmluaXNoKCk7XHJcblx0XHRcdFx0IFx0fVxyXG5cdFx0XHQgXHR9O1xyXG5cdFx0XHR9LCBjb25zb2xlLmVycm9yKTtcclxuXHRcdH0sZmFsc2UpO1xyXG5cdFx0eGhyLnNlbmQoKTtcclxuXHR9XHJcblxyXG5cdGdldF9zaXplKHVybCxmdW5jdGlvbihzaXplKXtcclxuXHRcdHRvdGFsc2l6ZT1zaXplO1xyXG5cdFx0aWYgKCFzaXplKSB7XHJcblx0XHRcdGlmIChjYikgY2IuYXBwbHkoY29udGV4dCxbZmFsc2VdKTtcclxuXHRcdH0gZWxzZSB7Ly9yZWFkeSB0byBkb3dubG9hZFxyXG5cdFx0XHRybSh0ZW1wZm4sZnVuY3Rpb24oKXtcclxuXHRcdFx0XHQgYmF0Y2hlcz1jcmVhdGVCYXRjaGVzKHNpemUpO1xyXG5cdFx0XHRcdCBpZiAoc3RhdHVzY2IpIHN0YXR1c2NiLmFwcGx5KGNvbnRleHQsWyAwLCB0b3RhbHNpemUgXSk7XHJcblx0XHRcdFx0IEFQSS5mcy5yb290LmdldEZpbGUodGVtcGZuLCB7Y3JlYXRlOiAxLCBleGNsdXNpdmU6IGZhbHNlfSwgZnVuY3Rpb24oX2ZpbGVFbnRyeSkge1xyXG5cdFx0XHRcdFx0XHRcdGZpbGVFbnRyeT1fZmlsZUVudHJ5O1xyXG5cdFx0XHRcdFx0XHRiYXRjaCgwKTtcclxuXHRcdFx0XHQgfSk7XHJcblx0XHRcdH0sdGhpcyk7XHJcblx0XHR9XHJcblx0fSk7XHJcbn1cclxuXHJcbnZhciByZWFkRmlsZT1mdW5jdGlvbihmaWxlbmFtZSxjYixjb250ZXh0KSB7XHJcblx0QVBJLmZzLnJvb3QuZ2V0RmlsZShmaWxlbmFtZSwgZnVuY3Rpb24oZmlsZUVudHJ5KSB7XHJcblx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG5cdFx0XHRyZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdFx0aWYgKGNiKSBjYi5hcHBseShjYixbdGhpcy5yZXN1bHRdKTtcclxuXHRcdFx0XHR9OyAgICAgICAgICAgIFxyXG5cdH0sIGNvbnNvbGUuZXJyb3IpO1xyXG59XHJcbnZhciB3cml0ZUZpbGU9ZnVuY3Rpb24oZmlsZW5hbWUsYnVmLGNiLGNvbnRleHQpe1xyXG5cdEFQSS5mcy5yb290LmdldEZpbGUoZmlsZW5hbWUsIHtjcmVhdGU6IHRydWUsIGV4Y2x1c2l2ZTogdHJ1ZX0sIGZ1bmN0aW9uKGZpbGVFbnRyeSkge1xyXG5cdFx0XHRmaWxlRW50cnkuY3JlYXRlV3JpdGVyKGZ1bmN0aW9uKGZpbGVXcml0ZXIpIHtcclxuXHRcdFx0XHRmaWxlV3JpdGVyLndyaXRlKGJ1Zik7XHJcblx0XHRcdFx0ZmlsZVdyaXRlci5vbndyaXRlZW5kID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdFx0aWYgKGNiKSBjYi5hcHBseShjYixbYnVmLmJ5dGVMZW5ndGhdKTtcclxuXHRcdFx0XHR9OyAgICAgICAgICAgIFxyXG5cdFx0XHR9LCBjb25zb2xlLmVycm9yKTtcclxuXHR9LCBjb25zb2xlLmVycm9yKTtcclxufVxyXG5cclxudmFyIHJlYWRkaXI9ZnVuY3Rpb24oY2IsY29udGV4dCkge1xyXG5cdHZhciBkaXJSZWFkZXIgPSBBUEkuZnMucm9vdC5jcmVhdGVSZWFkZXIoKTtcclxuXHR2YXIgb3V0PVtdLHRoYXQ9dGhpcztcclxuXHRkaXJSZWFkZXIucmVhZEVudHJpZXMoZnVuY3Rpb24oZW50cmllcykge1xyXG5cdFx0aWYgKGVudHJpZXMubGVuZ3RoKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBlbnRyeTsgZW50cnkgPSBlbnRyaWVzW2ldOyArK2kpIHtcclxuXHRcdFx0XHRpZiAoZW50cnkuaXNGaWxlKSB7XHJcblx0XHRcdFx0XHRvdXQucHVzaChbZW50cnkubmFtZSxlbnRyeS50b1VSTCA/IGVudHJ5LnRvVVJMKCkgOiBlbnRyeS50b1VSSSgpXSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRBUEkuZmlsZXM9b3V0O1xyXG5cdFx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtvdXRdKTtcclxuXHR9LCBmdW5jdGlvbigpe1xyXG5cdFx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtudWxsXSk7XHJcblx0fSk7XHJcbn1cclxudmFyIGdldEZpbGVVUkw9ZnVuY3Rpb24oZmlsZW5hbWUpIHtcclxuXHRpZiAoIUFQSS5maWxlcyApIHJldHVybiBudWxsO1xyXG5cdHZhciBmaWxlPSBBUEkuZmlsZXMuZmlsdGVyKGZ1bmN0aW9uKGYpe3JldHVybiBmWzBdPT1maWxlbmFtZX0pO1xyXG5cdGlmIChmaWxlLmxlbmd0aCkgcmV0dXJuIGZpbGVbMF1bMV07XHJcbn1cclxudmFyIHJtPWZ1bmN0aW9uKGZpbGVuYW1lLGNiLGNvbnRleHQpIHtcclxuXHR2YXIgdXJsPWdldEZpbGVVUkwoZmlsZW5hbWUpO1xyXG5cdGlmICh1cmwpIHJtVVJMKHVybCxjYixjb250ZXh0KTtcclxuXHRlbHNlIGlmIChjYikgY2IuYXBwbHkoY29udGV4dCxbZmFsc2VdKTtcclxufVxyXG5cclxudmFyIHJtVVJMPWZ1bmN0aW9uKGZpbGVuYW1lLGNiLGNvbnRleHQpIHtcclxuXHR3ZWJraXRSZXNvbHZlTG9jYWxGaWxlU3lzdGVtVVJMKGZpbGVuYW1lLCBmdW5jdGlvbihmaWxlRW50cnkpIHtcclxuXHRcdGZpbGVFbnRyeS5yZW1vdmUoZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlmIChjYikgY2IuYXBwbHkoY29udGV4dCxbdHJ1ZV0pO1xyXG5cdFx0fSwgY29uc29sZS5lcnJvcik7XHJcblx0fSwgIGZ1bmN0aW9uKGUpe1xyXG5cdFx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtmYWxzZV0pOy8vbm8gc3VjaCBmaWxlXHJcblx0fSk7XHJcbn1cclxuZnVuY3Rpb24gZXJyb3JIYW5kbGVyKGUpIHtcclxuXHRjb25zb2xlLmVycm9yKCdFcnJvcjogJyArZS5uYW1lKyBcIiBcIitlLm1lc3NhZ2UpO1xyXG59XHJcbnZhciBpbml0ZnM9ZnVuY3Rpb24oZ3JhbnRlZEJ5dGVzLGNiLGNvbnRleHQpIHtcclxuXHR3ZWJraXRSZXF1ZXN0RmlsZVN5c3RlbShQRVJTSVNURU5ULCBncmFudGVkQnl0ZXMsICBmdW5jdGlvbihmcykge1xyXG5cdFx0QVBJLmZzPWZzO1xyXG5cdFx0QVBJLnF1b3RhPWdyYW50ZWRCeXRlcztcclxuXHRcdHJlYWRkaXIoZnVuY3Rpb24oKXtcclxuXHRcdFx0QVBJLmluaXRpYWxpemVkPXRydWU7XHJcblx0XHRcdGNiLmFwcGx5KGNvbnRleHQsW2dyYW50ZWRCeXRlcyxmc10pO1xyXG5cdFx0fSxjb250ZXh0KTtcclxuXHR9LCBlcnJvckhhbmRsZXIpO1xyXG59XHJcbnZhciBpbml0PWZ1bmN0aW9uKHF1b3RhLGNiLGNvbnRleHQpIHtcclxuXHRuYXZpZ2F0b3Iud2Via2l0UGVyc2lzdGVudFN0b3JhZ2UucmVxdWVzdFF1b3RhKHF1b3RhLCBcclxuXHRcdFx0ZnVuY3Rpb24oZ3JhbnRlZEJ5dGVzKSB7XHJcblx0XHRcdFx0aW5pdGZzKGdyYW50ZWRCeXRlcyxjYixjb250ZXh0KTtcclxuXHRcdH0sIGVycm9ySGFuZGxlclxyXG5cdCk7XHJcbn1cclxudmFyIHF1ZXJ5UXVvdGE9ZnVuY3Rpb24oY2IsY29udGV4dCkge1xyXG5cdHZhciB0aGF0PXRoaXM7XHJcblx0bmF2aWdhdG9yLndlYmtpdFBlcnNpc3RlbnRTdG9yYWdlLnF1ZXJ5VXNhZ2VBbmRRdW90YSggXHJcblx0IGZ1bmN0aW9uKHVzYWdlLHF1b3RhKXtcclxuXHRcdFx0aW5pdGZzKHF1b3RhLGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0Y2IuYXBwbHkoY29udGV4dCxbdXNhZ2UscXVvdGFdKTtcclxuXHRcdFx0fSxjb250ZXh0KTtcclxuXHR9KTtcclxufVxyXG52YXIgQVBJPXtcclxuXHRpbml0OmluaXRcclxuXHQscmVhZGRpcjpyZWFkZGlyXHJcblx0LGNoZWNrVXBkYXRlOmNoZWNrVXBkYXRlXHJcblx0LHJtOnJtXHJcblx0LHJtVVJMOnJtVVJMXHJcblx0LGdldEZpbGVVUkw6Z2V0RmlsZVVSTFxyXG5cdCx3cml0ZUZpbGU6d3JpdGVGaWxlXHJcblx0LHJlYWRGaWxlOnJlYWRGaWxlXHJcblx0LGRvd25sb2FkOmRvd25sb2FkXHJcblx0LGdldF9oZWFkOmdldF9oZWFkXHJcblx0LGdldF9kYXRlOmdldF9kYXRlXHJcblx0LGdldF9zaXplOmdldF9zaXplXHJcblx0LGdldERvd25sb2FkU2l6ZTpnZXRfc2l6ZVxyXG5cdCxxdWVyeVF1b3RhOnF1ZXJ5UXVvdGFcclxufVxyXG5tb2R1bGUuZXhwb3J0cz1BUEk7IiwidmFyIGh0bWw1ZnM9cmVxdWlyZShcIi4vaHRtbDVmc1wiKTtcclxudmFyIEU9UmVhY3QuY3JlYXRlRWxlbWVudDtcclxuXHJcbnZhciBodG1sZnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcblx0Z2V0SW5pdGlhbFN0YXRlOmZ1bmN0aW9uKCkgeyBcclxuXHRcdHJldHVybiB7cmVhZHk6ZmFsc2UsIHF1b3RhOjAsdXNhZ2U6MCxJbml0aWFsaXplZDpmYWxzZSxhdXRvY2xvc2U6dGhpcy5wcm9wcy5hdXRvY2xvc2V9O1xyXG5cdH0sXHJcblx0aW5pdEZpbGVzeXN0ZW06ZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgcXVvdGE9dGhpcy5wcm9wcy5xdW90YXx8MTAyNCoxMDI0KjEyODsgLy8gZGVmYXVsdCAxMjhNQlxyXG5cdFx0cXVvdGE9cGFyc2VJbnQocXVvdGEpO1xyXG5cdFx0aHRtbDVmcy5pbml0KHF1b3RhLGZ1bmN0aW9uKHEpe1xyXG5cdFx0XHR0aGlzLmRpYWxvZz1mYWxzZTtcclxuXHRcdFx0JCh0aGlzLnJlZnMuZGlhbG9nMS5nZXRET01Ob2RlKCkpLm1vZGFsKCdoaWRlJyk7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe3F1b3RhOnEsYXV0b2Nsb3NlOnRydWV9KTtcclxuXHRcdH0sdGhpcyk7XHJcblx0fSxcclxuXHR3ZWxjb21lOmZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIChcclxuXHRcdEUoXCJkaXZcIiwge3JlZjogXCJkaWFsb2cxXCIsIGNsYXNzTmFtZTogXCJtb2RhbCBmYWRlXCIsIGlkOiBcIm15TW9kYWxcIiwgXCJkYXRhLWJhY2tkcm9wXCI6IFwic3RhdGljXCJ9LCBcclxuXHRcdCAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtZGlhbG9nXCJ9LCBcclxuXHRcdCAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1jb250ZW50XCJ9LCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWhlYWRlclwifSwgXHJcblx0XHQgICAgICAgICAgRShcImg0XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtdGl0bGVcIn0sIFwiV2VsY29tZVwiKVxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWJvZHlcIn0sIFxyXG5cdFx0ICAgICAgICAgIFwiQnJvd3NlciB3aWxsIGFzayBmb3IgeW91ciBjb25maXJtYXRpb24uXCJcclxuXHRcdCAgICAgICAgKSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1mb290ZXJcIn0sIFxyXG5cdFx0ICAgICAgICAgIEUoXCJidXR0b25cIiwge29uQ2xpY2s6IHRoaXMuaW5pdEZpbGVzeXN0ZW0sIHR5cGU6IFwiYnV0dG9uXCIsIFxyXG5cdFx0ICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJ0biBidG4tcHJpbWFyeVwifSwgXCJJbml0aWFsaXplIEZpbGUgU3lzdGVtXCIpXHJcblx0XHQgICAgICAgIClcclxuXHRcdCAgICAgIClcclxuXHRcdCAgICApXHJcblx0XHQgIClcclxuXHRcdCApO1xyXG5cdH0sXHJcblx0cmVuZGVyRGVmYXVsdDpmdW5jdGlvbigpe1xyXG5cdFx0dmFyIHVzZWQ9TWF0aC5mbG9vcih0aGlzLnN0YXRlLnVzYWdlL3RoaXMuc3RhdGUucXVvdGEgKjEwMCk7XHJcblx0XHR2YXIgbW9yZT1mdW5jdGlvbigpIHtcclxuXHRcdFx0aWYgKHVzZWQ+NTApIHJldHVybiBFKFwiYnV0dG9uXCIsIHt0eXBlOiBcImJ1dHRvblwiLCBjbGFzc05hbWU6IFwiYnRuIGJ0bi1wcmltYXJ5XCJ9LCBcIkFsbG9jYXRlIE1vcmVcIik7XHJcblx0XHRcdGVsc2UgbnVsbDtcclxuXHRcdH1cclxuXHRcdHJldHVybiAoXHJcblx0XHRFKFwiZGl2XCIsIHtyZWY6IFwiZGlhbG9nMVwiLCBjbGFzc05hbWU6IFwibW9kYWwgZmFkZVwiLCBpZDogXCJteU1vZGFsXCIsIFwiZGF0YS1iYWNrZHJvcFwiOiBcInN0YXRpY1wifSwgXHJcblx0XHQgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWRpYWxvZ1wifSwgXHJcblx0XHQgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtY29udGVudFwifSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1oZWFkZXJcIn0sIFxyXG5cdFx0ICAgICAgICAgIEUoXCJoNFwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLXRpdGxlXCJ9LCBcIlNhbmRib3ggRmlsZSBTeXN0ZW1cIilcclxuXHRcdCAgICAgICAgKSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1ib2R5XCJ9LCBcclxuXHRcdCAgICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwicHJvZ3Jlc3NcIn0sIFxyXG5cdFx0ICAgICAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcInByb2dyZXNzLWJhclwiLCByb2xlOiBcInByb2dyZXNzYmFyXCIsIHN0eWxlOiB7d2lkdGg6IHVzZWQrXCIlXCJ9fSwgXHJcblx0XHQgICAgICAgICAgICAgICB1c2VkLCBcIiVcIlxyXG5cdFx0ICAgICAgICAgICAgKVxyXG5cdFx0ICAgICAgICAgICksIFxyXG5cdFx0ICAgICAgICAgIEUoXCJzcGFuXCIsIG51bGwsIHRoaXMuc3RhdGUucXVvdGEsIFwiIHRvdGFsICwgXCIsIHRoaXMuc3RhdGUudXNhZ2UsIFwiIGluIHVzZWRcIilcclxuXHRcdCAgICAgICAgKSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1mb290ZXJcIn0sIFxyXG5cdFx0ICAgICAgICAgIEUoXCJidXR0b25cIiwge29uQ2xpY2s6IHRoaXMuZGlzbWlzcywgdHlwZTogXCJidXR0b25cIiwgY2xhc3NOYW1lOiBcImJ0biBidG4tZGVmYXVsdFwiLCBcImRhdGEtZGlzbWlzc1wiOiBcIm1vZGFsXCJ9LCBcIkNsb3NlXCIpLCBcclxuXHRcdCAgICAgICAgICBtb3JlKClcclxuXHRcdCAgICAgICAgKVxyXG5cdFx0ICAgICAgKVxyXG5cdFx0ICAgIClcclxuXHRcdCAgKVxyXG5cdFx0ICApO1xyXG5cdH0sXHJcblx0ZGlzbWlzczpmdW5jdGlvbigpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdHRoYXQucHJvcHMub25SZWFkeSh0aGF0LnN0YXRlLnF1b3RhLHRoYXQuc3RhdGUudXNhZ2UpO1x0XHJcblx0XHR9LDApO1xyXG5cdH0sXHJcblx0cXVlcnlRdW90YTpmdW5jdGlvbigpIHtcclxuXHRcdGlmIChrc2FuYWdhcC5wbGF0Zm9ybT09XCJjaHJvbWVcIikge1xyXG5cdFx0XHRodG1sNWZzLnF1ZXJ5UXVvdGEoZnVuY3Rpb24odXNhZ2UscXVvdGEpe1xyXG5cdFx0XHRcdHRoaXMuc2V0U3RhdGUoe3VzYWdlOnVzYWdlLHF1b3RhOnF1b3RhLGluaXRpYWxpemVkOnRydWV9KTtcclxuXHRcdFx0fSx0aGlzKTtcdFx0XHRcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe3VzYWdlOjMzMyxxdW90YToxMDAwKjEwMDAqMTAyNCxpbml0aWFsaXplZDp0cnVlLGF1dG9jbG9zZTp0cnVlfSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHRyZW5kZXI6ZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0aWYgKCF0aGlzLnN0YXRlLnF1b3RhIHx8IHRoaXMuc3RhdGUucXVvdGE8dGhpcy5wcm9wcy5xdW90YSkge1xyXG5cdFx0XHRpZiAodGhpcy5zdGF0ZS5pbml0aWFsaXplZCkge1xyXG5cdFx0XHRcdHRoaXMuZGlhbG9nPXRydWU7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMud2VsY29tZSgpO1x0XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIEUoXCJzcGFuXCIsIG51bGwsIFwiY2hlY2tpbmcgcXVvdGFcIik7XHJcblx0XHRcdH1cdFx0XHRcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGlmICghdGhpcy5zdGF0ZS5hdXRvY2xvc2UpIHtcclxuXHRcdFx0XHR0aGlzLmRpYWxvZz10cnVlO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlckRlZmF1bHQoKTsgXHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5kaXNtaXNzKCk7XHJcblx0XHRcdHRoaXMuZGlhbG9nPWZhbHNlO1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHR9LFxyXG5cdGNvbXBvbmVudERpZE1vdW50OmZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKCF0aGlzLnN0YXRlLnF1b3RhKSB7XHJcblx0XHRcdHRoaXMucXVlcnlRdW90YSgpO1xyXG5cclxuXHRcdH07XHJcblx0fSxcclxuXHRjb21wb25lbnREaWRVcGRhdGU6ZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAodGhpcy5kaWFsb2cpICQodGhpcy5yZWZzLmRpYWxvZzEuZ2V0RE9NTm9kZSgpKS5tb2RhbCgnc2hvdycpO1xyXG5cdH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1odG1sZnM7IiwidmFyIGtzYW5hPXtcInBsYXRmb3JtXCI6XCJyZW1vdGVcIn07XHJcbmlmICh0eXBlb2Ygd2luZG93IT1cInVuZGVmaW5lZFwiKSB7XHJcblx0d2luZG93LmtzYW5hPWtzYW5hO1xyXG5cdGlmICh0eXBlb2Yga3NhbmFnYXA9PVwidW5kZWZpbmVkXCIpIHtcclxuXHRcdHdpbmRvdy5rc2FuYWdhcD1yZXF1aXJlKFwiLi9rc2FuYWdhcFwiKTsgLy9jb21wYXRpYmxlIGxheWVyIHdpdGggbW9iaWxlXHJcblx0fVxyXG59XHJcbmlmICh0eXBlb2YgcHJvY2VzcyAhPVwidW5kZWZpbmVkXCIpIHtcclxuXHRpZiAocHJvY2Vzcy52ZXJzaW9ucyAmJiBwcm9jZXNzLnZlcnNpb25zW1wibm9kZS13ZWJraXRcIl0pIHtcclxuICBcdFx0aWYgKHR5cGVvZiBub2RlUmVxdWlyZSE9XCJ1bmRlZmluZWRcIikga3NhbmEucmVxdWlyZT1ub2RlUmVxdWlyZTtcclxuICBcdFx0a3NhbmEucGxhdGZvcm09XCJub2RlLXdlYmtpdFwiO1xyXG4gIFx0XHR3aW5kb3cua3NhbmFnYXAucGxhdGZvcm09XCJub2RlLXdlYmtpdFwiO1xyXG5cdFx0dmFyIGtzYW5hanM9cmVxdWlyZShcImZzXCIpLnJlYWRGaWxlU3luYyhcImtzYW5hLmpzXCIsXCJ1dGY4XCIpLnRyaW0oKTtcclxuXHRcdGtzYW5hLmpzPUpTT04ucGFyc2Uoa3NhbmFqcy5zdWJzdHJpbmcoMTQsa3NhbmFqcy5sZW5ndGgtMSkpO1xyXG5cdFx0d2luZG93Lmtmcz1yZXF1aXJlKFwiLi9rZnNcIik7XHJcbiAgXHR9XHJcbn0gZWxzZSBpZiAodHlwZW9mIGNocm9tZSE9XCJ1bmRlZmluZWRcIil7Ly99ICYmIGNocm9tZS5maWxlU3lzdGVtKXtcclxuLy9cdHdpbmRvdy5rc2FuYWdhcD1yZXF1aXJlKFwiLi9rc2FuYWdhcFwiKTsgLy9jb21wYXRpYmxlIGxheWVyIHdpdGggbW9iaWxlXHJcblx0d2luZG93LmtzYW5hZ2FwLnBsYXRmb3JtPVwiY2hyb21lXCI7XHJcblx0d2luZG93Lmtmcz1yZXF1aXJlKFwiLi9rZnNfaHRtbDVcIik7XHJcblx0cmVxdWlyZShcIi4vbGl2ZXJlbG9hZFwiKSgpO1xyXG5cdGtzYW5hLnBsYXRmb3JtPVwiY2hyb21lXCI7XHJcbn0gZWxzZSB7XHJcblx0aWYgKHR5cGVvZiBrc2FuYWdhcCE9XCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgZnMhPVwidW5kZWZpbmVkXCIpIHsvL21vYmlsZVxyXG5cdFx0dmFyIGtzYW5hanM9ZnMucmVhZEZpbGVTeW5jKFwia3NhbmEuanNcIixcInV0ZjhcIikudHJpbSgpOyAvL2FuZHJvaWQgZXh0cmEgXFxuIGF0IHRoZSBlbmRcclxuXHRcdGtzYW5hLmpzPUpTT04ucGFyc2Uoa3NhbmFqcy5zdWJzdHJpbmcoMTQsa3NhbmFqcy5sZW5ndGgtMSkpO1xyXG5cdFx0a3NhbmEucGxhdGZvcm09a3NhbmFnYXAucGxhdGZvcm07XHJcblx0XHRpZiAodHlwZW9mIGtzYW5hZ2FwLmFuZHJvaWQgIT1cInVuZGVmaW5lZFwiKSB7XHJcblx0XHRcdGtzYW5hLnBsYXRmb3JtPVwiYW5kcm9pZFwiO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG52YXIgdGltZXI9bnVsbDtcclxudmFyIGJvb3Q9ZnVuY3Rpb24oYXBwSWQsY2IpIHtcclxuXHRrc2FuYS5hcHBJZD1hcHBJZDtcclxuXHRpZiAoa3NhbmFnYXAucGxhdGZvcm09PVwiY2hyb21lXCIpIHsgLy9uZWVkIHRvIHdhaXQgZm9yIGpzb25wIGtzYW5hLmpzXHJcblx0XHR0aW1lcj1zZXRJbnRlcnZhbChmdW5jdGlvbigpe1xyXG5cdFx0XHRpZiAoa3NhbmEucmVhZHkpe1xyXG5cdFx0XHRcdGNsZWFySW50ZXJ2YWwodGltZXIpO1xyXG5cdFx0XHRcdGlmIChrc2FuYS5qcyAmJiBrc2FuYS5qcy5maWxlcyAmJiBrc2FuYS5qcy5maWxlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdHJlcXVpcmUoXCIuL2luc3RhbGxrZGJcIikoa3NhbmEuanMsY2IpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRjYigpO1x0XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0sMzAwKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0Y2IoKTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzPXtib290OmJvb3RcclxuXHQsaHRtbGZzOnJlcXVpcmUoXCIuL2h0bWxmc1wiKVxyXG5cdCxodG1sNWZzOnJlcXVpcmUoXCIuL2h0bWw1ZnNcIilcclxuXHQsbGl2ZXVwZGF0ZTpyZXF1aXJlKFwiLi9saXZldXBkYXRlXCIpXHJcblx0LGZpbGVpbnN0YWxsZXI6cmVxdWlyZShcIi4vZmlsZWluc3RhbGxlclwiKVxyXG5cdCxkb3dubG9hZGVyOnJlcXVpcmUoXCIuL2Rvd25sb2FkZXJcIilcclxuXHQsaW5zdGFsbGtkYjpyZXF1aXJlKFwiLi9pbnN0YWxsa2RiXCIpXHJcbn07IiwidmFyIEZpbGVpbnN0YWxsZXI9cmVxdWlyZShcIi4vZmlsZWluc3RhbGxlclwiKTtcclxuXHJcbnZhciBnZXRSZXF1aXJlX2tkYj1mdW5jdGlvbigpIHtcclxuICAgIHZhciByZXF1aXJlZD1bXTtcclxuICAgIGtzYW5hLmpzLmZpbGVzLm1hcChmdW5jdGlvbihmKXtcclxuICAgICAgaWYgKGYuaW5kZXhPZihcIi5rZGJcIik9PWYubGVuZ3RoLTQpIHtcclxuICAgICAgICB2YXIgc2xhc2g9Zi5sYXN0SW5kZXhPZihcIi9cIik7XHJcbiAgICAgICAgaWYgKHNsYXNoPi0xKSB7XHJcbiAgICAgICAgICB2YXIgZGJpZD1mLnN1YnN0cmluZyhzbGFzaCsxLGYubGVuZ3RoLTQpO1xyXG4gICAgICAgICAgcmVxdWlyZWQucHVzaCh7dXJsOmYsZGJpZDpkYmlkLGZpbGVuYW1lOmRiaWQrXCIua2RiXCJ9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmFyIGRiaWQ9Zi5zdWJzdHJpbmcoMCxmLmxlbmd0aC00KTtcclxuICAgICAgICAgIHJlcXVpcmVkLnB1c2goe3VybDprc2FuYS5qcy5iYXNldXJsK2YsZGJpZDpkYmlkLGZpbGVuYW1lOmZ9KTtcclxuICAgICAgICB9ICAgICAgICBcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVxdWlyZWQ7XHJcbn1cclxudmFyIGNhbGxiYWNrPW51bGw7XHJcbnZhciBvblJlYWR5PWZ1bmN0aW9uKCkge1xyXG5cdGNhbGxiYWNrKCk7XHJcbn1cclxudmFyIG9wZW5GaWxlaW5zdGFsbGVyPWZ1bmN0aW9uKGtlZXApIHtcclxuXHR2YXIgcmVxdWlyZV9rZGI9Z2V0UmVxdWlyZV9rZGIoKS5tYXAoZnVuY3Rpb24oZGIpe1xyXG5cdCAgcmV0dXJuIHtcclxuXHQgICAgdXJsOndpbmRvdy5sb2NhdGlvbi5vcmlnaW4rd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lK2RiLmRiaWQrXCIua2RiXCIsXHJcblx0ICAgIGRiZGI6ZGIuZGJpZCxcclxuXHQgICAgZmlsZW5hbWU6ZGIuZmlsZW5hbWVcclxuXHQgIH1cclxuXHR9KVxyXG5cdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEZpbGVpbnN0YWxsZXIsIHtxdW90YTogXCI1MTJNXCIsIGF1dG9jbG9zZTogIWtlZXAsIG5lZWRlZDogcmVxdWlyZV9rZGIsIFxyXG5cdCAgICAgICAgICAgICAgICAgb25SZWFkeTogb25SZWFkeX0pO1xyXG59XHJcbnZhciBpbnN0YWxsa2RiPWZ1bmN0aW9uKGtzYW5hanMsY2IsY29udGV4dCkge1xyXG5cdGNvbnNvbGUubG9nKGtzYW5hanMuZmlsZXMpO1xyXG5cdFJlYWN0LnJlbmRlcihvcGVuRmlsZWluc3RhbGxlcigpLGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFpblwiKSk7XHJcblx0Y2FsbGJhY2s9Y2I7XHJcbn1cclxubW9kdWxlLmV4cG9ydHM9aW5zdGFsbGtkYjsiLCIvL1NpbXVsYXRlIGZlYXR1cmUgaW4ga3NhbmFnYXBcclxuLyogXHJcbiAgcnVucyBvbiBub2RlLXdlYmtpdCBvbmx5XHJcbiovXHJcblxyXG52YXIgcmVhZERpcj1mdW5jdGlvbihwYXRoKSB7IC8vc2ltdWxhdGUgS3NhbmFnYXAgZnVuY3Rpb25cclxuXHR2YXIgZnM9bm9kZVJlcXVpcmUoXCJmc1wiKTtcclxuXHRwYXRoPXBhdGh8fFwiLi5cIjtcclxuXHR2YXIgZGlycz1bXTtcclxuXHRpZiAocGF0aFswXT09XCIuXCIpIHtcclxuXHRcdGlmIChwYXRoPT1cIi5cIikgZGlycz1mcy5yZWFkZGlyU3luYyhcIi5cIik7XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0ZGlycz1mcy5yZWFkZGlyU3luYyhcIi4uXCIpO1xyXG5cdFx0fVxyXG5cdH0gZWxzZSB7XHJcblx0XHRkaXJzPWZzLnJlYWRkaXJTeW5jKHBhdGgpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGRpcnMuam9pbihcIlxcdWZmZmZcIik7XHJcbn1cclxudmFyIGxpc3RBcHBzPWZ1bmN0aW9uKCkge1xyXG5cdHZhciBmcz1ub2RlUmVxdWlyZShcImZzXCIpO1xyXG5cdHZhciBrc2FuYWpzZmlsZT1mdW5jdGlvbihkKSB7cmV0dXJuIFwiLi4vXCIrZCtcIi9rc2FuYS5qc1wifTtcclxuXHR2YXIgZGlycz1mcy5yZWFkZGlyU3luYyhcIi4uXCIpLmZpbHRlcihmdW5jdGlvbihkKXtcclxuXHRcdFx0XHRyZXR1cm4gZnMuc3RhdFN5bmMoXCIuLi9cIitkKS5pc0RpcmVjdG9yeSgpICYmIGRbMF0hPVwiLlwiXHJcblx0XHRcdFx0ICAgJiYgZnMuZXhpc3RzU3luYyhrc2FuYWpzZmlsZShkKSk7XHJcblx0fSk7XHJcblx0XHJcblx0dmFyIG91dD1kaXJzLm1hcChmdW5jdGlvbihkKXtcclxuXHRcdHZhciBjb250ZW50PWZzLnJlYWRGaWxlU3luYyhrc2FuYWpzZmlsZShkKSxcInV0ZjhcIik7XHJcbiAgXHRjb250ZW50PWNvbnRlbnQucmVwbGFjZShcIn0pXCIsXCJ9XCIpO1xyXG4gIFx0Y29udGVudD1jb250ZW50LnJlcGxhY2UoXCJqc29ucF9oYW5kbGVyKFwiLFwiXCIpO1xyXG5cdFx0dmFyIG9iaj0gSlNPTi5wYXJzZShjb250ZW50KTtcclxuXHRcdG9iai5kYmlkPWQ7XHJcblx0XHRvYmoucGF0aD1kO1xyXG5cdFx0cmV0dXJuIG9iajtcclxuXHR9KVxyXG5cdHJldHVybiBKU09OLnN0cmluZ2lmeShvdXQpO1xyXG59XHJcblxyXG5cclxuXHJcbnZhciBrZnM9e3JlYWREaXI6cmVhZERpcixsaXN0QXBwczpsaXN0QXBwc307XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1rZnM7IiwidmFyIHJlYWREaXI9ZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gW107XHJcbn1cclxudmFyIGxpc3RBcHBzPWZ1bmN0aW9uKCl7XHJcblx0cmV0dXJuIFtdO1xyXG59XHJcbm1vZHVsZS5leHBvcnRzPXtyZWFkRGlyOnJlYWREaXIsbGlzdEFwcHM6bGlzdEFwcHN9OyIsInZhciBhcHBuYW1lPVwiaW5zdGFsbGVyXCI7XHJcbnZhciBzd2l0Y2hBcHA9ZnVuY3Rpb24ocGF0aCkge1xyXG5cdHZhciBmcz1yZXF1aXJlKFwiZnNcIik7XHJcblx0cGF0aD1cIi4uL1wiK3BhdGg7XHJcblx0YXBwbmFtZT1wYXRoO1xyXG5cdGRvY3VtZW50LmxvY2F0aW9uLmhyZWY9IHBhdGgrXCIvaW5kZXguaHRtbFwiOyBcclxuXHRwcm9jZXNzLmNoZGlyKHBhdGgpO1xyXG59XHJcbnZhciBkb3dubG9hZGVyPXt9O1xyXG52YXIgcm9vdFBhdGg9XCJcIjtcclxuXHJcbnZhciBkZWxldGVBcHA9ZnVuY3Rpb24oYXBwKSB7XHJcblx0Y29uc29sZS5lcnJvcihcIm5vdCBhbGxvdyBvbiBQQywgZG8gaXQgaW4gRmlsZSBFeHBsb3Jlci8gRmluZGVyXCIpO1xyXG59XHJcbnZhciB1c2VybmFtZT1mdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gXCJcIjtcclxufVxyXG52YXIgdXNlcmVtYWlsPWZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiBcIlwiXHJcbn1cclxudmFyIHJ1bnRpbWVfdmVyc2lvbj1mdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gXCIxLjRcIjtcclxufVxyXG5cclxuLy9jb3B5IGZyb20gbGl2ZXVwZGF0ZVxyXG52YXIganNvbnA9ZnVuY3Rpb24odXJsLGRiaWQsY2FsbGJhY2ssY29udGV4dCkge1xyXG4gIHZhciBzY3JpcHQ9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqc29ucDJcIik7XHJcbiAgaWYgKHNjcmlwdCkge1xyXG4gICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuICB9XHJcbiAgd2luZG93Lmpzb25wX2hhbmRsZXI9ZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgaWYgKHR5cGVvZiBkYXRhPT1cIm9iamVjdFwiKSB7XHJcbiAgICAgIGRhdGEuZGJpZD1kYmlkO1xyXG4gICAgICBjYWxsYmFjay5hcHBseShjb250ZXh0LFtkYXRhXSk7ICAgIFxyXG4gICAgfSAgXHJcbiAgfVxyXG4gIHdpbmRvdy5qc29ucF9lcnJvcl9oYW5kbGVyPWZ1bmN0aW9uKCkge1xyXG4gICAgY29uc29sZS5lcnJvcihcInVybCB1bnJlYWNoYWJsZVwiLHVybCk7XHJcbiAgICBjYWxsYmFjay5hcHBseShjb250ZXh0LFtudWxsXSk7XHJcbiAgfVxyXG4gIHNjcmlwdD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuICBzY3JpcHQuc2V0QXR0cmlidXRlKCdpZCcsIFwianNvbnAyXCIpO1xyXG4gIHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ29uZXJyb3InLCBcImpzb25wX2Vycm9yX2hhbmRsZXIoKVwiKTtcclxuICB1cmw9dXJsKyc/JysobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xyXG4gIHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ3NyYycsIHVybCk7XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpOyBcclxufVxyXG5cclxudmFyIGtzYW5hZ2FwPXtcclxuXHRwbGF0Zm9ybTpcIm5vZGUtd2Via2l0XCIsXHJcblx0c3RhcnREb3dubG9hZDpkb3dubG9hZGVyLnN0YXJ0RG93bmxvYWQsXHJcblx0ZG93bmxvYWRlZEJ5dGU6ZG93bmxvYWRlci5kb3dubG9hZGVkQnl0ZSxcclxuXHRkb3dubG9hZGluZ0ZpbGU6ZG93bmxvYWRlci5kb3dubG9hZGluZ0ZpbGUsXHJcblx0Y2FuY2VsRG93bmxvYWQ6ZG93bmxvYWRlci5jYW5jZWxEb3dubG9hZCxcclxuXHRkb25lRG93bmxvYWQ6ZG93bmxvYWRlci5kb25lRG93bmxvYWQsXHJcblx0c3dpdGNoQXBwOnN3aXRjaEFwcCxcclxuXHRyb290UGF0aDpyb290UGF0aCxcclxuXHRkZWxldGVBcHA6IGRlbGV0ZUFwcCxcclxuXHR1c2VybmFtZTp1c2VybmFtZSwgLy9ub3Qgc3VwcG9ydCBvbiBQQ1xyXG5cdHVzZXJlbWFpbDp1c2VybmFtZSxcclxuXHRydW50aW1lX3ZlcnNpb246cnVudGltZV92ZXJzaW9uLFxyXG5cdFxyXG59XHJcblxyXG5pZiAodHlwZW9mIHByb2Nlc3MhPVwidW5kZWZpbmVkXCIpIHtcclxuXHR2YXIga3NhbmFqcz1yZXF1aXJlKFwiZnNcIikucmVhZEZpbGVTeW5jKFwiLi9rc2FuYS5qc1wiLFwidXRmOFwiKS50cmltKCk7XHJcblx0ZG93bmxvYWRlcj1yZXF1aXJlKFwiLi9kb3dubG9hZGVyXCIpO1xyXG5cdGNvbnNvbGUubG9nKGtzYW5hanMpO1xyXG5cdC8va3NhbmEuanM9SlNPTi5wYXJzZShrc2FuYWpzLnN1YnN0cmluZygxNCxrc2FuYWpzLmxlbmd0aC0xKSk7XHJcblx0cm9vdFBhdGg9cHJvY2Vzcy5jd2QoKTtcclxuXHRyb290UGF0aD1yZXF1aXJlKFwicGF0aFwiKS5yZXNvbHZlKHJvb3RQYXRoLFwiLi5cIikucmVwbGFjZSgvXFxcXC9nLFwiL1wiKSsnLyc7XHJcblx0a3NhbmEucmVhZHk9dHJ1ZTtcclxufSBlbHNle1xyXG5cdHZhciB1cmw9d2luZG93LmxvY2F0aW9uLm9yaWdpbit3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZShcImluZGV4Lmh0bWxcIixcIlwiKStcImtzYW5hLmpzXCI7XHJcblx0anNvbnAodXJsLGFwcG5hbWUsZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRrc2FuYS5qcz1kYXRhO1xyXG5cdFx0a3NhbmEucmVhZHk9dHJ1ZTtcclxuXHR9KTtcclxufVxyXG5tb2R1bGUuZXhwb3J0cz1rc2FuYWdhcDsiLCJ2YXIgc3RhcnRlZD1mYWxzZTtcclxudmFyIHRpbWVyPW51bGw7XHJcbnZhciBidW5kbGVkYXRlPW51bGw7XHJcbnZhciBnZXRfZGF0ZT1yZXF1aXJlKFwiLi9odG1sNWZzXCIpLmdldF9kYXRlO1xyXG52YXIgY2hlY2tJZkJ1bmRsZVVwZGF0ZWQ9ZnVuY3Rpb24oKSB7XHJcblx0Z2V0X2RhdGUoXCJidW5kbGUuanNcIixmdW5jdGlvbihkYXRlKXtcclxuXHRcdGlmIChidW5kbGVkYXRlICYmYnVuZGxlZGF0ZSE9ZGF0ZSl7XHJcblx0XHRcdGxvY2F0aW9uLnJlbG9hZCgpO1xyXG5cdFx0fVxyXG5cdFx0YnVuZGxlZGF0ZT1kYXRlO1xyXG5cdH0pO1xyXG59XHJcbnZhciBsaXZlcmVsb2FkPWZ1bmN0aW9uKCkge1xyXG5cdGlmIChzdGFydGVkKSByZXR1cm47XHJcblxyXG5cdHRpbWVyMT1zZXRJbnRlcnZhbChmdW5jdGlvbigpe1xyXG5cdFx0Y2hlY2tJZkJ1bmRsZVVwZGF0ZWQoKTtcclxuXHR9LDIwMDApO1xyXG5cdHN0YXJ0ZWQ9dHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHM9bGl2ZXJlbG9hZDsiLCJcclxudmFyIGpzb25wPWZ1bmN0aW9uKHVybCxkYmlkLGNhbGxiYWNrLGNvbnRleHQpIHtcclxuICB2YXIgc2NyaXB0PWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianNvbnBcIik7XHJcbiAgaWYgKHNjcmlwdCkge1xyXG4gICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuICB9XHJcbiAgd2luZG93Lmpzb25wX2hhbmRsZXI9ZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgLy9jb25zb2xlLmxvZyhcInJlY2VpdmUgZnJvbSBrc2FuYS5qc1wiLGRhdGEpO1xyXG4gICAgaWYgKHR5cGVvZiBkYXRhPT1cIm9iamVjdFwiKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgZGF0YS5kYmlkPT1cInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgZGF0YS5kYmlkPWRiaWQ7XHJcbiAgICAgIH1cclxuICAgICAgY2FsbGJhY2suYXBwbHkoY29udGV4dCxbZGF0YV0pO1xyXG4gICAgfSAgXHJcbiAgfVxyXG5cclxuICB3aW5kb3cuanNvbnBfZXJyb3JfaGFuZGxlcj1mdW5jdGlvbigpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJ1cmwgdW5yZWFjaGFibGVcIix1cmwpO1xyXG4gICAgY2FsbGJhY2suYXBwbHkoY29udGV4dCxbbnVsbF0pO1xyXG4gIH1cclxuXHJcbiAgc2NyaXB0PWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gIHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ2lkJywgXCJqc29ucFwiKTtcclxuICBzY3JpcHQuc2V0QXR0cmlidXRlKCdvbmVycm9yJywgXCJqc29ucF9lcnJvcl9oYW5kbGVyKClcIik7XHJcbiAgdXJsPXVybCsnPycrKG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcclxuICBzY3JpcHQuc2V0QXR0cmlidXRlKCdzcmMnLCB1cmwpO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc2NyaXB0KTsgXHJcbn1cclxudmFyIHJ1bnRpbWVfdmVyc2lvbl9vaz1mdW5jdGlvbihtaW5ydW50aW1lKSB7XHJcbiAgaWYgKCFtaW5ydW50aW1lKSByZXR1cm4gdHJ1ZTsvL25vdCBtZW50aW9uZWQuXHJcbiAgdmFyIG1pbj1wYXJzZUZsb2F0KG1pbnJ1bnRpbWUpO1xyXG4gIHZhciBydW50aW1lPXBhcnNlRmxvYXQoIGtzYW5hZ2FwLnJ1bnRpbWVfdmVyc2lvbigpfHxcIjEuMFwiKTtcclxuICBpZiAobWluPnJ1bnRpbWUpIHJldHVybiBmYWxzZTtcclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxudmFyIG5lZWRUb1VwZGF0ZT1mdW5jdGlvbihmcm9tanNvbix0b2pzb24pIHtcclxuICB2YXIgbmVlZFVwZGF0ZXM9W107XHJcbiAgZm9yICh2YXIgaT0wO2k8ZnJvbWpzb24ubGVuZ3RoO2krKykgeyBcclxuICAgIHZhciB0bz10b2pzb25baV07XHJcbiAgICB2YXIgZnJvbT1mcm9tanNvbltpXTtcclxuICAgIHZhciBuZXdmaWxlcz1bXSxuZXdmaWxlc2l6ZXM9W10scmVtb3ZlZD1bXTtcclxuICAgIFxyXG4gICAgaWYgKCF0bykgY29udGludWU7IC8vY2Fubm90IHJlYWNoIGhvc3RcclxuICAgIGlmICghcnVudGltZV92ZXJzaW9uX29rKHRvLm1pbnJ1bnRpbWUpKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybihcInJ1bnRpbWUgdG9vIG9sZCwgbmVlZCBcIit0by5taW5ydW50aW1lKTtcclxuICAgICAgY29udGludWU7IFxyXG4gICAgfVxyXG4gICAgaWYgKCFmcm9tLmZpbGVkYXRlcykge1xyXG4gICAgICBjb25zb2xlLndhcm4oXCJtaXNzaW5nIGZpbGVkYXRlcyBpbiBrc2FuYS5qcyBvZiBcIitmcm9tLmRiaWQpO1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuICAgIGZyb20uZmlsZWRhdGVzLm1hcChmdW5jdGlvbihmLGlkeCl7XHJcbiAgICAgIHZhciBuZXdpZHg9dG8uZmlsZXMuaW5kZXhPZiggZnJvbS5maWxlc1tpZHhdKTtcclxuICAgICAgaWYgKG5ld2lkeD09LTEpIHtcclxuICAgICAgICAvL2ZpbGUgcmVtb3ZlZCBpbiBuZXcgdmVyc2lvblxyXG4gICAgICAgIHJlbW92ZWQucHVzaChmcm9tLmZpbGVzW2lkeF0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBmcm9tZGF0ZT1EYXRlLnBhcnNlKGYpO1xyXG4gICAgICAgIHZhciB0b2RhdGU9RGF0ZS5wYXJzZSh0by5maWxlZGF0ZXNbbmV3aWR4XSk7XHJcbiAgICAgICAgaWYgKGZyb21kYXRlPHRvZGF0ZSkge1xyXG4gICAgICAgICAgbmV3ZmlsZXMucHVzaCggdG8uZmlsZXNbbmV3aWR4XSApO1xyXG4gICAgICAgICAgbmV3ZmlsZXNpemVzLnB1c2godG8uZmlsZXNpemVzW25ld2lkeF0pO1xyXG4gICAgICAgIH0gICAgICAgIFxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGlmIChuZXdmaWxlcy5sZW5ndGgpIHtcclxuICAgICAgZnJvbS5uZXdmaWxlcz1uZXdmaWxlcztcclxuICAgICAgZnJvbS5uZXdmaWxlc2l6ZXM9bmV3ZmlsZXNpemVzO1xyXG4gICAgICBmcm9tLnJlbW92ZWQ9cmVtb3ZlZDtcclxuICAgICAgbmVlZFVwZGF0ZXMucHVzaChmcm9tKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIG5lZWRVcGRhdGVzO1xyXG59XHJcbnZhciBnZXRVcGRhdGFibGVzPWZ1bmN0aW9uKGFwcHMsY2IsY29udGV4dCkge1xyXG4gIGdldFJlbW90ZUpzb24oYXBwcyxmdW5jdGlvbihqc29ucyl7XHJcbiAgICB2YXIgaGFzVXBkYXRlcz1uZWVkVG9VcGRhdGUoYXBwcyxqc29ucyk7XHJcbiAgICBjYi5hcHBseShjb250ZXh0LFtoYXNVcGRhdGVzXSk7XHJcbiAgfSxjb250ZXh0KTtcclxufVxyXG52YXIgZ2V0UmVtb3RlSnNvbj1mdW5jdGlvbihhcHBzLGNiLGNvbnRleHQpIHtcclxuICB2YXIgdGFza3F1ZXVlPVtdLG91dHB1dD1bXTtcclxuICB2YXIgbWFrZWNiPWZ1bmN0aW9uKGFwcCl7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgaWYgKCEoZGF0YSAmJiB0eXBlb2YgZGF0YSA9PSdvYmplY3QnICYmIGRhdGEuX19lbXB0eSkpIG91dHB1dC5wdXNoKGRhdGEpO1xyXG4gICAgICAgIGlmICghYXBwLmJhc2V1cmwpIHtcclxuICAgICAgICAgIHRhc2txdWV1ZS5zaGlmdCh7X19lbXB0eTp0cnVlfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZhciB1cmw9YXBwLmJhc2V1cmwrXCIva3NhbmEuanNcIjsgICAgXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyh1cmwpO1xyXG4gICAgICAgICAganNvbnAoIHVybCAsYXBwLmRiaWQsdGFza3F1ZXVlLnNoaWZ0KCksIGNvbnRleHQpOyAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICB9O1xyXG4gIGFwcHMuZm9yRWFjaChmdW5jdGlvbihhcHApe3Rhc2txdWV1ZS5wdXNoKG1ha2VjYihhcHApKX0pO1xyXG5cclxuICB0YXNrcXVldWUucHVzaChmdW5jdGlvbihkYXRhKXtcclxuICAgIG91dHB1dC5wdXNoKGRhdGEpO1xyXG4gICAgY2IuYXBwbHkoY29udGV4dCxbb3V0cHV0XSk7XHJcbiAgfSk7XHJcblxyXG4gIHRhc2txdWV1ZS5zaGlmdCgpKHtfX2VtcHR5OnRydWV9KTsgLy9ydW4gdGhlIHRhc2tcclxufVxyXG52YXIgaHVtYW5GaWxlU2l6ZT1mdW5jdGlvbihieXRlcywgc2kpIHtcclxuICAgIHZhciB0aHJlc2ggPSBzaSA/IDEwMDAgOiAxMDI0O1xyXG4gICAgaWYoYnl0ZXMgPCB0aHJlc2gpIHJldHVybiBieXRlcyArICcgQic7XHJcbiAgICB2YXIgdW5pdHMgPSBzaSA/IFsna0InLCdNQicsJ0dCJywnVEInLCdQQicsJ0VCJywnWkInLCdZQiddIDogWydLaUInLCdNaUInLCdHaUInLCdUaUInLCdQaUInLCdFaUInLCdaaUInLCdZaUInXTtcclxuICAgIHZhciB1ID0gLTE7XHJcbiAgICBkbyB7XHJcbiAgICAgICAgYnl0ZXMgLz0gdGhyZXNoO1xyXG4gICAgICAgICsrdTtcclxuICAgIH0gd2hpbGUoYnl0ZXMgPj0gdGhyZXNoKTtcclxuICAgIHJldHVybiBieXRlcy50b0ZpeGVkKDEpKycgJyt1bml0c1t1XTtcclxufTtcclxuXHJcbnZhciBzdGFydD1mdW5jdGlvbihrc2FuYWpzLGNiLGNvbnRleHQpe1xyXG4gIHZhciBmaWxlcz1rc2FuYWpzLm5ld2ZpbGVzfHxrc2FuYWpzLmZpbGVzO1xyXG4gIHZhciBiYXNldXJsPWtzYW5hanMuYmFzZXVybHx8IFwiaHR0cDovLzEyNy4wLjAuMTo4MDgwL1wiK2tzYW5hanMuZGJpZCtcIi9cIjtcclxuICB2YXIgc3RhcnRlZD1rc2FuYWdhcC5zdGFydERvd25sb2FkKGtzYW5hanMuZGJpZCxiYXNldXJsLGZpbGVzLmpvaW4oXCJcXHVmZmZmXCIpKTtcclxuICBjYi5hcHBseShjb250ZXh0LFtzdGFydGVkXSk7XHJcbn1cclxudmFyIHN0YXR1cz1mdW5jdGlvbigpe1xyXG4gIHZhciBuZmlsZT1rc2FuYWdhcC5kb3dubG9hZGluZ0ZpbGUoKTtcclxuICB2YXIgZG93bmxvYWRlZEJ5dGU9a3NhbmFnYXAuZG93bmxvYWRlZEJ5dGUoKTtcclxuICB2YXIgZG9uZT1rc2FuYWdhcC5kb25lRG93bmxvYWQoKTtcclxuICByZXR1cm4ge25maWxlOm5maWxlLGRvd25sb2FkZWRCeXRlOmRvd25sb2FkZWRCeXRlLCBkb25lOmRvbmV9O1xyXG59XHJcblxyXG52YXIgY2FuY2VsPWZ1bmN0aW9uKCl7XHJcbiAgcmV0dXJuIGtzYW5hZ2FwLmNhbmNlbERvd25sb2FkKCk7XHJcbn1cclxuXHJcbnZhciBsaXZldXBkYXRlPXsgaHVtYW5GaWxlU2l6ZTogaHVtYW5GaWxlU2l6ZSwgXHJcbiAgbmVlZFRvVXBkYXRlOiBuZWVkVG9VcGRhdGUgLCBqc29ucDpqc29ucCwgXHJcbiAgZ2V0VXBkYXRhYmxlczpnZXRVcGRhdGFibGVzLFxyXG4gIHN0YXJ0OnN0YXJ0LFxyXG4gIGNhbmNlbDpjYW5jZWwsXHJcbiAgc3RhdHVzOnN0YXR1c1xyXG4gIH07XHJcbm1vZHVsZS5leHBvcnRzPWxpdmV1cGRhdGU7IiwiZnVuY3Rpb24gbWtkaXJQIChwLCBtb2RlLCBmLCBtYWRlKSB7XHJcbiAgICAgdmFyIHBhdGggPSBub2RlUmVxdWlyZSgncGF0aCcpO1xyXG4gICAgIHZhciBmcyA9IG5vZGVSZXF1aXJlKCdmcycpO1xyXG5cdFxyXG4gICAgaWYgKHR5cGVvZiBtb2RlID09PSAnZnVuY3Rpb24nIHx8IG1vZGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGYgPSBtb2RlO1xyXG4gICAgICAgIG1vZGUgPSAweDFGRiAmICh+cHJvY2Vzcy51bWFzaygpKTtcclxuICAgIH1cclxuICAgIGlmICghbWFkZSkgbWFkZSA9IG51bGw7XHJcblxyXG4gICAgdmFyIGNiID0gZiB8fCBmdW5jdGlvbiAoKSB7fTtcclxuICAgIGlmICh0eXBlb2YgbW9kZSA9PT0gJ3N0cmluZycpIG1vZGUgPSBwYXJzZUludChtb2RlLCA4KTtcclxuICAgIHAgPSBwYXRoLnJlc29sdmUocCk7XHJcblxyXG4gICAgZnMubWtkaXIocCwgbW9kZSwgZnVuY3Rpb24gKGVyKSB7XHJcbiAgICAgICAgaWYgKCFlcikge1xyXG4gICAgICAgICAgICBtYWRlID0gbWFkZSB8fCBwO1xyXG4gICAgICAgICAgICByZXR1cm4gY2IobnVsbCwgbWFkZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN3aXRjaCAoZXIuY29kZSkge1xyXG4gICAgICAgICAgICBjYXNlICdFTk9FTlQnOlxyXG4gICAgICAgICAgICAgICAgbWtkaXJQKHBhdGguZGlybmFtZShwKSwgbW9kZSwgZnVuY3Rpb24gKGVyLCBtYWRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyKSBjYihlciwgbWFkZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBta2RpclAocCwgbW9kZSwgY2IsIG1hZGUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIC8vIEluIHRoZSBjYXNlIG9mIGFueSBvdGhlciBlcnJvciwganVzdCBzZWUgaWYgdGhlcmUncyBhIGRpclxyXG4gICAgICAgICAgICAvLyB0aGVyZSBhbHJlYWR5LiAgSWYgc28sIHRoZW4gaG9vcmF5ISAgSWYgbm90LCB0aGVuIHNvbWV0aGluZ1xyXG4gICAgICAgICAgICAvLyBpcyBib3JrZWQuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBmcy5zdGF0KHAsIGZ1bmN0aW9uIChlcjIsIHN0YXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgc3RhdCBmYWlscywgdGhlbiB0aGF0J3Mgc3VwZXIgd2VpcmQuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbGV0IHRoZSBvcmlnaW5hbCBlcnJvciBiZSB0aGUgZmFpbHVyZSByZWFzb24uXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyMiB8fCAhc3RhdC5pc0RpcmVjdG9yeSgpKSBjYihlciwgbWFkZSlcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGNiKG51bGwsIG1hZGUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxubWtkaXJQLnN5bmMgPSBmdW5jdGlvbiBzeW5jIChwLCBtb2RlLCBtYWRlKSB7XHJcbiAgICB2YXIgcGF0aCA9IG5vZGVSZXF1aXJlKCdwYXRoJyk7XHJcbiAgICB2YXIgZnMgPSBub2RlUmVxdWlyZSgnZnMnKTtcclxuICAgIGlmIChtb2RlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBtb2RlID0gMHgxRkYgJiAofnByb2Nlc3MudW1hc2soKSk7XHJcbiAgICB9XHJcbiAgICBpZiAoIW1hZGUpIG1hZGUgPSBudWxsO1xyXG5cclxuICAgIGlmICh0eXBlb2YgbW9kZSA9PT0gJ3N0cmluZycpIG1vZGUgPSBwYXJzZUludChtb2RlLCA4KTtcclxuICAgIHAgPSBwYXRoLnJlc29sdmUocCk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBmcy5ta2RpclN5bmMocCwgbW9kZSk7XHJcbiAgICAgICAgbWFkZSA9IG1hZGUgfHwgcDtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnIwKSB7XHJcbiAgICAgICAgc3dpdGNoIChlcnIwLmNvZGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnRU5PRU5UJyA6XHJcbiAgICAgICAgICAgICAgICBtYWRlID0gc3luYyhwYXRoLmRpcm5hbWUocCksIG1vZGUsIG1hZGUpO1xyXG4gICAgICAgICAgICAgICAgc3luYyhwLCBtb2RlLCBtYWRlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgLy8gSW4gdGhlIGNhc2Ugb2YgYW55IG90aGVyIGVycm9yLCBqdXN0IHNlZSBpZiB0aGVyZSdzIGEgZGlyXHJcbiAgICAgICAgICAgIC8vIHRoZXJlIGFscmVhZHkuICBJZiBzbywgdGhlbiBob29yYXkhICBJZiBub3QsIHRoZW4gc29tZXRoaW5nXHJcbiAgICAgICAgICAgIC8vIGlzIGJvcmtlZC5cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHZhciBzdGF0O1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ID0gZnMuc3RhdFN5bmMocCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXN0YXQuaXNEaXJlY3RvcnkoKSkgdGhyb3cgZXJyMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbWFkZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbWtkaXJQLm1rZGlycCA9IG1rZGlyUC5ta2RpclAgPSBta2RpclA7XHJcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBFdmVudEVtaXR0ZXIgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRXZlbnQgaGFuZGxlciB0byBiZSBjYWxsZWQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IENvbnRleHQgZm9yIGZ1bmN0aW9uIGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IGVtaXQgb25jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogRXZlbnRFbWl0dGVyIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHsgLyogTm90aGluZyB0byBzZXQgKi8gfVxuXG4vKipcbiAqIEhvbGRzIHRoZSBhc3NpZ25lZCBFdmVudEVtaXR0ZXJzIGJ5IG5hbWUuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZXR1cm4gYSBsaXN0IG9mIGFzc2lnbmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50cyB0aGF0IHNob3VsZCBiZSBsaXN0ZWQuXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2ZW50XSkgcmV0dXJuIFtdO1xuICBpZiAodGhpcy5fZXZlbnRzW2V2ZW50XS5mbikgcmV0dXJuIFt0aGlzLl9ldmVudHNbZXZlbnRdLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuX2V2ZW50c1tldmVudF0ubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gdGhpcy5fZXZlbnRzW2V2ZW50XVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogRW1pdCBhbiBldmVudCB0byBhbGwgcmVnaXN0ZXJlZCBldmVudCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBJbmRpY2F0aW9uIGlmIHdlJ3ZlIGVtaXR0ZWQgYW4gZXZlbnQuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1tldmVudF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2ZW50XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgbmV3IEV2ZW50TGlzdGVuZXIgZm9yIHRoZSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0b259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2ZW50XSkgdGhpcy5fZXZlbnRzW2V2ZW50XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldmVudF0uZm4pIHRoaXMuX2V2ZW50c1tldmVudF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZlbnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2ZW50XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhbiBFdmVudExpc3RlbmVyIHRoYXQncyBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcywgdHJ1ZSk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldmVudF0pIHRoaXMuX2V2ZW50c1tldmVudF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZlbnRdLmZuKSB0aGlzLl9ldmVudHNbZXZlbnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2ZW50XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldmVudF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2Ugd2FudCB0byByZW1vdmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgdGhhdCB3ZSBuZWVkIHRvIGZpbmQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25jZSBsaXN0ZW5lcnMuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBvbmNlKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZlbnRdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2ZW50XVxuICAgICwgZXZlbnRzID0gW107XG5cbiAgaWYgKGZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5mbiAmJiAobGlzdGVuZXJzLmZuICE9PSBmbiB8fCAob25jZSAmJiAhbGlzdGVuZXJzLm9uY2UpKSkge1xuICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzKTtcbiAgICB9XG4gICAgaWYgKCFsaXN0ZW5lcnMuZm4pIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0uZm4gIT09IGZuIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSkpIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gIC8vXG4gIGlmIChldmVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fZXZlbnRzW2V2ZW50XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gIH0gZWxzZSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1tldmVudF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgb3Igb25seSB0aGUgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2FudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG5cbiAgaWYgKGV2ZW50KSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2ZW50XTtcbiAgZWxzZSB0aGlzLl9ldmVudHMgPSB7fTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyMiA9IEV2ZW50RW1pdHRlcjtcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIzID0gRXZlbnRFbWl0dGVyO1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG4iLCIvKipcbiAqIEEgbW9kdWxlIG9mIG1ldGhvZHMgdGhhdCB5b3Ugd2FudCB0byBpbmNsdWRlIGluIGFsbCBhY3Rpb25zLlxuICogVGhpcyBtb2R1bGUgaXMgY29uc3VtZWQgYnkgYGNyZWF0ZUFjdGlvbmAuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xufTtcbiIsImV4cG9ydHMuY3JlYXRlZFN0b3JlcyA9IFtdO1xuXG5leHBvcnRzLmNyZWF0ZWRBY3Rpb25zID0gW107XG5cbmV4cG9ydHMucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICB3aGlsZShleHBvcnRzLmNyZWF0ZWRTdG9yZXMubGVuZ3RoKSB7XG4gICAgICAgIGV4cG9ydHMuY3JlYXRlZFN0b3Jlcy5wb3AoKTtcbiAgICB9XG4gICAgd2hpbGUoZXhwb3J0cy5jcmVhdGVkQWN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgZXhwb3J0cy5jcmVhdGVkQWN0aW9ucy5wb3AoKTtcbiAgICB9XG59O1xuIiwidmFyIF8gPSByZXF1aXJlKCcuL3V0aWxzJyksXG4gICAgbWFrZXIgPSByZXF1aXJlKCcuL2pvaW5zJykuaW5zdGFuY2VKb2luQ3JlYXRvcjtcblxuLyoqXG4gKiBBIG1vZHVsZSBvZiBtZXRob2RzIHJlbGF0ZWQgdG8gbGlzdGVuaW5nLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIEFuIGludGVybmFsIHV0aWxpdHkgZnVuY3Rpb24gdXNlZCBieSBgdmFsaWRhdGVMaXN0ZW5pbmdgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FjdGlvbnxTdG9yZX0gbGlzdGVuYWJsZSBUaGUgbGlzdGVuYWJsZSB3ZSB3YW50IHRvIHNlYXJjaCBmb3JcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gVGhlIHJlc3VsdCBvZiBhIHJlY3Vyc2l2ZSBzZWFyY2ggYW1vbmcgYHRoaXMuc3Vic2NyaXB0aW9uc2BcbiAgICAgKi9cbiAgICBoYXNMaXN0ZW5lcjogZnVuY3Rpb24obGlzdGVuYWJsZSkge1xuICAgICAgICB2YXIgaSA9IDAsIGosIGxpc3RlbmVyLCBsaXN0ZW5hYmxlcztcbiAgICAgICAgZm9yICg7aSA8ICh0aGlzLnN1YnNjcmlwdGlvbnN8fFtdKS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgbGlzdGVuYWJsZXMgPSBbXS5jb25jYXQodGhpcy5zdWJzY3JpcHRpb25zW2ldLmxpc3RlbmFibGUpO1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGxpc3RlbmFibGVzLmxlbmd0aDsgaisrKXtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lciA9IGxpc3RlbmFibGVzW2pdO1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lciA9PT0gbGlzdGVuYWJsZSB8fCBsaXN0ZW5lci5oYXNMaXN0ZW5lciAmJiBsaXN0ZW5lci5oYXNMaXN0ZW5lcihsaXN0ZW5hYmxlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBIGNvbnZlbmllbmNlIG1ldGhvZCB0aGF0IGxpc3RlbnMgdG8gYWxsIGxpc3RlbmFibGVzIGluIHRoZSBnaXZlbiBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbGlzdGVuYWJsZXMgQW4gb2JqZWN0IG9mIGxpc3RlbmFibGVzLiBLZXlzIHdpbGwgYmUgdXNlZCBhcyBjYWxsYmFjayBtZXRob2QgbmFtZXMuXG4gICAgICovXG4gICAgbGlzdGVuVG9NYW55OiBmdW5jdGlvbihsaXN0ZW5hYmxlcyl7XG4gICAgICAgIGZvcih2YXIga2V5IGluIGxpc3RlbmFibGVzKXtcbiAgICAgICAgICAgIHZhciBjYm5hbWUgPSBfLmNhbGxiYWNrTmFtZShrZXkpLFxuICAgICAgICAgICAgICAgIGxvY2FsbmFtZSA9IHRoaXNbY2JuYW1lXSA/IGNibmFtZSA6IHRoaXNba2V5XSA/IGtleSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChsb2NhbG5hbWUpe1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuVG8obGlzdGVuYWJsZXNba2V5XSxsb2NhbG5hbWUsdGhpc1tjYm5hbWUrXCJEZWZhdWx0XCJdfHx0aGlzW2xvY2FsbmFtZStcIkRlZmF1bHRcIl18fGxvY2FsbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSBjdXJyZW50IGNvbnRleHQgY2FuIGxpc3RlbiB0byB0aGUgc3VwcGxpZWQgbGlzdGVuYWJsZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtBY3Rpb258U3RvcmV9IGxpc3RlbmFibGUgQW4gQWN0aW9uIG9yIFN0b3JlIHRoYXQgc2hvdWxkIGJlXG4gICAgICogIGxpc3RlbmVkIHRvLlxuICAgICAqIEByZXR1cm5zIHtTdHJpbmd8VW5kZWZpbmVkfSBBbiBlcnJvciBtZXNzYWdlLCBvciB1bmRlZmluZWQgaWYgdGhlcmUgd2FzIG5vIHByb2JsZW0uXG4gICAgICovXG4gICAgdmFsaWRhdGVMaXN0ZW5pbmc6IGZ1bmN0aW9uKGxpc3RlbmFibGUpe1xuICAgICAgICBpZiAobGlzdGVuYWJsZSA9PT0gdGhpcykge1xuICAgICAgICAgICAgcmV0dXJuIFwiTGlzdGVuZXIgaXMgbm90IGFibGUgdG8gbGlzdGVuIHRvIGl0c2VsZlwiO1xuICAgICAgICB9XG4gICAgICAgIGlmICghXy5pc0Z1bmN0aW9uKGxpc3RlbmFibGUubGlzdGVuKSkge1xuICAgICAgICAgICAgcmV0dXJuIGxpc3RlbmFibGUgKyBcIiBpcyBtaXNzaW5nIGEgbGlzdGVuIG1ldGhvZFwiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaXN0ZW5hYmxlLmhhc0xpc3RlbmVyICYmIGxpc3RlbmFibGUuaGFzTGlzdGVuZXIodGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiBcIkxpc3RlbmVyIGNhbm5vdCBsaXN0ZW4gdG8gdGhpcyBsaXN0ZW5hYmxlIGJlY2F1c2Ugb2YgY2lyY3VsYXIgbG9vcFwiO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldHMgdXAgYSBzdWJzY3JpcHRpb24gdG8gdGhlIGdpdmVuIGxpc3RlbmFibGUgZm9yIHRoZSBjb250ZXh0IG9iamVjdFxuICAgICAqXG4gICAgICogQHBhcmFtIHtBY3Rpb258U3RvcmV9IGxpc3RlbmFibGUgQW4gQWN0aW9uIG9yIFN0b3JlIHRoYXQgc2hvdWxkIGJlXG4gICAgICogIGxpc3RlbmVkIHRvLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258U3RyaW5nfSBjYWxsYmFjayBUaGUgY2FsbGJhY2sgdG8gcmVnaXN0ZXIgYXMgZXZlbnQgaGFuZGxlclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258U3RyaW5nfSBkZWZhdWx0Q2FsbGJhY2sgVGhlIGNhbGxiYWNrIHRvIHJlZ2lzdGVyIGFzIGRlZmF1bHQgaGFuZGxlclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEEgc3Vic2NyaXB0aW9uIG9iaiB3aGVyZSBgc3RvcGAgaXMgYW4gdW5zdWIgZnVuY3Rpb24gYW5kIGBsaXN0ZW5hYmxlYCBpcyB0aGUgb2JqZWN0IGJlaW5nIGxpc3RlbmVkIHRvXG4gICAgICovXG4gICAgbGlzdGVuVG86IGZ1bmN0aW9uKGxpc3RlbmFibGUsIGNhbGxiYWNrLCBkZWZhdWx0Q2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGRlc3ViLCB1bnN1YnNjcmliZXIsIHN1YnNjcmlwdGlvbm9iaiwgc3VicyA9IHRoaXMuc3Vic2NyaXB0aW9ucyA9IHRoaXMuc3Vic2NyaXB0aW9ucyB8fCBbXTtcbiAgICAgICAgXy50aHJvd0lmKHRoaXMudmFsaWRhdGVMaXN0ZW5pbmcobGlzdGVuYWJsZSkpO1xuICAgICAgICB0aGlzLmZldGNoSW5pdGlhbFN0YXRlKGxpc3RlbmFibGUsIGRlZmF1bHRDYWxsYmFjayk7XG4gICAgICAgIGRlc3ViID0gbGlzdGVuYWJsZS5saXN0ZW4odGhpc1tjYWxsYmFja118fGNhbGxiYWNrLCB0aGlzKTtcbiAgICAgICAgdW5zdWJzY3JpYmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBzdWJzLmluZGV4T2Yoc3Vic2NyaXB0aW9ub2JqKTtcbiAgICAgICAgICAgIF8udGhyb3dJZihpbmRleCA9PT0gLTEsJ1RyaWVkIHRvIHJlbW92ZSBsaXN0ZW4gYWxyZWFkeSBnb25lIGZyb20gc3Vic2NyaXB0aW9ucyBsaXN0IScpO1xuICAgICAgICAgICAgc3Vicy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgZGVzdWIoKTtcbiAgICAgICAgfTtcbiAgICAgICAgc3Vic2NyaXB0aW9ub2JqID0ge1xuICAgICAgICAgICAgc3RvcDogdW5zdWJzY3JpYmVyLFxuICAgICAgICAgICAgbGlzdGVuYWJsZTogbGlzdGVuYWJsZVxuICAgICAgICB9O1xuICAgICAgICBzdWJzLnB1c2goc3Vic2NyaXB0aW9ub2JqKTtcbiAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbm9iajtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcHMgbGlzdGVuaW5nIHRvIGEgc2luZ2xlIGxpc3RlbmFibGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QWN0aW9ufFN0b3JlfSBsaXN0ZW5hYmxlIFRoZSBhY3Rpb24gb3Igc3RvcmUgd2Ugbm8gbG9uZ2VyIHdhbnQgdG8gbGlzdGVuIHRvXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgYSBzdWJzY3JpcHRpb24gd2FzIGZvdW5kIGFuZCByZW1vdmVkLCBvdGhlcndpc2UgZmFsc2UuXG4gICAgICovXG4gICAgc3RvcExpc3RlbmluZ1RvOiBmdW5jdGlvbihsaXN0ZW5hYmxlKXtcbiAgICAgICAgdmFyIHN1YiwgaSA9IDAsIHN1YnMgPSB0aGlzLnN1YnNjcmlwdGlvbnMgfHwgW107XG4gICAgICAgIGZvcig7aSA8IHN1YnMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgc3ViID0gc3Vic1tpXTtcbiAgICAgICAgICAgIGlmIChzdWIubGlzdGVuYWJsZSA9PT0gbGlzdGVuYWJsZSl7XG4gICAgICAgICAgICAgICAgc3ViLnN0b3AoKTtcbiAgICAgICAgICAgICAgICBfLnRocm93SWYoc3Vicy5pbmRleE9mKHN1YikhPT0tMSwnRmFpbGVkIHRvIHJlbW92ZSBsaXN0ZW4gZnJvbSBzdWJzY3JpcHRpb25zIGxpc3QhJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9wcyBhbGwgc3Vic2NyaXB0aW9ucyBhbmQgZW1wdGllcyBzdWJzY3JpcHRpb25zIGFycmF5XG4gICAgICovXG4gICAgc3RvcExpc3RlbmluZ1RvQWxsOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgcmVtYWluaW5nLCBzdWJzID0gdGhpcy5zdWJzY3JpcHRpb25zIHx8IFtdO1xuICAgICAgICB3aGlsZSgocmVtYWluaW5nPXN1YnMubGVuZ3RoKSl7XG4gICAgICAgICAgICBzdWJzWzBdLnN0b3AoKTtcbiAgICAgICAgICAgIF8udGhyb3dJZihzdWJzLmxlbmd0aCE9PXJlbWFpbmluZy0xLCdGYWlsZWQgdG8gcmVtb3ZlIGxpc3RlbiBmcm9tIHN1YnNjcmlwdGlvbnMgbGlzdCEnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVc2VkIGluIGBsaXN0ZW5Ub2AuIEZldGNoZXMgaW5pdGlhbCBkYXRhIGZyb20gYSBwdWJsaXNoZXIgaWYgaXQgaGFzIGEgYGdldEluaXRpYWxTdGF0ZWAgbWV0aG9kLlxuICAgICAqIEBwYXJhbSB7QWN0aW9ufFN0b3JlfSBsaXN0ZW5hYmxlIFRoZSBwdWJsaXNoZXIgd2Ugd2FudCB0byBnZXQgaW5pdGlhbCBzdGF0ZSBmcm9tXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbnxTdHJpbmd9IGRlZmF1bHRDYWxsYmFjayBUaGUgbWV0aG9kIHRvIHJlY2VpdmUgdGhlIGRhdGFcbiAgICAgKi9cbiAgICBmZXRjaEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKGxpc3RlbmFibGUsIGRlZmF1bHRDYWxsYmFjaykge1xuICAgICAgICBkZWZhdWx0Q2FsbGJhY2sgPSAoZGVmYXVsdENhbGxiYWNrICYmIHRoaXNbZGVmYXVsdENhbGxiYWNrXSkgfHwgZGVmYXVsdENhbGxiYWNrO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGRlZmF1bHRDYWxsYmFjaykgJiYgXy5pc0Z1bmN0aW9uKGxpc3RlbmFibGUuZ2V0SW5pdGlhbFN0YXRlKSkge1xuICAgICAgICAgICAgZGF0YSA9IGxpc3RlbmFibGUuZ2V0SW5pdGlhbFN0YXRlKCk7XG4gICAgICAgICAgICBpZiAoZGF0YSAmJiBfLmlzRnVuY3Rpb24oZGF0YS50aGVuKSkge1xuICAgICAgICAgICAgICAgIGRhdGEudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdENhbGxiYWNrLmFwcGx5KG1lLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0Q2FsbGJhY2suY2FsbCh0aGlzLCBkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUaGUgY2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgb25jZSBhbGwgbGlzdGVuYWJsZXMgaGF2ZSB0cmlnZ2VyZWQgYXQgbGVhc3Qgb25jZS5cbiAgICAgKiBJdCB3aWxsIGJlIGludm9rZWQgd2l0aCB0aGUgbGFzdCBlbWlzc2lvbiBmcm9tIGVhY2ggbGlzdGVuYWJsZS5cbiAgICAgKiBAcGFyYW0gey4uLlB1Ymxpc2hlcnN9IHB1Ymxpc2hlcnMgUHVibGlzaGVycyB0aGF0IHNob3VsZCBiZSB0cmFja2VkLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258U3RyaW5nfSBjYWxsYmFjayBUaGUgbWV0aG9kIHRvIGNhbGwgd2hlbiBhbGwgcHVibGlzaGVycyBoYXZlIGVtaXR0ZWRcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBIHN1YnNjcmlwdGlvbiBvYmogd2hlcmUgYHN0b3BgIGlzIGFuIHVuc3ViIGZ1bmN0aW9uIGFuZCBgbGlzdGVuYWJsZWAgaXMgYW4gYXJyYXkgb2YgbGlzdGVuYWJsZXNcbiAgICAgKi9cbiAgICBqb2luVHJhaWxpbmc6IG1ha2VyKFwibGFzdFwiKSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCBvbmNlIGFsbCBsaXN0ZW5hYmxlcyBoYXZlIHRyaWdnZXJlZCBhdCBsZWFzdCBvbmNlLlxuICAgICAqIEl0IHdpbGwgYmUgaW52b2tlZCB3aXRoIHRoZSBmaXJzdCBlbWlzc2lvbiBmcm9tIGVhY2ggbGlzdGVuYWJsZS5cbiAgICAgKiBAcGFyYW0gey4uLlB1Ymxpc2hlcnN9IHB1Ymxpc2hlcnMgUHVibGlzaGVycyB0aGF0IHNob3VsZCBiZSB0cmFja2VkLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258U3RyaW5nfSBjYWxsYmFjayBUaGUgbWV0aG9kIHRvIGNhbGwgd2hlbiBhbGwgcHVibGlzaGVycyBoYXZlIGVtaXR0ZWRcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBIHN1YnNjcmlwdGlvbiBvYmogd2hlcmUgYHN0b3BgIGlzIGFuIHVuc3ViIGZ1bmN0aW9uIGFuZCBgbGlzdGVuYWJsZWAgaXMgYW4gYXJyYXkgb2YgbGlzdGVuYWJsZXNcbiAgICAgKi9cbiAgICBqb2luTGVhZGluZzogbWFrZXIoXCJmaXJzdFwiKSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCBvbmNlIGFsbCBsaXN0ZW5hYmxlcyBoYXZlIHRyaWdnZXJlZCBhdCBsZWFzdCBvbmNlLlxuICAgICAqIEl0IHdpbGwgYmUgaW52b2tlZCB3aXRoIGFsbCBlbWlzc2lvbiBmcm9tIGVhY2ggbGlzdGVuYWJsZS5cbiAgICAgKiBAcGFyYW0gey4uLlB1Ymxpc2hlcnN9IHB1Ymxpc2hlcnMgUHVibGlzaGVycyB0aGF0IHNob3VsZCBiZSB0cmFja2VkLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258U3RyaW5nfSBjYWxsYmFjayBUaGUgbWV0aG9kIHRvIGNhbGwgd2hlbiBhbGwgcHVibGlzaGVycyBoYXZlIGVtaXR0ZWRcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBIHN1YnNjcmlwdGlvbiBvYmogd2hlcmUgYHN0b3BgIGlzIGFuIHVuc3ViIGZ1bmN0aW9uIGFuZCBgbGlzdGVuYWJsZWAgaXMgYW4gYXJyYXkgb2YgbGlzdGVuYWJsZXNcbiAgICAgKi9cbiAgICBqb2luQ29uY2F0OiBtYWtlcihcImFsbFwiKSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCBvbmNlIGFsbCBsaXN0ZW5hYmxlcyBoYXZlIHRyaWdnZXJlZC5cbiAgICAgKiBJZiBhIGNhbGxiYWNrIHRyaWdnZXJzIHR3aWNlIGJlZm9yZSB0aGF0IGhhcHBlbnMsIGFuIGVycm9yIGlzIHRocm93bi5cbiAgICAgKiBAcGFyYW0gey4uLlB1Ymxpc2hlcnN9IHB1Ymxpc2hlcnMgUHVibGlzaGVycyB0aGF0IHNob3VsZCBiZSB0cmFja2VkLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb258U3RyaW5nfSBjYWxsYmFjayBUaGUgbWV0aG9kIHRvIGNhbGwgd2hlbiBhbGwgcHVibGlzaGVycyBoYXZlIGVtaXR0ZWRcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBIHN1YnNjcmlwdGlvbiBvYmogd2hlcmUgYHN0b3BgIGlzIGFuIHVuc3ViIGZ1bmN0aW9uIGFuZCBgbGlzdGVuYWJsZWAgaXMgYW4gYXJyYXkgb2YgbGlzdGVuYWJsZXNcbiAgICAgKi9cbiAgICBqb2luU3RyaWN0OiBtYWtlcihcInN0cmljdFwiKVxufTtcbiIsInZhciBfID0gcmVxdWlyZSgnLi91dGlscycpLFxuICAgIExpc3RlbmVyTWV0aG9kcyA9IHJlcXVpcmUoJy4vTGlzdGVuZXJNZXRob2RzJyk7XG5cbi8qKlxuICogQSBtb2R1bGUgbWVhbnQgdG8gYmUgY29uc3VtZWQgYXMgYSBtaXhpbiBieSBhIFJlYWN0IGNvbXBvbmVudC4gU3VwcGxpZXMgdGhlIG1ldGhvZHMgZnJvbVxuICogYExpc3RlbmVyTWV0aG9kc2AgbWl4aW4gYW5kIHRha2VzIGNhcmUgb2YgdGVhcmRvd24gb2Ygc3Vic2NyaXB0aW9ucy5cbiAqIE5vdGUgdGhhdCBpZiB5b3UncmUgdXNpbmcgdGhlIGBjb25uZWN0YCBtaXhpbiB5b3UgZG9uJ3QgbmVlZCB0aGlzIG1peGluLCBhcyBjb25uZWN0IHdpbGxcbiAqIGltcG9ydCBldmVyeXRoaW5nIHRoaXMgbWl4aW4gY29udGFpbnMhXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gXy5leHRlbmQoe1xuXG4gICAgLyoqXG4gICAgICogQ2xlYW5zIHVwIGFsbCBsaXN0ZW5lciBwcmV2aW91c2x5IHJlZ2lzdGVyZWQuXG4gICAgICovXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IExpc3RlbmVyTWV0aG9kcy5zdG9wTGlzdGVuaW5nVG9BbGxcblxufSwgTGlzdGVuZXJNZXRob2RzKTtcbiIsInZhciBfID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG4vKipcbiAqIEEgbW9kdWxlIG9mIG1ldGhvZHMgZm9yIG9iamVjdCB0aGF0IHlvdSB3YW50IHRvIGJlIGFibGUgdG8gbGlzdGVuIHRvLlxuICogVGhpcyBtb2R1bGUgaXMgY29uc3VtZWQgYnkgYGNyZWF0ZVN0b3JlYCBhbmQgYGNyZWF0ZUFjdGlvbmBcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBIb29rIHVzZWQgYnkgdGhlIHB1Ymxpc2hlciB0aGF0IGlzIGludm9rZWQgYmVmb3JlIGVtaXR0aW5nXG4gICAgICogYW5kIGJlZm9yZSBgc2hvdWxkRW1pdGAuIFRoZSBhcmd1bWVudHMgYXJlIHRoZSBvbmVzIHRoYXQgdGhlIGFjdGlvblxuICAgICAqIGlzIGludm9rZWQgd2l0aC4gSWYgdGhpcyBmdW5jdGlvbiByZXR1cm5zIHNvbWV0aGluZyBvdGhlciB0aGFuXG4gICAgICogdW5kZWZpbmVkLCB0aGF0IHdpbGwgYmUgcGFzc2VkIG9uIGFzIGFyZ3VtZW50cyBmb3Igc2hvdWxkRW1pdCBhbmRcbiAgICAgKiBlbWlzc2lvbi5cbiAgICAgKi9cbiAgICBwcmVFbWl0OiBmdW5jdGlvbigpIHt9LFxuXG4gICAgLyoqXG4gICAgICogSG9vayB1c2VkIGJ5IHRoZSBwdWJsaXNoZXIgYWZ0ZXIgYHByZUVtaXRgIHRvIGRldGVybWluZSBpZiB0aGVcbiAgICAgKiBldmVudCBzaG91bGQgYmUgZW1pdHRlZCB3aXRoIGdpdmVuIGFyZ3VtZW50cy4gVGhpcyBtYXkgYmUgb3ZlcnJpZGRlblxuICAgICAqIGluIHlvdXIgYXBwbGljYXRpb24sIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gYWx3YXlzIHJldHVybnMgdHJ1ZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIGV2ZW50IHNob3VsZCBiZSBlbWl0dGVkXG4gICAgICovXG4gICAgc2hvdWxkRW1pdDogZnVuY3Rpb24oKSB7IHJldHVybiB0cnVlOyB9LFxuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlcyB0aGUgZ2l2ZW4gY2FsbGJhY2sgZm9yIGFjdGlvbiB0cmlnZ2VyZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBjYWxsYmFjayB0byByZWdpc3RlciBhcyBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtNaXhlZH0gW29wdGlvbmFsXSBiaW5kQ29udGV4dCBUaGUgY29udGV4dCB0byBiaW5kIHRoZSBjYWxsYmFjayB3aXRoXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBDYWxsYmFjayB0aGF0IHVuc3Vic2NyaWJlcyB0aGUgcmVnaXN0ZXJlZCBldmVudCBoYW5kbGVyXG4gICAgICovXG4gICAgbGlzdGVuOiBmdW5jdGlvbihjYWxsYmFjaywgYmluZENvbnRleHQpIHtcbiAgICAgICAgdmFyIGV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KGJpbmRDb250ZXh0LCBhcmdzKTtcbiAgICAgICAgfSwgbWUgPSB0aGlzO1xuICAgICAgICB0aGlzLmVtaXR0ZXIuYWRkTGlzdGVuZXIodGhpcy5ldmVudExhYmVsLCBldmVudEhhbmRsZXIpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBtZS5lbWl0dGVyLnJlbW92ZUxpc3RlbmVyKG1lLmV2ZW50TGFiZWwsIGV2ZW50SGFuZGxlcik7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFB1Ymxpc2hlcyBhbiBldmVudCB1c2luZyBgdGhpcy5lbWl0dGVyYCAoaWYgYHNob3VsZEVtaXRgIGFncmVlcylcbiAgICAgKi9cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgICAgICBwcmUgPSB0aGlzLnByZUVtaXQuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIGFyZ3MgPSBwcmUgPT09IHVuZGVmaW5lZCA/IGFyZ3MgOiBfLmlzQXJndW1lbnRzKHByZSkgPyBwcmUgOiBbXS5jb25jYXQocHJlKTtcbiAgICAgICAgaWYgKHRoaXMuc2hvdWxkRW1pdC5hcHBseSh0aGlzLCBhcmdzKSkge1xuICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQodGhpcy5ldmVudExhYmVsLCBhcmdzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmllcyB0byBwdWJsaXNoIHRoZSBldmVudCBvbiB0aGUgbmV4dCB0aWNrXG4gICAgICovXG4gICAgdHJpZ2dlckFzeW5jOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxtZSA9IHRoaXM7XG4gICAgICAgIF8ubmV4dFRpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBtZS50cmlnZ2VyLmFwcGx5KG1lLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcbiIsIi8qKlxuICogQSBtb2R1bGUgb2YgbWV0aG9kcyB0aGF0IHlvdSB3YW50IHRvIGluY2x1ZGUgaW4gYWxsIHN0b3Jlcy5cbiAqIFRoaXMgbW9kdWxlIGlzIGNvbnN1bWVkIGJ5IGBjcmVhdGVTdG9yZWAuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RvcmUsIGRlZmluaXRpb24pIHtcbiAgZm9yICh2YXIgbmFtZSBpbiBkZWZpbml0aW9uKSB7XG4gICAgdmFyIHByb3BlcnR5ID0gZGVmaW5pdGlvbltuYW1lXTtcblxuICAgIGlmICh0eXBlb2YgcHJvcGVydHkgIT09ICdmdW5jdGlvbicgfHwgIWRlZmluaXRpb24uaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHN0b3JlW25hbWVdID0gcHJvcGVydHkuYmluZChzdG9yZSk7XG4gIH1cblxuICByZXR1cm4gc3RvcmU7XG59O1xuIiwidmFyIFJlZmx1eCA9IHJlcXVpcmUoJy4uL3NyYycpLFxuICAgIF8gPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obGlzdGVuYWJsZSxrZXkpe1xuICAgIHJldHVybiB7XG4gICAgICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmICghXy5pc0Z1bmN0aW9uKGxpc3RlbmFibGUuZ2V0SW5pdGlhbFN0YXRlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdGVuYWJsZS5nZXRJbml0aWFsU3RhdGUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ub2JqZWN0KFtrZXldLFtsaXN0ZW5hYmxlLmdldEluaXRpYWxTdGF0ZSgpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXy5leHRlbmQodGhpcyxSZWZsdXguTGlzdGVuZXJNZXRob2RzKTtcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsIGNiID0gKGtleSA9PT0gdW5kZWZpbmVkID8gdGhpcy5zZXRTdGF0ZSA6IGZ1bmN0aW9uKHYpe21lLnNldFN0YXRlKF8ub2JqZWN0KFtrZXldLFt2XSkpO30pO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5UbyhsaXN0ZW5hYmxlLGNiKTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tcG9uZW50V2lsbFVubW91bnQ6IFJlZmx1eC5MaXN0ZW5lck1peGluLmNvbXBvbmVudFdpbGxVbm1vdW50XG4gICAgfTtcbn07XG4iLCJ2YXIgXyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcbiAgICBSZWZsdXggPSByZXF1aXJlKCcuLi9zcmMnKSxcbiAgICBLZWVwID0gcmVxdWlyZSgnLi9LZWVwJyksXG4gICAgYWxsb3dlZCA9IHtwcmVFbWl0OjEsc2hvdWxkRW1pdDoxfTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFjdGlvbiBmdW5jdG9yIG9iamVjdC4gSXQgaXMgbWl4ZWQgaW4gd2l0aCBmdW5jdGlvbnNcbiAqIGZyb20gdGhlIGBQdWJsaXNoZXJNZXRob2RzYCBtaXhpbi4gYHByZUVtaXRgIGFuZCBgc2hvdWxkRW1pdGAgbWF5XG4gKiBiZSBvdmVycmlkZGVuIGluIHRoZSBkZWZpbml0aW9uIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmaW5pdGlvbiBUaGUgYWN0aW9uIG9iamVjdCBkZWZpbml0aW9uXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVmaW5pdGlvbikge1xuXG4gICAgZGVmaW5pdGlvbiA9IGRlZmluaXRpb24gfHwge307XG5cbiAgICBmb3IodmFyIGEgaW4gUmVmbHV4LkFjdGlvbk1ldGhvZHMpe1xuICAgICAgICBpZiAoIWFsbG93ZWRbYV0gJiYgUmVmbHV4LlB1Ymxpc2hlck1ldGhvZHNbYV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBvdmVycmlkZSBBUEkgbWV0aG9kIFwiICsgYSArXG4gICAgICAgICAgICAgICAgXCIgaW4gUmVmbHV4LkFjdGlvbk1ldGhvZHMuIFVzZSBhbm90aGVyIG1ldGhvZCBuYW1lIG9yIG92ZXJyaWRlIGl0IG9uIFJlZmx1eC5QdWJsaXNoZXJNZXRob2RzIGluc3RlYWQuXCJcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IodmFyIGQgaW4gZGVmaW5pdGlvbil7XG4gICAgICAgIGlmICghYWxsb3dlZFtkXSAmJiBSZWZsdXguUHVibGlzaGVyTWV0aG9kc1tkXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IG92ZXJyaWRlIEFQSSBtZXRob2QgXCIgKyBkICtcbiAgICAgICAgICAgICAgICBcIiBpbiBhY3Rpb24gY3JlYXRpb24uIFVzZSBhbm90aGVyIG1ldGhvZCBuYW1lIG9yIG92ZXJyaWRlIGl0IG9uIFJlZmx1eC5QdWJsaXNoZXJNZXRob2RzIGluc3RlYWQuXCJcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgY29udGV4dCA9IF8uZXh0ZW5kKHtcbiAgICAgICAgZXZlbnRMYWJlbDogXCJhY3Rpb25cIixcbiAgICAgICAgZW1pdHRlcjogbmV3IF8uRXZlbnRFbWl0dGVyKCksXG4gICAgICAgIF9pc0FjdGlvbjogdHJ1ZVxuICAgIH0sIFJlZmx1eC5QdWJsaXNoZXJNZXRob2RzLCBSZWZsdXguQWN0aW9uTWV0aG9kcywgZGVmaW5pdGlvbik7XG5cbiAgICB2YXIgZnVuY3RvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmdW5jdG9yW2Z1bmN0b3Iuc3luYz9cInRyaWdnZXJcIjpcInRyaWdnZXJBc3luY1wiXS5hcHBseShmdW5jdG9yLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBfLmV4dGVuZChmdW5jdG9yLGNvbnRleHQpO1xuXG4gICAgS2VlcC5jcmVhdGVkQWN0aW9ucy5wdXNoKGZ1bmN0b3IpO1xuXG4gICAgcmV0dXJuIGZ1bmN0b3I7XG5cbn07XG4iLCJ2YXIgXyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcbiAgICBSZWZsdXggPSByZXF1aXJlKCcuLi9zcmMnKSxcbiAgICBLZWVwID0gcmVxdWlyZSgnLi9LZWVwJyksXG4gICAgYWxsb3dlZCA9IHtwcmVFbWl0OjEsc2hvdWxkRW1pdDoxfSxcbiAgICBiaW5kTWV0aG9kcyA9IHJlcXVpcmUoJy4vYmluZE1ldGhvZHMnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGV2ZW50IGVtaXR0aW5nIERhdGEgU3RvcmUuIEl0IGlzIG1peGVkIGluIHdpdGggZnVuY3Rpb25zXG4gKiBmcm9tIHRoZSBgTGlzdGVuZXJNZXRob2RzYCBhbmQgYFB1Ymxpc2hlck1ldGhvZHNgIG1peGlucy4gYHByZUVtaXRgXG4gKiBhbmQgYHNob3VsZEVtaXRgIG1heSBiZSBvdmVycmlkZGVuIGluIHRoZSBkZWZpbml0aW9uIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmaW5pdGlvbiBUaGUgZGF0YSBzdG9yZSBvYmplY3QgZGVmaW5pdGlvblxuICogQHJldHVybnMge1N0b3JlfSBBIGRhdGEgc3RvcmUgaW5zdGFuY2VcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkZWZpbml0aW9uKSB7XG5cbiAgICBkZWZpbml0aW9uID0gZGVmaW5pdGlvbiB8fCB7fTtcblxuICAgIGZvcih2YXIgYSBpbiBSZWZsdXguU3RvcmVNZXRob2RzKXtcbiAgICAgICAgaWYgKCFhbGxvd2VkW2FdICYmIChSZWZsdXguUHVibGlzaGVyTWV0aG9kc1thXSB8fCBSZWZsdXguTGlzdGVuZXJNZXRob2RzW2FdKSl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3Qgb3ZlcnJpZGUgQVBJIG1ldGhvZCBcIiArIGEgKyBcbiAgICAgICAgICAgICAgICBcIiBpbiBSZWZsdXguU3RvcmVNZXRob2RzLiBVc2UgYW5vdGhlciBtZXRob2QgbmFtZSBvciBvdmVycmlkZSBpdCBvbiBSZWZsdXguUHVibGlzaGVyTWV0aG9kcyAvIFJlZmx1eC5MaXN0ZW5lck1ldGhvZHMgaW5zdGVhZC5cIlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvcih2YXIgZCBpbiBkZWZpbml0aW9uKXtcbiAgICAgICAgaWYgKCFhbGxvd2VkW2RdICYmIChSZWZsdXguUHVibGlzaGVyTWV0aG9kc1tkXSB8fCBSZWZsdXguTGlzdGVuZXJNZXRob2RzW2RdKSl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3Qgb3ZlcnJpZGUgQVBJIG1ldGhvZCBcIiArIGQgKyBcbiAgICAgICAgICAgICAgICBcIiBpbiBzdG9yZSBjcmVhdGlvbi4gVXNlIGFub3RoZXIgbWV0aG9kIG5hbWUgb3Igb3ZlcnJpZGUgaXQgb24gUmVmbHV4LlB1Ymxpc2hlck1ldGhvZHMgLyBSZWZsdXguTGlzdGVuZXJNZXRob2RzIGluc3RlYWQuXCJcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBTdG9yZSgpIHtcbiAgICAgICAgdmFyIGk9MCwgYXJyO1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5lbWl0dGVyID0gbmV3IF8uRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuZXZlbnRMYWJlbCA9IFwiY2hhbmdlXCI7XG4gICAgICAgIGlmICh0aGlzLmluaXQgJiYgXy5pc0Z1bmN0aW9uKHRoaXMuaW5pdCkpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmxpc3RlbmFibGVzKXtcbiAgICAgICAgICAgIGFyciA9IFtdLmNvbmNhdCh0aGlzLmxpc3RlbmFibGVzKTtcbiAgICAgICAgICAgIGZvcig7aSA8IGFyci5sZW5ndGg7aSsrKXtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlblRvTWFueShhcnJbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgXy5leHRlbmQoU3RvcmUucHJvdG90eXBlLCBSZWZsdXguTGlzdGVuZXJNZXRob2RzLCBSZWZsdXguUHVibGlzaGVyTWV0aG9kcywgUmVmbHV4LlN0b3JlTWV0aG9kcywgZGVmaW5pdGlvbik7XG5cbiAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmUoKTtcbiAgICBiaW5kTWV0aG9kcyhzdG9yZSwgZGVmaW5pdGlvbik7XG4gICAgS2VlcC5jcmVhdGVkU3RvcmVzLnB1c2goc3RvcmUpO1xuXG4gICAgcmV0dXJuIHN0b3JlO1xufTtcbiIsImV4cG9ydHMuQWN0aW9uTWV0aG9kcyA9IHJlcXVpcmUoJy4vQWN0aW9uTWV0aG9kcycpO1xuXG5leHBvcnRzLkxpc3RlbmVyTWV0aG9kcyA9IHJlcXVpcmUoJy4vTGlzdGVuZXJNZXRob2RzJyk7XG5cbmV4cG9ydHMuUHVibGlzaGVyTWV0aG9kcyA9IHJlcXVpcmUoJy4vUHVibGlzaGVyTWV0aG9kcycpO1xuXG5leHBvcnRzLlN0b3JlTWV0aG9kcyA9IHJlcXVpcmUoJy4vU3RvcmVNZXRob2RzJyk7XG5cbmV4cG9ydHMuY3JlYXRlQWN0aW9uID0gcmVxdWlyZSgnLi9jcmVhdGVBY3Rpb24nKTtcblxuZXhwb3J0cy5jcmVhdGVTdG9yZSA9IHJlcXVpcmUoJy4vY3JlYXRlU3RvcmUnKTtcblxuZXhwb3J0cy5jb25uZWN0ID0gcmVxdWlyZSgnLi9jb25uZWN0Jyk7XG5cbmV4cG9ydHMuTGlzdGVuZXJNaXhpbiA9IHJlcXVpcmUoJy4vTGlzdGVuZXJNaXhpbicpO1xuXG5leHBvcnRzLmxpc3RlblRvID0gcmVxdWlyZSgnLi9saXN0ZW5UbycpO1xuXG5leHBvcnRzLmxpc3RlblRvTWFueSA9IHJlcXVpcmUoJy4vbGlzdGVuVG9NYW55Jyk7XG5cblxudmFyIG1ha2VyID0gcmVxdWlyZSgnLi9qb2lucycpLnN0YXRpY0pvaW5DcmVhdG9yO1xuXG5leHBvcnRzLmpvaW5UcmFpbGluZyA9IGV4cG9ydHMuYWxsID0gbWFrZXIoXCJsYXN0XCIpOyAvLyBSZWZsdXguYWxsIGFsaWFzIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG5cbmV4cG9ydHMuam9pbkxlYWRpbmcgPSBtYWtlcihcImZpcnN0XCIpO1xuXG5leHBvcnRzLmpvaW5TdHJpY3QgPSBtYWtlcihcInN0cmljdFwiKTtcblxuZXhwb3J0cy5qb2luQ29uY2F0ID0gbWFrZXIoXCJhbGxcIik7XG5cblxuLyoqXG4gKiBDb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgY3JlYXRpbmcgYSBzZXQgb2YgYWN0aW9uc1xuICpcbiAqIEBwYXJhbSBhY3Rpb25OYW1lcyB0aGUgbmFtZXMgZm9yIHRoZSBhY3Rpb25zIHRvIGJlIGNyZWF0ZWRcbiAqIEByZXR1cm5zIGFuIG9iamVjdCB3aXRoIGFjdGlvbnMgb2YgY29ycmVzcG9uZGluZyBhY3Rpb24gbmFtZXNcbiAqL1xuZXhwb3J0cy5jcmVhdGVBY3Rpb25zID0gZnVuY3Rpb24oYWN0aW9uTmFtZXMpIHtcbiAgICB2YXIgaSA9IDAsIGFjdGlvbnMgPSB7fTtcbiAgICBmb3IgKDsgaSA8IGFjdGlvbk5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFjdGlvbnNbYWN0aW9uTmFtZXNbaV1dID0gZXhwb3J0cy5jcmVhdGVBY3Rpb24oKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjdGlvbnM7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIGV2ZW50bWl0dGVyIHRoYXQgUmVmbHV4IHVzZXNcbiAqL1xuZXhwb3J0cy5zZXRFdmVudEVtaXR0ZXIgPSBmdW5jdGlvbihjdHgpIHtcbiAgICB2YXIgXyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbiAgICBfLkV2ZW50RW1pdHRlciA9IGN0eDtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgbWV0aG9kIHVzZWQgZm9yIGRlZmVycmluZyBhY3Rpb25zIGFuZCBzdG9yZXNcbiAqL1xuZXhwb3J0cy5uZXh0VGljayA9IGZ1bmN0aW9uKG5leHRUaWNrKSB7XG4gICAgdmFyIF8gPSByZXF1aXJlKCcuL3V0aWxzJyk7XG4gICAgXy5uZXh0VGljayA9IG5leHRUaWNrO1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyB0aGUgc2V0IG9mIGNyZWF0ZWQgYWN0aW9ucyBhbmQgc3RvcmVzIGZvciBpbnRyb3NwZWN0aW9uXG4gKi9cbmV4cG9ydHMuX19rZWVwID0gcmVxdWlyZSgnLi9LZWVwJyk7XG5cbi8qKlxuICogV2FybiBpZiBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCBub3QgYXZhaWxhYmxlXG4gKi9cbmlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgY29uc29sZS5lcnJvcihcbiAgICAnRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgbm90IGF2YWlsYWJsZS4gJyArXG4gICAgJ0VTNSBzaGltIHJlcXVpcmVkLiAnICtcbiAgICAnaHR0cHM6Ly9naXRodWIuY29tL3Nwb2lrZS9yZWZsdXhqcyNlczUnXG4gICk7XG59XG4iLCIvKipcbiAqIEludGVybmFsIG1vZHVsZSB1c2VkIHRvIGNyZWF0ZSBzdGF0aWMgYW5kIGluc3RhbmNlIGpvaW4gbWV0aG9kc1xuICovXG5cbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZSxcbiAgICBfID0gcmVxdWlyZShcIi4vdXRpbHNcIiksXG4gICAgY3JlYXRlU3RvcmUgPSByZXF1aXJlKFwiLi9jcmVhdGVTdG9yZVwiKSxcbiAgICBzdHJhdGVneU1ldGhvZE5hbWVzID0ge1xuICAgICAgICBzdHJpY3Q6IFwiam9pblN0cmljdFwiLFxuICAgICAgICBmaXJzdDogXCJqb2luTGVhZGluZ1wiLFxuICAgICAgICBsYXN0OiBcImpvaW5UcmFpbGluZ1wiLFxuICAgICAgICBhbGw6IFwiam9pbkNvbmNhdFwiXG4gICAgfTtcblxuLyoqXG4gKiBVc2VkIGluIGBpbmRleC5qc2AgdG8gY3JlYXRlIHRoZSBzdGF0aWMgam9pbiBtZXRob2RzXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyYXRlZ3kgV2hpY2ggc3RyYXRlZ3kgdG8gdXNlIHdoZW4gdHJhY2tpbmcgbGlzdGVuYWJsZSB0cmlnZ2VyIGFyZ3VtZW50c1xuICogQHJldHVybnMge0Z1bmN0aW9ufSBBIHN0YXRpYyBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGEgc3RvcmUgd2l0aCBhIGpvaW4gbGlzdGVuIG9uIHRoZSBnaXZlbiBsaXN0ZW5hYmxlcyB1c2luZyB0aGUgZ2l2ZW4gc3RyYXRlZ3lcbiAqL1xuZXhwb3J0cy5zdGF0aWNKb2luQ3JlYXRvciA9IGZ1bmN0aW9uKHN0cmF0ZWd5KXtcbiAgICByZXR1cm4gZnVuY3Rpb24oLyogbGlzdGVuYWJsZXMuLi4gKi8pIHtcbiAgICAgICAgdmFyIGxpc3RlbmFibGVzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gY3JlYXRlU3RvcmUoe1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB0aGlzW3N0cmF0ZWd5TWV0aG9kTmFtZXNbc3RyYXRlZ3ldXS5hcHBseSh0aGlzLGxpc3RlbmFibGVzLmNvbmNhdChcInRyaWdnZXJBc3luY1wiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG59O1xuXG4vKipcbiAqIFVzZWQgaW4gYExpc3RlbmVyTWV0aG9kcy5qc2AgdG8gY3JlYXRlIHRoZSBpbnN0YW5jZSBqb2luIG1ldGhvZHNcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJhdGVneSBXaGljaCBzdHJhdGVneSB0byB1c2Ugd2hlbiB0cmFja2luZyBsaXN0ZW5hYmxlIHRyaWdnZXIgYXJndW1lbnRzXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IEFuIGluc3RhbmNlIG1ldGhvZCB3aGljaCBzZXRzIHVwIGEgam9pbiBsaXN0ZW4gb24gdGhlIGdpdmVuIGxpc3RlbmFibGVzIHVzaW5nIHRoZSBnaXZlbiBzdHJhdGVneVxuICovXG5leHBvcnRzLmluc3RhbmNlSm9pbkNyZWF0b3IgPSBmdW5jdGlvbihzdHJhdGVneSl7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKC8qIGxpc3RlbmFibGVzLi4uLCBjYWxsYmFjayovKXtcbiAgICAgICAgXy50aHJvd0lmKGFyZ3VtZW50cy5sZW5ndGggPCAzLCdDYW5ub3QgY3JlYXRlIGEgam9pbiB3aXRoIGxlc3MgdGhhbiAyIGxpc3RlbmFibGVzIScpO1xuICAgICAgICB2YXIgbGlzdGVuYWJsZXMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICBjYWxsYmFjayA9IGxpc3RlbmFibGVzLnBvcCgpLFxuICAgICAgICAgICAgbnVtYmVyT2ZMaXN0ZW5hYmxlcyA9IGxpc3RlbmFibGVzLmxlbmd0aCxcbiAgICAgICAgICAgIGpvaW4gPSB7XG4gICAgICAgICAgICAgICAgbnVtYmVyT2ZMaXN0ZW5hYmxlczogbnVtYmVyT2ZMaXN0ZW5hYmxlcyxcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogdGhpc1tjYWxsYmFja118fGNhbGxiYWNrLFxuICAgICAgICAgICAgICAgIGxpc3RlbmVyOiB0aGlzLFxuICAgICAgICAgICAgICAgIHN0cmF0ZWd5OiBzdHJhdGVneVxuICAgICAgICAgICAgfSwgaSwgY2FuY2VscyA9IFtdLCBzdWJvYmo7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBudW1iZXJPZkxpc3RlbmFibGVzOyBpKyspIHtcbiAgICAgICAgICAgIF8udGhyb3dJZih0aGlzLnZhbGlkYXRlTGlzdGVuaW5nKGxpc3RlbmFibGVzW2ldKSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG51bWJlck9mTGlzdGVuYWJsZXM7IGkrKykge1xuICAgICAgICAgICAgY2FuY2Vscy5wdXNoKGxpc3RlbmFibGVzW2ldLmxpc3RlbihuZXdMaXN0ZW5lcihpLGpvaW4pLHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgICByZXNldChqb2luKTtcbiAgICAgICAgc3Vib2JqID0ge2xpc3RlbmFibGU6IGxpc3RlbmFibGVzfTtcbiAgICAgICAgc3Vib2JqLnN0b3AgPSBtYWtlU3RvcHBlcihzdWJvYmosY2FuY2Vscyx0aGlzKTtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zID0gKHRoaXMuc3Vic2NyaXB0aW9ucyB8fCBbXSkuY29uY2F0KHN1Ym9iaik7XG4gICAgICAgIHJldHVybiBzdWJvYmo7XG4gICAgfTtcbn07XG5cbi8vIC0tLS0gaW50ZXJuYWwgam9pbiBmdW5jdGlvbnMgLS0tLVxuXG5mdW5jdGlvbiBtYWtlU3RvcHBlcihzdWJvYmosY2FuY2Vscyxjb250ZXh0KXtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpLCBzdWJzID0gY29udGV4dC5zdWJzY3JpcHRpb25zO1xuICAgICAgICAgICAgaW5kZXggPSAoc3VicyA/IHN1YnMuaW5kZXhPZihzdWJvYmopIDogLTEpO1xuICAgICAgICBfLnRocm93SWYoaW5kZXggPT09IC0xLCdUcmllZCB0byByZW1vdmUgam9pbiBhbHJlYWR5IGdvbmUgZnJvbSBzdWJzY3JpcHRpb25zIGxpc3QhJyk7XG4gICAgICAgIGZvcihpPTA7aSA8IGNhbmNlbHMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgY2FuY2Vsc1tpXSgpO1xuICAgICAgICB9XG4gICAgICAgIHN1YnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiByZXNldChqb2luKSB7XG4gICAgam9pbi5saXN0ZW5hYmxlc0VtaXR0ZWQgPSBuZXcgQXJyYXkoam9pbi5udW1iZXJPZkxpc3RlbmFibGVzKTtcbiAgICBqb2luLmFyZ3MgPSBuZXcgQXJyYXkoam9pbi5udW1iZXJPZkxpc3RlbmFibGVzKTtcbn1cblxuZnVuY3Rpb24gbmV3TGlzdGVuZXIoaSxqb2luKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2FsbGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIGlmIChqb2luLmxpc3RlbmFibGVzRW1pdHRlZFtpXSl7XG4gICAgICAgICAgICBzd2l0Y2goam9pbi5zdHJhdGVneSl7XG4gICAgICAgICAgICAgICAgY2FzZSBcInN0cmljdFwiOiB0aHJvdyBuZXcgRXJyb3IoXCJTdHJpY3Qgam9pbiBmYWlsZWQgYmVjYXVzZSBsaXN0ZW5lciB0cmlnZ2VyZWQgdHdpY2UuXCIpO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJsYXN0XCI6IGpvaW4uYXJnc1tpXSA9IGNhbGxhcmdzOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiYWxsXCI6IGpvaW4uYXJnc1tpXS5wdXNoKGNhbGxhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGpvaW4ubGlzdGVuYWJsZXNFbWl0dGVkW2ldID0gdHJ1ZTtcbiAgICAgICAgICAgIGpvaW4uYXJnc1tpXSA9IChqb2luLnN0cmF0ZWd5PT09XCJhbGxcIj9bY2FsbGFyZ3NdOmNhbGxhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbWl0SWZBbGxMaXN0ZW5hYmxlc0VtaXR0ZWQoam9pbik7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZW1pdElmQWxsTGlzdGVuYWJsZXNFbWl0dGVkKGpvaW4pIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpvaW4ubnVtYmVyT2ZMaXN0ZW5hYmxlczsgaSsrKSB7XG4gICAgICAgIGlmICgham9pbi5saXN0ZW5hYmxlc0VtaXR0ZWRbaV0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBqb2luLmNhbGxiYWNrLmFwcGx5KGpvaW4ubGlzdGVuZXIsam9pbi5hcmdzKTtcbiAgICByZXNldChqb2luKTtcbn1cbiIsInZhciBSZWZsdXggPSByZXF1aXJlKCcuLi9zcmMnKTtcblxuXG4vKipcbiAqIEEgbWl4aW4gZmFjdG9yeSBmb3IgYSBSZWFjdCBjb21wb25lbnQuIE1lYW50IGFzIGEgbW9yZSBjb252ZW5pZW50IHdheSBvZiB1c2luZyB0aGUgYExpc3RlbmVyTWl4aW5gLFxuICogd2l0aG91dCBoYXZpbmcgdG8gbWFudWFsbHkgc2V0IGxpc3RlbmVycyBpbiB0aGUgYGNvbXBvbmVudERpZE1vdW50YCBtZXRob2QuXG4gKlxuICogQHBhcmFtIHtBY3Rpb258U3RvcmV9IGxpc3RlbmFibGUgQW4gQWN0aW9uIG9yIFN0b3JlIHRoYXQgc2hvdWxkIGJlXG4gKiAgbGlzdGVuZWQgdG8uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufFN0cmluZ30gY2FsbGJhY2sgVGhlIGNhbGxiYWNrIHRvIHJlZ2lzdGVyIGFzIGV2ZW50IGhhbmRsZXJcbiAqIEBwYXJhbSB7RnVuY3Rpb258U3RyaW5nfSBkZWZhdWx0Q2FsbGJhY2sgVGhlIGNhbGxiYWNrIHRvIHJlZ2lzdGVyIGFzIGRlZmF1bHQgaGFuZGxlclxuICogQHJldHVybnMge09iamVjdH0gQW4gb2JqZWN0IHRvIGJlIHVzZWQgYXMgYSBtaXhpbiwgd2hpY2ggc2V0cyB1cCB0aGUgbGlzdGVuZXIgZm9yIHRoZSBnaXZlbiBsaXN0ZW5hYmxlLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGxpc3RlbmFibGUsY2FsbGJhY2ssaW5pdGlhbCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCB1cCB0aGUgbWl4aW4gYmVmb3JlIHRoZSBpbml0aWFsIHJlbmRlcmluZyBvY2N1cnMuIEltcG9ydCBtZXRob2RzIGZyb20gYExpc3RlbmVyTWV0aG9kc2BcbiAgICAgICAgICogYW5kIHRoZW4gbWFrZSB0aGUgY2FsbCB0byBgbGlzdGVuVG9gIHdpdGggdGhlIGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGUgZmFjdG9yeSBmdW5jdGlvblxuICAgICAgICAgKi9cbiAgICAgICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm9yKHZhciBtIGluIFJlZmx1eC5MaXN0ZW5lck1ldGhvZHMpe1xuICAgICAgICAgICAgICAgIGlmICh0aGlzW21dICE9PSBSZWZsdXguTGlzdGVuZXJNZXRob2RzW21dKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXNbbV0pe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJDYW4ndCBoYXZlIG90aGVyIHByb3BlcnR5ICdcIittK1wiJyB3aGVuIHVzaW5nIFJlZmx1eC5saXN0ZW5UbyFcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzW21dID0gUmVmbHV4Lkxpc3RlbmVyTWV0aG9kc1ttXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKGxpc3RlbmFibGUsY2FsbGJhY2ssaW5pdGlhbCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGVhbnMgdXAgYWxsIGxpc3RlbmVyIHByZXZpb3VzbHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgICovXG4gICAgICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBSZWZsdXguTGlzdGVuZXJNZXRob2RzLnN0b3BMaXN0ZW5pbmdUb0FsbFxuICAgIH07XG59O1xuIiwidmFyIFJlZmx1eCA9IHJlcXVpcmUoJy4uL3NyYycpO1xuXG4vKipcbiAqIEEgbWl4aW4gZmFjdG9yeSBmb3IgYSBSZWFjdCBjb21wb25lbnQuIE1lYW50IGFzIGEgbW9yZSBjb252ZW5pZW50IHdheSBvZiB1c2luZyB0aGUgYGxpc3RlbmVyTWl4aW5gLFxuICogd2l0aG91dCBoYXZpbmcgdG8gbWFudWFsbHkgc2V0IGxpc3RlbmVycyBpbiB0aGUgYGNvbXBvbmVudERpZE1vdW50YCBtZXRob2QuIFRoaXMgdmVyc2lvbiBpcyB1c2VkXG4gKiB0byBhdXRvbWF0aWNhbGx5IHNldCB1cCBhIGBsaXN0ZW5Ub01hbnlgIGNhbGwuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGxpc3RlbmFibGVzIEFuIG9iamVjdCBvZiBsaXN0ZW5hYmxlc1xuICogQHJldHVybnMge09iamVjdH0gQW4gb2JqZWN0IHRvIGJlIHVzZWQgYXMgYSBtaXhpbiwgd2hpY2ggc2V0cyB1cCB0aGUgbGlzdGVuZXJzIGZvciB0aGUgZ2l2ZW4gbGlzdGVuYWJsZXMuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obGlzdGVuYWJsZXMpe1xuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgdXAgdGhlIG1peGluIGJlZm9yZSB0aGUgaW5pdGlhbCByZW5kZXJpbmcgb2NjdXJzLiBJbXBvcnQgbWV0aG9kcyBmcm9tIGBMaXN0ZW5lck1ldGhvZHNgXG4gICAgICAgICAqIGFuZCB0aGVuIG1ha2UgdGhlIGNhbGwgdG8gYGxpc3RlblRvYCB3aXRoIHRoZSBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlIGZhY3RvcnkgZnVuY3Rpb25cbiAgICAgICAgICovXG4gICAgICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZvcih2YXIgbSBpbiBSZWZsdXguTGlzdGVuZXJNZXRob2RzKXtcbiAgICAgICAgICAgICAgICBpZiAodGhpc1ttXSAhPT0gUmVmbHV4Lkxpc3RlbmVyTWV0aG9kc1ttXSl7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzW21dKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IFwiQ2FuJ3QgaGF2ZSBvdGhlciBwcm9wZXJ0eSAnXCIrbStcIicgd2hlbiB1c2luZyBSZWZsdXgubGlzdGVuVG9NYW55IVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbbV0gPSBSZWZsdXguTGlzdGVuZXJNZXRob2RzW21dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG9NYW55KGxpc3RlbmFibGVzKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsZWFucyB1cCBhbGwgbGlzdGVuZXIgcHJldmlvdXNseSByZWdpc3RlcmVkLlxuICAgICAgICAgKi9cbiAgICAgICAgY29tcG9uZW50V2lsbFVubW91bnQ6IFJlZmx1eC5MaXN0ZW5lck1ldGhvZHMuc3RvcExpc3RlbmluZ1RvQWxsXG4gICAgfTtcbn07XG4iLCIvKlxuICogaXNPYmplY3QsIGV4dGVuZCwgaXNGdW5jdGlvbiwgaXNBcmd1bWVudHMgYXJlIHRha2VuIGZyb20gdW5kZXNjb3JlL2xvZGFzaCBpblxuICogb3JkZXIgdG8gcmVtb3ZlIHRoZSBkZXBlbmRlbmN5XG4gKi9cbnZhciBpc09iamVjdCA9IGV4cG9ydHMuaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBvYmo7XG4gICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgdHlwZSA9PT0gJ29iamVjdCcgJiYgISFvYmo7XG59O1xuXG5leHBvcnRzLmV4dGVuZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghaXNPYmplY3Qob2JqKSkge1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cbiAgICB2YXIgc291cmNlLCBwcm9wO1xuICAgIGZvciAodmFyIGkgPSAxLCBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc291cmNlID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbn07XG5cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn07XG5cbmV4cG9ydHMuRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xuXG5leHBvcnRzLm5leHRUaWNrID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCAwKTtcbn07XG5cbmV4cG9ydHMuY2FsbGJhY2tOYW1lID0gZnVuY3Rpb24oc3RyaW5nKXtcbiAgICByZXR1cm4gXCJvblwiK3N0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKStzdHJpbmcuc2xpY2UoMSk7XG59O1xuXG5leHBvcnRzLm9iamVjdCA9IGZ1bmN0aW9uKGtleXMsdmFscyl7XG4gICAgdmFyIG89e30sIGk9MDtcbiAgICBmb3IoO2k8a2V5cy5sZW5ndGg7aSsrKXtcbiAgICAgICAgb1trZXlzW2ldXSA9IHZhbHNbaV07XG4gICAgfVxuICAgIHJldHVybiBvO1xufTtcblxuZXhwb3J0cy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUubGVuZ3RoID09ICdudW1iZXInICYmXG4gICAgICAodG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFyZ3VtZW50c10nIHx8IChoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY2FsbGVlJyAmJiAhcHJvcGVydHlJc0VudW1lcmFibGUuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpKSkpIHx8IGZhbHNlO1xufTtcblxuZXhwb3J0cy50aHJvd0lmID0gZnVuY3Rpb24odmFsLG1zZyl7XG4gICAgaWYgKHZhbCl7XG4gICAgICAgIHRocm93IEVycm9yKG1zZ3x8dmFsKTtcbiAgICB9XG59O1xuIiwidmFyIHJ1bnRpbWU9cmVxdWlyZShcImtzYW5hMjAxNS13ZWJydW50aW1lXCIpO1xyXG4vL3ZhciBrZGU9cmVxdWlyZShcImtzYW5hLWRhdGFiYXNlXCIpO1xyXG5ydW50aW1lLmJvb3QoXCJ2aXN1YWxtYXJrdXBcIixmdW5jdGlvbigpe1xyXG5cdHZhciBNYWluPVJlYWN0LmNyZWF0ZUVsZW1lbnQocmVxdWlyZShcIi4vc3JjL21haW4uanN4XCIpKTtcclxuXHRSZWFjdC5yZW5kZXIoTWFpbixkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW5cIikpO1xyXG59KTsiLCJtb2R1bGUuZXhwb3J0cz1yZXF1aXJlKFwicmVmbHV4XCIpLmNyZWF0ZUFjdGlvbnMoW1xyXG5cdFx0XCJvcGVuRFNcIixcclxuXHRcdFwib3BlbkRTTFwiLFxyXG5cdFx0XCJnb1N1dHJhXCIsICAgICAgLy/liIfmj5vljp/mlodcclxuXHRcdFwiZ29MZWN0dXJlXCIgICAgICAvL+WIh+aPm+ism+e+qVxyXG4gICAgXSk7IiwibW9kdWxlLmV4cG9ydHM9UmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiBcImV4cG9ydHNcIixcclxuXHRyZW5kZXI6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIG51bGwsIFwiZGljdGlvbmFyeVwiKVxyXG5cdH1cclxufSk7IiwidmFyIGtkZT1yZXF1aXJlKFwia3NhbmEtZGF0YWJhc2VcIik7XHJcbnZhciBzdGFja1RvYz1yZXF1aXJlKFwia3NhbmEyMDE1LXN0YWNrdG9jXCIpO1xyXG52YXIgU3RhY2tUb2M9c3RhY2tUb2MuY29tcG9uZW50O1xyXG52YXIgc3RvcmU9cmVxdWlyZShcIi4vc3RvcmVzXCIpLmRzO1xyXG52YXIgYWN0aW9ucz1yZXF1aXJlKFwiLi9hY3Rpb25zXCIpO1xyXG52YXIgUmVmbHV4PXJlcXVpcmUoXCJyZWZsdXhcIik7XHJcbm1vZHVsZS5leHBvcnRzPVJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogXCJleHBvcnRzXCIsXHJcblx0Z2V0SW5pdGlhbFN0YXRlOmZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGN1cnJlbnQ9cGFyc2VJbnQobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ2aXN1YWxtYXJrdXBfa2VwYW5fY3VycmVudFwiKXx8XCIwXCIpO1xyXG5cdFx0cmV0dXJuIHt0b2M6W10sY3VycmVudDpjdXJyZW50fTtcclxuXHR9LFxyXG5cdG1peGluczpbUmVmbHV4Lmxpc3RlblRvKHN0b3JlLFwiZGJPcGVuZWRcIildLFxyXG5cdGRiT3BlbmVkOmZ1bmN0aW9uKGRiLGtlcGFuKXtcclxuXHRcdHZhciB0b2M9c3RhY2tUb2MuZ2VuVG9jKGtlcGFuLFwi6YeR5Ymb57aT6Kyb6KiYXCIpO1xyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZGI6ZGIsdG9jOnRvY30pO1xyXG5cdH0sXHJcblx0cmVuZGVyOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCBudWxsLCBcclxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChTdGFja1RvYywge2RhdGE6IHRoaXMuc3RhdGUudG9jLCBzaG93VGV4dDogdGhpcy5wcm9wcy5zaG93VGV4dCwgY3VycmVudDogdGhpcy5zdGF0ZS5jdXJyZW50fSlcclxuXHRcdClcclxuXHR9XHJcbn0pOyIsInZhciBLc2U9cmVxdWlyZShcImtzYW5hLXNlYXJjaFwiKTtcclxuIFxyXG52YXIgUmVmZXJUZXh0PXJlcXVpcmUoXCIuL3JlZmVydGV4dFwiKTtcclxudmFyIE1hcmt1cFRleHQ9cmVxdWlyZShcIi4vbWFya3VwdGV4dFwiKTtcclxudmFyIE1hcmt1cFBhbmVsPXJlcXVpcmUoXCIuL21hcmt1cHBhbmVsXCIpO1xyXG52YXIgRGljdGlvbmFyeVBhbmVsPXJlcXVpcmUoXCIuL2RpY3Rpb25hcnlwYW5lbFwiKTtcclxudmFyIEtlcGFuUGFuZWw9cmVxdWlyZShcIi4va2VwYW5wYW5lbFwiKTtcclxuXHJcbnZhciBhY3Rpb25zPXJlcXVpcmUoXCIuL2FjdGlvbnNcIik7XHJcbnZhciBtYWluY29tcG9uZW50ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiBcIm1haW5jb21wb25lbnRcIixcclxuXHRnZXRJbml0aWFsU3RhdGU6ZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4ge2RhdGE6XCJcIn0gXHJcblx0fSxcclxuXHRjb21wb25lbnREaWRNb3VudDpmdW5jdGlvbigpIHsgXHJcblx0XHRhY3Rpb25zLm9wZW5EUygpO1xyXG5cdFx0YWN0aW9ucy5vcGVuRFNMKCk7XHJcblx0fSxcclxuXHRzaG93VGV4dDpmdW5jdGlvbihuKSB7XHJcblx0XHRjb25zb2xlLmxvZyhuKVxyXG5cdH0sXHJcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIG51bGwsIFxyXG5cdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtjbGFzc05hbWU6IFwiY29sLW1kLTNcIn0sIFxyXG5cdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoS2VwYW5QYW5lbCwge3Nob3dUZXh0OiB0aGlzLnNob3dUZXh0fSlcclxuXHRcdFx0KSwgXHJcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJjb2wtbWQtNlwifSwgXHJcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChNYXJrdXBQYW5lbCwgbnVsbCksIFxyXG5cdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoUmVmZXJUZXh0LCBudWxsKSwgXHJcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChNYXJrdXBUZXh0LCBudWxsKVxyXG5cdFx0XHQpLCBcclxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7Y2xhc3NOYW1lOiBcImNvbC1tZC0zXCJ9LCBcclxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KERpY3Rpb25hcnlQYW5lbCwgbnVsbClcclxuXHRcdFx0KVxyXG5cclxuXHRcdCk7XHJcblx0fVxyXG59KTtcclxubW9kdWxlLmV4cG9ydHM9bWFpbmNvbXBvbmVudDsiLCJtb2R1bGUuZXhwb3J0cz1SZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6IFwiZXhwb3J0c1wiLFxyXG5cdHJlbmRlcjpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgbnVsbCwgXCJtYXJrdXAgYnV0dG9uc1wiKVxyXG5cdH1cclxufSk7IiwibW9kdWxlLmV4cG9ydHM9UmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiBcImV4cG9ydHNcIixcclxuXHRyZW5kZXI6ZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCBudWxsLCBcIuism+iomFwiKVxyXG5cdH1cclxufSkiLCJ2YXIgUmVmbHV4PXJlcXVpcmUoXCJyZWZsdXhcIik7XHJcbnZhciBzdG9yZT1yZXF1aXJlKFwiLi9zdG9yZXNcIikuZHM7XHJcbnZhciBhY3Rpb25zPXJlcXVpcmUoXCIuL2FjdGlvbnNcIik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1SZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6IFwiZXhwb3J0c1wiLFxyXG5cdG1peGluczpbUmVmbHV4Lmxpc3RlblRvKHN0b3JlLFwiZGJPcGVuZWRcIildLFxyXG5cdGRiT3BlbmVkOmZ1bmN0aW9uKGRiKXtcclxuXHRcdHRoaXMuc2V0U3RhdGUoe2RiOmRifSk7XHJcblx0XHRjb25zb2xlLmxvZyhcImRzIG9wZW5lZFwiKTtcclxuXHR9LFxyXG5cdHJlbmRlcjpmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIG51bGwsIFwi6YeR5Ymb57aTXCIpXHJcblx0fVxyXG59KSIsIlxyXG52YXIga2RlPXJlcXVpcmUoXCJrc2FuYS1kYXRhYmFzZVwiKTtcclxudmFyIFJlZmx1eD1yZXF1aXJlKFwicmVmbHV4XCIpO1xyXG5cclxuXHJcblxyXG52YXIgc3RvcmVfZHNsPVJlZmx1eC5jcmVhdGVTdG9yZSh7XHJcblx0bGlzdGVuYWJsZXM6IFtyZXF1aXJlKFwiLi9hY3Rpb25zXCIpXSxcclxuXHRvbk9wZW5EU0w6ZnVuY3Rpb24oKXtcclxuXHRcdGtkZS5vcGVuKFwiZHNsX2p3blwiLHtwcmVsb2FkOltbXCJmaWVsZHNcIl1dfSxmdW5jdGlvbihlcnIsZGIpe1xyXG5cdFx0XHRpZiAoIWVycikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGRiLmdldChcImZpZWxkc1wiKSk7XHJcblx0XHRcdFx0dGhpcy50cmlnZ2VyKGRiKTtcclxuXHRcdFx0fVxyXG5cdFx0fSx0aGlzKTtcclxuXHR9XHJcbn0pO1xyXG5cclxudmFyIHN0b3JlX2RzPVJlZmx1eC5jcmVhdGVTdG9yZSh7XHJcblx0bGlzdGVuYWJsZXM6IFtyZXF1aXJlKFwiLi9hY3Rpb25zXCIpXSxcclxuXHRvbkdvU3V0cmE6ZnVuY3Rpb24oKSB7XHJcblx0XHRjb25zb2xlLmxvZyhcImdvc3V0cmFcIilcclxuXHR9LFxyXG5cdHBhcnNlS2VwYW46ZnVuY3Rpb24oa2VwYW4pIHsgLy9sZWFkaW5nIG51bWJlciBpcyBkZXB0aFxyXG5cdFx0dmFyIGRlcHRocz1bXSx0ZXh0cz1bXTtcclxuXHRcdGZvciAodmFyIGk9MDtpPGtlcGFuLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0dmFyIGRlcHRoPXBhcnNlSW50KGtlcGFuW2ldKTtcclxuXHRcdFx0ZGVwdGhzLnB1c2goZGVwdGgpO1xyXG5cdFx0XHR2YXIgYXQ9a2VwYW5baV0uaW5kZXhPZihcIi5cIik7XHJcblx0XHRcdHRleHRzLnB1c2goa2VwYW5baV0uc3Vic3RyKGF0KzEpKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB7dGV4dHM6dGV4dHMsZGVwdGhzOmRlcHRoc307XHJcblx0fSxcclxuXHRwcmVwYXJlS2VwYW46ZnVuY3Rpb24oZGIpIHtcclxuXHRcdHZhciBleHRyYT1kYi5nZXQoW1wiZXh0cmFcIl0pO1xyXG5cdFx0dmFyIGZpZWxkcz1kYi5nZXQoW1wiZmllbGRzXCJdKTtcclxuXHRcdHZhciBrZXBhbj10aGlzLnBhcnNlS2VwYW4oZXh0cmEua2VwYW5fanduKTtcclxuXHRcdGtlcGFuLnZwb3M9ZmllbGRzLmt3X2p3bi52cG9zO1xyXG5cdFx0cmV0dXJuIGtlcGFuO1xyXG5cdH0sXHJcblx0b25PcGVuRFM6ZnVuY3Rpb24oKXtcclxuXHRcdGtkZS5vcGVuKFwiZHNcIix7cHJlbG9hZDpbW1wiZmllbGRzXCJdLFtcImV4dHJhXCJdXX0sZnVuY3Rpb24oZXJyLGRiKXtcclxuXHRcdFx0aWYgKCFlcnIpIHtcclxuXHRcdFx0XHR2YXIga2VwYW49dGhpcy5wcmVwYXJlS2VwYW4oZGIpO1xyXG5cdFx0XHRcdHRoaXMudHJpZ2dlcihkYixrZXBhbik7XHJcblx0XHRcdH1cclxuXHRcdH0sdGhpcyk7XHJcblx0fSxcclxuXHJcblx0b25Hb0xlY3R1cmU6ZnVuY3Rpb24oKSB7XHJcblx0XHRjb25zb2xlLmxvZyhcImdvbGVjdHVyZVwiKVxyXG5cdH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cz17ZHM6c3RvcmVfZHMsZHNsOnN0b3JlX2RzbH07XHJcbiJdfQ==
