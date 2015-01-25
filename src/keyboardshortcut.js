var actions=require("./actions_markup");

var keyboardshortcut=function(e) {
	if (!e.altKey)return;
	if (e.which<48&&e.which>57) return;
	var n=e.which-49;
	if (e.which==48) n=9;
	actions.doTag(n);
	return true;
}
module.exports=keyboardshortcut;