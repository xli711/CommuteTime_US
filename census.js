var overMap;
var censusModule;

function mouseEnter(e) {};

function mouseExit(e) {};

function mouseClick(e) {};

var _USData = {};
var _stateData = {};
var _latLonData = {};

var _USMapData = {};
var _stateMapData = {};

var _hover;

function hover() {
    return _hover;
}

function checkHover() {
    return (_hover != null);
}


function initializeCensus(apiKey) {
    // enable census module with api key
    var sdk = new CitySDK();
    censusModule = sdk.modules.census;
    censusModule.enable(apiKey);
    pixelDensity(1);

    // create a graphics layer to draw over the map
    overMap = createGraphics(width, height);
    overMap.style('display', 'block');
    overMap.position(0, 0);
    overMap.style('z-index', '99');
    overMap.style('pointer-events', 'none');

    overMap.clear = function() {
        this.elt.getContext('2d').clearRect(0, 0, this.width, this.height);
    }
}

function requestUSData(year, variable) {
    var request = {
        "level": "us",
        "sublevel": true,
        "variables": [
            variable
        ],
        "api": "acs5",
        "year": year
    }

    censusModule.APIRequest(request, function(response) {
        var formattedData = {};
        response.data.forEach(function(value, idx, array) {
            formattedData[value.name] = Number(value[variable]);
        });
        _USData[year + variable] = formattedData;
    });
}

function requestStateData(state, year, variable) {
    var request = {
        "level": "state",
        "state": state,
        "sublevel": true,
        "variables": [
            variable
        ],
        "api": "acs5",
        "year": year
    }

    censusModule.APIRequest(request, function(response) {
        var formattedData = {};
        response.data.forEach(function(value, idx, array) {
            // get the county name without the state
            var ctyAndState = split(value.name, ',');
            formattedData[ctyAndState[0]] = Number(value[
                variable]);
        });
        _stateData[state + year + variable] = formattedData;
    });
}

function requestLatLonData(lat, lon, year, variable) {
    var request = {
        "level": "blockGroup",
        "lat": lat,
        "lng": lon,
        "variables": [
            variable
        ],
        "api": "acs5",
        "year": year
    }

    censusModule.APIRequest(request, function(response) {
        _latLonData[lat + "_" + lon + "_" + year + variable] = Number(
            response.data[0][variable]);
    });
}

function USDataIsReady(year, variable) {
    return (_USData[year + variable] != null && _USData[year + variable] !=
        false);
}

function stateDataIsReady(state, year, variable) {
    return (_stateData[state + year + variable] != null &&
        _stateData[state + year + variable] != false);
}

function latLonDataIsReady(lat, lon, year, variable) {
    var id = lat + "_" + lon + "_" + year + variable;
    return (_latLonData[id] != null && _latLonData[id] != false);
}

function getUSData(year, variable) {
    return _USData[year + variable];
}

function getStateData(state, year, variable) {
    return _stateData[state + year + variable];
}

function getLatLonData(lat, lon, year, variable) {
    return _latLonData[lat + "_" + lon + "_" + year + variable];
}

function requestUSMap() {
    var request = {
        "level": "us",
        "sublevel": true
    }

    censusModule.GEORequest(request, function(response) {
        _USMapData['US'] = response;
    });
}

function requestStateMap(state) {
    var request = {
        "level": "state",
        "state": state,
        "sublevel": true
    }

    censusModule.GEORequest(request, function(response) {
        _stateMapData[state] = response;
    });
}

function USMapIsReady() {
    return (_USMapData['US'] != null && _USMapData['US'] != false);
}

function stateMapIsReady(state) {
    return (_stateMapData[state] != null &&
        _stateMapData[state] != false);
}

function createUSMap(x, y, w, h) {
    return new Map('', x, y, w, h);
}

function createStateMap(state, x, y, w, h) {
    return new Map(state, x, y, w, h);
}

function Map(state, x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.xTranslate = 0;
    this.yTranslate = 0;
    this.scaleVal = 1;

    this.hover = null;

    if (state.length > 0) {
        this.data = _stateMapData[state];
        this.level = "state";
    } else {
        this.data = _USMapData['US'];
        this.level = "us";
    }

    if (this.level == "state") {
        this.getCountyNames = function() {
            return this.data.features.map(function(d) {
                return d.properties.NAME;
            })
        }
    } else if (this.level == "us") {
        this.getStateNames = function() {
            return this.data.features.map(function(d) {
                return d.properties.BASENAME;
            })
        }
    }

    var canvas = d3.select('#defaultCanvas0').node().getBoundingClientRect();

    var height = this.h,
        width = this.w,
        top = this.y + canvas.top,
        left = this.x + canvas.left;

    d3.select('.svg-' + state + x + y + w + h).remove();

    this.svg = d3.select('body')
        .append('svg')
        .attr('class', 'svg-' + state + x + y + w + h)
        .attr('height', height)
        .attr('width', width)
        .style('position', 'absolute')
        .style('left', left)
        .style('top', top)
        .style('display', 'none')
        .style('overflow', 'visible');

    if (this.level == 'state' && state == 'AK') {
        var projection = d3.geoAlbersUsa()
            .fitSize([width, height], this.data)
    } else if (this.level == 'state') {
        var projection = d3.geoMercator()
            .fitSize([width, height], this.data);
    } else if (this.level == 'us') {
        var projection = d3.geoAlbersUsa()
            .fitSize([width, height], this.data);
    }

    var path = d3.geoPath()
        .projection(projection);

    this.projection = projection;

    var self = this;

    this._mapObj = this.svg.selectAll('path')
        .data(this.data.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', function(d) {
            return d.properties.NAME.toLowerCase().split(' ').join('-');
        })
        .on('mouseenter', function(d) {
            var el = (self.level == 'state') ? d.properties.NAME : d.properties
                .BASENAME;

            mouseEnter(el);
        })
        .on('mouseout', function(d) {
            var el = (self.level == 'state') ? d.properties.NAME : d.properties
                .BASENAME;

            mouseLeave(el);
        })
        .on('click', function(d) {
            var el = (self.level == 'state') ? d.properties.NAME : d.properties
                .BASENAME;

            mouseClick(el);
        })
        .style('fill', '#ddd')
        .style('stroke', '#fff');
}

Map.prototype.show = function() {
    this.svg.style('display', 'block');
}

Map.prototype.hide = function() {
    this.svg.style('display', 'none');
}

Map.prototype.latLonToXY = function(lat, lon) {
    // D3 likes this stuff backwards for some reason
    var arr = [lon, lat];

    var results = this.projection(arr);

    return {
        x: results[0]*this.scaleVal + (this.x + this.xTranslate),
        y: results[1]*this.scaleVal + (this.y + this.yTranslate)
    }
}

Map.prototype.fill = function(region, c) {
    this._mapObj.filter('.' + region.toLowerCase().split(' ').join('-'))
        .style('fill', c);
    this._mapObj.filter('.' + region.toLowerCase().split(' ').join('-'))
        .style('fill-opacity', alpha(color(c)));
}

Map.prototype.noFill = function(region) {
    this._mapObj.filter('.' + region.toLowerCase().split(' ').join('-'))
        .style('fill-opacity', 0.0);
}

Map.prototype.stroke = function(region, c) {
    this._mapObj.filter('.' + region.toLowerCase().split(' ').join('-'))
        .style('stroke', c);
    this._mapObj.filter('.' + region.toLowerCase().split(' ').join('-'))
        .style('stroke-opacity', alpha(color(c)));
}

Map.prototype.noStroke = function(region) {
    this._mapObj.filter('.' + region.toLowerCase().split(' ').join('-'))
        .style('stroke-opacity', 0.0);
}

Map.prototype.scale = function(scale) {
    this.scaleVal *= scale;
    var xTranslate = this.xTranslate,
        yTranslate = this.yTranslate,
        scaleVal = this.scaleVal;
    this._mapObj.each(function(d, i) {
        d3.select(this).attr('transform', 'translate(' + xTranslate +
            ', ' + yTranslate + ') scale(' + scaleVal + ')');
    })
}

Map.prototype.moveX = function(x) {
    this.xTranslate += x;
    console.log(this.xTranslate);
    var xTranslate = this.xTranslate,
        yTranslate = this.yTranslate,
        scaleVal = this.scaleVal;
    this._mapObj.each(function(d, i) {
        d3.select(this).attr('transform', 'translate(' + xTranslate +
            ', ' + yTranslate + ') scale(' + scaleVal + ')');
    })
}

Map.prototype.moveY = function(y) {
    this.yTranslate += y;
    var xTranslate = this.xTranslate,
        yTranslate = this.yTranslate,
        scaleVal = this.scaleVal;
    this._mapObj.each(function(d, i) {
        d3.select(this).attr('transform', 'translate(' + xTranslate +
            ', ' + yTranslate + ') scale(' + scaleVal + ')');
    })
}