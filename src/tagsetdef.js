var simple={
	isValidSelection:function(viewselections) {
		console.log("validate simple")
		return true;
	}
	,shadow:false
}
var internal={
	isValidSelection:function(viewselections) {
		console.log("validate internal")
		return true;
	}
	,shadow:true
}
var intertext={
	isValidSelection:function(viewselections) {
		console.log("validate intertext")
		return true;
		//2 viewid has selection, who is the leading?
	}
	,shadow:true
}
var usernote={
	isValidSelection:function(viewselections) {
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