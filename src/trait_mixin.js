var trait_mixin={
	propsType:{
		trait:React.PropTypes.object.isRequired
		,onChanged:React.PropTypes.func
	}
	,componentWillReceiveProps:function(nextprops) {
		if (nextprops.trait!=this.props.trait || nextprops.revert) this.copyValue(nextprops);
	}
	,componentDidMount:function() {
		this.copyValue(this.props);
	}
	,copyValue:function(props) {
		var trait=props.trait;
		for (var i in trait) {
			if (this.refs[i]) {
				this.refs[i].getDOMNode().value=trait[i];
			}
		}
	}
	,getValue:function() {
		var out={};
		var trait=this.props.trait;
		for (var i in this.props.trait) {
			if (this.refs[i]) {
				out[i]=this.refs[i].getDOMNode().value;
			}
		}
		return out;
	}
	,change:function(e){
		if (this.props.onChanged) this.props.onChanged(e.target.value);
	}
}
module.exports=trait_mixin;