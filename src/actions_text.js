var action_texts=require("reflux").createActions([
		"getKepan",
		"openDSL",
		"openDS",
		"getSutraTextByKepanId",     
		"getLectureTextByKepanId",
		"getSutraTextBySeg",
		"getLectureTextBySeg",
		"getTextBySeg",
		"nextPara",
		"prevPara",
		"searchDictionary" ,
		"nextSutraPara",
		"prevSutraPara",
		"nextLecturePara",
		"prevLecturePara",
		"goKepanId",
		"getTextByVpos",
		"onSyncKepan",
		"onSyncLecture",
		"onSyncSutra"
]);
module.exports=action_texts;