



//--------------- S T U F F   ------------------------------

//Function.prototype.bind = function(scope) {var _function = this; return function() {return _function.apply(scope, arguments);}}

function $(id)               { return document.getElementById(id);}
function sgn (v)             { return (v < 0) ? -1 : 1;}
function mulString(s, count) { var out = ""; for (var i=0; i<count; i++){out += s;} return out;}  // multiple copies of s
function rndPick  (a)        { return a[Math.floor(Math.random() * a.length)];}                    // pick random item from array
function rndSpread(n)        { return (Math.random() * 2 -1) * n;}
function dampTo(value, target, damp) { if (value == target){return target;} else {return (value - target) / damp + target;}}
function oAttrs(o)           { var a, out = ""; for (a in o){ out += a + " ";} return trim(out);}
function oLength(o)          { var a, i = 0; for (a in o){ i++;} return i;}
function trim (str)          { return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');}
function escTags(msg)        { return msg.replace(/</g, '&lt;').replace(/>/g, '&gt;');}

function pad(number, length) {
  var str = '' + number;
  while (str.length < length) {
    str = '0' + str;
  } return str;
}

function extend(target, source){
  for (var p in source){
    if (typeof source[p] === "function") {
      target[p] = source[p];
    }
  }
}

function getWinsize(){

  if (self.innerWidth) {
    winW = self.innerWidth;
    winH = self.innerHeight;
  } else if (document.documentElement && document.documentElement.clientWidth) {
    winW = document.documentElement.clientWidth;
    winH = document.documentElement.clientHeight;
  } else if (document.body) {
    winW = document.body.clientWidth;
    winH = document.body.clientHeight;
  }
  canvWidth  = winW;
  canvHeight = winH;
}

function clone(o) {
  function c(o) {
    for (var i in o) {
      if (typeof o[i] == "object") {
        this[i] = clone(o[i]);
      } else {
      this[i] = o[i];
      }
    }
  }
  return new c(o);
}

function copyInto(target, source) {
  for (var p in source){
    target[p] = source[p];
  }
  return target;
}


function angle(x,y){//the strangest of functions

	var angle = 0;

  if (x == 0 && y == 0) {return 0;}

	if(x < 0){angle += Math.PI;}
	if(y < 0){y = -y; x =- x;}
	angle += Math.atan(y/x);
	return angle;
}

function r(n, l) {
  var out, i;
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
}   // rount to l digits


function sign(x1, y1, x2, y2, x3, y3){
  return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
}

function isPointInTriangle(px, py, x1, y1, x2, y2, x3, y3)
{
  var b1, b2, b3;

  b1 = sign(px, py, x1, y1, x2, y2) < 0;
  b2 = sign(px, py, x2, y2, x3, y3) < 0;
  b3 = sign(px, py, x3, y3, x1, y1) < 0;

  return ((b1 == b2) && (b2 == b3));
}

function isInDiamond(x, y, dx, dy, px, py){

  if (isPointInTriangle(px, py, x, y, x + dx, y, x, y - dy)) {return true;} // ur
  if (isPointInTriangle(px, py, x, y, x + dx, y, x, y + dy)) {return true;} // lr
  if (isPointInTriangle(px, py, x, y, x - dx, y, x, y + dy)) {return true;} // ll
  if (isPointInTriangle(px, py, x, y, x - dx, y, x, y - dy)) {return true;} // ul
  return false;
}

function cross(v1, v2) {
    return v1.x * v2.y - v2.x * v1.y;
}

function doIntersect(s1x1, s1y1, s1x2, s1y2, s2x1, s2y1, s2x2, s2y2) {

  var p, r, q, s, t, u, rCrossS, epsilon = 10e-6;
  var s1p1, s1p2, s2p1, s2p2;

    s1p1 = new vec(s1x1, s1y1);
    s1p2 = new vec(s1x2, s1y2);
    s2p1 = new vec(s2x1, s2y1);
    s2p2 = new vec(s2x2, s2y2);

    p = s1p1;
    r = s1p2.subtract(s1p1);
    q = s2p1;
    s = s2p2.subtract(s2p1);


    rCrossS = cross(r, s);

    if(rCrossS <= epsilon && rCrossS >= -1 * epsilon){
      s1p1 = null; s1p2 = null; s2p1 = null; s2p2 = null; p = null; r = null; q = null; s = null;
      return false;
    }

    t = cross(q.subtract(p), s) / rCrossS;
    u = cross(q.subtract(p), r) / rCrossS;

    if(0 <= u && u <= 1 && 0 <= t && t <= 1){
      s1p1 = null; s1p2 = null; s2p1 = null; s2p2 = null; p = null; r = null; q = null; s = null;
      return true;
    } else {
      s1p1 = null; s1p2 = null; s2p1 = null; s2p2 = null; p = null; r = null; q = null; s = null;
      return false;
    }
}


function vec(x, y){

  this.x = x;
  this.y = y;

  this.scalarMult = function(scalar){
      return new vec(this.x * scalar, this.y * scalar);
  };
  this.dot = function(v2) {
    return this.x * v2.x + this.y * v2.y;
  };
  this.perp = function() {
    return new vec(-1 * this.y, this.x);
  };
  this.subtract = function(v2) {
    return this.add(v2.scalarMult(-1)); //new Vector(this.x - v2.x, this.y - v2.y);
  };
  this.add = function(v2) {
      return new vec(this.x + v2.x, this.y + v2.y);
  };
}

function isOnSharkCollision(s1, s2){

  var s1x1, s1y1, s1x2, s1y2, s2x1, s2y1, s2x2, s2y2, speed, b;

  speed = Math.sqrt(s1.vx * s1.vx + s1.vy * s1.vy);

  s1x1 = s1.x;
  s1y1 = s1.y;
  s1x2 = s1.x + s1.smellDistance * s1.vx / speed;
  s1y2 = s1.y + s1.smellDistance * s1.vy / speed;

  // vertical

  s2x1 = s2.x;
  s2y1 = s2.y - s2.h;
  s2x2 = s2.x;
  s2y2 = s2.y + s2.h;

  b = doIntersect(s1x1, s1y1, s1x2, s1y2, s2x1, s2y1, s2x2, s2y2);

  if(b) {return true;}

// horzontal

  s2x1 = s2.x - s2.w >> 1;
  s2y1 = s2.y;
  s2x2 = s2.x + s2.w >> 1;
  s2y2 = s2.y;

  b = doIntersect(s1x1, s1y1, s1x2, s1y2, s2x1, s2y1, s2x2, s2y2);

  if(b) {return true;}

  return false;
}

