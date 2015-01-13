var Reflux=require("reflux");
var store=require("./store_text").kepan;
var actions=require("./action_text");
var stacktoc=require("ksana2015-stacktoc");
var StackToc=stacktoc.component; //react 0.12 component name first character has to beuppercase

module.exports=React.createClass({
	getInitialState:function() {
		var kepanid=parseInt(localStorage.getItem("visualmarkup.kepanid")||"1");
		var current=parseInt(localStorage.getItem("visualmarkup_kepan_current")||"0");
		return {toc:[],current:current,kepanid:kepanid};
	},
	mixins:[Reflux.listenTo(store,"onData")],
	onData:function(kepan,db){
		if (typeof kepan=="number") {
			this.setState({current:kepan});
		} else {
			var toc=stacktoc.genToc(kepan,"金剛經講義");
			this.setState({db:db,toc:toc});			
		}
	},
	showText:function(n) {
		actions.getSutraTextByKepanId(n);
		actions.getLectureTextByKepanId(n);
		localStorage.setItem("visualmarkup.kepanid",n);
	},
	componentDidMount:function() { 
		actions.getKepan();
		actions.getSutraTextByKepanId(this.state.kepanid);
		actions.getLectureTextByKepanId(this.state.kepanid);
	},
	render:function(){
		return <div className="kepanview">
			<StackToc data={this.state.toc} 
			opts={{tocstyle:"ganzhi"}} showText={this.showText} current={this.state.current}/>
		</div>
	}
});