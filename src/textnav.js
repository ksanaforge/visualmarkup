var Reflux=require("reflux");
var store_markup=require("./store_markup");
var stores=require("./store_text");
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
	,checkSynable:function() {
		var that=this;
		setTimeout(function(){
			var kepanid=that.props.store.getKepanId();
			var others=store_markup.otherView(that.props.viewid);
			var syncable=false;
			for (var i=0;i<others.length;i++) {
				if (kepanid!=stores[others[i]].getKepanId()) {
					syncable=true;
					break;
				}
			}

			that.setState({syncable:syncable});
		},500);
	}
	,onData:function(text,seg,db,opts) {
		var opts=opts||{};
		this.checkSynable();
		this.setState({npara:seg||0});
		if (this.state.sync && !opts.nosync) this.syncpara();
	}
	,getInitialState:function() {
		return {npara:1,sync:true,syncable:false};
	}
	,clearSystemSelection:function() {
		window.getSelection().empty();
	}
	,nextpara:function() {
		this.props.actions.nextPara(this.props.viewid);
		this.clearSystemSelection();
	}
	,prevpara:function() {
		this.props.actions.prevPara(this.props.viewid);
		this.clearSystemSelection();
	}
	,goPara:function(e) {
		var n=parseInt(this.state.npara)||1;
		if (e.key=="Enter")	{
			this.props.actions.getTextBySeg(this.props.viewid,n);
			this.clearSystemSelection();
		}
	}
	,changed:function(e) {
		//TODO , vpos can be prefixed with @, convert to npara and addHighlight
		this.setState({npara:e.target.value});
	}
	,toggleSync:function(e) {
		this.setState({sync:e.target.checked});
	}
	,syncpara:function() {
		//if (!this.state.sync) return;
		var kepanid=this.props.store.getKepanId();
		var others=store_markup.otherView(this.props.viewid);
		for (var i=0;i<others.length;i++) {
			this.props.actions.getTextByKepanId(others[i],kepanid);
		}
		this.setState({syncable:false});
	}
	,render:function() {
		return <div>
				<div className="col-md-3">
					<input checked={this.state.sync} className="largecheckbox" type="checkbox" onChange={this.toggleSync}/>
					<button onClick={this.syncpara} className={"btn btn-success"+(this.state.syncable?"":" disabled")}>Sync</button>
				</div>
				<div className="col-md-5"><div className="text-center textpanel-title">{this.props.title}</div></div>

				<div className="col-md-4">
					<div className="input-group">
					<span className="input-group-btn">
						<button onClick={this.prevpara} className="btn btn-success">Previous</button>
					</span>
					<input size="2" className="text form-control larger-input"
				   		onChange={this.changed} onKeyPress={this.goPara} value={this.state.npara}/>
					<span className="input-group-btn">
						<button onClick={this.nextpara} className="btn btn-success">Next</button>
					</span>
					</div>
				</div>
		    </div>
	}
});

module.exports=TextNav;