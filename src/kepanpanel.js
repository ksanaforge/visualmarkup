var kde=require("ksana-database");
var stackToc=require("ksana2015-stacktoc");
var StackToc=stackToc.component;
var store=require("./stores").ds;
var actions=require("./actions");
var Reflux=require("reflux");
module.exports=React.createClass({
	getInitialState:function() {
		var current=parseInt(localStorage.getItem("visualmarkup_kepan_current")||"0");
		return {toc:[],current:current};
	},
	mixins:[Reflux.listenTo(store,"dbOpened")],
	dbOpened:function(db,kepan){
		var toc=stackToc.genToc(kepan,"金剛經講記");
		this.setState({db:db,toc:toc});
	},
	render:function(){
		return <div>
			<StackToc data={this.state.toc} showText={this.props.showText} current={this.state.current}/>
		</div>
	}
});