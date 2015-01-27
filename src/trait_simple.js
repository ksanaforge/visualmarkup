var Trait_partofspeech=React.createClass({
	mixins:[require("./trait_mixin")]

	,onChanged:function() {
		this.refs.source.getDOMNode().value=this.state.username;
	}
	,render:function() {
		return <div>
			<div className="form-group">
				<div className="input-group">
	  				<span className="input-group-addon">標記</span>
	  				<input ref="tag" type="text" readOnly={true} className="form-control"></input>
				</div>

				<div className="input-group">
	  				<span className="input-group-addon">來源</span>
	  				<input ref="source" type="text" readOnly={true} className="form-control"></input>
				</div>

				<div className="input-group">
	  				<span className="input-group-addon">解釋</span>
	  					<textarea ref="explain" onInput={this.change} cols="10" className="form-control" placeholder="解釋"/>
				</div>
			</div>
			</div>
	}
});
/*
  dropdown user created defination
*/ 
module.exports=Trait_partofspeech;