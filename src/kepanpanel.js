var Reflux=require("reflux");
var store=require("./store_text").kepan;
var actions=require("./actions_text");
var stacktoc=require("ksana2015-stacktoc");
var StackToc=stacktoc.component; //react 0.12 component name first character has to beuppercase

module.exports=React.createClass({
	getInitialState:function() {
		var kepanid=parseInt(localStorage.getItem("visualmarkup.kepanid")||"1");
		return {toc:[],current:0,kepanid:kepanid};
	},
	propTypes:{
		tocname:React.PropTypes.string.isRequired
	},
	mixins:[Reflux.listenTo(store,"onData")],
	onData:function(kepan,db){
		if (typeof kepan=="number") {
			this.setState({current:kepan});
		} else {
			var toc=stacktoc.genToc(kepan,this.props.tocname);
			this.setState({db:db,toc:toc});			
		}
	},
	showText:function(n) {
		actions.getSutraTextByKepanId(n);
		localStorage.setItem("visualmarkup.kepanid",n);
	},
	componentDidMount:function() { 
		actions.getKepan();
		actions.getSutraTextByKepanId(this.state.kepanid);
		//actions.getLectureTextByKepanId(this.state.kepanid);
	},
	render:function(){
		return <div className="panel panel-info">
			<div className="panel-heading text-center">科文</div>
			<div className="panel-body kepanview">
			<StackToc data={this.state.toc} 
			opts={{tocstyle:"ganzhi"}} showText={this.showText} current={this.state.current}/>
			</div>
		</div>
	}
});