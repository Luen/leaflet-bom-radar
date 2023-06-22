/**
  * Leaflet.BOM
  * A JavaScript library for using BOM's layers and data for leaflet based maps.
  * Project page: https://github.com/Luen/leaflet-bom-radar
  * Data: https://weather.bom.gov.au/
  * Save to KML requires tokml.js, Save to GPX requires togpx.js
  * License: CC0 (Creative Commons Zero), see https://creativecommons.org/publicdomain/zero/1.0/
  */

const coeff = 1000 * 60 * 10; // every 10 min
const timeout = 500; // frame change every 500ms
const frameCount = 10; // 6 instances of images shown on bom site
let run = true;
const radarLayers = [];
const times = [];
let info;

const getRadarTime = i => {
  let x = 1;
  if (Number(new Date().getUTCMinutes().toString().slice(-1)) <= 5) {
    x = 0;
  }
  const date = new Date(new Date() - (coeff * ((frameCount - x) - i)));
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = new Date(Math.floor(date.getTime() / coeff) * coeff).getUTCMinutes().toString().padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}`;
}

L.TileLayer.bomRadar = L.TileLayer.extend({
	options: {
		attribution: 'Weather from <a href="https://weather.bom.gov.au/">BOM</a>'
	},
	onAdd: map => {
		// Setup
		run = true;
		for (let i = 0; i < frameCount; i++) {
			const time = getRadarTime(i);
			times.push(time);
      //radarLayers[i] = L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${time}/256/{z}/{x}/{y}/1/1_0.png`, {
      //radarLayers[i] = L.tileLayer(`https://api.weather.bom.gov.au/v1/rainradar/tiles/${time}/{z}/{x}/{y}.png`, {
      radarLayers[i] = L.tileLayer(`https://radar-tiles.service.bom.gov.au/tiles/${time}/{z}/{x}/{y}.png`, {
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

		const updateRadar = i => {
			const time = getRadarTime(i);
			times[i] = time;
			radarLayers.map(layer => layer.setOpacity(0));
			radarLayers[i] = L.tileLayer(`https://api.weather.bom.gov.au/v1/rainradar/tiles/${time}/{z}/{x}/{y}.png`, {
				layers: time,
				format: 'image/png',
				transparent: true,
				opacity: 0.8,
				minNativeZoom: 5,
				maxNativeZoom: 10
			});
			radarLayers[i].addTo(map).bringToFront();
		}

		let i = 0;
		const radarLoop = () => { // create a loop function
			setTimeout(() => {
				if (run) {
					radarLayers.map(layer => layer.setOpacity(0));
					radarLayers[i].setOpacity(0.8);
					info._update(i);
					if (getRadarTime(i) !== times[i]) {
						updateRadar(i);
					}
					i++;
					if (i === frameCount) {
						i = 0;
					}
					radarLoop();
				}
			}, timeout);
		}
		radarLoop();
	},
	onRemove: map => {
		run = false;
		radarLayers.map(layer => layer.setOpacity(0));
		info.remove();
	}
});

L.tileLayer.bomradar = map => new L.TileLayer.bomRadar(map);

L.Control.radarInfo = L.Control.extend({
  onAdd: function (map) {
      this._container = L.DomUtil.create('div', 'leaflet-radar-control');
      let slider_div = L.DomUtil.create('div', 'leaflet-radar-slider', this._container);

      this._slider = document.createElement('input');
      this._slider.id = 'leaflet-radar-slider';
      this._slider.type = 'range';
      this._slider.min = 1;
      this._slider.max = frameCount;
      this._slider.disabled = true;
      slider_div.appendChild(this._slider);

      this._info_div = L.DomUtil.create('div', 'leaflet-radar-info', this._container);

      return this._container;
  },
  _update: function (i) {
      const time = new Date(times[i].replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$2/$3/$1 $4:$5 UTC'));
      const current = new Date();
      const delay = new Date(current - time);
      const delayMinutes = ((delay.getUTCHours() * 60) + delay.getUTCMinutes()).toString();
      const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this._info_div.innerHTML = `Radar time: ${formattedTime} (-${delayMinutes} min)`; // Changed this.info_div to this._info_div
      this._slider.value = i + 1; // Changed this.slider to this._slider
  }
});

L.control.radarinfo = opts => new L.Control.radarInfo(opts);
