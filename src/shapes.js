
var drawImportant=function(rect,ctx) {
	var gra=ctx.createLinearGradient(0,0,0,(rect[3]-rect[1])*3);
	gra.addColorStop(0,"rgba(255, 0, 0, 0.2)");
	gra.addColorStop(1,"rgba(0,0 , 255, 0.7)");
	ctx.fillStyle=gra;
	ctx.fillRect(rect[0],rect[1],rect[2]-rect[0],rect[3]-rect[1]);
}

var drawDoubt=function(rect,ctx) {
	var cx=(rect[0]+rect[2])/2;
	var cy=(rect[1]+rect[3])/2;
	var r=(rect[3]-rect[1])/2 +1;

	ctx.beginPath();
	ctx.setLineDash([3])
	ctx.lineWidth=1;
	ctx.strokeStyle="red";
	ctx.arc(cx,cy,r,0,2*Math.PI,false);
	ctx.stroke();
	//ctx.fillStyle="red";
	//ctx.fillRect(rect[0],rect[3],rect[2]-rect[0],3);
}
var painters={important:drawImportant,doubt:drawDoubt};

var draw=function(tag,rect,ctx) {
	var painter=painters[tag];
	if (painter) painter(rect,ctx);
}
module.exports={draw:draw};