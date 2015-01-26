
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
var PartOfSpeechColor={noun:"#F73",verb:"#993",adjective:"#66F",
pronoun:"#7F3",preposition:"#3F3",conjunction:"#F0F",adverb:"#2FF"
,numeral:"#3F7",classifier:"#F07",particle:"#0FF"};
var drawSimple=function(ctx,inst) {
	ctx.beginPath();
	ctx.strokeStyle=PartOfSpeechColor[inst.payload.tag];
	ctx.setLineDash([2]);
	ctx.lineWidth=2;
	var x1=inst.rect[0],y1=inst.rect[1],x2=inst.rect[2],y2=inst.rect[3];

	ctx.moveTo(x2,y1);ctx.lineTo(x1,y1);
	if (inst.nth==0) ctx.lineTo(x1,y2);
	ctx.moveTo(x1,y2);ctx.lineTo(x2,y2);
	if (inst.nth==inst.len-1) ctx.lineTo(x2,y1);
	ctx.stroke();
}
var readerExperssColor={important2:"#F33"};

var drawReaderExpress=function(ctx,inst) {
	var cx=(inst.rect[0]+inst.rect[2])/2;
	var cy=(inst.rect[1]+inst.rect[3])/2;
	var r=(inst.rect[3]-inst.rect[1])/2 +1;

	ctx.beginPath();
	ctx.setLineDash([3])
	ctx.lineWidth=2;
	ctx.strokeStyle=readerExperssColor[inst.payload.tag];
	ctx.arc(cx,cy,r,0,2*Math.PI,false);
	ctx.stroke();
}

var painters={
	simple:drawSimple
};

var draw=function(ctx,inst) {
	console.log(inst)
	var painter=painters[inst.tagdef.type];
	if (painter) painter(ctx,inst);
}
module.exports={draw:draw};