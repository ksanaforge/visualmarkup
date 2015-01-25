/*markup defination file*/
var tagset_partofspeech=[
   {label:"名詞", name:"noun", type:"simple", desc:"：桌、椅"} 
  ,{label:"動詞", name:"verb", type:"simple", desc:"：行、住、坐、臥"} 
  ,{label:"形容詞", name:"adjective",type:"simple", desc:"：冷、熱"}  
  ,{label:"副詞", name:"adverb",type:"simple", desc:"：快、慢"}  
  ,{label:"代名詞", name:"pronoun", type:"internal", desc:"：你、我、他"} 
  ,{label:"助詞", name:"particle",type:"simple", desc:"：很"}    
  ,{label:"連接詞", name:"conjunction", type:"simple", desc:"：及"} 
  ,{label:"介詞", name:"preposition", type:"simple" , desc:"："} 
  ,{label:"數詞", name:"numeral",type:"simple", desc:"：百、千、萬"}  
  ,{label:"量詞", name:"classifier",type:"simple", desc:"：匹、頭"}  

];
var tagset_punctuation=[
   {label:"句號", name:"fullstop", type:"internal"} 
  ,{label:"逗號", name:"comma", type:"simple"} 
  ,{label:"頓號", name:"douten", type:"simple"} 
  ,{label:"分號", name:"semicolon",type:"simple"}  
  ,{label:"冒號", name:"colon",type:"simple"}  
  ,{label:"引號", name:"quotationmark",type:"simple"}    
  ,{label:"夾注", name:"warichu", type:"simple" } 
  ,{label:"問號", name:"questionmark", type:"simple"  } 
  ,{label:"驚嘆", name:"exclamationmark",type:"simple"}  
  ,{label:"破折", name:"emdash",type:"simple"}  
  ,{label:"刪節", name:"ellipsis",type:"simple"}  
  ,{label:"專名", name:"propernamemark",type:"simple"}  
  ,{label:"間隔", name:"interpunct",type:"simple"}  
  ,{label:"連接", name:"dash",type:"simple"}  

];
var tagset_defination=[
  {label:"釋義", name:"defination", type:"internal",labels:["字詞","釋義"]  } 
  ,{label:"同名異譯", name:"translation", type:"internal",labels:["字詞","譯名"]  } 

];

var tagset_wordrelation=[
   {label:"同義", name:"synonym", type: "internal"  ,labels:["詞彙","同義詞"]} 
  ,{label:"反義詞", name:"antonym", type: "internal"  ,labels:["詞彙","反義詞"]} 
  ,{label:"能所", name:"sign", type: "internal"  ,labels:["能指","所指"]} 
  ,{label:"名相", name:"nameappearance", type: "internal" ,labels:["名","相"] } 
  ,{label:"因果", name:"causeeffect", type: "internal" ,labels:["因","果"] } 
  ,{label:"題名互文", name:"bookquote", type: "internal" ,labels:["題名","引文"] } 
  ,{label:"人名互文", name:"personquote", type: "internal" ,labels:["人名","引文"] } 
  ,{label:"跨文本互文", name:"quote", type: "intertext" } 
];
var tagset_wordcontext=[
   {label:"人", name:"person", type:"simple"} 
  ,{label:"事", name:"matter", type:"simple"} 
  ,{label:"時", name:"time",type:"simple"}  
  ,{label:"地", name:"place",type:"simple"}  
  ,{label:"物", name:"thing",type:"simple"}    
  ,{label:"狀態", name:"state",type:"simple"}    
  ,{label:"顏色", name:"color",type:"simple"}    
  ,{label:"動作", name:"action",type:"simple"}    

  ,{label:"其他", name:"other",type:"simple"}    

  ,{label:"食", name:"eating", type:"simple" } 
  ,{label:"衣", name:"clothing", type:"simple"  } 
  ,{label:"住", name:"housing",type:"simple"}  
  ,{label:"行", name:"traffic",type:"simple"}  
  ,{label:"育", name:"education",type:"simple"}
  ,{label:"樂", name:"entertainment",type:"simple"}
 ];
var tagset_authorexpress=[ 
   {label:"重點", name:"important", type: "simple"}
  ,{label:"說明", name:"clarify", type: "simple"}
  ,{label:"提醒", name:"remind", type: "simple"}
  ,{label:"補充", name:"complement", type: "simple"}
  ,{label:"推論", name:"inference", type: "simple"}
  ,{label:"提問", name:"question", type: "simple"}
  ,{label:"回答", name:"answer", type: "simple"}
  ,{label:"校勘", name:"revise", type: "simple"}
  ,{label:"語譜", name:"paradigm", type: "simple"}
  ,{label:"情感", name:"emotion", type: "simple"}
];

var tagset_readerexpress=[
   {label:"重點",name:"important2",type:"usernote"} 
  ,{label:"摘要",name:"abstract2",type:"usernote"}
  ,{label:"提問",name:"question2",type:"usernote"} 
  ,{label:"解釋", name:"explain2", type:"usernote"} 
  ,{label:"感受", name:"feel2", type:"usernote"} 
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
