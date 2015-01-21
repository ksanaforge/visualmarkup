var trait_mixin={
	propsType:{
		trait:React.PropTypes.object.isRequired
		,onChanged:React.PropTypes.func
	},
	componentDidMount:function() {
		var trait=this.props.trait;
		for (var i in trait) {
			if (this.refs[i]) {
				this.refs[i].getDOMNode().value=trait[i];
			}
		}
	},
	change:function(e){
		if (this.props.onChanged) this.props.onChanged(e.target.value);
	}
}
module.exports=trait_mixin;