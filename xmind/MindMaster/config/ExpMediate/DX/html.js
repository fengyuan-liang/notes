var mua=window.navigator.userAgent;
var ua=(mua.indexOf('rv:11')+mua.indexOf('MSIE'))>=0;
document.getElementById('svg-container').oncontextmenu = function (event) {
    event.preventDefault();
}
document.getElementById('svg-container').onmousedown = function (event) {
    if(event.which ==3){
        this.style.cursor = 'pointer';
        this.onmousemove = function (ev) {
            this.scrollBy(-(ev.movementX), 0);
            window.scrollBy(0,-(ev.movementY))
        }
        this.onmouseup = function () {
            this.style.cursor =  null;
            this.onmouseup = null;
            this.onmousemove = null;
        }
    }
}
Number.prototype.tosuitsvg=function () {
    var num=this.valueOf();
    if(num%1===0){
        return num+0.5
    }else return num;
};
Number.prototype.plusz=function() {
    var num=this.valueOf();
    return num<10?'0'+num:num;
};
function parseDate(num) {
    var date = new Date(num);
    var Y = date.getFullYear() + '-';
    var M = (date.getMonth()+1).plusz() + '-';
    var D = date.getDate().plusz() + ' ';
    var h = date.getHours().plusz() + ':';
    var mm = date.getMinutes().plusz() + ':';
    var s = date.getSeconds().plusz();
    return Y+M+D+h+mm+s;
}
//--predefined
//comment--
var comments=document.querySelectorAll('g>g[ed\\:comment]');
function getcwh(popup) {
    document.body.getElementsByTagName('svg')[0].appendChild(popup);
    var w=popup.getBoundingClientRect().width;
    var h=popup.getBoundingClientRect().height;
    return [w,h]
}
for(var i=0;i<comments.length;i++){
    var popup=document.createElementNS('http://www.w3.org/2000/svg','g');
    var popupR= document.createElementNS('http://www.w3.org/2000/svg','rect');
    var hover=document.createElementNS('http://www.w3.org/2000/svg','rect');
    var oline=document.createElementNS('http://www.w3.org/2000/svg','rect');
    hover.setAttribute('fill','#cdcdff');
    hover.setAttribute('x','0');
    hover.setAttribute('y','0');
    hover.setAttribute('height','16');
    hover.setAttribute('width','16');
    hover.setAttribute('fill-opacity','0.6');
    hover.setAttribute('transform',comments[i].querySelector('use').getAttribute('transform'));
    hover.style.display='none';
    comments[i].appendChild(hover);
    var a=JSON.parse(comments[i].getAttribute('ed:comment'));
    var height=0;
    var carr=[];
    for(var j=0;j<a.length;j++){
        var stamp=Number(a[j].Date)*1000;
        var time=parseDate(stamp);
        var name=a[j].Name;
        var message=a[j].Message;
        var messageArr=message.split(/\n/);
        var o=document.createElementNS('http://www.w3.org/2000/svg','g');
        var n=document.createElementNS('http://www.w3.org/2000/svg','text');
        var t=document.createElementNS('http://www.w3.org/2000/svg','text');
        var m=document.createElementNS('http://www.w3.org/2000/svg','text');
        n.setAttribute('x',5);
        n.setAttribute('y',12);
        n.setAttribute('fill','#006eff');
        n.textContent=name+': ';
        n.setAttribute('font-size','12');
        t.setAttribute('x',200);
        t.setAttribute('y',12);
        t.setAttribute('fill','#969696');
        t.textContent=time;
        t.setAttribute('font-size','10');
        m.setAttribute('transform','translate(20,27)');
        m.setAttribute('font-size','12');
        for(var k=0;k<messageArr.length;k++){
            var ts=document.createElementNS('http://www.w3.org/2000/svg','tspan');
            ts.setAttribute('x','0');
            ts.setAttribute('y',k*16);
            ts.textContent=messageArr[k];
            m.appendChild(ts);
        }
        o.setAttribute('transform','translate(0,'+height+')');
        o.appendChild(n);
        o.appendChild(t);
        o.appendChild(m);
        carr.push(o);
        popup.appendChild(o);
        height=(messageArr.length+1)*16+height;
    }
    var warr=getcwh(popup);
    oline.setAttribute('x','0');
    oline.setAttribute('y','0');
    var ow=warr[0]+10.5;
    var oh=warr[1]+3;
    oline.setAttribute('width',ow);
    oline.setAttribute('height',oh);
    oline.setAttribute('fill','white');
    oline.setAttribute('stroke','#656565');
    popup.appendChild(oline);
    var l=carr.length;
    while(l--){
        popup.appendChild(carr[l]);
    }
    popup.onmouseover=function () {
        this.style.display='block';
    };
    popup.onmouseout=function () {
        this.style.display = 'none';
    };
    var cs=comments[i].querySelector('use').getAttribute('transform').match(/\((\S*|\S*\s\S*)\)/)[1].split(/ |,/);
    var ps=comments[i].parentNode.getAttribute('transform');
    if(ps.substr(0,2) == 'tr'){
        var pps = ps.match(/\((\S*|\S*\s\S*)\)/)[1].split(/ |,/);
        var x=parseFloat(cs[0])+parseFloat(pps[0]);
        var y=parseFloat(pps[1]);
        x=x.tosuitsvg();
        y=y.tosuitsvg();
        var trstr = 'translate('+x+','+y+')';
    }
    else if(ps.substr(0,2) == 'ma'){
        var pps = ps.match(/(\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)\)$/);
        var maArr = [parseFloat(pps[1]),parseFloat(pps[3]),parseFloat(pps[5]),parseFloat(pps[7]),parseFloat(pps[9]),parseFloat(pps[11])];
        if(maArr[1] == 0){
            var x = parseFloat(cs[0]);
            var y= parseFloat(cs[1])+16;
            var x1 = x * maArr[0] + y * maArr[2] + maArr[4];
            var y1 = x * maArr[1] + y * maArr[3] + maArr[5];
            x1=x1.tosuitsvg();
            y1=y1.tosuitsvg();
            var trstr =  'translate('+x1+','+y1+')';
        }else{
            var x = parseFloat(cs[0])+16;
            var y = parseFloat(cs[1])+16;
            var x1 = x * maArr[0] + y * maArr[2] + maArr[4];
            var y1 = x * maArr[1] + y * maArr[3] + maArr[5];
            x = parseFloat(cs[0])+16;
            y = parseFloat(cs[1]);
            var x2 = x * maArr[0] + y * maArr[2] + maArr[4];
            var y2 = x * maArr[1] + y * maArr[3] + maArr[5];
            var fx = x1<x2?x1.tosuitsvg(): x2.tosuitsvg();
            var fy = y1>y2?y1.tosuitsvg(): y2.tosuitsvg();
            var offy = Math.abs(y1-y2);
            var trstr =  'translate('+fx+','+fy+')';
            popupR.setAttribute('height',offy.toString());
            popupR.setAttribute('width','16');
            popupR.setAttribute('y',(-offy).toString());
            popupR.setAttribute('fill','transparent');
            popup.appendChild(popupR);
        }
    }
    popup.setAttribute('transform',trstr);
    popup.setAttribute('comment','');
    popup.style.display='none';
    popup.setAttribute('ed:commentid',comments[i].parentNode.id);
    document.querySelector('#svg-container > svg').appendChild(popup);
    comments[i].onmouseover=function () {
        var commentid=this.parentNode.id;
        this.querySelector('rect').style.display='block';
        document.querySelector("g[ed\\:commentid='"+commentid+"'][comment]").style.display='block';
    };
    comments[i].onmouseout=function () {
        var commentid=this.parentNode.id;
//        window.getSelection().removeAllRanges();
        this.querySelector('rect').style.display='none';
        document.querySelector("g[ed\\:commentid='"+commentid+"'][comment]").style.display='none';
    }
}
//--comment
//note--
if(!ua){
    var notes=document.querySelectorAll('g>g[ed\\:note]');
    function getwh(s,p) {
        var mainp=document.createElement('div');
        mainp.style.cssText=s;
        mainp.style.display='inline-block';
		mainp.style.maxWidth = '400px';
		mainp.style.wordBreak = 'break-all';
        mainp.innerHTML=p;
        document.body.appendChild(mainp);
        var w=mainp.clientWidth;
        var h=mainp.clientHeight;
        document.body.removeChild(mainp);
        return [w,h]
    }
    for(var i=0;i<notes.length;i++){
        var a=notes[i].getAttribute('ed:note');
		var noteLock = notes[i].getAttribute('ed:notelock');
        if(noteLock == 'true'){
            continue;
        }
        var mainp=a.match(/<body[^>]*>(.*)<\/body>/)[1];
        var mains=a.match(/style="(.*?)"/)[1];
        var out=document.createElementNS('http://www.w3.org/2000/svg','g');
        var oline=document.createElementNS('http://www.w3.org/2000/svg','rect');
        var popup=document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
        var popupR= document.createElementNS('http://www.w3.org/2000/svg','rect');
        var hover=document.createElementNS('http://www.w3.org/2000/svg','rect');
        hover.setAttribute('fill','#cdcdff');
        hover.setAttribute('x','0');
        hover.setAttribute('y','0');
        hover.setAttribute('height','16');
        hover.setAttribute('width','16');
        hover.setAttribute('fill-opacity','0.6');
        hover.setAttribute('transform',notes[i].querySelector('use').getAttribute('transform'));
        hover.style.display='none';
        notes[i].appendChild(hover);
        popup.style.cssText=mains;
        popup.innerHTML=mainp;
        var wh=getwh(mains,mainp);
        popup.setAttribute('width',wh[0]);
        popup.setAttribute('height',wh[1]);
        popup.setAttribute('transform','translate(8,4)');
		popup.style.wordBreak = 'break-all';
        popup.style.textAlign='left';
        oline.setAttribute('x','0');
        oline.setAttribute('y','0');
        oline.setAttribute('width',wh[0]+16);
        oline.setAttribute('height',wh[1]+8);
        oline.setAttribute('stroke','#a27a00');
        oline.setAttribute('fill','#ffe79d');
        out.appendChild(oline);
        out.appendChild(popup);
        out.setAttribute('note','');
        out.style.display='none';
        out.setAttribute('ed:noteid',notes[i].parentNode.id);
        out.onmouseover=function () {
            this.style.display='block';
        };
        out.onmouseout=function () {
//        window.getSelection ? window.getSelection().removeRange(window.getSelection().re):document.selection.empty();

            this.style.display='none';
        };
        var cs=notes[i].querySelector('use').getAttribute('transform').match(/\((\S*|\S*\s\S*)\)/)[1].split(/ |,/);
        var ps=notes[i].parentNode.getAttribute('transform');
        if(ps.substr(0,2) == 'tr'){
            var pps = ps.match(/\((\S*|\S*\s\S*)\)/)[1].split(/ |,/);
            var x=parseFloat(cs[0])+parseFloat(pps[0]);
            var y=parseFloat(pps[1]);
            x=x.tosuitsvg();
            y=y.tosuitsvg();
            var trstr = 'translate('+x+','+y+')';
        }else if(ps.substr(0,2) == 'ma'){
            var pps = ps.match(/(\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)\)$/);
            var maArr = [parseFloat(pps[1]),parseFloat(pps[3]),parseFloat(pps[5]),parseFloat(pps[7]),parseFloat(pps[9]),parseFloat(pps[11])];
            if(maArr[1] == 0){
                var x = parseFloat(cs[0]);
                var y = parseFloat(cs[1])+16;
                var x1 = x * maArr[0] + y * maArr[2] + maArr[4];
                var y1 = x * maArr[1] + y * maArr[3] + maArr[5];
                x1=x1.tosuitsvg();
                y1=y1.tosuitsvg();
                var trstr =  'translate('+x1+','+y1+')';
            }else{
                var x = parseFloat(cs[0])+16;
                var y = parseFloat(cs[1])+16;
                var x1 = x * maArr[0] + y * maArr[2] + maArr[4];
                var y1 = x * maArr[1] + y * maArr[3] + maArr[5];
                x = parseFloat(cs[0])+16;
                y = parseFloat(cs[1]);
                var x2 = x * maArr[0] + y * maArr[2] + maArr[4];
                var y2 = x * maArr[1] + y * maArr[3] + maArr[5];
                var fx = x1<x2?x1.tosuitsvg(): x2.tosuitsvg();
                var fy = y1>y2?y1.tosuitsvg(): y2.tosuitsvg();
				var offy = Math.abs(y1-y2);										  
                var trstr =  'translate('+fx+','+fy+')';
                popupR.setAttribute('height',offy.toString());
                popupR.setAttribute('width','16');
                popupR.setAttribute('y',(-offy).toString());
                popupR.setAttribute('fill','transparent');
                popup.appendChild(popupR);
            }
        }
        out.setAttribute('transform',trstr);
        document.querySelector('#svg-container > svg').appendChild(out);
        notes[i].onmouseover=function () {
            var noteid=this.parentNode.id;
            this.querySelector('rect').style.display='block';
            document.querySelector("g[ed\\:noteid='"+noteid+"'][note]").style.display='block';
        };
        notes[i].onmouseout=function () {
            var noteid=this.parentNode.id;
//        window.getSelection().removeAllRanges();
            this.querySelector('rect').style.display='none';
            document.querySelector("g[ed\\:noteid='"+noteid+"'][note]").style.display='none';
        }
    }
}else{
    console.log('抱歉，IE浏览器不支持note解析，请使用其他内核浏览器。谢谢！')
}
//--note
//hyperlink--
var links=document.querySelectorAll('g>g[ed\\:hyperlink]');
function getmaxlen(arr,brr) {
    var l=0;
    var ll=0;
    for(var j=0;j<arr.length;j++){
        var e=document.createElementNS('http://www.w3.org/2000/svg','text');
        if(!isNaN(linkarr[j])){
            e.textContent='Page-'+arr[j];
        }else{
            e.textContent=arr[j];
        }
        e.style.fontSize='12px';
        document.body.getElementsByTagName('svg')[0].appendChild(e);
        var ew=e.getBBox().width;
        document.body.getElementsByTagName('svg')[0].removeChild(e);
        var h=document.createElementNS('http://www.w3.org/2000/svg','text');
        h.textContent=brr[j];
        h.style.fontSize='12px';
        h.style.fontWeight='bold';
        document.body.getElementsByTagName('svg')[0].appendChild(h);
        var hw=h.getBBox().width;
        document.body.getElementsByTagName('svg')[0].removeChild(h);
        l=ew>hw?ew:hw;
        ll=l>ll?l:ll;
    }
    return ll;
}
for(var i=0;i<links.length;i++){
    var popup=document.createElementNS('http://www.w3.org/2000/svg','g');
    var popupR= document.createElementNS('http://www.w3.org/2000/svg','rect');
    var hover=document.createElementNS('http://www.w3.org/2000/svg','rect');
    var descarr=[];
    var linkarr=[];
    hover.setAttribute('fill','#cdcdff');
    hover.setAttribute('x','0');
    hover.setAttribute('y','0');
    hover.setAttribute('height','16');
    hover.setAttribute('width','16');
    hover.setAttribute('fill-opacity','0.6');
    hover.setAttribute('transform',links[i].querySelector('use').getAttribute('transform'));
    hover.style.display='none';
    links[i].appendChild(hover);
    // console.log(links[i].getAttribute('ed:hyperlink'));
    var a=JSON.parse(links[i].getAttribute('ed:hyperlink'));
    var cs=links[i].querySelector('use').getAttribute('transform').match(/\((\S*|\S*\s\S*)\)/)[1].split(/ |,/);
    var ps=links[i].parentNode.getAttribute('transform');
    if(ps.substr(0,2) == 'tr'){
        var pps = ps.match(/\((\S*|\S*\s\S*)\)/)[1].split(/ |,/);
        var x=parseFloat(cs[0])+parseFloat(pps[0]);
        var y=parseFloat(pps[1]);
        x=x.tosuitsvg();
        y=y.tosuitsvg();
        var trstr = 'translate('+x+','+y+')';
    }else if(ps.substr(0,2) == 'ma'){
        var pps = ps.match(/(\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)[\, ](\-?\d+(\.\d+)?)\)$/);
        var maArr = [parseFloat(pps[1]),parseFloat(pps[3]),parseFloat(pps[5]),parseFloat(pps[7]),parseFloat(pps[9]),parseFloat(pps[11])];
        if(maArr[1] == 0){
            var x = parseFloat(cs[0]);
            var y = parseFloat(cs[1])+16;
            var x1 = x * maArr[0] + y * maArr[2] + maArr[4];
            var y1 = x * maArr[1] + y * maArr[3] + maArr[5];
            x1=x1.tosuitsvg();
            y1=y1.tosuitsvg();
            var trstr =  'translate('+x1+','+y1+')';
        }else{
            var x = parseFloat(cs[0])+16;
            var y = parseFloat(cs[1])+16;
            var x1 = x * maArr[0] + y * maArr[2] + maArr[4];
            var y1 = x * maArr[1] + y * maArr[3] + maArr[5];
            x = parseFloat(cs[0])+16;
            y = parseFloat(cs[1]);
            var x2 = x * maArr[0] + y * maArr[2] + maArr[4];
            var y2 = x * maArr[1] + y * maArr[3] + maArr[5];
            var fx = x1<x2?x1.tosuitsvg(): x2.tosuitsvg();
            var fy = y1>y2?y1.tosuitsvg(): y2.tosuitsvg();
			var offy = Math.abs(y1-y2);										  
            var trstr =  'translate('+fx+','+fy+')';
            popupR.setAttribute('height',offy.toString());
            popupR.setAttribute('width','16');
            popupR.setAttribute('y',(-offy).toString());
            popupR.setAttribute('fill','transparent');
            popup.appendChild(popupR);
        }
    }
    var al=a.length;
    for(var j=0;j<al;j++){
        linkarr.push(a[j].link);
        descarr.push(a[j].desc);
    }
    popup.setAttribute('transform',trstr);
    var max=getmaxlen(linkarr,descarr);
    for(var k=0;k<al;k++){
        var c=document.createElementNS('http://www.w3.org/2000/svg','a');
        var d=document.createElementNS('http://www.w3.org/2000/svg','rect');
        var e=document.createElementNS('http://www.w3.org/2000/svg','text');
        var f=document.createElementNS('http://www.w3.org/2000/svg','text');
        if(isNaN(linkarr[k])){
            c.setAttributeNS("http://www.w3.org/2000/svg", "xlink", "http://www.w3.org/1999/xlink");
            c.setAttributeNS("http://www.w3.org/1999/xlink", "href", linkarr[k]);
            c.setAttribute('target','_blank');
            e.textContent=linkarr[k];
        }else{
            e.textContent='Page-'+linkarr[k];
            c.setAttributeNS("http://www.w3.org/2000/svg", "xlink", "http://www.w3.org/1999/xlink");
            c.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#"+linkarr[k]);
        }
        d.setAttribute('width',max+10);
        d.setAttribute('height','33');
        d.setAttribute('stroke','#999999');
        d.setAttribute('fill','white');
        d.setAttribute('y',33*k);
        f.textContent=descarr[k];
        f.style.fontSize='12px';
        f.style.fontWeight='bold';
        f.setAttribute('x',5);
        f.setAttribute('y',33*k+12);
        e.style.fontSize='12px';
        e.setAttribute('y',33*k+28);
        e.setAttribute('x',5);
        c.appendChild(d);
        c.appendChild(f);
        c.appendChild(e);
        c.onmouseover=function () {
            this.querySelector('rect').style.fill='#e1e1ff'
        };
        c.onmouseout=function () {
            this.querySelector('rect').style.fill='white'
        };
        popup.appendChild(c);
    }
    popup.style.display='none';
    popup.setAttribute('hyperlink','');
    popup.setAttribute('ed:linkid',links[i].parentNode.id);
    popup.onmouseover=function () {
        this.style.display='block';
    };
    popup.onclick=function () {
        this.style.display='none';
    };
    popup.onmouseout=function () {
        this.style.display='none';
    };
    document.querySelector('#svg-container > svg').appendChild(popup);
    links[i].onmouseover=function () {
        var linkid=this.parentNode.id;
        this.querySelector('rect').style.display='block';
        document.querySelector("g[ed\\:linkid='"+linkid+"'][hyperlink]").style.display='block';
    }
    links[i].onmouseout=function () {
        var linkid=this.parentNode.id;
        this.querySelector('rect').style.display='none';
        document.querySelector("g[ed\\:linkid='"+linkid+"'][hyperlink]").style.display='none';
    }
}
//--hyperlink
//initialize--
var shape=document.querySelectorAll('g[ed\\:togtopicid]');
var mId=document.querySelectorAll('g[ed\\:topictype]');
var dataTree={};
var extraRela={};
var checkID='';
for(var i=0;i<mId.length;i++){
    var type=mId[i].getAttribute('ed:topictype');
    var sid=mId[i].id;
    if(type!=='callout'){
        init(sid,dataTree)
    }
}
function init(id, obj) {
    var childs = document.querySelectorAll("g[ed\\:parentid='" + id + "']:not([ed\\:topictype])");
    var calls = document.querySelectorAll("g[ed\\:parentid='" + id + "'][ed\\:topictype]");
    var summary = document.querySelectorAll("path[ed\\:parentid*='" + id + "'][ed\\:type='summary']");
    var boundary= document.querySelectorAll("path[ed\\:parentid*='" + id + "'][ed\\:type='boundary']");
    var relafrom=document.querySelectorAll("g[ed\\:fromid*='" + id + "'][ed\\:type='relation']");
    var relato=document.querySelectorAll("g[ed\\:toid*='" + id + "'][ed\\:type='relation']");
    obj["m" + id] = {};
    var type = document.getElementById(id).getAttribute('ed:topictype');
    var iw=document.getElementById(id).getAttribute('ed:width');
    var ih=document.getElementById(id).getAttribute('ed:height');
    if (type) {
        obj["m" + id].type = type;
    }
    if(iw&&ih){
        obj["m" + id].width =iw;
        obj["m" + id].height =ih;
    }
    if (relafrom.length !== 0) {
        obj["m" + id].relafrom = {};
        for (var i = 0; i < relafrom.length; i++) {
            var indexid = relafrom[i].id;
            var toid = document.getElementById(indexid).getAttribute('ed:toid');
            if (extraRela[indexid] === undefined) {
                extraRela[indexid] = {
                    id: indexid,
                    fromid: id,
                    toid: toid,
                    isC: false
                };
            }
            obj["m" + id].relafrom[indexid]={};
            obj["m" + id].relafrom.display=document.getElementById(id).style.display !== 'none'?'block':'none';
        }
    }
    if (relato.length !== 0) {
        obj["m" + id].relato = {};
        for (var i = 0; i < relato.length; i++) {
            var indexid=relato[i].id;
            var fromid=document.getElementById(indexid).getAttribute('ed:fromid');
            if(extraRela[indexid] === undefined){
                extraRela[indexid]={
                    id:indexid,
                    fromid:fromid,
                    toid:id,
                    isC:false
                };
            }
            obj["m" + id].relato[indexid]={};
            obj["m" + id].relato.display=document.getElementById(id).style.display !== 'none'?'block':'none';
        }
    }
    if (childs.length !== 0) {
        obj["m" + id].child = {};
        if (document.querySelector("g[ed\\:togtopicid='" + id + "']")) {
            // console.log(document.querySelector("g[ed\\:togtopicid='" + id + "']").childNodes[0].getAttribute('xlink:href'));
            var tog = document.querySelector("g[ed\\:togtopicid='" + id + "']").getElementsByTagName('use')[0].getAttribute('xlink:href').slice(1);
            obj["m" + id].togtype = tog;
        }
        for (var i = 0; i < childs.length; i++) {
            var cid = childs[i].id;
            init(cid, obj["m" + id].child);
        }
    }
    if (calls.length !== 0) {
        obj["m" + id].call = {};
        for (var i = 0; i < calls.length; i++) {
            var cid = calls[i].id;
            init(cid, obj["m" + id].call);
        }
    }
    if (boundary.length !== 0) {
        obj["m" + id].boundary = {};
        for (var i = 0; i < boundary.length; i++) {
            var cid =boundary[i].id;
            init(cid, obj["m" + id].boundary);
        }
    }
    if (summary.length !== 0) {
        obj["m" + id].summary = {};
        for (var i = 0; i < summary.length; i++) {
            var cid = summary[i].id;
            init(cid, obj["m" + id].summary);
        }
    }
}
//--initialize
//toggledisplay--
var chainArr=[];
function getchain(id){
    chainArr.unshift('m'+id);
    var parent=document.getElementById(id).getAttribute('ed:parentid');
    if(!parent){
        return;
    }
	if(parent.match(/\,/)){
        parent = parent.match(/\d+(?=\,)/)[0]
    }
    getchain(parent);
}
function getobj(id) {
    chainArr=[];
    getchain(id);
    var main=chainArr[0];
    if(chainArr.length>1){
        var obj=dataTree[main];
        // console.log(chainArr);
        for(var i=1;i<chainArr.length;i++) {
            var a = chainArr[i];
            for(var j=0;j<Object.keys(obj).length;j++){
                var cobj= obj[Object.keys(obj)[j]][a];
                if(cobj){
                    obj=cobj;
                    continue
                }
            }
        }
        return obj
    }else{
        var obj=dataTree[main];
        return obj
    }

}
for(var i=0;i<shape.length;i++){
    shape[i].onclick=function () {
        var id=Number(this.getAttribute('ed:togtopicid'));
        var obj=getobj(id);

        var type=obj.togtype==='minus'?'plus':'minus';
        var display=obj.togtype==='minus'?'none':'block';
        this.getElementsByTagName('use')[0].setAttribute('xlink:href','#'+type);
        obj.togtype=type;
        checkID=obj;

        utd(obj,id,display);
        extraRelaFin();
    }
}
function utd(obj,id,show,oc) {

    var pshow=document.getElementById(id).style.display!== 'none'?'block':'none';
    if (obj.relafrom){
        if(obj.relafrom.display!== pshow){
            var relafroms=Object.keys(obj.relafrom);
            relafroms.splice(relafroms.indexOf('display'),1);
            for(var k=0;k<relafroms.length;k++){
                var d=relafroms[k];
                extraRela[d].isC=true;
            }
            obj.relafrom.display = pshow;
        }
    }
    if (obj.relato){
        if(obj.relato.display!== pshow){
            var relatos=Object.keys(obj.relato);
            relatos.splice(relatos.indexOf('display'),1);
            for(var k=0;k<relatos.length;k++){
                var d=relatos[k];
                extraRela[d].isC=true;
            }
            obj.relato.display = pshow;
        }
    }
    if(obj.call){
        var calls=Object.keys(obj.call);
        if(checkID!==obj){
            for(var i=0;i < calls.length;i++){
                var a=calls[i].slice(1);
                var b=obj.call[calls[i]];
                var c=b.togtype;
                document.getElementById(a).style.display=show;
                if (b.relafrom&&!c){
                    if(b.relafrom.display!== show){
                        var relafroms=Object.keys(b.relafrom);
                        relafroms.splice(relafroms.indexOf('display'),1);
                        for(var k=0;k<relafroms.length;k++){
                            var d=relafroms[k];
                            extraRela[d].isC=true;
                        }
                        b.relafrom.display = show;
                    }
                }
                if (b.relato&&!c){
                    if(b.relato.display!== show){
                        var relatos=Object.keys(b.relato);
                        relatos.splice(relatos.indexOf('display'),1);
                        for(var k=0;k<relatos.length;k++){
                            var d=relatos[k];
                            extraRela[d].isC=true;
                        }
                        b.relato.display = show;
                    }
                }
                if(c){
                    document.querySelector("g[ed\\:togtopicid='"+a+"']").style.display=show;
                    if(c==='minus'){
                        utd(b,a,show)
                    }
                    if ((b.call||b.boundary||b.summary)&&c==='plus') {
                        utd(b,a,show,true)
                    }
                }
                if(b.call&&!c) {
                    utd(b,a,show,true)
                }
                if (b.summary&&!c) {
                    utd(b,a,show)
                }
                if (b.boundary&&!c) {
                    utd(b,a,show)
                }

            }
        }
    }
    if(obj.summary){
        var summarys=Object.keys(obj.summary);
        if((checkID!==obj&&(obj.togtype==='minus'||!obj.togtype))||checkID===obj){
            for(var i=0;i<summarys.length;i++){
                var a=summarys[i].slice(1);
				var osp = document.getElementById(a).getAttribute('ed:parentid');
                if(osp.match(/\,/)){
                    var ospa = osp.split(',');
                    var ospL=0;

                    for(var j=0;j<ospa.length;j++){
                        if(show == 'none'){
                            if(document.getElementById(ospa[j]).style.display != 'none'){
                                break;
                            }else{
                                ospL++;
                            }
                        }else{
                                if(document.getElementById(a).style.display != 'none'){
                                    break;
                                }else{
                                    ospL++;
                                }
                        }

                    }
                    if(ospL !== ospa.length){
                        continue;
                    }
                }
                var b=obj.summary[summarys[i]];
                // console.log(a);
                document.getElementById(a).style.display=show;
//                if(c){
//                    document.querySelector("g[ed\\:togtopicid='"+a+"']").style.display=show;
//                    if(c==='minus'){
//                        utd(b,show)
//                    }
//                    if (b.call&&c==='plus') {
//                        utd(b,show,true)
//                    }
//                }
//                if(b.call&&!c) {
//                    utd(b,show,true)
//                }
                if(Object.keys(b).length!==0){
                    utd(b,a,show)
                }
            }
        }
    }
    if(obj.boundary){
        var boundarys=Object.keys(obj.boundary);
        if(checkID!==obj){
            for(var i=0;i<boundarys.length;i++){
                var a=boundarys[i].slice(1);
                var b=obj.boundary[boundarys[i]];
                // console.log(a);
                document.getElementById(a).style.display=show;
//                if(c){
//                    document.querySelector("g[ed\\:togtopicid='"+a+"']").style.display=show;
//                    if(c==='minus'){
//                        utd(b,show)
//                    }
//                    if (b.call&&c==='plus') {
//                        utd(b,show,true)
//                    }
//                }
//                if(b.call&&!c) {
//                    utd(b,show,true)
//                }
                if(Object.keys(b).length!==0){
                    utd(b,a,show)
                }
            }
        }
    }
    if(!oc&&obj.child) {
        var childs = Object.keys(obj.child);
        for (var i = 0; i < childs.length; i++) {
            var a = childs[i].slice(1);
            var b = obj.child[childs[i]];
            var c = b.togtype;
            document.getElementById(a).style.display = show;
			var tSPath = document.querySelector("path[ed\\:tosuperid='"+a+"']");
            if(tSPath){
                tSPath.style.display = show;
            }
			var noteTip = document.querySelector("g[ed\\:noteto='"+a+"']");
            if(noteTip){
                noteTip.style.display = show;
            }
            if (b.relafrom&&!c){
                if(b.relafrom.display!== show){
                    var relafroms=Object.keys(b.relafrom);
                    relafroms.splice(relafroms.indexOf('display'),1);
                    for(var k=0;k<relafroms.length;k++){
                        var d=relafroms[k];
                        extraRela[d].isC=true;
                    }
                    b.relafrom.display = show;
                }
            }
            if (b.relato&&!c){
                if(b.relato.display!== show){
                    var relatos=Object.keys(b.relato);
                    relatos.splice(relatos.indexOf('display'),1);
                    for(var k=0;k<relatos.length;k++){
                        var d=relatos[k];
                        extraRela[d].isC=true;
                    }
                    b.relato.display = show;
                }
            }
            if (c) {
                document.querySelector("g[ed\\:togtopicid='" + a + "']").style.display = show;
                if (c === 'minus') {
                    utd(b,a,show)
                }
                if ((b.call||b.boundary||b.summary)&&c==='plus') {
                    utd(b,a,show,true)
                }
            }
            if (b.call&&!c) {
                utd(b,a,show,true)
            }
            if (b.summary&&!c) {
                utd(b,a,show)
            }
            if (b.boundary&&!c) {
                utd(b,a,show)
            }
        }
    }
}

function extraRelaFin() {
    var extrakeys=Object.keys(extraRela);
    for(var i=0;i<extrakeys.length;i++){
        var extraObj=extraRela[extrakeys[i]];
        if(extraObj.isC === true){
            var fshow=document.getElementById(extraObj.fromid).style.display !=='none'? true: false;
            var tshow=document.getElementById(extraObj.toid).style.display !=='none'? true: false;
            document.getElementById(extraObj.id).style.display=fshow && tshow? 'block': 'none';
            extraRela[extrakeys[i]].isC = false;
        }
    }
}