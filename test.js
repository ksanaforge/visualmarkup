kde=require("ksana-database");
kde.open("ds",function(err,db){

	var fseg=db.fileSegFromVpos(9);
	
	var seg=db.fileSegToAbsSeg(fseg.file,fseg.seg);

	console.log(fseg,seg)
	var vpos=db.fileSegToVpos(fseg.file,fseg.seg);
	console.log("vpos",vpos)

	//vpos=db.fileSegToVpos(fseg.file,fseg.seg);
	//console.log(vpos)

});