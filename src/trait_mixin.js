var Reflux=require("reflux");
var store=require("./store_userinfo");

var trait_mixin={
	onUser:function(userinfo) {
		console.log("trait user name",userinfo.name)
		this.setState({username:userinfo.name});
	}
	,propsType:{
		trait:React.PropTypes.object.isRequired
		,onChanged:React.PropTypes.func
	}
	,getInitialState:function() {
		return ({username:store.getUserName() })
	}
	,componentWillReceiveProps:function(nextprops) {
		if (nextprops.trait!=this.props.trait || nextprops.revert) this.copyValue(nextprops);
	}
	,componentDidMount:function() {
		this.unsubscribe=store.listen(this.onUser);
		this.copyValue(this.props);
	}
	,componentWillUnmount:function(){
		this.unsubscribe();
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
		if (this.onChanged) this.onChanged(e.target.value);
	}
}
module.exports=trait_mixin;