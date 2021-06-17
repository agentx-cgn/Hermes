
var TIMECODE = function (){
  
  var start = Date.now() - new Date().getTimezoneOffset() * 60 * 1000,
      pad   = function (number) {
        var str = '' + number;
        while (str.length < 2) {
          str = '0' + str;
        } return str;
      }

  return {
    reset  : function(){start = Date.now() - new Date().getTimezoneOffset() * 60 * 1000;},
    now    : function(){return this.format(Date.now());},
    lapsed : function(){return this.format(Date.now() - start);},
    format : function(msecs){

      var hh, mm, ss, ff, t = new Date(msecs);
      hh = pad(t.getHours());
      mm = pad(t.getMinutes());
      ss = pad(t.getSeconds());
      ff = pad(parseInt(t.getMilliseconds()/40, 10));
      return [hh, mm, ss, ff].join(":");

    }

  };

}();



var MEDIA = function (){

  var media = {}, bunch = [], nextMedia = 0, callback;

  return {

    init : function(){},
    get  : function(identifier){return identifier ? media[identifier] : media;},
    load : function(files, onready){
      nextMedia = 0;
      bunch = files;
      callback = onready;
      this.loadNext();
    },
    loadNext : function(){
//      console.log("MEDIA.loadNext: ", nextMedia, bunch.length, media, secret);
      if (nextMedia === bunch.length) {
        callback();
      } else {
        this.loadMedia(bunch[nextMedia]);
      }
    },
    loadMedia : function(file){

      var pic, vid, ext = file.split(".")[1];

      nextMedia += 1;

      switch (ext){
        case "jpg" :
        case "gif" :
        case "png" :
          pic         = new Image();
          pic.onload  = this.loadNext.bind(this);
          pic.onerror = function(){console.error("ERROR: " + file);};
          pic.src     = file;
          media[file] = pic;
        break;
        case "mp4" :
          vid         = new Video();
          vid.onload  = this.loadNext.bind(this);
          vid.onerror = function(){console.error("ERROR: " + file);};
          vid.src     = file;
          media[file] = vid;
        break;
        default :
          console.log("MEDIA: ", ext , "not registered");
        break
      }

//      console.log("MEDIA.loadMedia: ", this, nextMedia, file, media[file], media, media.length, secret);

    }

  };

}();



var DEVICES = function (){

  return {

    init : function (){

      // all keys here
      window.onkeydown = function(e){
        if      (e.keyCode === 68) {ANIMATOR.toggleDebug();}   // d
        else if (e.keyCode === 33) {ANIMATOR.switchCompo( 1);} // pageUp
        else if (e.keyCode === 34) {ANIMATOR.switchCompo(-1);} // pageDown
        else if (e.keyCode === 36) {ANIMATOR.setScale(1);}     // Home
        else if (e.keyCode === 32) {ANIMATOR.toggle();}        // Space
        else {console.log("KEY :", e.keyCode);}
      };

      // mousewheel
      function wheelee(event){
        event  = window.event || event;
        var wheel  = sgn((event.detail ? event.detail * (-120) : event.wheelDelta) / 240);
        ANIMATOR.switchCompo(wheel);
      }
      if ("onmousewheel" in document.body){
        document.onmousewheel = wheelee;
      } else {
        document.addEventListener("DOMMouseScroll", wheelee, false);
      }

    }

  };

}();



var ANIMATOR = function (){

  var word, isRunning = false, counter = 0, interval = 25, divisor = 20, debug = false, dimensions = {},
      vidNoise, ctxTarget, ctxBuffer, ctxWords, ctxDebug, ctxImage, ctxParts,
      TIMER = null, frameDuration = 0, frameIn = 0, frameOffset = 0,  frameAVGDuration,
      projector,
      scaler = [],
      mouseX, mouseY, mouseClickX, mouseClickY ,
      compo = 0, compos = ["source-over", "source-in", "source-out", "source-atop",
                            "destination-over", "destination-out", "destination-atop",
                            "copy", "lighter", "xor"];

     var frameDurations = createRingBuffer(5);
     frameDurations.average = function(){
       var i, result = 0, counter = 0;
       for (i=0; i<this.length; i++){
         if (!isNaN(this.buffer[i])){
           result += this.buffer[i];
           counter += 1
         }
       }
       return result / counter;
     };

//     var transX =0, transY=0, transZ = 1.04;

  return {

    trace       : function(){
      var i, canvas;
      for (i=0; canvas = scaler[i]; i++){
        console.log(canvas.doop.label, canvas.width, canvas.height, canvas.style.width, canvas.style.height);
      }
    },
    toggleDebug : function(value){debug = (value) ? value : !debug;},
    start       : function(){isRunning = true; this.tick(); console.log("ANIMATOR.start");},
    stop        : function(){isRunning = false; clearInterval(TIMER); console.log("ANIMATOR.stop");},
    toggle      : function(){isRunning ? ANIMATOR.stop() : ANIMATOR.start()},
    switchCompo : function(dir){
      compo += dir;
      if (compo < 0) {compo = compos.length -1;}
      if (compo === compos.length) {compo = 0;}
    },
    init        : function(){

      var size = DISPLAY.getSize();
      dimensions.scale  = 1;
      dimensions.width  = size.width;
      dimensions.height = size.height;

      ctxTarget = this.create2dContext("projector", dimensions);
      projector = ctxTarget.canvas;
      projector.doop.resize = function(width, height){
        projector.style.width = dimensions.width + "px";
        projector.style.height = dimensions.height+ "px";
        projector.width = width;
        projector.height = height;
      };
      projector.onmousemove = function(e){
        mouseX = e.clientX; mouseY = e.clientY;
      }
      scaler.push(projector);
      document.body.appendChild(projector)

      ctxImage = this.create2dContext("image", dimensions);
      ctxImage.canvas.doop.resize = function(width, height){
        var elImage = MEDIA.get("static/test-pattern.jpg");
        ctxImage.canvas.width = width;
        ctxImage.canvas.height = height;
        ctxImage.drawImage(elImage,
          0, 0, elImage.width, elImage.height,
          0, 0, ctxImage.canvas.width, ctxImage.canvas.height
        );
      };
      scaler.push(ctxImage.canvas);


      ctxBuffer = this.create2dContext("buffer" ,dimensions);
      scaler.push(ctxBuffer.canvas);

      ctxWords = this.create2dContext("words", dimensions);
      scaler.push(ctxWords.canvas);

      ctxParts = this.create2dContext("parts", dimensions);
      ctxParts.canvas.doop.mousedown = function(e){console.log(e);}
      projector.onmousedown = function(e){
        mouseClickX = e.clientX; mouseClickY = e.clientY;
        ctxParts.save();
        ctxParts.strokeStyle = "rgba(200, 200, 200, 0.8)";
        ctxParts.beginPath();
        ctxParts.arc(mouseClickX * dimensions.scale, mouseClickY * dimensions.scale, 20, 0, Math.PI*2, false);
        ctxParts.stroke();
        ctxParts.restore();
//        console.log(mouseClickX * dimensions.scale, mouseClickY * dimensions.scale);
      }
      scaler.push(ctxParts.canvas);

      ctxDebug = this.create2dContext("debug", dimensions);
//      ctxDebug.canvas.doop.resize = function(){};
      scaler.push(ctxDebug.canvas);

//      vidNoise = $("srcVideo");
//      vidNoise.autoplay = false;
//      vidNoise.loop = true;
//      vidNoise.volume = 0;
//      vidNoise.currentTime = 1.0;
//      vidNoise.play();
//      scaler.push(vidNoise);



      this.resize(dimensions);

    },
    render : function(){

      var width, height;

      // process words
      if (!(counter % divisor) || !word) {
        word = w[parseInt(Math.pow(10, Math.random() * 4), 10)];
      } //word = "+";

      ctxWords.drawImage(ctxBuffer.canvas, 0, 0);

      ctxWords.save();
      ctxWords.font = "80px sans-serif"
      ctxWords.textAlign = "center";
      ctxWords.textBaseline = "middle";
      ctxWords.strokeStyle = "white";
      ctxWords.fillStyle = "black";
      ctxWords.lineWidth = 2;
      ctxWords.translate(ctxWords.canvas.width/2, ctxWords.canvas.height/2);
      ctxWords.scale(dimensions.scale, dimensions.scale);

      ctxWords.fillText(word, 0, 0);
      ctxWords.strokeText(word, 0, 0);

      ctxWords.restore();


      ctxWords.save();
      ctxWords.translate(ctxWords.canvas.width/2, ctxWords.canvas.height/2);
      ctxWords.strokeStyle = "white";
      ctxWords.lineWidth = 2;
//      ctxWords.strokeRect(-2,-2,5,5);
//      ctxWords.beginPath();
//      ctxWords.moveTo(-33,  8);
//      ctxWords.lineTo( 33,  8);
//      ctxWords.moveTo(-33, -7);
//      ctxWords.lineTo( 33, -7);
//      ctxWords.moveTo( 8, -33);
//      ctxWords.lineTo( 8,  33);
//      ctxWords.moveTo(-7, -33);
//      ctxWords.lineTo(-7,  33);
//      ctxWords.moveTo(0,0);
//      ctxWords.arc(0, 0, 64, 0, Math.PI*2, false);
      ctxWords.stroke();
      ctxWords.restore();

      width  = ctxBuffer.canvas.width;
      height = ctxBuffer.canvas.height;
      ctxBuffer.save();
      ctxBuffer.translate(width/2, height/2);
      ctxBuffer.scale(1.02, 1.02);
      ctxBuffer.drawImage(ctxWords.canvas, 0, 0, width, height, -width/2, -height/2, width, height);  // copy words to buffer
      ctxBuffer.fillStyle = "rgba(120, 20, 0, 0.01)";
      ctxBuffer.fillRect(-width/2, -height/2, width, height);  // dim buffer
      ctxBuffer.strokeStyle = "yellow";
      ctxBuffer.beginPath();
//      ctxBuffer.arc(0, 0, 32, 0, Math.PI*2, false);
      ctxBuffer.stroke();

      ctxBuffer.restore();



//      ctxTarget.canvas.width = ctxTarget.canvas.width;
      projector.width = projector.width;

      // final -> Words
      ctxTarget.globalAlpha = 0.9;
      ctxTarget.globalCompositeOperation = compos[compo];
      ctxTarget.drawImage(ctxWords.canvas,
          0, 0, ctxWords.canvas.width, ctxWords.canvas.height,
          0, 0, ctxTarget.canvas.width, ctxTarget.canvas.height
        );


      // Video
//      vidNoise.currentTime = counter % 250;
//      ctxTarget.globalAlpha = 0.5;
//      ctxTarget.globalCompositeOperation = compos[compo];
//      ctxTarget.drawImage(vidNoise,
//          0, 0, vidNoise.width, vidNoise.height,
//          0, 0, ctxTarget.canvas.width, ctxTarget.canvas.height
//        );

      //Image
      //~ ctxTarget.globalAlpha = 0.2;
      //~ ctxTarget.globalCompositeOperation = compos[compo];
      //~ ctxTarget.drawImage(ctxImage.canvas,
          //~ 0, 0, ctxImage.canvas.width, ctxImage.canvas.height,
          //~ 0, 0, ctxTarget.canvas.width, ctxTarget.canvas.height
        //~ );

      // Particle
      //~ ctxTarget.globalAlpha = 0.99;
      //~ ctxTarget.globalCompositeOperation = compos[compo];
      //~ ctxTarget.drawImage(ctxParts.canvas,
          //~ 0, 0, ctxParts.canvas.width, ctxParts.canvas.height,
          //~ 0, 0, ctxTarget.canvas.width, ctxTarget.canvas.height
        //~ );

      //~ // debug
      if (debug) {
        ctxTarget.globalAlpha = 1;
        ctxTarget.globalCompositeOperation = "source-over";
        ctxTarget.drawImage(ctxDebug.canvas,
          0, 0, ctxDebug.canvas.width, ctxDebug.canvas.height,
          0, 0, ctxTarget.canvas.width, ctxTarget.canvas.height
        );
        this.renderDebug(ctxTarget);
      }

      frameDuration = Date.now() - frameIn;

//      console.log("Buffer.width: ", ctxBuffer.canvas.width);

    },
    setTrans  : function(x, y){transX = x; transY = y;},
    setScale  : function(scale){
      var i, canvas;
      dimensions.scale = scale;
      for (i=0; canvas = scaler[i]; i++){
        try {
          canvas.doop.resize(dimensions.width * dimensions.scale, dimensions.height * dimensions.scale);
        } catch(e){
          console.log(canvas.doop.label, e);
        }
      }
      console.log("ANIMATOR.setScale", counter, r(dimensions.scale), frameDuration, "AVG:" + r(frameDurations.avg()));
      try {
//      transX = ctxBuffer.canvas.width/(2*transZ)  - ctxBuffer.canvas.width/2;
//      transY = ctxBuffer.canvas.height/(2*transZ) - ctxBuffer.canvas.height/2;
      } catch(e){}
//      console.log("ANIMATOR.setTrans(" + transX + ", " + transY + ")");
    },
    resize: function(){
      var size = DISPLAY.getSize();
      dimensions.scale  = 1;
      dimensions.width  = size.width;
      dimensions.height = size.height;
      dimensions.factor = dimensions.width / dimensions.height;
      this.setScale(dimensions.scale);
//      console.log("ANIMATOR.resize: ", size.width, size.height);
    },
    tick  : function(){

      frameIn = Date.now();

      ANIMATOR.render();

      counter       += 1;
      frameDuration  = Date.now() - frameIn;
      frameOffset    =  frameIn + interval - Date.now();
      frameDurations.push(frameDuration);
      frameAVGDuration = frameDurations.avg();

      if (frameAVGDuration > interval) {
        if (dimensions.scale > 0.3) {
          ANIMATOR.setScale(dimensions.scale * 0.96);
        }
      }

      if (frameOffset < 1) {frameOffset = 1;}

//      if (counter < 10) console.log("TICK: ", counter, interval, frameOffset, r(dimensions.scale));
      TIMER = setTimeout(ANIMATOR.tick, frameOffset);

    },
    renderDebug : function(ctxDebug){

      if (debug) {

        var i, lineheight = 12, padding = 4, line, txt = [
          counter +
            " I:"     + interval  +
            " D:"     + r(frameDuration) +
            " Avg:"   + r(frameAVGDuration) +
            " Lag:"   + r(frameOffset),
          " ",
          "Window: "    + dimensions.width + "x" + dimensions.height,
          "Projector: " + projector.width + "x" + projector.height,
          "Scale: "     + r(dimensions.scale),
          " ",
          "Compo: "     + compos[compo]
        ];

//        ctxDebug.canvas.width = ctxDebug.canvas.width;
        ctxDebug.fillStyle = "red";
        ctxDebug.font = "bold 12px sans-serif";
        ctxDebug.textAlign = "right";
//        ctxDebug.scale(dimensions.scale, dimensions.scale);

        ctxDebug.save();
        ctxDebug.translate(ctxDebug.canvas.width - padding, padding);
        for (i=0; line = txt[i]; i++){
          ctxDebug.fillText(line, 0, (i+1) * lineheight);
        }
        ctxDebug.restore();
        ctxDebug.translate(ctxDebug.canvas.width - padding, ctxDebug.canvas.height - padding);
        ctxDebug.fillText(TIMECODE.now() + " | " + TIMECODE.lapsed(), 0, 0);
//        ctxDebug.restore();


      }

    },

    create2dContext : function( identifier, size){
      var cav = document.createElement('canvas');
      cav.setAttribute('width',  size.width);
      cav.setAttribute('height', size.height);
      cav.doop = {
        label  : identifier,
        resize : function(width, height){
          cav.width  = width;
          cav.height = height;
        }
      };
      return cav.getContext("2d");
    }

  };

}();


var DISPLAY = function (){

  var elements = [], dimensions = {width: window.innerWidth, height: window.innerHeight};

  return {

    init      : function(){window.onresize = this.resize;},
    getSize   : function(){return dimensions;},
    register  : function(id, position, zorder){
      var item, el = document.getElementById(id);
      el.style.display = "block";
      el.style.position = "absolute";
      el.style.zIndex = zorder;
      item = {element:el, zorder: zorder, position: position};
      item.adjust = function(){DISPLAY.adjust(this)};
      item.adjust();
      elements.push(item);
    },
    adjust    : function(item){

      var min, element = item.element;

      switch(item.position){
        case "lower left":
          element.style.left   = "0px";
          element.style.bottom = "0px";
        break;
        case "upper left":
          element.style.left  = "0px";
          element.style.top   = "0px";
        break;
        case "upper right":
          element.style.right  = "0px";
          element.style.top    = "0px";
        break;
        case "center square":
          min = Math.min(dimensions.width, dimensions.height)
          element.style.width  = min + "px";
          element.style.height = min + "px";
          element.style.left   = (dimensions.width -  min) / 2 + "px"
          element.style.top    = (dimensions.height - min) / 2 + "px"
        break;
        case "full":
          element.style.width  = dimensions.width + "px";
          element.style.height = dimensions.height + "px";
          element.style.left   = "0px";
          element.style.top    = "0px";
        break;
      }

    },

    resize : function(){

      var i, item;

      dimensions = {width: window.innerWidth, height: window.innerHeight};

      elements.sort(function (el1, el2){
        return el1.zorder - el2.zorder;
      });

      for (i=0; item=elements[i]; i++){
        item.adjust();
      }
      ANIMATOR.resize(dimensions);
//      console.log("resized");
    }

  };

}()
