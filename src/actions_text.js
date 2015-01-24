var action_texts=require("reflux").createActions([
		"getKepan",
		"openDSL",
		"openDS",
		"getSutraTextByKepanId",     
		"getLectureTextByKepanId",
		"getSutraTextBySeg",
		"getLectureTextBySeg",
		"searchDictionary" ,
		"nextSutraPara",
		"prevSutraPara",
		"nextLecturePara",
		"prevLecturePara",
		"goKepanId"
]);
module.exports=action_texts;