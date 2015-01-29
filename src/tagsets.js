/*markup defination file*/
var tagset_partofspeech=[
  {label:"代名詞", name:"pronoun", type:"simple", desc:"：你、我、他", color:"#7F3"} 
  ,{label:"名詞", name:"noun", type:"simple", desc:"：桌、椅",color:"#F73"} 
  ,{label:"動詞", name:"verb", type:"simple", desc:"：行、住、坐、臥",color:"#993"} 
  ,{label:"副詞", name:"adverb",type:"simple", desc:"：快、慢",color:"#2FF"}  
  ,{label:"形容詞", name:"adjective",type:"simple", desc:"：冷、熱",color:"#66F"}  
  ,{label:"助詞", name:"particle",type:"simple", desc:"：很",color:"#0FF"}
  ,{label:"連接詞", name:"conjunction", type:"simple", desc:"：及",color:"#F0F"} 
  ,{label:"介詞", name:"preposition", type:"simple" , desc:"：向、於、對",color:"#3F3"} 
  ,{label:"數詞", name:"numeral",type:"simple", desc:"：百、千、萬",color:"#3F7"}  
  ,{label:"量詞", name:"classifier",type:"simple", desc:"：匹、頭",color:"#F07"}  

];
var tagset_punctuation=[
   {label:"句號", name:"fullstop", type:"punc",desc:"："} 
  ,{label:"逗號", name:"comma", type:"punc",desc:"："} 
  ,{label:"頓號", name:"douten", type:"punc",desc:"："} 
  ,{label:"分號", name:"semicolon",type:"punc",desc:"："}  
  ,{label:"冒號", name:"colon",type:"punc",desc:"："}  
  ,{label:"引號", name:"quotationmark",type:"punc2",desc:"：「」",desc:"：『』"}    
  ,{label:"雙引號", name:"quotationmark2",type:"punc2",desc:"：『』"}
  ,{label:"夾注號", name:"warichu", type:"punc2",desc:"：甲式：（　）"} 
  ,{label:"夾注號2", name:"warichu2", type:"punc2",desc:"：乙式：──　──"}   
  ,{label:"問號", name:"questionmark", type:"punc",desc:"：？"  } 
  ,{label:"驚嘆號", name:"exclamationmark",type:"punc",desc:"：！"}  
  ,{label:"破折號", name:"emdash",type:"punc",desc:"：──"}  
  ,{label:"刪節號", name:"ellipsis",type:"punc",desc:"：……"}  
  ,{label:"書名號", name:"booknamemark",type:"punc2",desc:"金剛經"}  
  ,{label:"專名號", name:"propernamemark",type:"punc2",desc:"：專有名詞"}  
  ,{label:"間隔號", name:"interpunct",type:"punc",desc:"：．"}  
  ,{label:"連接號", name:"dash",type:"punc",desc:"：甲式"}
  ,{label:"連接號2", name:"dash",type:"punc",desc:"：乙式"}

];
var tagset_defination=[
  {label:"釋義", name:"defination", type:"internal",labels:["字詞","釋義"],desc:"：通序|諸經通有"  } 
  ,{label:"同名異譯", name:"translation", type:"internal",labels:["字詞","譯名"],desc:"：耶斯那|耶舍陀"} 

];

var tagset_wordrelation=[
   {label:"同義", name:"synonym", type: "internal"  ,labels:["詞彙","同義詞"],desc:"：三衣|加沙", color:"#7F3" } 
  ,{label:"反義詞", name:"antonym", type: "internal"  ,labels:["詞彙","反義詞"],desc:"：如是|不如是" ,color:"#F73"} 
  ,{label:"能所", name:"sign", type: "internal"  ,labels:["能指","所指"],desc:"：五藏|經、律、論，及雜集藏、禁咒藏",color:"#993" } 
  ,{label:"名相", name:"nameappearance", type: "internal" ,labels:["名","相"],desc:"：如|不異",color:"#703"} 
  ,{label:"因果", name:"causeeffect", type: "internal" ,labels:["因","果"],desc:"：降伏我慢故，不貪口味故。|乞食" ,color:"#66F" } 
  ,{label:"題名互文", name:"bookquote", type: "internal" ,labels:["題名","引文"] ,desc:"：華嚴經|信為道元功德母，長養一切諸善法。",color:"#F07"} 
  ,{label:"人名互文", name:"personquote", type: "internal" ,desc:"：",labels:["人名","引文"] ,desc:"：台宗智者大師|說法華經題,說明體宗相用",color:"#F0F" } 
  ,{label:"跨文本互文", name:"quote", type: "intertext" ,desc:"：隋•嘉祥吉藏《金剛般若疏》|「一切經初當安如是我聞。」遺言令安此六事，故名遺教序。" ,color:"#307"} 
];
var tagset_wordcontext=[
   {label:"人", name:"person", type:"simple",desc:"：大迦葉"} 
  ,{label:"事", name:"matter", type:"simple",desc:"：大乘結集"} 
  ,{label:"時", name:"time",type:"simple",desc:"：佛滅七日"}  
  ,{label:"地", name:"place",type:"simple",desc:"：娑羅雙樹間"}  
  ,{label:"物", name:"thing",type:"simple",desc:"：三藏"}    
  ,{label:"狀態", name:"state",type:"simple",desc:"：滅"}    
  ,{label:"顏色", name:"color",type:"simple",desc:"：紫"}    
  ,{label:"動作", name:"action",type:"simple",desc:"：著衣"}    

  ,{label:"其他", name:"other",type:"simple",desc:"：如此之色"}    

  ,{label:"食", name:"eating", type:"simple" ,desc:"：吃飯"} 
  ,{label:"衣", name:"clothing", type:"simple" ,desc:"：三衣" } 
  ,{label:"住", name:"housing",type:"simple",desc:"：住舍衛城"}  
  ,{label:"行", name:"traffic",type:"simple",desc:"：旅行"}  
  ,{label:"育", name:"education",type:"simple",desc:"：世尊說法"}
  ,{label:"樂", name:"entertainment",type:"simple",desc:"歌舞"}
 ];
var tagset_authorexpress=[ 
   {label:"重點", name:"important", type: "simple",desc:"：乞食。降伏我慢故，不貪口味故"}
  ,{label:"說明", name:"clarify", type: "simple",desc:"：出家本為度眾生。"}
  ,{label:"提醒", name:"remind", type: "simple",desc:"：珍重"}
  ,{label:"補充", name:"complement", type: "simple",desc:"：這家布施甜，他家或布施鹹，故名加沙味。"}
  ,{label:"推論", name:"inference", type: "simple",desc:"：推之，若對於一切境緣皆能如是領會，則受用無窮矣。"}
  ,{label:"提問", name:"question", type: "simple",desc:"：云何六緣？"}
  ,{label:"回答", name:"answer", type: "simple",desc:"：一者，如是，信成就也。"}
  ,{label:"校勘", name:"revise", type: "simple",desc:"：校也，舊版無。據原稿補。"}
  ,{label:"語譜", name:"paradigm", type: "simple",desc:"：世尊|佛|如來"}
  ,{label:"情感", name:"emotion", type: "simple",desc:"：痛心"}
];

var tagset_readerexpress=[
   {label:"重點",name:"important2",type:"usernote",desc:"：世尊|佛說般若波羅蜜，則非般若波羅蜜。"} 
  ,{label:"摘要",name:"abstract2",type:"usernote",desc:"：三衣：安陀會、鬱多羅僧、僧伽黎"}
  ,{label:"提問",name:"question2",type:"usernote",desc:"：為什麼五條、七條、九條有下品、中品及上品之分？"} 
  ,{label:"解釋", name:"explain2", type:"usernote",desc:"：六緣指：信、聞、時、主、處、眾"} 
  ,{label:"感受", name:"feel2", type:"usernote",desc:"：現在能見聞到佛典，當懷恭敬和感恩心"} 
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
