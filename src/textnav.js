var Reflux=require("reflux");
var TextNav=React.createClass({
	mixins:[Reflux.ListenerMixin]
	,propTypes:{
		viewid:React.PropTypes.string.isRequired
		,title:React.PropTypes.string.isRequired
		,store:React.PropTypes.object.isRequired
		,actions:React.PropTypes.object.isRequired
	}
	,componentDidMount:function() {
		this.listenTo(this.props.store,this.onData);
	}
	,onData:function(text,seg) {
		this.setState({npara:seg||1});
	}
	,getInitialState:function() {
		return {npara:1}
	}
	,nextpara:function() {
		this.props.actions.nextPara(this.props.viewid);
	}
	,prevpara:function() {
		this.props.actions.prevPara(this.props.viewid);
	}
	,goPara:function(e) {
		var n=parseInt(this.state.npara)||1;
		if (e.key=="Enter")	this.props.actions.getTextBySeg(this.props.viewid,n);
	}
	,changed:function(e) {
		//TODO , vpos can be prefixed with @, convert to npara and addHighlight
		this.setState({npara:e.target.value});
	}
	,render:function() {
		return <div className="text-center">{this.props.title}
				<div className="pull-right">
				<button onClick={this.prevpara}>上一段</button>
				<input size="2" 
				   onChange={this.changed} onKeyPress={this.goPara} value={this.state.npara}/>
				<button onClick={this.nextpara}>下一段</button>
				</div>
		    </div>
	}
});

module.exports=TextNav;