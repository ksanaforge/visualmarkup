var store_userinfo=require("./store_userinfo");

var simple={
	isValidSelection:function(grouped,viewselections) {
		return (grouped.length>0);
	}
	,initPayload:function(tag) {
		return {tag:tag,source:store_userinfo.getUserName()};
	}
	,shadow:false
}
var internal={
	isValidSelection:function(grouped,viewselections) {
		return (grouped.length==1 && grouped[0]>1);
	}
	,initPayload:function() {

	}
	,shadow:true
}
var intertext={
	isValidSelection:function(grouped,viewselections) {
		return (grouped.length>1)
	}
	,initPayload:function() {

	}
	,shadow:true
}
var usernote={
	isValidSelection:function(grouped,viewselections) {
		console.log("validate intertext")
		return true;
		//2 viewid has selection, who is the leading?
	}
	,initPayload:function() {

	}
	,shadow:true
}
var defs={
	"simple":simple
	,"internal":internal
	,"intertext":intertext
	,"usernote":usernote
}

module.exports=defs;