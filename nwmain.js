var file=process.cwd()+require("path").sep+'bundle.js';

var watchFiles=function() {
  var fs=require('fs');
  fs.watchFile(file, function (f1, f2) {
    if (f1.mtime.toString()!=f2.mtime.toString()) reload();
  });
}
var unwatchFiles=function() {
  var fs=require('fs');
  fs.unwatchFile(file);
}
var reload=function(){
  var gui = global.window.nwDispatcher.requireNwGui();
  var win = gui.Window.get();
  gui.App.clearCache();
  win.reload();
}

var gui = global.window.nwDispatcher.requireNwGui();
gui.Window.get().on('close', function(){
   unwatchFiles();
   gui.App.quit();
});
watchFiles();