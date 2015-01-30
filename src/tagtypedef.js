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