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
		return {npara:1,sync:true}
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
	,toggleSync:function(e) {
		this.setState({sync:e.target.checked});
	}
	,syncpara:function() {

	}
	,render:function() {
		return <div>
				<div className="col-md-3">
					<input checked={this.state.sync} className="largecheckbox" type="checkbox" onChange={this.toggleSync}/>
					<button onClick={this.syncpara} className={"btn btn-success"+(this.state.sync?" disabled":"")}>同步</button>
				</div>
				<div className="col-md-5"><div className="text-center textpanel-title">{this.props.title}</div></div>

				<div className="col-md-4">
					<div className="input-group">
					<span className="input-group-btn">
						<button onClick={this.prevpara} className="btn btn-success">上一段</button>
					</span>
					<input size="2" className="text form-control larger-input"
				   		onChange={this.changed} onKeyPress={this.goPara} value={this.state.npara}/>
					<span className="input-group-btn">
						<button onClick={this.nextpara} className="btn btn-success">下一段</button>
					</span>
					</div>
				</div>
		    </div>
	}
});

module.exports=TextNav;