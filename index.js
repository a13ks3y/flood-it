var global = window;

global._DEBUG_ = false;

var MAP_SIZE = 21;

function rand( min, max ) {	
    if( max ) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
        return Math.floor(Math.random() * (min + 1));
    }
}

var randomItemFromArray = function(arr){
    return arr[rand(0, arr.length - 1)];
}

var get = function(val, path, default_result){
    var propNames;
    if(path instanceof Array){
        propNames = path;
    }else{
        path = String(path);
        propNames = path.split('.');
    }
    if(default_result === undefined){
        default_result = null;
    }

    return (function getProp(val, propNames, i){
        var result = default_result;
        if(val != undefined && val[propNames[i]] != undefined){
            result = val[propNames[i]];
        }
        if(i == propNames.length -1){
            return result;
        }else{
            return getProp(result, propNames, i+1);
        }
    })(val, propNames, 0);
};
global.get = get;


var loop = function(callback, iterations, delay, finished){
    callback = callback || function(){};
    finished = finished || function(){};
    iterations = iterations || 0;
    delay = delay || 0;

    var i = 0;
    (function _loop(iterations, i, delay){
        setTimeout(function(){
            callback();
            if(i<iterations){
                _loop(iterations, i+1, delay);
            }else{
                finished();
            }
        }, delay);
    })(iterations, i, delay);
};



var Cell = (function(){
    /**
     *
     * @param c column
     * @param r row
     * @param t type
     * @constructor
     */
    var Cell = function(c, r, t, isCenter){
        this.c = c;
        this.r = r;
        this.type = t;
        this.isOwned = false;
        this.isCenter = isCenter || false;
    };
    Cell.CELL_TYPES = [0,1,2, 3, 4, 5];

    Cell.CELL_COLORS = [
        'f00',
        '00f',
        '0f0',
        'ff0',
        '0ff',
        'f90'
    ];

    Cell.CELL_SIZE = 32;

    Cell.prototype = {
        getColor : function(){
            return  '#' + get(Cell.CELL_COLORS, this.type, 'fff');
        },

        getRect : function(xOffset, yOffset, zoom){
            zoom = parseInt(zoom) || 100;
            var fZoom = zoom / 100;

            xOffset = xOffset || 0;
            yOffset = yOffset || 0;

            var cellSize = Math.floor(Cell.CELL_SIZE * fZoom);

            var rect = {
                x : (this.c * cellSize) + xOffset,
                y : (this.r * cellSize) + yOffset,
                w : cellSize,
                h : cellSize
            };

            return rect;

        },

        render : function(ctx, xOffset, yOffset, zoom){
            var rect = this.getRect(xOffset, yOffset, zoom);
            if(ctx){
                ctx.fillStyle = this.getColor();
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
                if(this.isOwned){
                    //this._renderIsOwned(ctx, rect);
                }
                if (this.isCenter) {
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / Math.E, 0, Math.PI * 2);
                    ctx.fill();
                }

                if(global._DEBUG_){
                    this._renderCoordinates(ctx, rect);
                }
            }
        },

        _renderIsOwned : function(ctx, rect){
            var size = Cell.CELL_SIZE ;//Math.floor(Cell.CELL_SIZE / 4);
            var padding = Math.floor((Cell.CELL_SIZE - size) / 2);
            ctx.fillStyle = 'rgba(0,0,1,0.5)';
            ctx.fillRect(rect.x + padding, rect.y + padding, size, size);
            //ctx.strokeStyle = 'rgba(1,0,1,0.5)';
            //ctx.lineWidth = 1;
            //ctx.lineCap = 'square';
            //ctx.strokeRect(rect.x + padding, rect.y + padding, size, size);
        },

        _renderCoordinates : function(ctx, rect){
            ctx.fillStyle = '#fff';
            ctx.font = "20px Arial";
            ctx.fillText(this.c + ':' + this.r, rect.x + 20, rect.y + 40);
        }

    };

    return Cell;
})();

var Map = (function(){
    var Map = function(columns, rows, callback){
        this.cells = [];
        this.columns = columns;
        this.rows = rows;
        this.initCells(callback);
    };

    Map.prototype = {
        initCells : function(callback){
            this.cells = [];
            for (var c = 0; c < this.columns + 1; c++) {
                this.cells.push([]);
                for (var r = 0; r < this.rows + 1; r++) {
                    this.cells[c][r] = callback(c, r);
                }
            }
        },

        /**
         * iterate all cells
         * @param callback {function(c, r, cell)}
         */
        forEach : function(callback){
            for (var c = 0; c < this.columns; c++) {
                this.cells.push();
                for (var r = 0; r < this.rows; r++) {
                    var result = callback(c, r, this.cells[c][r]);
                    if(result === false){
                        break;
                    }
                }
            }
        }
    };

    return Map;
})();

var Timer = (function(){
    var Timer = function(callback, interval, startNow){
        startNow = !!startNow;
        this._id = null;
        this._interval = parseInt(interval) || 1000;
        this.callback = callback || function(){};
        this.callback._timer = this;
        if(startNow){
            this.start();
        }
    };

    Timer.prototype = {
        start : function(){
            this._id = setInterval(this.callback, this._interval);
        },
        stop  : function(){
            if(this._id != null){
                clearInterval(this._id);
            }
        },
        setInterval : function(interval){
            this._interval = parseInt(interval) || 1000;
        },
        restart : function(){
            this.stop();
            this.start();
        },
        destroy : function(){
            this.stop();
            if(this.callback){
                delete this.callback._timer
                delete this.callback;
            }
        }
    };

    return Timer;
})();
global.Timer = Timer;


//todo fix this (http://blogs.sitepointstatic.com/examples/tech/canvas/canvas.html)
var raindrop = function(ctx, x, y){
    // start animation

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    setInterval(function() {
        var	x = x,
                y = y,
                e = 20 + Math.round(Math.random()*30),
                s = 0;
        (function renderRainDrop() {
            s++;
            if (s <= e) {
                setTimeout(renderRainDrop,s);
                var c = 255-(e-s)*3;
                ctx.strokeStyle = "rgb("+c+","+c+","+c+")";
                ctx.beginPath();
                ctx.arc(x,y,s,0,Math.PI*2,true);
                ctx.fill();
                ctx.stroke();
            }
        })();
    },100);
};
window.raindrop = raindrop;






var ToOneColor = (function(){
    var ToOneColor = function(){
        this.zoom = 100;
        this.levelFinished = false;
    };

    ToOneColor.prototype = {
        initialize : function(canvasElement){
            this.canvas = canvasElement;
            this.ctx = canvasElement.getContext('2d');
            this.renderTimer = new Timer(this.render.bind(this), 24);
            this.canvas.onclick = this.onCanvasClick.bind(this);
            this.canvas.onmousemove = this.onCanvasMouseMove.bind(this);
            this.canvas.width = MAP_SIZE * Cell.CELL_SIZE;
            this.canvas.height = MAP_SIZE * Cell.CELL_SIZE;

            this.selectedType = null;
        },

        initMap : function(centerCellType){
            centerCellType = centerCellType || randomItemFromArray(Cell.CELL_TYPES);
            var mapColumns = MAP_SIZE;
            var mapRows = MAP_SIZE;
            this.map = new Map(mapColumns, mapRows, function(c,r){
                var type = (c==Math.floor((mapColumns)/2) && r == Math.floor((mapRows)/2)) ? centerCellType : randomItemFromArray(Cell.CELL_TYPES);
                return new Cell(c,r, type);
            });
            var centerCell = this.getCenterCell();
            centerCell.isCenter = true;
            centerCell.isOwned = true;
            //this.render();
        },

        centerMap : function(){
            var fZoom = this.zoom / 100;

            var cellSize = Math.floor(Cell.CELL_SIZE * fZoom);
            var w = this.canvas.width;
            var h = this.canvas.height;
            var mw = this.map.columns * cellSize;
            var mh = this.map.rows * cellSize;



            return {
                xOffset : Math.floor((w - mw) / 2),
                yOffset : Math.floor((h - mh) / 2)
            }
        },


        getCenterCell : function(){
            var c = Math.floor(this.map.columns / 2);
            var r = Math.floor(this.map.rows / 2);
            return this.map.cells[c][r];
        },

        getCellByXY : function(x, y){
            var mapOffset = this.centerMap();
            var x = x - mapOffset.xOffset;
            var y = y - mapOffset.yOffset;

            var zoom = this.zoom || 100;
            var fZoom = zoom / 100;
            var cellSize = Math.floor(Cell.CELL_SIZE * fZoom);

            var c = Math.floor(x / cellSize);
            var r = Math.floor(y / cellSize);
            if(this.map.cells[c]){
                return this.map.cells[c][r];
            }
        },

        nextLevel : function(){
            this.zoom += 1000;
            var type = this.map.cells[0][0].type;
            this.initMap(type);
            loop(function(){
                this.zoom -= 10;
            }.bind(this), 99, 24, function(){
                this.levelFinished = false;
                //todo unlock ui
            }.bind(this));
        },

        render : function(){

            var atLeastOneFreeCell = false;

            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height);

            this.map.forEach(function( c, r, cell){
                var mapOffset = this.centerMap();
                cell.render(this.ctx, mapOffset.xOffset, mapOffset.yOffset, this.zoom);
                if(!cell.isOwned){
                    atLeastOneFreeCell = true;
                }
            }.bind(this));



            if(this.selectedType){
                this.renderSelectedType(this.zoom);
            }
            if(this.mouseOverCell && global._DEBUG_){

                this.ctx.fillStyle = '#000';
                this.ctx.font = "20px Arial";

                this.ctx.fillText("c: " + this.mouseOverCell.c + " r: " + this.mouseOverCell.r, 12, this.canvas.height - 20);

            }

            if(!atLeastOneFreeCell) {
                this.levelFinished = true;
            }

        },

        renderSelectedType : function(zoom){
            return;
            zoom = zoom || 100;
            var fZoom = zoom / 100;
            var cellSize = Math.floor(Cell.CELL_SIZE * fZoom);

            this.ctx.fillStyle = "#" + get(Cell.CELL_COLORS, this.selectedType, 'fff');
            this.ctx.fillRect(12,12, cellSize, cellSize);

        },

        start : function(){
            this.initMap();
            this.renderTimer.start();
        },
        stop : function(){
            this.renderTimer.stop();
        },

        /**
         * Game step
         * @param selectedType type of cell, that user clicked.
         */
        step : function(selectedType){

            if(this.levelFinished){
                // todo prevent double click
                this.nextLevel();
                return;
            }

            this.selectedType = selectedType;

            global._checkedCells = {};


            this.map.forEach(function(c,r, cell){
                if(cell.isOwned) {
                    cell.type = selectedType;
                }
            });

            var checkCell = function(cell){
                if(!cell){
                    return;
                }

                if(global._checkedCells[cell.c + '_' + cell.r]){
                    return;
                }

                var c = cell.c;
                var r = cell.r;

                if(cell.type == selectedType){
                    cell.isOwned = true;
                }


                var neighbors = [];
                neighbors.push(get(this.map.cells, [c-1, r])); // left
                neighbors.push(get(this.map.cells, [c+1, r])); // right
                neighbors.push(get(this.map.cells, [c, r-1])); // top
                neighbors.push(get(this.map.cells, [c, r+1])); // bottom

                global._checkedCells[cell.c + '_' + cell.r] = {cell:cell, neighbors:neighbors};

                for (var i = 0; i < neighbors.length; i++) {
                    var neighbor = neighbors[i];
                    if(neighbor){
                        if(neighbor.type == selectedType){
                            checkCell(neighbor);
                        }
                    }
                }


            }.bind(this);

            var cell = this.getCenterCell();
            checkCell(cell);

            this.render();

        },

        /*
            * Event Handlers
            */
        onCanvasClick : function(event){
            var x = event.offsetX;
            var y = event.offsetY;
            var cell = this.getCellByXY(x, y);
            if(cell){
                var type = cell.type;
                this.step(type);
            }
        },
        onCanvasMouseMove : function(event){
            var x = event.offsetX;
            var y = event.offsetY;
            var cell = this.getCellByXY(x, y);
            if(cell){
                this.mouseOverCell = cell;
            }
        }
    };

    return ToOneColor;
})();

var toOneColor = new ToOneColor();
global.toOneColor = toOneColor;
toOneColor.initialize(document.getElementById('main-canvas'));
toOneColor.start();
