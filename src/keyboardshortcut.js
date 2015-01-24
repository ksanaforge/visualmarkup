var actions=require("./actions_markup");

var keyboardshortcut=function(e) {
	if (!e.altKey)return;
	if (e.which<48&&e.which>57) return;
	var n=e.which-48;
	console.log("dotag",n)
	actions.doTag(n);
	return true;
}
module.exports=keyboardshortcut;