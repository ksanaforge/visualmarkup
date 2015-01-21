var Reflux=require("reflux");
var store=require("./store_trait");
var store_tagset=require("./store_tagset");
var action=require("./actions_markup");
var trait_templates={
	"partofspeech":require("./trait_partofspeech")
	,"readerexpress":require("./trait_readerexpress")
	,"authorexpress":require("./trait_authorexpress")
}

var Trait=React.createClass({
	mixins:[Reflux.listenTo(store,"onData")],
	getInitialState:function(){
		return {template:null}
	}
	,onData:function(viewid,nmarkup,markup){
		if (!markup) {
			this.setState({template:null,markup:null});	
			return;
		}
		var group=store_tagset.tagsetOfTag(markup[2].tag);
		if (!group) {
			return;
		}
		var template=trait_templates[group];
		this.setState({template:template,markup:markup,viewid:viewid,nmarkup:nmarkup});
	}
	,onChanged:function(){
		this.setState({modified:true});
	}
	,renderTemplate:function() {
		if (!this.state.template)return;
		var ele=React.createFactory(this.state.template);
		return ele({onChanged:this.onChanged,trait:this.state.markup[2]});
	}
	,save:function() {
		this.setState({modified:false});
	}
	,renderControls:function() {
		if (!this.state.template) return;
		var disabled=!this.state.modified?" disabled":"";
		return <div>
				<br/><button onClick={this.save} className={"btn btn-success"+disabled}>Save</button>
			   </div>
	}
	,render:function() {
		return <div className="traitpanel">
				<div className="col-md-10">
					{this.renderTemplate()}
				</div>
				<div className="col-md-2">
					{this.renderControls()}
				</div>				
			</div>
	}
});
module.exports=Trait;
