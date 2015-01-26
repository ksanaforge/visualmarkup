var simple={
	isValidSelection:function(grouped,viewselections) {
		return (grouped.length>0);
	}
	,shadow:false
}
var internal={
	isValidSelection:function(grouped,viewselections) {
		return (grouped.length==1 && grouped[0]>1);
	}
	,shadow:true
}
var intertext={
	isValidSelection:function(grouped,viewselections) {
		return (grouped.length>1)
	}
	,shadow:true
}
var usernote={
	isValidSelection:function(grouped,viewselections) {
		console.log("validate intertext")
		return true;
		//2 viewid has selection, who is the leading?
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