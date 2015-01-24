var Reflux=require("reflux");
var store=require("./store_text").dictionary;
var store_tagset=require("./store_tagset");
var actions_text=require("./actions_text");
var actions_markup=require("./actions_markup");
var SearchDictionary=React.createClass({
		search:function() {
			var tofind=this.refs.tofind.getDOMNode().value;
			actions_text.searchDictionary(tofind);
		},
		onkey:function(e) {
			if (e.key=="Enter") this.search();
		},
		render:function(){
			return <div>教育部國語辭典
				<input onKeyPress={this.onkey} ref="tofind" size="3" className="textinput"></input>
				<button onClick={this.search}>查</button>
			</div>
		}
	});
var partofspeechtag={"動":"verb","副":"adverb","形":"adjective","名":"noun","助":"particle"
,"介":"preposition","連":"conjunction","代":"pronoun"};
var DictionaryPanel=React.createClass({
	mixins:[Reflux.listenTo(store,"onData"),Reflux.listenTo(store_tagset,"onTagsetname")],
	getInitialState:function() {
		return {data:[],enableMarkup:false}
	},
	onData:function(data,extra){
		this.setState({data:data,db:extra.db,viewid:extra.viewid,vpos:extra.vpos});
	}, 
	onTagsetname:function(tagsetname) {
		this.setState({enableMarkup:tagsetname=="partofspeech"});
	},
	createMarkup:function(partofspeech,explain,term) {
		//actions.addMarkup();
		var tag=partofspeechtag[partofspeech];
		var payload={tag:tag,source:this.state.db.dbname,explain:explain};
		var exclusive=[];
		for (var key in partofspeechtag) exclusive.push(partofspeechtag[key]);
		var m=actions_markup.createMarkup(this.state.viewid,this.state.vpos,term.length,payload,{edit:true,exclusive:exclusive});
	},
	onclick:function(e){
		if(e.target.nodeName=="BUTTON") {
			var term=e.target.parentElement.dataset.term;
			var explain=e.target.nextSibling.innerHTML;
			this.createMarkup(e.target.innerHTML,explain,term);
		}
	},
	renderItem:function(item,idx) {
		var lines=item.split("\n");
		var term=lines.shift();
		var out=['<div data-term="'+term+'">','<span class="dictentry">'+term+'</span>'];
		for (var i=0;i<lines.length;i++) {
			var line=lines[i];
			if (this.state.enableMarkup && line[0]=="{"){
				var	at=line.indexOf("}");
				line='<button>'+line.substring(1,at)+"</button><span>"+line.substr(at+1)+"</span>";
			}
			out.push(line);
		}
		out.push("</div>");
		
		return <div key={"I"+idx} dangerouslySetInnerHTML={{__html:out.join("<br/>")}}/>
	},
	render:function(){
		return <div className="dictionarypanel panel panel-warning">
				<div className="panel-heading text-center"><SearchDictionary/></div>
				<div onClick={this.onclick} className="panel-body dictionarytext">
				{this.state.data.map(this.renderItem)}
				</div>
		</div>
	}
});
module.exports=DictionaryPanel;