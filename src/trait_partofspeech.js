var Trait_partofspeech=React.createClass({
	mixins:[require("./trait_mixin")]
	,render:function() {
		return <div>
			<div className="form-group">
				<div className="input-group">
	  				<span className="input-group-addon">解釋</span>
	  					<input ref="explain" onInput={this.change} type="text" className="form-control" placeholder="解釋"/>
				</div>
				<div className="input-group">
	  				<span className="input-group-addon">來源</span>
	  				<input ref="source" type="text" readOnly={true} className="form-control"></input>
				</div>
			</div>
			</div>
	}
});

module.exports=Trait_partofspeech;