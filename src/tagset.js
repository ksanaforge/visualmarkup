/*markup defination file*/
var tagset_partofspeech=[
  {caption:"代名詞", tag:"pronoun", type:"markinternal"} 
  ,{caption:"名詞", tag:"noun", type:"marksimple"} 
  ,{caption:"動詞", tag:"verb", type:"marksimple"} 
  ,{caption:"副詞", tag:"adverb",type:"marksimple"}  
  ,{caption:"形容詞", tag:"adjective",type:"marksimple"}  
  ,{caption:"助詞", tag:"particle",type:"marksimple"}    
  ,{caption:"連接詞", tag:"conjunction", type:"marksimple" } 
  ,{caption:"介詞", tag:"preposition", type:"marksimple"  } 
  ,{caption:"數詞", tag:"numeral",type:"marksimple"}  
  ,{caption:"量詞", tag:"classifier",type:"marksimple"}  

];
var tagset_punctuation=[
   {caption:"句號", tag:"fullstop", type:"markinternal"} 
  ,{caption:"逗號", tag:"comma", type:"marksimple"} 
  ,{caption:"頓號", tag:"douten", type:"marksimple"} 
  ,{caption:"分號", tag:"semicolon",type:"marksimple"}  
  ,{caption:"冒號", tag:"colon",type:"marksimple"}  
  ,{caption:"引號", tag:"quotationmark",type:"marksimple"}    
  ,{caption:"夾注號", tag:"warichu", type:"marksimple" } 
  ,{caption:"問號", tag:"questionmark", type:"marksimple"  } 
  ,{caption:"驚嘆號", tag:"exclamationmark",type:"marksimple"}  
  ,{caption:"破折號", tag:"emdash",type:"marksimple"}  
  ,{caption:"刪節號", tag:"ellipsis",type:"marksimple"}  
  ,{caption:"專名號", tag:"propernamemark",type:"marksimple"}  
  ,{caption:"間隔號", tag:"interpunct",type:"marksimple"}  
  ,{caption:"連接號", tag:"dash",type:"marksimple"}  

];
var tagset_defination=[
  {caption:"釋義", tag:"defination", type:"markinternal2",label:["字詞","釋義"]  } 
  {caption:"同名異譯", tag:"defination", type:"markinternal2",label:["字詞","譯名"]  } 

];

var tagset_wordrelation=[
   {caption:"同義", tag:"synonym", type: "markinternal"  ,label:["詞彙","同義詞"]} 
  ,{caption:"反義詞", tag:"antonym", type: "markinternal"  ,label:["詞彙","反義詞"]} 
  ,{caption:"能所", tag:"sign", type: "markinternal2"  ,label:["能指","所指"]} 
  ,{caption:"名相", tag:"nameappearance", type: "markinternal2" ,label:["名","相"] } 
  ,{caption:"因果", tag:"causeeffect", type: "markinternal2" ,label:["因","果"] } 
  ,{caption:"題名互文", tag:"bookquote", type: "markinternal2" ,label:["題名","引文"] } 
  ,{caption:"人名互文", tag:"personquote", type: "markinternal2" ,label:["人名","引文"] } 
  ,{caption:"跨文本互文", tag:"quote", type: "markintertext" } 
];
var tagset_wordcontext=[
   {caption:"人", tag:"person", type:"marksimple"} 
  ,{caption:"事", tag:"matter", type:"marksimple"} 
  ,{caption:"時", tag:"time",type:"marksimple"}  
  ,{caption:"地", tag:"place",type:"marksimple"}  
  ,{caption:"物", tag:"thing",type:"marksimple"}    
  ,{caption:"狀態", tag:"state",type:"marksimple"}    
  ,{caption:"顏色", tag:"color",type:"marksimple"}    
  ,{caption:"動作", tag:"action",type:"marksimple"}    

  ,{caption:"其他", tag:"other",type:"marksimple"}    

  ,{caption:"食", tag:"eating", type:"marksimple" } 
  ,{caption:"衣", tag:"clothing", type:"marksimple"  } 
  ,{caption:"住", tag:"housing",type:"marksimple"}  
  ,{caption:"行", tag:"traffic",type:"marksimple"}  
  ,{caption:"育", tag:"education",type:"marksimple"}
  ,{caption:"樂", tag:"entertainment",type:"marksimple"}
 ];
var tagset_authorexpress=[
   {caption:"重點", tag:"important", type: "marksimple"}
  ,{caption:"說明", tag:"clarify", type: "marksimple"}
  ,{caption:"提醒", tag:"remind", type: "marksimple"}
  ,{caption:"補充", tag:"complement", type: "marksimple"}
  ,{caption:"推論", tag:"inference", type: "marksimple"}
  ,{caption:"提問", tag:"question", type: "marksimple"}
  ,{caption:"回答", tag:"answer", type: "marksimple"}
  ,{caption:"校勘", tag:"revise", type: "marksimple"}
  ,{caption:"語譜", tag:"paradigm", type: "marksimple"}
  ,{caption:"情感", tag:"emotion", type: "marksimple"}
];

var tagset_readerexpress=[
   {caption:"重點",tag:"important2",type:"markusernode"} 
  ,{caption:"摘要",tag:"abstract2",type:"markusernode"}
  ,{caption:"提問",tag:"question2",type:"markusernode"} 
  ,{caption:"解釋", tag:"explain2", type:"markusernode"} 
  ,{caption:"感受", tag:"feel2", type:"markusernode"} 
];

var tagsets={
	[
		 {caption:"詞性",name:"partofspeech", tagset:tagset_partofspeech}
		,{caption:"標逗",name:"punctuation",  tagset:tagset_punctuation}
		,{caption:"釋義",name:"defination",  tagset:tagset_defination}
		,{caption:"字詞關係",name:"wordrelation",  tagset:tagset_wordrelation}
		,{caption:"字詞情境",name:"wordcontext",  tagset:tagset_wordcontxt}
		,{caption:"作者表達",name:"authorexpress",tagset_authorexpress}
		,{caption:"讀者表達",name:"readerexpress",tagset_readerexpress}	
	]

}
modules.exports=tagsets;
