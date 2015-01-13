var getTextUntilPunc=function(ele) {
	var tofind="";
	if (ele.nodeName!="SPAN")return;
	while (ele) {
		if (ele.nodeName=="SPAN") {
			var text=ele.innerHTML;
			var ic=text.charCodeAt(0);
			if ((ic>=0x3F00 && ic<=0x9FFF) || (ic>=0xD800 && ic<=0xDFFF)) {
				tofind+=text;
				ele=ele.nextSibling;
			} else break;
		} else break;
	}
	return tofind;		
};

module.exports={getTextUntilPunc:getTextUntilPunc};