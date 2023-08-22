Module.register("MMM-BirdNET", {
    defaults: {
        updateInterval: 60 * 60 * 1000, // one hour
        dataUrl: 'https://birdnet.cornell.edu/map/requeststats',
        mapUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        lat: 51.505,
        lon: -0.09,
        width: '400px',
        height: '400px',
        zoomLevel: 7,
        popInterval: 10 * 1000, // ten seconds
    },
  
    start: function () {
        this.updateTimer = setInterval(()=> {
            this.updateData();
        }, this.config.updateInterval);
        Log.info("Starting module " + this.name);

        this.config.animationSpeed = 1000;
        this.birdData = {};
        this.birdMap = null;
        this.markersLayer = new L.layerGroup();
    },

    getHeader: function() { return this.name;},

    suspend: function() { clearInterval(this.updateTimer);},

    resume: function() { 
        this.updateTimer = setInterval(()=> {
            this.updateData();
        }, this.config.updateInterval);
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "BirdNETmap";
        wrapper.id = "BirdNET-map";
        
        if (!self.loaded) {
            wrapper.innerHTML = this.translate('LOADING');
            wrapper.innerClassName = 'dimmed light small';
            return wrapper;
          }
        
        return wrapper;
    },

    updateData: function() {
        Log.info("Downloading bird hit data.");
        var self = this;
        var url = this.config.dataUrl;

        var dataRequest = new XMLHttpRequest();
        dataRequest.open("GET", url, true);
        dataRequest.send();
        dataRequest.onprogress = function(event) {
            Log.info("Downloading bird data: " + event.total);
        }
        dataRequest.onerror = function() {
            Log.error("Unable to download bird data");
            this.birdData = {};
        }
        dataRequest.onload = function() {
            Log.info("Bird data loaded.");
            // remove markers
            if (dataRequest.status >= 200 && dataRequest.status < 300) {
                self.processBirdData(dataRequest.responseText);
            }
        }
        
    },

    processBirdData: function(birdData) {
        Log.info("Processing bird hits");
        
        this.birdData = JSON.parse(birdData);
        var markers = this.markersLayer;
        markers.clearLayers(); // clear markers ahead of data load

        var observations = this.birdData.observations;
        for (let index = 0; index < observations.length; index++) {
            var entry = observations[index];
            var lat = entry.lat;
            var lon = entry.lon;
            // remove entries further than 300 km
            var dist = this.getDistance(this.config.lat,this.config.lon, lat, lon);
            if (dist < 300) { 
            // if (this.getDistance(this.config.lat,this.config.lon, lat, lon) < 300) { 
                var marker = L.marker([lat, lon]);
                markers.addLayer(marker);
                Log.info("Bird added @ " + dist + " km");
            }
        }
        Log.info("Processing complete")
    },

    /**
	 * Schedule popups
	 */
	schedulePopInterval: function () {
		this.updateDom(this.config.animationSpeed);

		// #2638 Clear timer if it already exists
		if (this.timer) clearInterval(this.timer);

		this.timer = setInterval(() => {
			this.activeBird++;
			this.updateDom(this.config.animationSpeed);
		}, this.config.popInterval);
	},

    createMarker: function(lat,lon,popup) {
          var marker = L.marker([lat,lon]);
          // bind popup to marker

          return marker;
    },

    buildMap: function() {
        Log.info("Building birdmap.");
        var map = L.map('BirdNET-map')
        map.setView([this.config.lat, this.config.lon],this.config.zoomLevel); // create the map
        L.tileLayer(this.config.mapUrl, {maxZoom: 19, attribution: 'OpenStreetMap'}).addTo(map); // add map tiles
        this.birdMap = map;
        if (this.markersLayer == null) { this.markersLayer = L.layerGroup().addTo(this.birdMap);}
        else { this.markersLayer.addTo(map)}

        // test marker
        // L.marker([38.6906303,-77.4128]).addTo(this.birdMap);
        this.createMarker(38.6906303,-77.4128, null).addTo(this.markersLayer);
    },

    getScripts: function() {
        return [this.file('leaflet/leaflet-src.js')];
    },
    
    getStyles: function() {
        return [this.file('leaflet/leaflet.css'),this.file('MMM-BirdNET.css')];
    },
    
    notificationReceived: function(notification, payload, sender) {
        switch(notification) {
            case "DOM_OBJECTS_CREATED":
                Log.log("let's go");
                this.buildMap();
                this.updateData();
        }
    },

    getDistance: function(lat1, lon1, lat2, lon2) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        }
        else {
            var radlat1 = Math.PI * lat1/180;
            var radlat2 = Math.PI * lat2/180;
            var theta = lon1-lon2;
            var radtheta = Math.PI * theta/180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180/Math.PI;
            dist = dist * 60 * 1.1515;
            dist * 1.609344
            
            return dist;
        }
    },
  })