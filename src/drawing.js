
var curveLink=function(ctx,rect,master) {
	var x1=(rect[0]+rect[2])/2, y1=(rect[3]); 

	var x3=(master[0]+master[2])/2, y3=(master[3]);

	if (Math.abs(y3-y1)>Math.abs(master[1]-y1)) y3=master[1];
	if (Math.abs(y1-y3)>Math.abs(rect[1]-y3)) y1=rect[1];

/*
	var max_y=y1;
	if (y3>y1) max_y=y3;
	var x2=(x1+x3)/2, y2=max_y+20;
*/
	ctx.moveTo(x1,y1+3);
	//ctx.quadraticCurveTo(x2,y2,x3,y3);
	ctx.lineTo(x3,y3+3);
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(x3 , y3 , 3, 0, Math.PI*2, true); 
	ctx.closePath();
	ctx.fill();

}

module.exports={curveLink:curveLink};