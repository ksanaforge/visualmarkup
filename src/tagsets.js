/*markup defination file*/
var tagset_partofspeech=[
   {label:"名詞", name:"noun", type:"marksimple", desc:"：桌、椅"} 
  ,{label:"動詞", name:"verb", type:"marksimple", desc:"：行、住、坐、臥"} 
  ,{label:"形容詞", name:"adjective",type:"marksimple", desc:"：冷、熱"}  
  ,{label:"副詞", name:"adverb",type:"marksimple", desc:"：快、慢"}  
  ,{label:"代名詞", name:"pronoun", type:"markinternal", desc:"：你、我、他"} 
  ,{label:"助詞", name:"particle",type:"marksimple", desc:"：很"}    
  ,{label:"連接詞", name:"conjunction", type:"marksimple", desc:"：及"} 
  ,{label:"介詞", name:"preposition", type:"marksimple" , desc:"："} 
  ,{label:"數詞", name:"numeral",type:"marksimple", desc:"：百、千、萬"}  
  ,{label:"量詞", name:"classifier",type:"marksimple", desc:"：匹、頭"}  

];
var tagset_punctuation=[
   {label:"句號", name:"fullstop", type:"markinternal"} 
  ,{label:"逗號", name:"comma", type:"marksimple"} 
  ,{label:"頓號", name:"douten", type:"marksimple"} 
  ,{label:"分號", name:"semicolon",type:"marksimple"}  
  ,{label:"冒號", name:"colon",type:"marksimple"}  
  ,{label:"引號", name:"quotationmark",type:"marksimple"}    
  ,{label:"夾注", name:"warichu", type:"marksimple" } 
  ,{label:"問號", name:"questionmark", type:"marksimple"  } 
  ,{label:"驚嘆", name:"exclamationmark",type:"marksimple"}  
  ,{label:"破折", name:"emdash",type:"marksimple"}  
  ,{label:"刪節", name:"ellipsis",type:"marksimple"}  
  ,{label:"專名", name:"propernamemark",type:"marksimple"}  
  ,{label:"間隔", name:"interpunct",type:"marksimple"}  
  ,{label:"連接", name:"dash",type:"marksimple"}  

];
var tagset_defination=[
  {label:"釋義", name:"defination", type:"markinternal2",labels:["字詞","釋義"]  } 
  ,{label:"同名異譯", name:"translation", type:"markinternal2",labels:["字詞","譯名"]  } 

];

var tagset_wordrelation=[
   {label:"同義", name:"synonym", type: "markinternal"  ,labels:["詞彙","同義詞"]} 
  ,{label:"反義詞", name:"antonym", type: "markinternal"  ,labels:["詞彙","反義詞"]} 
  ,{label:"能所", name:"sign", type: "markinternal2"  ,labels:["能指","所指"]} 
  ,{label:"名相", name:"nameappearance", type: "markinternal2" ,labels:["名","相"] } 
  ,{label:"因果", name:"causeeffect", type: "markinternal2" ,labels:["因","果"] } 
  ,{label:"題名互文", name:"bookquote", type: "markinternal2" ,labels:["題名","引文"] } 
  ,{label:"人名互文", name:"personquote", type: "markinternal2" ,labels:["人名","引文"] } 
  ,{label:"跨文本互文", name:"quote", type: "markintertext" } 
];
var tagset_wordcontext=[
   {label:"人", name:"person", type:"marksimple"} 
  ,{label:"事", name:"matter", type:"marksimple"} 
  ,{label:"時", name:"time",type:"marksimple"}  
  ,{label:"地", name:"place",type:"marksimple"}  
  ,{label:"物", name:"thing",type:"marksimple"}    
  ,{label:"狀態", name:"state",type:"marksimple"}    
  ,{label:"顏色", name:"color",type:"marksimple"}    
  ,{label:"動作", name:"action",type:"marksimple"}    

  ,{label:"其他", name:"other",type:"marksimple"}    

  ,{label:"食", name:"eating", type:"marksimple" } 
  ,{label:"衣", name:"clothing", type:"marksimple"  } 
  ,{label:"住", name:"housing",type:"marksimple"}  
  ,{label:"行", name:"traffic",type:"marksimple"}  
  ,{label:"育", name:"education",type:"marksimple"}
  ,{label:"樂", name:"entertainment",type:"marksimple"}
 ];
var tagset_authorexpress=[ 
   {label:"重點", name:"important", type: "marksimple"}
  ,{label:"說明", name:"clarify", type: "marksimple"}
  ,{label:"提醒", name:"remind", type: "marksimple"}
  ,{label:"補充", name:"complement", type: "marksimple"}
  ,{label:"推論", name:"inference", type: "marksimple"}
  ,{label:"提問", name:"question", type: "marksimple"}
  ,{label:"回答", name:"answer", type: "marksimple"}
  ,{label:"校勘", name:"revise", type: "marksimple"}
  ,{label:"語譜", name:"paradigm", type: "marksimple"}
  ,{label:"情感", name:"emotion", type: "marksimple"}
];

var tagset_readerexpress=[
   {label:"重點",name:"important2",type:"markusernode"} 
  ,{label:"摘要",name:"abstract2",type:"markusernode"}
  ,{label:"提問",name:"question2",type:"markusernode"} 
  ,{label:"解釋", name:"explain2", type:"markusernode"} 
  ,{label:"感受", name:"feel2", type:"markusernode"} 
];

var tagsets=[
	 {label:"詞性",name:"partofspeech", tagset:tagset_partofspeech}
	,{label:"標逗",name:"punctuation",  tagset:tagset_punctuation}
	,{label:"釋義",name:"defination",  tagset:tagset_defination}
	,{label:"字詞關係",name:"wordrelation", tagset:tagset_wordrelation}
	,{label:"字詞情境",name:"wordcontext",  tagset:tagset_wordcontext}
	,{label:"作者表達",name:"authorexpress",tagset:tagset_authorexpress}
	,{label:"讀者表達",name:"readerexpress",tagset:tagset_readerexpress}	
]


module.exports=tagsets;
