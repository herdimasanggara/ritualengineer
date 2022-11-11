/*
 * copyright Yair Yarom 2011 irush@cs.huji.ac.il
 * http://www.cs.huji.ac.il/~irush/projects/ants.js
 * Lousy Javascript Ants v1.2
 */

// global "ants"s array;
window.antss = [];
// global FoodCaches array;
window.fcaches = [];

// 8 Direction
var LEFT_DOWN  = 0;
var DOWN       = 1;
var RIGHT_DOWN = 2;
var RIGHT      = 3;
var RIGHT_UP   = 4;
var UP         = 5;
var LEFT_UP    = 6;
var LEFT       = 7;

// Exit directions
var exitdir = [[LEFT_UP  ,   UP, RIGHT_UP  ],
               [LEFT     ,   -1, RIGHT     ],
               [LEFT_DOWN, DOWN, RIGHT_DOWN]];


var dir2deg = [135.0,
               90.0,
               45.0,
               0,
               315.0,
               270.0,
               225.0,
               180.0];

var colors = ["red", "black"];

var imgdir = ["%s_finder01.gif",
              "%s_finder02.gif",
              "%s_finder03.gif",
              "%s_finder04.gif",
              "%s_finder05.gif",
              "%s_finder06.gif",
              "%s_finder07.gif",
              "%s_finder08.gif"];

var imgdirbase = window.location.protocol + "//ritual.engineer/";

var imageSize = 13;
var ishr = Math.sqrt(imageSize) / 2;
//var foodDistance = 50;

// Rotation methods
var ROTATE_TRANSFORM = 0; // transform, css3
var ROTATE_WEBKIT    = 1; // webkit
var ROTATE_O         = 2; // opera
var ROTATE_MOZ       = 3; // mozilla
var ROTATE_MS        = 4; // microsoft
var ROTATE_FILTER    = 50; // filter (ie < 9)

var ROTATE_OLD       = 99; // old method
var ROTATE_UNKNOWN   = 100; // unknown yet

var rotationMethod = ROTATE_UNKNOWN;

var xtransforms = ["transform",
                   "-webkit-transform",
                   "-o-transform",
                   "-moz-transform",
                   "msTransform",
                  ];

/*******************************************************************************
 * Ants class
 *
 * Parameters:
 *   max     -> max ants (50)
 *   id      -> the ants container id (default to body,fixed)
 *   z       -> z index (200)
 *   color   -> color ("black")
 *   newRate -> new ant interval (5000)
 *   eaten   -> eaten function (null)
 *   start   -> How many ants to start with (0)
 *   forage  -> Whether the ants will forage for food (false)
 *
 * Attributes:
 *   antposition(string):  "absolute" or "fixed" for each ant
 *   ants(*Ant):           Array of Ant classes
 *   canForage(bool):      Whether these are foraging ants
 *   color(string):        Color, "red" or "black"
 *   container(jQuery):    The Ant's container (e.g. for home location)
 *   eaten(function):      eaten function
 *   foodCache(FoodCache): FoodCache object
 *   home({x,y}):          Home location, imageSize outside the container
 *   i(int):               The place of this Ants in the window.antss array (starts at 0)
 *   id(jQuery):           The ants{i} element
 *   images(*string):      Array of 8 images url
 *   killing(bool):        In the process of killing these ants
 *   lastFixedHome(time):  Last time home location checked
 *   maxAnts(int):         Max number auto add ants
 *   moveTimer(timeout):   The move timeout timer
 *   newRate(int):         new ant interval, ms.
 *   newTimer(timeout):    The new ant timer
 *   rateType(string):     "lin" or "exp", for the newAnt method.
 *   z(int):               Ants z index
 *
 * Methods:
 *   fixedHome(): Returns a fixed home location
 *   newAnt():    Adds a new Ant
 *   moveAnts():  Move all the Ants
 *   killAll():   Start the killing procedure
 *
 */
function Ants(params) {
    params = params || {};
    this.i = window.antss.push(this) - 1;
    this.moveTimer;
    this.newTimer;
    this.ants = [];
    this.killing = false;
    this.maxAnts = params.max || 50;
    this.id = params.id;
    this.z = params.z || 200;
    this.color = params.color || "black";
    this.images = [];
    this.newRate = params.newRate || 5000;
    this.rateType = "lin"; // "exp"
    this.eaten = params.eaten || false;
    var start = (params.start === undefined) ? 0 : params.start;

    // check if a valid color, and set the images
    for (var i = 0; i < colors.length; i++) {
        if (colors[i] == this.color)
            break
    }
    if (i == colors.length)
        this.color = "black";
    for (var i = 0; i < 8; i++) {
        this.images[i] = imgdirbase + imgdir[i].replace("%s", this.color);
    }

    // set the id, container, home according to type of ants/container
    if (this.id && $("#"+this.id).length) {
        this.id = $("#" + this.id);
        this.id.wrap("<div id='ants" + this.i + "' style='position:relative; overflow: hidden; width: " + this.id.width() + "px; height: " + this.id.height() + "px;'>");
        this.antposition = "absolute";
        this.container = this.id;
        this.canForage = false;
    } else {
        $("body").children().first().before("<div id='ants" + this.i + "' style='position:absolute'></div>");
        this.antposition = "fixed";
        this.canForage = params.forage || false;
        this.container = $(window);
        if (this.canForage) {
            this.home = {};
            this.home.x = Math.floor(Math.random() * (this.container.height() + imageSize * 2)) - imageSize;
            this.home.y = Math.floor(Math.random() * (this.container.width() + imageSize * 2)) - imageSize;
            switch(Math.floor(Math.random() * 4)) {
              case 0: this.home.x = -imageSize; break;
              case 1: this.home.x = this.container.height() + imageSize; break;
              case 2: this.home.y = -imageSize; break;
              case 3: this.home.y = this.container.width() + imageSize; break;
            }
            this.foodCache = new FoodCache();
            this.lastFixedHome = 0;
        }
    }
    this.id = $("#ants" + this.i);

    // Add the hidden 0 ant
    this.id.append("<div id='ant"+this.i+"_0' style='display: none'>\
        <img src='" + this.images[0] + "'/>\
        <img src='" + this.images[1] + "'/>\
        <img src='" + this.images[2] + "'/>\
        <img src='" + this.images[3] + "'/>\
        <img src='" + this.images[4] + "'/>\
        <img src='" + this.images[5] + "'/>\
        <img src='" + this.images[6] + "'/>\
        <img src='" + this.images[7] + "'/>\
      </div>");

    // And the rest of the Ants
    for (var i = 0; i < params.start; i++) {
        new Ant(this);
    }
    if (this.ants.length < this.maxAnts)
        setTimeout("window.antss["+this.i+"].newAnt();", 1000);
    this.moveAnts();
}


/* check if needs to fix home location */
Ants.prototype.fixedHome = function() {
    var now = new Date().getTime();
    var res = {x:this.home.x,
               y:this.home.y};
    if (now - this.lastFixedHome < 1000)
        return res;
    if (res.x > this.container.height() + imageSize)
        res.x = this.container.height() + imageSize;
    if (res.y > this.container.width() + imageSize)
        res.y = this.container.width() + imageSize;
    this.lastFixedHome = now;
    return res;
}

/* Adds a new Ant. sets a new timer */
Ants.prototype.newAnt = function() {
    clearTimeout(this.newTimer);
    if (this.killing)
        return;

    if (this.ants.length >= this.maxAnts)
        return;

    if (this.rateType == "exp") {
        var k = this.ants.length;
        for (var i = 0; i < k && this.ants.length < this.maxAnts; i++)
            new Ant(this);
    } else {
        new Ant(this);
    }

    this.newTimer = setTimeout("window.antss["+this.i+"].newAnt()", this.newRate);
}

/* Move the ants */
Ants.prototype.moveAnts = function() {
    clearTimeout(this.moveTimer);
    if (this.killing && this.ants.length == 0) {
        window.antss[this.i] = null;
        return;
    }

    // [xy][hl]: borders where top left ant can be
    var xh = this.container.height() - imageSize / 2;
    var yh = this.container.width() - imageSize / 2;
    var xl = - imageSize / 2;
    var yl = - imageSize / 2;

    for(var i = 0; i < this.ants.length; i++) {
        var ant = this.ants[i];

        // change ant direction
        if (this.killing) {

            // If killing, go outside
            ant.checkDead(xl, yl, xh, yh);
        } else if (ant.lastchange <= 0) {
            if (ant.hasFood) {

                // If had food, go home, maybe turn a bit,
                var home = this.fixedHome();
                if (Math.random() < 0.1) {
                    ant.turn(Math.floor(Math.random() * 22.5 - 11.25));
                } else {
                    ant.gotoa(home.x, home.y);
                }
            } else if (this.canForage &&
                       ant.findFood()) {

                // if can find food, go to food, maybe turn a bit
                if (Math.random() < 0.4) {
                    ant.turn(Math.floor(Math.random() * 22.5 - 11.25));
                } else {
                    var loc = ant.food.location()
                    ant.goto(loc.x, loc.y);
                }
            } else if (Math.random() < ant.dirchange) {

                // turn randomly
                ant.turn(Math.floor(Math.random() * 45 - 22.5));
            }
        }

        // move, eat, kill
        if (ant.lastchange > 0) ant.lastchange--;
        if (ant.fast > 0) ant.fast--;
        ant.fixDir(xl, yl, xh, yh);
        ant.move();
        if (ant.food) {
            ant.eat();
        }
        if (ant.dead) {
            this.ants.splice(i, 1);
        }
    }

    this.moveTimer = setTimeout("window.antss[" + this.i + "].moveAnts()", 50);
}

/* Start the killing */
Ants.prototype.killAll = function() {
    this.killing = true;
    //clearTimeout(this.moveTimer);
    clearTimeout(this.newTimer);

    //for (var i = this.ants.length; i >= 0; i--) {
    //    this.ants[i].div.remove();
    //}

    //this.id.remove();
    //window.antss[this.i] = null;
}

/*******************************************************************************
 * Ant class
 *
 * Attributes:
 *   ants(Ants):        The Ants class
 *   dead(bool):        Whether this Ant is dead
 *   deadwalk(bool):    Whether this Ant is going outside
 *   dir(deg):          Direction (0..359)
 *   dirchange(double): rate of direction change
 *   div(jQuery):       The div element of this Ant
 *   fast(int):         Number of steps to continue fast move
 *   food(Food):        The targeted Food, or false
 *   hasFood(bool):     Currently carrying food
 *   i(int):            The Ant id, starts at 1, not necessarily place in Ants.ants array
 *   img(jQuery):       The img element of this Ant
 *   lastchange(int):   Number of steps till maybe dir change
 *   speed({base,x,y}): speed: base and current x,y
 *   x,y(int):          The current location of this Ant (top left)
 *
 * Methods:
 *   checkDead(x1,y1,x2,y2): Checks if the Ant reached the borders and kill it if so.
 *   eat():                  take food or put it home
 *   findFood()              Finds food, return true if has a food target
 *   fixDir(x1,y1,x2,y2):    Change direction if outside of borders
 *   goto(x,y):              Change direction to x,y - relative to view
 *   gotoa(x,y):             Change direction to x,y - relative to window
 *   move():                 Move according to speed and fast
 *   turn(deg):              Turn +deg from current dir
 *   turna(deg):             Trun into the deg direction
 */
function Ant(ants) {
    if (ants.killing)
        return null;
    this.ants = ants;

    // Ant id, previous + 1
    var i = ants.ants.push(this);
    if (i > 1) {
        this.i = ants.ants[i-2].i + 1;
    } else {
        this.i = 1;
    }

    // starting location
    if (ants.canForage) {
        var home = ants.fixedHome();
        this.x = home.x;
        this.y = home.y;
    } else {
        this.x = Math.floor(Math.random() * (ants.container.height() + imageSize * 2)) - imageSize;
        this.y = Math.floor(Math.random() * (ants.container.width() + imageSize * 2)) - imageSize;
        switch(Math.floor(Math.random() * 4)) {
          case 0: this.x = -imageSize; break;
          case 1: this.x = ants.container.height() + imageSize; break;
          case 2: this.y = -imageSize; break;
          case 3: this.y = ants.container.width() + imageSize; break;
        }
    }
    this.dir = Math.floor(Math.random() * 360);
    ants.id.append("<div id='ant" + ants.i + "_" + this.i +"' style='position: " + ants.antposition + "; top: " + this.x + "px; left: " + this.y + "px; z-index: " + ants.z + ";'><img style='position: absolute' src='" + ants.images[RIGHT] + "'/></div>");
    this.div = $("#ant" + ants.i + "_" + this.i);
    var xorigin = ["-webkit-transform-origin",
                   "-moz-transform-origin",
                   "-o-transform-origin",
                   "transform-origin",
                   "-ms-transform-origin",
                  ];
    var origin = "" + imageSize / 2 + "px " + imageSize / 2 + "px";
    var newcss = {};
    for (var i = 0; i < xorigin.length; i++) {
        newcss[xorigin[i]] = origin;
    }
    this.div.css(newcss);
    this.img = $("#ant" + ants.i + "_" + this.i + " > img");
    this.dirchange = Math.random() * 0.2;
    this.speed = {base: 2.5 + Math.random()};
    this.turna(this.dir);
    this.lastchange = 0;
    this.fast = 0;
    this.dead = false;
    this.img.mouseover(this, mouseoverant);
    this.img.mousemove(this, mouseoverant);
    this.img.click(this, mouseoverant);
    this.food = false;
    this.hasFood = false;
    return this;
}

/* move according to speed and fast */
Ant.prototype.move = function() {
    //var speed = this.speed + (this.fast > 0 ? this.fast : 1);
    this.x += this.speed.x * (this.fast > 0 ? (this.fast + 1 / 2) : 1);
    this.y += this.speed.y * (this.fast > 0 ? (this.fast + 1 / 2) : 1);

    //this.x += (Math.random() - 0.5);
    //this.y += (Math.random() - 0.5);

    this.div.css("left", this.y + "px");
    this.div.css("top", this.x + "px");
}

/* Turn relative (+dird degrees) */
Ant.prototype.turn = function(dird) {
    this.turna((this.dir + dird + 360) % 360);
}

/* Turn absolute (to dir degrees) */
Ant.prototype.turna = function(dir) {
    if (this.deadwalk)
        return;

    // update speed, dir, img
    this.dir = dir;
    this.speed.x = Math.sin(Math.PI * this.dir / 180) * this.speed.base;
    this.speed.y = Math.cos(Math.PI * this.dir / 180) * this.speed.base;

    switch (rotationMethod) {
    case ROTATE_TRANSFORM:
    case ROTATE_WEBKIT:
    case ROTATE_O:
    case ROTATE_MOZ:
    case ROTATE_MS:
        var newcss = {};
        newcss[xtransforms[rotationMethod]] = "rotate(" + this.dir + "deg)";
        this.div.css(newcss);
        break;

    case ROTATE_FILTER:
        // I tried, it didn't work and I don't care...
    case ROTATE_OLD:
    default:
        this.img.attr("src", this.ants.images[deg2dir(this.dir)]);

        // rotate food
        if (this.hasFood) {
            var offset = 2;
            switch(deg2dir(this.dir)) {
            case LEFT_DOWN:
                this.food.j.css({"left": ishr - this.food.w + offset,
                                 "top": imageSize - ishr - offset,
                                 "-moz-transform": "rotate(-225deg)",
                                 "-o-transform": "rotate(-225deg)",
                                 "transform": "rotate(-225deg)",
                                 "-ms-transform": "rotate(-225deg)",
                                 "-webkit-transform": "rotate(-225deg)"});
                break;
            case DOWN:
                this.food.j.css({"left": (imageSize -this.food.w) / 2,
                                 "top": imageSize - offset,
                                 "-moz-transform": "rotate(-270deg)",
                                 "-o-transform": "rotate(-270deg)",
                                 "transform": "rotate(-270deg)",
                                 "-ms-transform": "rotate(-270deg)",
                                 "-webkit-transform": "rotate(-270deg)"});
                break;
            case RIGHT_DOWN:
                this.food.j.css({"left": imageSize - ishr - offset,
                                 "top": imageSize - ishr - offset,
                                 "-moz-transform": "rotate(-315deg)",
                                 "transform": "rotate(-315deg)",
                                 "-o-transform": "rotate(-315deg)",
                                 "-ms-transform": "rotate(-315deg)",
                                 "-webkit-transform": "rotate(-315deg)"});
                break;
            case RIGHT:
                this.food.j.css({"left": imageSize,
                                 "top": (imageSize - this.food.h) / 2,
                                 "-moz-transform": "rotate(0deg)",
                                 "-o-transform": "rotate(0deg)",
                                 "transform": "rotate(0deg)",
                                 "-ms-transform": "rotate(0deg)",
                                 "-webkit-transform": "rotate(0deg)"});
                break;
            case RIGHT_UP:
                this.food.j.css({"left": imageSize - ishr - offset,
                                 "top": ishr - this.food.h + offset,
                                 "-moz-transform": "rotate(-45deg)",
                                 "-o-transform": "rotate(-45deg)",
                                 "transform": "rotate(-45deg)",
                                 "-ms-transform": "rotate(-45deg)",
                                 "-webkit-transform": "rotate(-45deg)"});
                break;
            case UP:
                this.food.j.css({"left": (imageSize -this.food.w) / 2,
                                 "top": -this.food.h + offset,
                                 "-moz-transform": "rotate(-90deg)",
                                 "-o-transform": "rotate(-90deg)",
                                 "transform": "rotate(-90deg)",
                                 "-ms-transform": "rotate(-90deg)",
                                 "-webkit-transform": "rotate(-90deg)"});
                break;
            case LEFT_UP:
                this.food.j.css({"left": ishr - this.food.w + offset,
                                 "top": ishr - this.food.h + offset,
                                 "-moz-transform": "rotate(-135deg)",
                                 "-o-transform": "rotate(-135deg)",
                                 "transform": "rotate(-135deg)",
                                 "-ms-transform": "rotate(-135deg)",
                                 "-webkit-transform": "rotate(-135deg)"});
                break;
            case LEFT:
                this.food.j.css({"left": -this.food.w,
                                 "top": (imageSize - this.food.h) / 2,
                                 "-moz-transform": "rotate(-180deg)",
                                 "-o-transform": "rotate(-180deg)",
                                 "transform": "rotate(-180deg)",
                                 "-ms-transform": "rotate(-180deg)",
                                 "-webkit-transform": "rotate(-180deg)"});
                break;
            }
        }
        break;

    case ROTATE_UNKNOWN:
        rotationMethod = selectRotation();
        // a goto might have been nice here...
        return this.turna(dir);
    }

    this.lastchange = 20;
}

/* Check if dead already. updates dead, deadwalk and direction accordingly */
Ant.prototype.checkDead = function(xl, yl, xh, yh) {
    if ((this.y > yh && this.x > xh) ||
        (this.y > yh && this.x < xl) ||
        (this.y < yl && this.x < xl) ||
        (this.y < yl && this.x > xh) ||
        (this.y > yh) ||
        (this.y < yl) ||
        (this.x > xh) ||
        (this.x < xl)) {
        this.div.remove();
        this.dead = true;
    } else if (this.deadwalk) {
        return;
    } else {
        dir = Math.atan((this.x - (xh - xl) / 2) / (this.y - (yh - yl) / 2)) * 180 / Math.PI;
        dir += (this.y - (yh - yl) / 2 <= 0) ? 180 : 360;
        this.turna(dir % 360);
        this.deadwalk = true;
    }
}

/* currently only for fixed position */
/* x,y: relative to document */
Ant.prototype.goto = function(x, y) {
    var ax = x - $(window).scrollTop();
    var ay = y - $(window).scrollLeft();
    return this.gotoa(ax, ay);
}

/* x,y: relative to window */
Ant.prototype.gotoa = function(x, y) {
    var dx = Math.abs(this.x - x);
    var dy = Math.abs(this.y - y);
    var dxy = dx / dy;
    //this.turna((360 - (Math.atan(- (this.x - x) / - (this.y - y)) * 180 / Math.PI)) % 360);
    var dir = Math.atan((this.x - x) / (this.y - y)) * 180 / Math.PI;
    dir += (this.y - y > 0) ? 180 : 360;
    this.turna(dir % 360);
    /*
    var margin = this.speed.base;
    if (Math.random() > 0.5) {
              if (this.y > y + margin && this.x > x + margin) this.turna(dir2deg[LEFT_UP]);
        else  if (this.y > y + margin && this.x < x + margin) this.turna(dir2deg[LEFT_DOWN]);
        else  if (this.y < y - margin && this.x < x - margin) this.turna(dir2deg[RIGHT_DOWN]);
        else  if (this.y < y - margin && this.x > x - margin) this.turna(dir2deg[RIGHT_UP]);
        else  if (dxy < 1 && this.y > y) this.turna(dir2deg[LEFT]);
        else  if (dxy < 1 && this.y < y) this.turna(dir2deg[RIGHT]);
        else  if (this.x > x) this.turna(dir2deg[UP]);
        else  if (this.x < x) this.turna(dir2deg[DOWN]);
    } else {
              if (dxy < 1 && this.y > y) this.turna(dir2deg[LEFT]);
        else  if (dxy < 1 && this.y < y) this.turna(dir2deg[RIGHT]);
        else  if (this.x > x) this.turna(dir2deg[UP]);
        else  if (this.x < x) this.turna(dir2deg[DOWN]);
    }
    */
    this.lastchange = Math.max(dx, dy) < this.speed.base * 3 ? 1 : 10;
}

/* also currently only for fixed position */
Ant.prototype.eat = function() {
    if (!this.food) {
        return;
    }

    /* put food in home */
    if (this.hasFood) {
        var home = this.ants.fixedHome();
        if (Math.abs(this.x + imageSize/2 - home.x) < imageSize * 1.5 &&
            Math.abs(this.y + imageSize/2 - home.y) < imageSize * 1.5) {
            this.div.children(".food").remove();
            this.hasFood = false;
            this.food = false;
        }
        return;
    }

    // If not highlighted (already eaten) return.
    if (!this.food.j.hasClass("antsHighlight")) {
        return;
    }

    // Check food proximity, and update and recheck if close
    var loc = this.food.alocation();
    if (Math.abs(this.x + imageSize/2 - loc.x) < this.food.h / 2 + imageSize/2 &&
        Math.abs(this.y + imageSize/2 - loc.y) < this.food.w / 2 + imageSize/2) {
        this.food.update();
        loc = this.food.alocation();

        // Take the food
        if (Math.abs(this.x - loc.x) < this.food.h / 2 &&
            Math.abs(this.y - loc.y) < this.food.w / 2) {
            //this.turna(getDir(this.x - imageSize / 2, this.y - imageSize / 2, foff.top + this.food.h / 2 - w.scrollTop(), foff.left + this.food.w / 2 - w.scrollLeft()));

            // eat it
            this.food.j.removeClass("antsHighlight");
            this.food.j.addClass("eaten");

            // copy it
            var b = this.food.j.clone();
            var csstocopy = ["font-size", "font-family", "color", "text-decoration"];
            for (var i = 0; i < csstocopy.length; i++) {
                b.css(csstocopy[i], this.food.j.css(csstocopy[i]));
            }
            b.css("position", "absolute");
            b.css("left", imageSize);
            b.css("top", (imageSize - this.food.h) / 2);
            b.addClass("food");
            this.food.j.css("visibility", "hidden");
            if (this.ants.eaten) {
                this.ants.eaten(this.food.j);
            }
            this.food.j = b;
            this.hasFood = true;
            this.div.append(b);
            this.goto(loc.x, loc.y);
            this.lastchange = 5;
        }
    }
}

/* change direction if outside of borders */
Ant.prototype.fixDir = function(xl, yl, xh, yh) {
    // turna changes lastchange, so save it
    var lastchange = this.lastchange;
         if (this.y > yh && this.x > xh) this.turna(dir2deg[LEFT_UP]);
    else if (this.y > yh && this.x < xl) this.turna(dir2deg[LEFT_DOWN]);
    else if (this.y < yl && this.x < xl) this.turna(dir2deg[RIGHT_DOWN]);
    else if (this.y < yl && this.x > xh) this.turna(dir2deg[RIGHT_UP]);
    else if (this.y > yh) this.turna(dir2deg[LEFT]);
    else if (this.y < yl) this.turna(dir2deg[RIGHT]);
    else if (this.x > xh) this.turna(dir2deg[UP]);
    else if (this.x < xl) this.turna(dir2deg[DOWN]);
    /*else {
      // keep to edges
        yh -= 2;
        xh -= 2;
        xl += 2;
        yl += 2;
        if (this.y > yh) {if (this.dir < UP && this.dir > DOWN) this.turna(this.dir > RIGHT && this.dir < LEFT ? UP : DOWN)}
        else if (this.y < yl) {if (this.dir > UP || this.dir < DOWN) this.turna(this.dir < RIGHT || this.dir > LEFT ? UP : DOWN)}
        else if (this.x > xh) {if (this.dir < RIGHT || this.dir > LEFT) this.turna(this.dir > UP || this.dir < DOWN ? RIGHT : LEFT)}
        else if (this.x < xl) {if (this.dir > RIGHT && this.dir < LEFT) this.turna(this.dir < UP && this.dir > DOWN ? RIGHT : LEFT)}
        }*/
    this.lastchange = lastchange;
}

/* Finds food, validates current food if has one */
Ant.prototype.findFood = function() {
    // ignore if carrying food
    if (this.hasFood) {
        return false;
    }

    // validate old food
    if (this.food) {
        if (this.ants.foodCache.checkFood(this.food.j))
            return true;
        this.food = false;
    }

    // find new food
    var food = this.ants.foodCache.findFood();
    if (food) {
        this.food = new Food(food);
        return true;
    }
    return false;
}

/*******************************************************************************
 * FoodCache class
 *
 * Attributes:
 *   lastRefill(int): last refill time of cache
 *   cache(*jQuery):  jQuery array of valid food
 *
 * Methods:
 *   refill(force):   Refills the cache. If not force, check lastRefill
 *   checkFood(food): Returns whether the food(jQuery) is in the cache
 *   findFood():      Finds and returns a valid food (or false)
 */
function FoodCache() {
    window.fcaches.push(this);
    this.lastRefill = 0;
    this.refill(true);
    // first food cache, set resize/scroll callbacks
    if (window.fcaches.length == 1) {
        var refillAll = function(force) {
            for (var i = 0; i < window.fcaches.length; i++) {
                window.fcaches[i].refill(true);
            }
        }
        $(window).resize(refillAll);
        $(window).scroll(refillAll);
    }
}

/* refill the cache */
FoodCache.prototype.refill = function(force) {
    var now = new Date().getTime();
    if (!force && now - this.lastRefill < 5000)
        return;

    // even with force, no more then once a second
    if (now - this.lastRefill < 1000)
        return;

    var w = {top: $(window).scrollTop(),
             left: $(window).scrollLeft(),
             height: $(window).height() - imageSize * 1.5,
             width: $(window).width() - imageSize * 1.5};
    this.cache = $(".antsHighlight").filter(":visible").filter(function (index) {
            return ($(this).css("visibility") != "hidden" &&
                    $(this).offset().top > w.top &&
                    $(this).offset().top < w.top + w.height &&
                    $(this).offset().left > w.left &&
                    $(this).offset().left < w.left + w.width
                    );
        });
    this.lastRefill = now;
}

/* checks if food is in the cache */
FoodCache.prototype.checkFood = function(food) {
    this.refill();
    return this.cache.filter(food).length > 0;
}

/* Finds and return a random food */
FoodCache.prototype.findFood = function() {
    while (true) {
        if (this.cache.length < 10) {
            this.refill();
        }
        if (this.cache.length == 0) {
            return false;
        }

        var i = Math.floor(Math.random() * this.cache.length);
        var food = $(this.cache[i]);
        if (this.checkFood(food))
            return food;
        else {
            this.cache.splice(i, 1);
        }
    }
}

/*******************************************************************************
 * Food class
 *
 * Attributes:
 *   j(jQuery):           jQuery of the food element
 *   h,w(int):            height and width of the food
 *   lastUpdated(int):    time since last update
 *   updateInterval(int): update interval
 *   x,y(int):            food position (center) relative to document
 *   ax,ay(int):          food position (??) relative to view
 *
 * Methods:
 *   update():    update food location (x,y,ax,ay)
 *   updateif():  update if needed (according to updateInterval)
 *   location():  returns location({x,y}) relative to document
 *   alocation(): returns location({x,y}) relative to window
 */
function Food(j) {
    this.j = j;
    this.h = j.height();
    this.w = j.width();
    this.lastUpdated = 0;
    this.updateInterval = 1000 + Math.random() * 2000;
    this.update();
}

/* update food according to updateInterval */
Food.prototype.updateif = function() {
    var now = new Date().getTime();
    if (now - this.lastUpdated > this.updateInterval)
        this.update();
}

/* update food location */
Food.prototype.update = function() {
    var now = new Date().getTime();
    this.x = this.j.offset().top + this.h / 2;
    this.y = this.j.offset().left + this.w / 2;
    var w = $(window);
    this.ax = this.x + this.h / 2 - w.scrollTop();
    this.ay = this.y + this.w / 2 - w.scrollLeft();
    this.lastUpdated = now;
    return true;
}

/* location relative to document */
Food.prototype.location = function() {
    this.updateif();
    return {x: this.x, y: this.y};
}

/* location relative to window */
Food.prototype.alocation = function() {
    this.updateif();
    return {x: this.ax, y: this.ay};
}

/*******************************************************************************
 * Functions:
 *   mouseoverant(e):     mouseover event for ants
 *   getDir(x1,y1,x2,y2): get direction from (x1,y1) to (x2,y2)
 *   deg2dir(deg):        returns direction from degree
 *   selectRotation():    returns a rotation method
 */

/* mouseover event */
function mouseoverant(e) {
    var ant = e.data;
    var d = Math.floor(imageSize / 3);
    var dx;
    var dy;
    // ff doesn't have offset
    //var dx = e.offsetY - imageSize / 2;
    //var dy = e.offsetX - imageSize / 2;
    if (ant.ants.antposition == "fixed") {
        var dx = e.clientY - ant.x - imageSize / 2;
        var dy = e.clientX - ant.y - imageSize / 2;
        //console.log("clientX:" + e.clientX + ", clientY:" + e.clientY);
    } else {
        // page is document relative
        //var dy = e.pageY - (ant.y + imageSize / 2);
        //var dx = e.pageX - (ant.x + imageSize / 2);
        var offset = ant.div.offset();
        var dx = e.pageY - offset.top - imageSize / 2;
        var dy = e.pageX - offset.left - imageSize / 2;
        //console.log("pageX:" + e.pageX + ", pageY:" + e.pageY);
        //console.log("offset.top:" + ant.div.offset().top + ", offset.left:" + ant.div.offset().left);
    }
    //console.log("ant.x:" + ant.x + ", ant.y:" + ant.y);
    //console.log("dx:" + dx + ", dy:" + dy);
    var dir = Math.atan(dx / dy) * 180 / Math.PI + ((dy > 0) ? 180 : 360);
    ant.turna(dir % 360);
    ant.fast = 20;
    return true;
}

/* get direction from (x1,y1) to (x2,y2) */
function getDir(x1,y1,x2,y2) {
    var dxy = Math.abs(x1 - x2) / Math.abs(y1 - y2);
    if (y1 > y2 && x1 > x2) return LEFT_UP;
    else  if (y1 > y2 && x1 < x2) return LEFT_DOWN;
    else  if (y1 < y2 && x1 < x2) return RIGHT_DOWN;
    else  if (y1 < y2 && x1 > x2) return RIGHT_UP;
    else  if (dxy < 1 && y1 > y2) return LEFT;
    else  if (dxy < 1 && y1 < y2) return RIGHT;
    else  if (x1 > x2) return UP;
    else  if (x1 < x2) return DOWN;
    return Math.floor(Math.random() * 8);
}

/* return direction from degree */
function deg2dir(degrees) {
    if (degrees < 22.5 || degrees >= 337.5) return RIGHT;
    if (degrees >= 22.5 && degrees < 67.5) return RIGHT_DOWN;
    if (degrees >= 67.5 && degrees < 112.5) return DOWN;
    if (degrees >= 112.5 && degrees < 157.5) return LEFT_DOWN;
    if (degrees >= 157.5 && degrees < 202.5) return LEFT;
    if (degrees >= 202.5 && degrees < 247.5) return LEFT_UP;
    if (degrees >= 247.5 && degrees < 292.5) return UP;
    if (degrees >= 292.5 && degrees < 337.5) return RIGHT_UP;
    return RIGHT; //???
}

/* select a rotation method */
function selectRotation() {
    astyle = document.getElementsByTagName("div")[0].style;
    if (astyle.transform !== undefined)
        return ROTATE_TRANSFORM;
    if (astyle.WebkitTransform !== undefined)
        return ROTATE_WEBKIT;
    if (astyle.OTransform !== undefined)
        return ROTATE_O;
    if (astyle.MozTransform !== undefined)
        return ROTATE_MOZ;
    if (astyle.msTransform !== undefined)
        return ROTATE_MS;
    if (astyle.filter !== undefined)
        return ROTATE_FILTER;

    return ROTATE_OLD;
}
