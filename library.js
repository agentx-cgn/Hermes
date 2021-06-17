
//
//
//
///////////////   E X T E N S I O N S    ///////////////////////////////////////

// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
if ( !Function.prototype.bind ) {
  Function.prototype.bind = function( obj ) {
    var slice = [].slice,
        args = slice.call(arguments, 1),
        self = this,
        nop = function () {},
        bound = function () {
          return self.apply( this instanceof nop ? this : ( obj || {} ), args.concat( slice.call(arguments) ) );
        };
    nop.prototype = self.prototype;
    bound.prototype = new nop();
    return bound;
  };
}

if ( !Array.prototype.to ) {
  Array.prototype.range = function(fn){
    var i, start = (this.length === 1) ? 0 : this[0],
        end = (this.length === 1) ? this[0] : this[1];
    for (i=start; i<end; i++){
      fn(i);
    }
  }
}


//
//
//
///////////////   T O O L S       ///////////////////////////////////////

var Tools = {

  getRandomColor : function (){
    return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  },
  formatDateTime : function (dat){

    var d = (dat) ? (typeof dat === "object") ? dat : new Date(dat) : new Date();
    var out = "", pad2 = Tools.pad2;

    out += d.getUTCFullYear() + "-" + pad2((d.getUTCMonth()+1)) + "-" + pad2(d.getUTCDate()) + " ";
    out += pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes()) + ":" + pad2(d.getUTCSeconds());
    out += ":" + d.getUTCMilliseconds();
    return out;
  },
  formatTime : function (dat){

    var d = (dat) ? (typeof dat === "object") ? dat : new Date(dat) : new Date();
    var out = "", pad2 = Tools.pad2;

    out += pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes()) + ":" + pad2(d.getUTCSeconds());
    out += ":" + Tools.pad3(d.getUTCMilliseconds());
    return out;
  },
  pad2 : function (num){return (num < 10) ? "0" + num : num;},
  pad3 : function (num){
    return (num <  10) ? "00" + num :
           (num < 100) ?  "0" + num :
           num;
  }
};


//
//
//
///////////////   R I N G B U F F E R   ///////////////////////////////////////

var createRingBuffer = function(length){

  // for your numbers only
  var pointer = 0, buffer = [];

  return {
    log : function(){return buffer.join(", ");},
    push : function(item){
      buffer[pointer] = item;
      pointer = (length + pointer +1) % length;
    },
    max : function(){return Math.max.apply(Math, buffer);},
    min : function(){return Math.min.apply(Math, buffer);},
    avg : function(){
      var sum = 0;
      buffer.forEach(function(num){sum += num;});
      return sum/buffer.length;
    },
    median : function(){
      var buff = buffer.slice(0).sort(function(a, b){return a-b;}),
          half = buff.length / 2, indx = Math.floor(half);
      return (half === indx) ? (buff[indx+1] - buff[indx])/2 : buff[indx];
    }
  };
};

//
//
///////////////   T I C K E R    //////////////////////////////////////////////

var createTickerX = function(interval, ontick, debug){

  var timer, ticker = {}, counter = 1;

  var go = function(){

      ticker.duration = 0;
      ticker.interval = interval;

      timer = setTimeout(function tick (){

        ticker.stamp = Date.now();
        if (counter === 1) {
          ticker.start = ticker.stamp;
        }
        ticker.offset = ticker.start + counter * ticker.interval - ticker.stamp;
        ticker.lag = ticker.interval - ticker.offset;

        timer = setTimeout(tick, ticker.offset);
        ticker.counter = counter;

        if (debug) {console.log(ticker.offset, ticker.start, ticker.counter, ticker.interval, ticker.stamp);}

        ontick(ticker);
        counter += 1;
        ticker.duration = Date.now() - ticker.stamp;

      }, interval);
    
  };

  ticker.stop  = function(){
    clearTimeout(timer);
    counter = 0;  // that's magic'
  };

  ticker.go = go;
  ticker.go();
  return ticker;
};

var createTicker = function(interval, ontick, debug){

  var ticker = {
    debug   : debug,
    log     : "",
    counter : 1,
    interval: interval,
    ontick  : ontick,
    fmt     : Tools.formatTime,
    go : function(){

      this.duration = 0;

      this.timer = setTimeout(function ticks (){

        this.stamp = Date.now();
        if (this.counter === 1) {
          this.start = this.stamp;
        }
        this.tick   = this.start + (this.counter-1) * this.interval;
        this.offset = this.interval - (this.stamp - this.tick);
        this.lag    = this.interval - this.offset;

        this.timer = setTimeout(ticks.bind(this), this.offset);

        if(debug){
          this.log = this.counter + 
            " I:" + this.interval +
            " T:" + this.fmt(this.tick) +
            " S:" + this.fmt(this.stamp) +
            " O:" + this.offset +
            " D:" + Tools.pad2(this.duration) +
            " L:" + Tools.pad2(this.lag);
        }

        this.ontick(this)
        this.counter += 1;
        this.duration = Date.now() - this.stamp;

      }.bind(this), this.interval);

    },
    stop : function(){
      clearTimeout(this.timer);
      this.counter = 0;
    }
  };
  ticker.go();
  return ticker;
};


//
//
///////////////   S T U F F     //////////////////////////////////////////////

function r(n, l) {
  // formats numbers(floats) for debug output
  var out, i;

  function mulString(s, count) { 
    var i, out = "";
    for (i=0; i<count; i++){out += s;}
    return out;
  }  // multiple copies of s

  if (l == 0) {return (n+"").split(".")[0];}
  if(!l){l=2;}
  var p = Math.pow(10, l);
  out = Math.round(n * p) / p;
  if(out >= 0) {out = " " + out;} else {out = "" + out;}

  if (l == 0){return out;}
  i = out.indexOf(".");
  if (i == -1){out = out + ".0";}
  i = out.indexOf(".");

  return out + mulString("0", l - out.length + i + 1);
}

