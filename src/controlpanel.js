var Reflux=require("reflux");
var savecaption="Save";
var savedcaption="Markups Written.";
var store=require("./store_markup");
var actions=require("./actions_markup");
var SetUser=require("./setuser"); 
var  utf8_to_b64= function( str ) {
    return btoa(unescape(encodeURIComponent( str )));
};

var Controlpanel=React.createClass({
	getInitialState:function(){
		return {savecaption:savecaption,dangerzone:false,message:""};
	}
	,restoresavecapcation:function() {
		this.setState({savecaption:savecaption});
	}
	,reset:function() {
		actions.clearAllMarkups();
		this.setState({message:"All Markup Clear",messagetype:"success"});
		setTimeout(this.clearMessage,5000);	
	}
	,clearMessage:function() {
		this.setState({message:""});
	}
	,save:function() {
		actions.saveMarkups(function(){
			this.setState({message:"Markup Saved",messagetype:"success"});
			setTimeout(this.clearMessage,5000);
		},this);
	}
	,upload:function() {
		var reader = new FileReader();
		var that=this;
		reader.onload = function() {
		  try{
		  	var json=JSON.parse(this.result);
		  } catch (e) {
		  	that.setState({message:"incorrect json format"+e,messagetype:"danger"})
		  	setTimeout(that.clearMessage,5000);
		  	return;
		  }
		  store.setRawMarkup(json);
		}
		var file=this.refs.uploadfile.getDOMNode().files[0];
		reader.readAsText(file);
	},
	uploadfile:function(){
		this.refs.uploadfile.getDOMNode().click();
	}
	,renderDownloadLink:function() {
		var filename="sample-"+(new Date().toLocaleString())+".json";
		var markupjson=store.getRawMarkup();
		var jsonstr=JSON.stringify(markupjson,""," ");
		var dataurl="data:application/octet-stream;base64,"+utf8_to_b64(jsonstr);

		return <a className="btn btn-info" download={filename} href={dataurl}>Export to JSON</a>
	}
	,renderDanger:function() {
		if (this.state.dangerzone) {
			return <div>
		    <input ref="uploadfile" type="file" onChange={this.upload} style={{display:"none"}}/>
		    {this.renderDownloadLink()}
		    <hr/>
		    <button onClick={this.uploadfile} className="btn btn-danger">Import</button>
			<button onClick={this.reset} className="btn btn-danger">Delete all markups</button>	
			</div>
		}	
	}
	,setAdvance:function(e) {
		this.setState({dangerzone:e.target.checked});
	}

	,render:function() {
		return <div>
			<SetUser/>
			<button onClick={this.save} className="btn btn-success">{this.state.savecaption}</button>
			<span>
    			<label>
      			Advance<input type="checkbox" onChange={this.setAdvance}/>
    			</label>
  			</span>
			{this.renderDanger()}
			<br/>
			<div className={"label label-"+this.state.messagetype}>{this.state.message}</div>
		</div>
	}
});
module.exports=Controlpanel;