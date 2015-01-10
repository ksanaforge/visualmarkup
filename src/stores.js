
var kde=require("ksana-database");
var Reflux=require("reflux");



var store_dsl=Reflux.createStore({
	listenables: [require("./actions")],
	onOpenDSL:function(){
		kde.open("dsl_jwn",{preload:[["fields"]]},function(err,db){
			if (!err) {
				console.log(db.get("fields"));
				this.trigger(db);
			}
		},this);
	}
});

var store_ds=Reflux.createStore({
	listenables: [require("./actions")],
	onGoSutra:function() {
		console.log("gosutra")
	},
	parseKepan:function(kepan) { //leading number is depth
		var depths=[],texts=[];
		for (var i=0;i<kepan.length;i++) {
			var depth=parseInt(kepan[i]);
			depths.push(depth);
			var at=kepan[i].indexOf(".");
			texts.push(kepan[i].substr(at+1));
		}
		return {texts:texts,depths:depths};
	},
	prepareKepan:function(db) {
		var extra=db.get(["extra"]);
		var fields=db.get(["fields"]);
		var kepan=this.parseKepan(extra.kepan_jwn);
		kepan.vpos=fields.kw_jwn.vpos;
		return kepan;
	},
	onOpenDS:function(){
		kde.open("ds",{preload:[["fields"],["extra"]]},function(err,db){
			if (!err) {
				var kepan=this.prepareKepan(db);
				this.trigger(db,kepan);
			}
		},this);
	},

	onGoLecture:function() {
		console.log("golecture")
	}
});

module.exports={ds:store_ds,dsl:store_dsl};
