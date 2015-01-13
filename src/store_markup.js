/*
  construct drawable markup object
*/
var Reflux=require("reflux");
var actions=require("./actions_markup");
var testmarkups=require("./testmarkups");

var getTagStyle=function(tag) {
	var style={color:"black"};

	if (tag=="doubt") {
		style.color="#FF00FF";
	} else if (tag=="important") {
		style.color="#00FF7F";
	}
	return style;
}
var layoutMarkups=function(viewpositions,viewmarkups) {
	var out=[];
	for (var i=0;i<viewmarkups.length;i++) {
		var markups=viewmarkups[i];
		var positions=viewpositions[i];
		if (!positions) continue ;
		for (var j=0;j<markups.length;j++) {
			var markup=markups[j];
			var start=markup[0], end=markup[0]+markup[1];
			var style=getTagStyle(markup[2].tag);
			for (var k=start;k<end;k++) {
				if (positions[k] ) {//onscreen
					out.push( [positions[k], style] );
				}
			}
		}
	}
	return out;
}
var store_markup=Reflux.createStore({
	listenables: [actions]
	,viewmarkups:testmarkups
	,viewpositions:[]
	,onMarkupUpdate:function(){
		var drawables=layoutMarkups(this.viewpositions,this.viewmarkups);
		if (drawables) this.trigger(drawables);
	}
	,onTokenPositionUpdated:function(positions,nview) {
		this.viewpositions[nview]=positions;
		var drawables=layoutMarkups(this.viewpositions,this.viewmarkups);
		if (drawables) this.trigger(drawables);
	}
});

module.exports=store_markup;