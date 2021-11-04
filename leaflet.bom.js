/**
  * Leaflet.BOM
  * A JavaScript library for using BOM's layers and data for leaflet based maps.
  * Project page: https://github.com/Luen/
  * Save to KML requires tokml.js, Save to GPX requires togpx.js
  * License: CC0 (Creative Commons Zero), see https://creativecommons.org/publicdomain/zero/1.0/
  */

var coeff = 1000 * 60 * 10; // every 10 min
var wait = 5; // BOM image isn't available straight away so wait 5 min.
var timeout = 500; // frame change every 3 secs
var frameCount = 10; // 6 instances of images shown on bom site
var run = true;
var radarLayers = [];
var times = [];
var info;
L.TileLayer.bomRadar = L.TileLayer.extend({
	options: {
    //maxNativeZoom: 10,
		//baseUrl: "https://api.weather.bom.gov.au/v1/rainradar/tiles/{time}/{z}/{x}/{y}.png",
		attribution: 'Weather from <a href="https://weather.bom.gov.au/">BOM</a>'
	},
  onAdd: function(map) {

    /*const radarLocations = [[-35.661387, 149.512229],[-33.700764, 151.209470],[-29.620633, 152.963328],[-29.496994, 149.850825],[-31.024219, 150.192037],[-32.729802, 152.025422],[-29.038524, 167.941679],[-35.158170, 147.456307],[-34.262389, 150.875099],[-37.855210, 144.755512],[-34.234354, 142.086133],[-37.887532, 147.575475],[-35.990000, 142.010000],[-36.029663, 146.022772],[-19.885737, 148.075693],[-27.717739, 153.240015],[-16.818145, 145.662895],[-23.549558, 148.239166],[-23.855056, 151.262567],[-25.957342, 152.576898],[-23.439783, 144.282270],[-21.117243, 149.217213],[-27.606344, 152.540084],[-16.670000, 139.170000],[-20.711204, 139.555281],[-19.419800, 146.550974],[-26.440193, 147.349130],[-12.666413, 141.924640],[-16.287199, 149.964539],[-34.617016, 138.468782],[-43.112593, 147.805241],[-41.179147, 145.579986],[-23.795064, 133.888935],[-12.455933, 130.926599],[-12.274995, 136.819911],[-14.510918, 132.447010],[-11.648500, 133.379977],[-34.941838, 117.816370],[-17.948234, 122.235334],[-24.887978, 113.669386],[-20.653613, 116.683144],[-31.777795, 117.952768],[-33.830150, 121.891734],[-28.804648, 114.697349],[-25.033225, 128.301756],[-30.784261, 121.454814],[-22.103197, 113.999698],[-33.096956, 119.008796],[-32.391761, 115.866955],[-20.371845, 118.631670],[-30.358887, 116.305769],[-15.451711, 128.120856],[-35.329531, 138.502498],[-32.129823, 133.696361],[-37.747713, 140.774605],[-31.155811, 136.804400],[-18.228916, 127.662836],[-29.96, 146.81]];
    for (i = 0; i < radarLocations.length; i++) {
      L.circle(radarLocations[i]).bindTooltip("Radar location").addTo(map);
    }*/

    // Setup
    run = true;
    for (i = 0; i < frameCount; i++) {
    	var time = getRadarTime(i);
      //console.log(i+" "+time);
    	times.push(time);
      //times[i] = time;
    	radarLayers[i] = L.tileLayer("https://api.weather.bom.gov.au/v1/rainradar/tiles/"+time+"/{z}/{x}/{y}.png", {
    		layers: time,
    		format: 'image/png',
    		transparent: true,
    		opacity: 0.0,
        minNativeZoom: 5,
        maxNativeZoom: 10
    	});
      radarLayers[i].addTo(map).bringToFront();
    }

    // Add Date Control
    info = L.control.radarinfo({ position: 'bottomright' });
    info.addTo(map);

    function getRadarTime(i) {
      var x = 1;
      if (Number(new Date().getUTCMinutes().toString().slice(-1)) <= 5) { // BOM image isn't available straight away so wait 5 min. delay
        //console.log(Number(new Date().getUTCMinutes().toString().slice(-1)));
        //console.log("x=0");
        x = 0;
      }
      var date = new Date(new Date()-(coeff*((frameCount-x)-i)));
      var year = date.getUTCFullYear().toString();
      var month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      var day = date.getUTCDate().toString().padStart(2, '0');
      var hours = date.getUTCHours().toString().padStart(2, '0');
      var minutes = new Date(Math.floor(date.getTime() / coeff) * coeff).getUTCMinutes().toString().padStart(2, '0');
      return year+month+day+hours+minutes;
    }

    function updateRadar(i) {
      var time = getRadarTime(i);
      //console.log("Updated frame "+i+" ("+times[i]+") to "+time);
      times[i] = time;
      //console.log(times);
      radarLayers.map(function(layer){ layer.setOpacity(0)});
      radarLayers[i] = L.tileLayer("https://api.weather.bom.gov.au/v1/rainradar/tiles/"+time+"/{z}/{x}/{y}.png", {
        layers: time,
        format: 'image/png',
        transparent: true,
        opacity: 0.8,
        minNativeZoom: 5,
        maxNativeZoom: 10
      });
      radarLayers[i].addTo(map).bringToFront();
    }

    var i = 0;
    function radarLoop() { // create a loop function
      setTimeout(function () { // call a 3s setTimeout when the loop is called
        if (run) {
          radarLayers.map(function(layer){ layer.setOpacity(0)});
          radarLayers[i].setOpacity(0.8);
          info._update(i);
          //console.log("frame: "+(i)+"; time: "+times[i].slice(-4));
          if (getRadarTime(i) != times[i]) {
            updateRadar(i);
          }
          i++; // increment the counter
          if (i == frameCount) {
            i = 0;
          }
          radarLoop();
        }
      }, timeout)
      return i;
    }
    radarLoop(); // start it
	},
	onRemove: function(map) {
    run = false;
    radarLayers.map(function(layer){ layer.setOpacity(0)}); //.remove()???

    info.remove();
	}
});
L.tileLayer.bomradar = function(map) {
    return new L.TileLayer.bomRadar(map);
}

L.Control.radarInfo = L.Control.extend({
    onAdd: function (map) {
        this.container = L.DomUtil.create('div', 'leaflet-radar-control');
        let slider_div = L.DomUtil.create('div', 'leaflet-radar-slider', this.container);


        this.slider = document.createElement('input');
        this.slider.id = 'leaflet-radar-slider';
        this.slider.type = 'range';
        this.slider.min = 1;
        this.slider.max = frameCount;
        this.slider.disabled = true;

        slider_div.appendChild(this.slider);

        this.info_div = L.DomUtil.create('div', 'leaflet-radar-info', this.container);

        return this.container;
    },
    _update: function (i) {
    	//if (typeof i !== "undefined") {
    		//var time = times[x].replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$4:$5');
        var time = new Date(times[i].replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$2/$3/$1 $4:$5 UTC'));
        //var current = new Date(getRadarTime(frameCount-1).replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$2/$3/$1 $4:$5 UTC'));
        var current = new Date();
        var delay = new Date(current-time);
        var delay = ((delay.getUTCHours()*60)+delay.getUTCMinutes()).toString();
        //console.log(times[i].replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$2/$3/$1 $4:$5 UTC'));
        //time = time.getHours().toString().padStart(2, '0')+":"+time.getMinutes().toString().padStart(2, '0')+" GMT+1000";
        time = time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    		this.info_div.innerHTML = "Radar time: " +time+" (-"+delay+" min)";
        this.slider.value = i+1;
    	//}
    },
    onRemove: function(map) {
        // Nothing to do here
    }
});
L.control.radarinfo = function(opts) {
    return new L.Control.radarInfo(opts);
}
