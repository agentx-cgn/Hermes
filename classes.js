//
//
//--------------- R I N G B U F F E R    ------------------------------------//

function RingBuffer(slots){

  this.length  = slots;
  this.pointer = 0;
  this.buffer  = [];

}

  RingBuffer.prototype.push = function (data){

    if (typeof data =="object"){
      this.buffer[this.pointer] = clone(data);
    } else {
      this.buffer[this.pointer] = data;
    }

    this.pointer += 1;
    if (this.pointer === this.length) {this.pointer = 0;}

  }

  RingBuffer.prototype.copy = function (){

    var i, idxTarget = 0, idxSource, a = [] ;

    if (this.buffer.length < this.length) {
      for (i=0; i<this.length; i++){
        if (this.buffer[i]) {
          a[i] = this.buffer[i];
        } else {
          a[i] = null;
        }
      }
    } else {
      for (i=this.pointer; i < this.pointer + this.length; i++){
        if(i > this.length -1){
          idxSource = i - this.length;
        } else {
          idxSource = i - this.buffer.length + this.length;
        }
        a[idxTarget] = this.buffer[idxSource];
        idxTarget++;
      }
    }
    return a;
  }

//
//
//--------------- I M A G E L O A D E R     ---------------------------------//

  function imageLoader(pics, folder, onready){
    this.nextPic  = 0;
    this.pics     = pics;
    this.folder   = folder;
    this.names    = oAttrs(pics).split(" ");
    this.onReady  = onready;
    this.loadNext();
  }

    imageLoader.prototype.loadNext = function (){
      if (this.nextPic == this.names.length) {
//        if (HOST.debM) {tim.step("images:" + this.names.length);}
        this.onReady();
      } else {
        this.loadImage(this.names[this.nextPic], this.pics[this.names[this.nextPic]]);
      }
    };

    imageLoader.prototype.loadImage = function (name, file){
      this.nextPic += 1;
      var pic       = new Image();
      pic.onload    = this.loadNext.bind(this);
      pic.onerror   = function(){console.error("ERROR: " + file);};
      pic.src       = this.folder + file;
      PICS[name]    = pic;
    };


//
//
//--------------- XMLHttpRequest     ----------------------------------------//

function HttpRequest(){
  var xmlHttp = false;
  try  {if (window.ActiveXObject){
           for(var i = 5; i; i-- ){
               try   { if   ( i == 2 )  {xmlHttp = new ActiveXObject( "Microsoft.XMLHTTP" );}
                       else             {xmlHttp = new ActiveXObject( "Msxml2.XMLHTTP." + i + ".0" );}
                       break;}
               catch ( excNotLoadable ) {xmlHttp = false;}}}
        else if( window.XMLHttpRequest ){xmlHttp = new XMLHttpRequest();}}
  catch(e)                              {xmlHttp = false;}
  return xmlHttp ;
}


//
//
//--------------- Request  --------------------------------------------------//

function request(para1, func, target, para2, para3, req){
  this.func     = func;
  this.target   = target;
  this.urlBase  = "/interface.php";
  this.getpost  = (req || "GET");
  this.url      = this.urlBase + "?act=" + para1 + ((para2) ? "&" + para2 + "=" + para3 : "");
  this.req      = getXMLRequester();
  this.req.open(this.getpost, encodeURI(this.url), true);
  this.req.setRequestHeader('X-Referer', document.location);
  this.req.onreadystatechange = function(){
    if (this.req.readyState == 4 && this.req.status == 200) {
//        console.log("HUHU");
      this.func.apply(this, [this.req.responseText, this.target, para1, para2, para3]);
    }
  }.bind(this);
  this.req.send(null);
  if (GAME.debM) {console.log("request", this.url);}
}


function Requester(url, timeout, payload, callback, onexception){

  var data;

  this.req = new HttpRequest();
  this.cancelled = false;

  if (payload) {
    this.req.open("POST", url, true);
    this.req.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
    data  = "action=" + encodeURIComponent("result");
    data  = "&payload=" + encodeURIComponent(payload);
    data += "&hash=" + encodeURIComponent(leagueDATA.hash);
  } else {
    this.req.open("GET", url, true);
    data = null;
  }

  this.req.setRequestHeader('X-Referer', document.location);

  this.timeout = setTimeout(function(){
    this.cancelled = true;
    this.req.abort();
    onexception("000/timeout", url);
  }.bind(this), timeout * 1000);

  this.req.onerror = function(e){
    this.cancelled = true;
    this.req.abort();
    clearTimeout(this.timeout);
    onexception("000/error", url);
  }.bind(this);

  this.req.onreadystatechange = function(){

//    console.log("onreadystatechange", this.req, this.req.readyState, this.req.status);

    if (this.cancelled) {return;}

    if (this.req.status === 404) {
      this.cancelled = true;
      console.log("404", this, this.req, this.req.abort());
      this.req.abort();
      clearTimeout(this.timeout);
      onexception(this.req.status + "/" + this.req.statusText, url);
    }

    if (this.req.readyState === 4 && this.req.status === 200) {
      clearTimeout(this.timeout);
      try {
        var answer = JSON.parse(this.req.responseText)
      } catch (e) {
        answer = {"error": "no valid response"};
        console.error("Requester " + url)
        console.error("Requester NO JSON:", this.req.responseText, "END");
      }
      callback.apply(this, [answer, url]);
    }
  }.bind(this);

  try {
    this.req.send(data);
  } catch(e){
    this.cancelled = true;
    this.req.abort();
    clearTimeout(this.timeout);
    onexception("höhö", url);
  }

}
