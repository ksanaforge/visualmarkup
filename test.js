Kse=require("ksana-search");
Kse.search("cbeta","菩提",{range:{start:0}},function(err,data){
	console.log(data.rawresult.length);
	console.log(data.excerpt[0])
});