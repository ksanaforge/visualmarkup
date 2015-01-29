var drawing=require("./drawing");
var drawImportant=function(ctx,inst) {
	var gra=ctx.createLinearGradient(0,0,0,(inst.rect[3]-inst.rect[1])*3);
	gra.addColorStop(0,"rgba(255, 0, 0, 0.2)");
	gra.addColorStop(1,"rgba(0,0 , 255, 0.7)");
	ctx.fillStyle=gra;
	ctx.fillinst.rect(inst.rect[0],inst.rect[1],inst.rect[2]-inst.rect[0],inst.rect[3]-inst.rect[1]);
}

var drawDoubt=function(ctx,inst) {
	var cx=(inst.rect[0]+inst.rect[2])/2;
	var cy=(inst.rect[1]+inst.rect[3])/2;
	var r=(inst.rect[3]-inst.rect[1])/2 +1;

	ctx.beginPath();
	ctx.setLineDash([3])
	ctx.lineWidth=1;
	ctx.strokeStyle="red";
	ctx.arc(cx,cy,r,0,2*Math.PI,false);
	ctx.stroke();
	//ctx.fillStyle="red";
	//ctx.fillinst.rect(inst.rect[0],inst.rect[3],inst.rect[2]-inst.rect[0],3);
}
var drawSimple=function(ctx,inst) {
	ctx.beginPath();
	ctx.strokeStyle=inst.tagsetting.color;
	ctx.setLineDash([2]);
	ctx.lineWidth=2;
	var x1=inst.rect[0],y1=inst.rect[1],x2=inst.rect[2],y2=inst.rect[3];

	ctx.moveTo(x2,y1);ctx.lineTo(x1,y1);
	if (inst.nth==0) ctx.lineTo(x1,y2);
	ctx.moveTo(x1,y2);ctx.lineTo(x2,y2);
	if (inst.nth==inst.len-1) ctx.lineTo(x2,y1);
	ctx.stroke();
}

var drawReaderExpress=function(ctx,inst) {
	var cx=(inst.rect[0]+inst.rect[2])/2;
	var cy=(inst.rect[1]+inst.rect[3])/2;
	var r=(inst.rect[3]-inst.rect[1])/2 +1;

	ctx.beginPath();
	ctx.setLineDash([3])
	ctx.lineWidth=2;
	ctx.strokeStyle=inst.tagsetting.color;
	ctx.arc(cx,cy,r,0,2*Math.PI,false);
	ctx.stroke();
}
var drawIntertext=function(ctx,inst,n,insts){
	var cx=(inst.rect[0]+inst.rect[2])/2;
	var cy=(inst.rect[1]+inst.rect[3])/2;
	var r=(inst.rect[3]-inst.rect[1])/2 +1;

	ctx.beginPath();
	ctx.setLineDash([3])
	ctx.lineWidth=2;
	ctx.strokeStyle=inst.tagsetting.color;
	ctx.arc(cx,cy,r,0,2*Math.PI,false);

	if (inst.master) {
		var x1=inst.master.rect[0],y1=inst.master.rect[3];
		var x2=inst.rect[0],y2=inst.rect[1];
		if (y1>y2) {
			y1=inst.master.rect[1];
			y2=inst.rect[3];
		}
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
	}
	ctx.stroke();
}
var combinedRect=function(insts,n){
	var i=n;
	var inst=insts[i];
	var x1=inst.rect[0],y1=inst.rect[1],x2=inst.rect[2],y2=inst.rect[3];
	while (i<insts.length) {
		x2=inst.rect[2],y2=inst.rect[3];
		if (inst.nth==inst.len-1) break;
		inst=insts[i++];
	}
	return [x1,y1,x2,y2];
}
var findMasterN=function(insts,master) {
	for (var i=0;i<insts.length;i++) {
		if (insts[i]==master) return i;
	}
}
var masterCombinedRect=function(insts,master){
	var n=findMasterN(insts,master);
	return combinedRect(insts,n);
}
var drawInternal=function(ctx,inst,n,insts) {
	ctx.beginPath();
	ctx.strokeStyle=inst.tagsetting.color;
	ctx.fillStyle=inst.tagsetting.fillcolor ||inst.tagsetting.color;
	ctx.setLineDash([2]);
	ctx.lineWidth=2;
	
	var x1=inst.rect[0],y1=inst.rect[1],x2=inst.rect[2],y2=inst.rect[3];

	ctx.moveTo(x2,y1);ctx.lineTo(x1,y1);
	if (inst.nth==0) ctx.lineTo(x1,y2);
	ctx.moveTo(x1,y2);ctx.lineTo(x2,y2);
	if (inst.nth==inst.len-1) ctx.lineTo(x2,y1);


	if (inst.master) {
		var masterRect=masterCombinedRect(insts,inst.master);
		var rect=combinedRect(insts,n);
		drawing.curveLink(ctx,rect,masterRect);

		if (inst.tagsetting && inst.tagsetting.labels) {
			ctx.strokeStyle='#000';
			ctx.fillStyle='#000';
			ctx.fillText(inst.tagsetting.labels[0],masterRect[0],masterRect[1]-2);
			ctx.fillText(inst.tagsetting.labels[1],rect[0],rect[1]-2);
		}
	}


	ctx.stroke();
}

var drawers={
	simple:drawSimple
	,intertext:drawInternal
	,internal:drawInternal
};

var draw=function(ctx,inst,n,insts) {
	var drawer=drawers[inst.tagsetting.type];
	if (drawer) drawer(ctx,inst,n,insts);
}
module.exports={draw:draw};