var Trait_readerexpress=React.createClass({
	mixins:[require("./trait_mixin")]
	,render:function() {
		return <div>
			<div className="form-group">
				<div className="input-group">
	  				<span className="input-group-addon">注記</span>
	  					<input ref="note" onInput={this.change} type="text" className="form-control" placeholder="解釋"/>
				</div>
				<div className="input-group">
	  				<span className="input-group-addon">創作者</span>
	  				<input ref="owner" type="text" readOnly={true} className="form-control"></input>
				</div>
			</div>
			</div>
	}
});

module.exports=Trait_readerexpress;