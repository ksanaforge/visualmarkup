
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
var PartOfSpeechColor={noun:"#F73",verb:"#993",adjective:"#66F",
pronoun:"#7F3",preposition:"#3F3",conjunction:"#F0F",adverb:"#2FF"
,numeral:"#3F7",classifier:"#F07",particle:"#0FF"};
var drawPartOfSpeech=function(rect,ctx,tag,nth,len) {
	ctx.beginPath();
	ctx.strokeStyle=PartOfSpeechColor[tag];
	ctx.setLineDash([2]);
	ctx.lineWidth=2;
	var x1=rect[0],y1=rect[1],x2=rect[2],y2=rect[3];

	ctx.moveTo(x2,y1);ctx.lineTo(x1,y1);
	if (nth==0) ctx.lineTo(x1,y2);
	ctx.moveTo(x1,y2);ctx.lineTo(x2,y2);
	if (nth==len-1) ctx.lineTo(x2,y1);
	ctx.stroke();
}
var readerExperssColor={important2:"#F33"};

var drawReaderExpress=function(rect,ctx,tag) {
	var cx=(rect[0]+rect[2])/2;
	var cy=(rect[1]+rect[3])/2;
	var r=(rect[3]-rect[1])/2 +1;

	ctx.beginPath();
	ctx.setLineDash([3])
	ctx.lineWidth=2;
	ctx.strokeStyle=readerExperssColor[tag];
	ctx.arc(cx,cy,r,0,2*Math.PI,false);
	ctx.stroke();
}

var painters={
	important:drawImportant
	,doubt:drawDoubt
	,important2:drawReaderExpress
	,noun:drawPartOfSpeech 
	,verb:drawPartOfSpeech
	,adjective:drawPartOfSpeech
	,adverb:drawPartOfSpeech
	,particle:drawPartOfSpeech
	,pronoun:drawPartOfSpeech
	,preposition:drawPartOfSpeech
	,conjunction:drawPartOfSpeech
	,numeral:drawPartOfSpeech
	,classifier:drawPartOfSpeech
	,particle:drawPartOfSpeech
	}
;

var draw=function(tag,rect,ctx,nth,len) {
	var painter=painters[tag];
	if (painter) painter(rect,ctx,tag,nth,len);
}
module.exports={draw:draw};