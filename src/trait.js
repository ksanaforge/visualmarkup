var Reflux=require("reflux");
var store=require("./store_trait");
var store_tagset=require("./store_tagset");
var actions=require("./actions_markup");
var trait_templates={
	"partofspeech":require("./trait_partofspeech")
	,"readerexpress":require("./trait_readerexpress")
	,"authorexpress":require("./trait_authorexpress")
}
var savecaption="Write To DB";
var savedcaption="Markups Written.";
var MarkupControls=React.createClass({
	mixins:[Reflux.listenTo(require("./store_markup"),"onData")]
	,getInitialState:function(){
		return {savecaption:savecaption,dangerzone:false};
	}
	,reset:function() {
		actions.clearAllMarkups();
	}
	,onData:function() {

	}
	,restoresavecapcation:function() {
		this.setState({savecaption:savecaption});
	}
	,save:function() {
		actions.saveMarkups(function(){
			this.setState({savecaption:savedcaption});
			setTimeout(this.restoresavecapcation,3000);
		},this);
	},
	renderDanger:function() {
		if (this.state.dangerzone) {
			return <button onClick={this.reset} className="btn btn-danger">Delete all markups</button>	
		}	
	}
	,setDanger:function(e) {
		this.setState({dangerzone:e.target.checked});
	}
	,render:function() {
		return <div>
			<button onClick={this.save} className="btn btn-success">{this.state.savecaption}</button>
			<span>
    			<label>
      			danger<input type="checkbox" onChange={this.setDanger}/>
    			</label>
  			</span>
			{this.renderDanger()}
		</div>
	}
});
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
		if (!this.state.template) {
			return <MarkupControls/>
		} else {
			var ele=React.createFactory(this.state.template);
			return ele({ref:"template",onChanged:this.onChanged,trait:this.state.markup[2]});			
		}
	}
	,deletemarkup:function() {
		actions.deleteMarkup(this.state.viewid,this.state.nmarkup);
	}
	,savemarkup:function(e) {
		var markup=this.state.markup;
		markup[2]=this.refs.template.getValue();
		actions.saveMarkups(this.state.viewid,this.state.nmarkup,markup);
		this.setState({modified:false,markup:markup});
	}
	,renderControls:function() {
		if (!this.state.template) return;
		var disabled=!this.state.modified?" disabled":"";
		var disabled_delete=!this.state.modified?"":" disabled";
		return <div>
				<button onClick={this.deletemarkup} className={"btn btn-danger"+disabled_delete}>Delete</button>
				<br/><button onClick={this.savemarkup} className={"btn btn-success"+disabled}>Save</button>
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
