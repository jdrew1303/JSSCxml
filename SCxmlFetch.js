SCxml.xFetch={
	xmls:function (o, element){
		if(o instanceof Element || o instanceof Document)
			return SCxml.xFetch._xmls.serializeToString(o)
		sc.error("execution",element,
			new TypeError('"xml" type requires a Document or Element.'))
	},
	_xmls:new XMLSerializer(),
	urls:function (o, element){
		if((typeof o)!="object")
			sc.error("execution",element,new TypeError(
			'"url" type requires an object with enumerable properties.'))
		var s=[]
		for(k in o) if(o.hasOwnProperty(k)) s.push(k+"="+encodeURIComponent(o[k]))
		return s.join("&")
	},
	types:{
		"json": JSON.stringify,
		"xml": SCxml.xFetch.xmls,
		"url": SCxml.xFetch.urls,
		"text": String
	},
	mime:{ // default Content-Type for each <fetch> type
		"json": "application/json",
		"xml": "application/xml",
		"url": "application/x-www-form-urlencoded",
		"text": "text/plain"
	},
	Request:function(target, caller, callback, headers, postData)
	{
		this.target=target
		this.callback=callback
		this.caller=caller
		
		with(this.req=new XMLHttpRequest())
		{
			open(postData?"POST":"GET",target,true)
			onreadystatechange=XHR.handler(this)
			for(var h in headers)
				setRequestHeader(h, headers[h])
			send(postData || null)
		}
	},
	handler:function (xhr)
	{
		function f()
		{
			if(xhr.req.readyState==4) xhr.caller.fireEvent(
				new SCxml.ExternalEvent(xhr.callback, xhr.target,
					"http", null, xhr.req))
		}
		return f
	},

}

SCxml.prototype.xFetchReadHeaders=function(element, headers)
{
	for(var c=element.firstElementChild; c; c=c.nextElementSibling)
	if(c.tagName=="header"){
		var name=c.getAttribute("name")
		var value=c.getAttribute("value") || this.expr(c.getAttribute("expr"), c)
		if(name && value) headers[name] = value
	}
}


SCxml.executableContent.fetch=function(sc, element)
{
	var target=element.getAttribute("target")
		||sc.expr(element.getAttribute("targetexpr"))
	var event=element.getAttribute("callback")
		||sc.expr(element.getAttribute("callbackexpr"))

	var type=element.getAttribute("type")
		||sc.expr(element.getAttribute("typeexpr"))
		||"text"
	var proc
	if(type in SCxml.xFtech.types)
		proc=SCxml.xFtech.types[type]
	if("function" != typeof proc)
		sc.error("execution",element,
			new Error('unsupported fetch type "'+proc+'"'))

	var namelist=element.getAttribute("namelist")
	var data={}
	if(namelist)
	{
		namelist=namelist.split(/\s+/)
		for(var i=0, name; name=namelist[i]; i++)
			data[name]=sc.expr(name)
	}
	sc.readParams(element, data)
	var headers={"Content-Type":SCxml.xFtech.mime[type]}
	sc.xFetchReadHeaders(element, headers)
	var c=element.firstElementChild
	if(c && c.tagName=="content")
		data=c.textContent
	
	new SCxml.xFetch.Request(target, sc, event, headers, data)
}