var Reflux=require("reflux");
var store=require("./store_trait");
var store_tagset=require("./store_tagset");
var store_selection=require("./store_selection");
var actions=require("./actions_markup");
var trait_templates={
	"partofspeech":require("./trait_partofspeech")
	,"readerexpress":require("./trait_readerexpress")
	,"authorexpress":require("./trait_authorexpress")
}


var Trait=React.createClass({
	mixins:[Reflux.listenTo(store,"onData"),Reflux.listenTo(store_selection,"onSelection")],
	getInitialState:function(){
		return {template:null,modified:false}
	}
	,commitChange:function() {
		if (!this.state.modified || !this.state.markup) return;
		var markup=this.state.markup;
		markup[2]=this.refs.template.getValue();
		actions.saveMarkups(this.state.viewid,this.state.nmarkup,markup);
	}
	,onData:function(viewid,nmarkup,markup){
		if (this.state.markup) this.commitChange();

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
	,onSelection:function(viewselections){
		this.setState({viewselections:viewselections});
	}
	,renderSelection:function() {
		var out=[];
		for (var view in this.state.viewselections) {
			var selections=this.state.viewselections[view];
			if (selections.length) out.push(<div>View:{view}</div>)
			for (var i=0;i<selections.length;i++) {
				var sel=selections[i];
				out.push(<div>{sel[0]+"-"+sel[1]}</div>);
			}
			out.push(<hr/>)
		}
		return out;
	}
	,renderTemplate:function() {
		if (this.state.template) {
			var ele=React.createFactory(this.state.template);
			var template=ele({ref:"template",onChanged:this.onChanged,trait:this.state.markup[2],revert:this.revert});
			this.revert=false;
			return template;
		} else {
			return this.renderSelection();
		}
	}
	,renderControls:function(){
		if (this.state.template) {
			var disabled=!this.state.modified?" disabled":"";
			var disabled_delete=!this.state.modified?"":" disabled";
			return <div>
					<button onClick={this.revertmarkup} title="Discard changes" className={"btn btn-warning"+disabled}>Revert</button>
					<button onClick={this.deletemarkup} title="Delete this markup"  className={"btn btn-danger"+disabled_delete}>Delete</button>
				   </div>
		}
	}
	,deletemarkup:function() {
		actions.deleteMarkup(this.state.viewid,this.state.nmarkup);
	}
	,revertmarkup:function() {
		this.revert=true;
		this.setState({modified:false});
	}
	,render:function() {
		return <div className="traitpanel">
					{this.renderControls()}
					{this.renderTemplate()}
			</div>
	}
});
module.exports=Trait;
