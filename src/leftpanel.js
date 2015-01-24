var actions=require("./actions_markup");
var KepanPanel=require("./kepanpanel");
var MarkupPanel=require("./markuppanel");
var DictionaryPanel=require("./dictionarypanel");
var mpviewid="markuppanel";
var LeftPanel=React.createClass({
	switchtab:function(e) {
		if (e.target.dataset.viewid==mpviewid) {
			actions.removeHiddenView(mpviewid);
		} else {
			actions.addHiddenView(mpviewid);
		}
	}
	,render:function() {
		return <div>
			<div>
				<ul className="nav nav-tabs" onClick={this.switchtab}>
					<li><a href="#kepan" data-toggle="tab">科文</a></li>
					<li className="active">
					    <a href="#markup" data-viewid={mpviewid} data-toggle="tab">標籤集</a></li>
					<li><a href="#dictionary" data-toggle="tab">辭典</a></li>
				</ul>
			</div>
			<div className="tab-content">
				<div className="tab-pane" id="kepan"><KepanPanel tocname="金剛經講義"/></div>
				<div className="tab-pane active" id="markup"><MarkupPanel/></div>
				<div className="tab-pane" id="dictionary"><DictionaryPanel/></div>
			</div> 		
		</div>
	}
});
module.exports=LeftPanel;