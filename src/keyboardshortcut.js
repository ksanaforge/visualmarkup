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