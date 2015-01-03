var runtime=require("ksana2015-webruntime");
//var kde=require("ksana-database");
runtime.boot("visualmarkup","main","main",function(){
	var Main=React.createElement(require("./src/main.jsx"));
	React.render(Main,document.getElementById("main"));
});
