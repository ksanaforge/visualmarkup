var Reflux=require("reflux");
var store=require("./store_trait");
var store_tagsets=require("./store_tagsets");
var store_selection=require("./store_selection");
var actions=require("./actions_markup");
var actions_selection=require("./actions_selection");
var MarkupGroup=require("./markupgroup");
var trait_templates={
	"simple":require("./trait_simple")
	,"intertext":require("./trait_intertext")
	,"internal":require("./trait_internal")
	,"punc":require("./trait_punc")
}
var MarkupSearch=require("./markupsearch");
var SelectionList=require("./selectionlist");

var Trait=React.createClass({
	mixins:[Reflux.listenTo(store,"onData"),Reflux.listenTo(store_selection,"onSelection")],
	getInitialState:function(){
		return {template:null,modified:false,viewselections:{},markupselections:{}};
	}
	,commitChange:function() {
		if (!this.state.modified || !this.state.markup) return;
		var markup=this.state.markup;
		markup[2]=this.refs.template.getValue();
		actions.saveMarkup(this.state.viewid,this.state.nmarkup,markup);
	}
	,componentWillUnmount:function() {
		this.commitChange();
	}
	,onData:function(viewid,markup,nmarkup,group,markupselections){
		this.commitChange();

		if (!markup) {
			this.setState({template:null,markup:null,modified:false,group:group});
			actions_selection.clearHighlights();
			return;
		}
		var type=store_tagsets.typeOfTag(markup[2].tag);
		if (!type) return;
		var template=trait_templates[type];
		actions_selection.setHighlights(markupselections);
		this.setState({markupselections:markupselections,template:template,markup:markup,viewid:viewid,nmarkup:nmarkup,modified:false});
	}
	,onChanged:function(){
		this.setState({modified:true});
	}
	,onSelection:function(viewselections){
		this.setState({viewselections:viewselections});
	}
	
	,renderTemplate:function() {
		if (this.state.template) {
			var ele=React.createFactory(this.state.template);
			var template=ele({ref:"template",onChanged:this.onChanged,trait:this.state.markup[2],revert:this.revert});
			this.revert=false;
			return template;
		}
	}
	,nextmarkup:function() {
		actions.nextMarkup();
	}
	,prevmarkup:function() {
		actions.prevMarkup();
	}
	,renderControls:function(){
		if (this.state.template) {
			var disabled=!this.state.modified?" disabled":"";
			var disabled_delete=!this.state.modified?"":" disabled";
			return <div>
					<div className="pull-right">
					<button onClick={this.prevmarkup} title="Prev Markup" className={"btn btn-info"}>Prev</button>
					<button onClick={this.nextmarkup} title="Next Markup"  className={"btn btn-info"}>Next</button>
					</div>
					<div className="">
					<button onClick={this.revertmarkup} title="Discard changes" className={"btn btn-warning"+disabled}>Revert</button>
					<button onClick={this.deletemarkup} title="Delete this markup"  className={"btn btn-danger"+disabled_delete}>Delete</button>
					</div>


					<MarkupSearch/>
					<SelectionList viewselections={this.state.markupselections}/>
				   </div>
		}
	}
	,deletemarkup:function() {
		actions.deleteMarkup(this.state.viewid,this.state.markup);
		actions_selection.setSelections(this.state.markupselections);
	}
	,revertmarkup:function() {
		this.revert=true;
		this.setState({modified:false});
	}
	,renderSelection:function() {
		if (!this.state.template) {
			return <SelectionList showtext={true} viewselections={this.state.viewselections}/>
		}
	}
	,render:function() {
		return <div className="traitpanel">
					{this.renderTemplate()}
					{this.renderControls()}
					<br/>
					{this.renderSelection()}
			</div>
	}
});
module.exports=Trait;
