Module.register("MMM-BirdNET", {
    defaults: {
        updateInterval: 60 * 60 * 1000, // one hour
        popInterval: 30 * 1000, // thirty seconds
        dataUrl: 'https://birdnet.cornell.edu/map/requeststats',
        mapUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        lat: 51.505,
        lon: -0.09,
        width: '400px',
        height: '400px',
        zoomLevel: 7,
    },
  
    start: function () {
        this.updateTimer = setInterval(()=> {
            this.updateData();
        }, this.config.updateInterval);
        Log.info("Starting module " + this.name);

        this.config.animationSpeed = 1000;
        this.imageUrl = "https://birdnet.cornell.edu/map/static/img/150px_crops3K/";
        this.birdData = {};
        this.birdMap = null;
        this.markersLayer = new L.layerGroup();

        this.popupOptions = {
            closeButton: false,
            closeOnClick: true
        };
        this.mapOptions = {
            zoomControl: false,
            boxZoom: false,
            doubleClickZoom: false
        }

        this.loaded = false;
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
        
        if (!this.loaded) {
            wrapper.innerHTML = this.translate('LOADING');
            wrapper.innerClassName = 'dimmed light small';
            return wrapper;
        } else { 
            this.buildMap();
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
        // dataRequest.onprogress = function(event) {
        //     Log.info("Downloading bird data: " + event.total);
        // }
        dataRequest.onerror = function() {
            Log.error("Unable to download bird data");
            this.birdData = {};
        }
        dataRequest.onload = function() {
            Log.info(self.name + " - Bird observation data loaded.");
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
            var dist = this.getDistance(this.config.lat,this.config.lon, lat, lon); 
            if (dist < 300) { // remove entries further than 300 km
                // split species into common & Latin
                var species_split = entry.species.split(";");
                var name = species_split[0];
                var species = species_split[1];
                var percent = entry.score;
                var ts = entry.ts;
            
                var marker = L.marker([lat, lon]);
                var popup = this.createPopup(name, species, percent, ts);
                marker.bindPopup(popup, this.popupOptions);
                markers.addLayer(marker);
            }
        }
        this.schedulePopInterval();
    },

    createPopup: function(name, species, percent, ts) {
        var wrapper = document.createElement("div");
        wrapper.className = "BirdNET-popUp";
        wrapper.id = "BirdNET-popup-" + ts;

        var labelEntry = labeldata[species + "_" + name];
        var imageSource = "";
        if (labelEntry != null) {
            imageSource = encodeURIComponent(labelEntry.icon);
        }

        var image = document.createElement("img");
        image.className = "rounded mr-3";
        image.setAttribute("width", "75px");
        image.setAttribute("height", "75px");
        image.setAttribute("src", this.imageUrl + imageSource);
        wrapper.appendChild(image);

        var bodyWrapper = document.createElement("div");
        bodyWrapper.className = "media-body";
        wrapper.appendChild(bodyWrapper);

        var nameLabel = document.createElement("h6");
        nameLabel.innerHTML = name + "<br>";
        bodyWrapper.appendChild(nameLabel);

        var speciesLabel = document.createElement("small");
        speciesLabel.className = "text-muted";
        speciesLabel.innerHTML = species + "<br>";
        nameLabel.appendChild(speciesLabel);

        var scoreLabel = document.createElement("small");
        scoreLabel.innerHTML = "Confidence: " + (Number(percent) * 100).toFixed(2) + "%";
        nameLabel.appendChild(scoreLabel);

        return wrapper;
    },

    randomPopup: function() {
        var markers = this.markersLayer;
        var markerArray = markers.getLayers();
        var index = Math.floor(Math.random() * markerArray.length);

        Log.info("pop");
        markerArray[index].openPopup();
    },

    /**
	 * Schedule popups
	 */
	schedulePopInterval: function () {
		this.updateDom(this.config.animationSpeed);

		// #2638 Clear timer if it already exists
		if (this.popTimer != null) clearInterval(this.timer);

		this.timer = setInterval(() => {
			this.activeBird++;
			this.randomPopup();
		}, this.config.popInterval);
	},

    buildMap: function() {
        if (this.birdMap != null) {
            Log.info("map already exists");
        } else {
            var map = L.map('BirdNET-map', this.mapOptions);
            map.setView([this.config.lat, this.config.lon],this.config.zoomLevel); // create the map
            L.tileLayer(this.config.mapUrl, {maxZoom: 19, attribution: 'OpenStreetMap'}).addTo(map); // add map tiles
            this.birdMap = map;
        }
        if (this.markersLayer == null) { this.markersLayer = L.layerGroup().addTo(this.birdMap);}
        else { this.markersLayer.addTo(map)}
    
    },

    getScripts: function() {
        return [this.file('leaflet/leaflet-src.js'),this.file('label_data_icons.js')];
    },
    
    getStyles: function() {
        return [this.file('leaflet/leaflet.css'),this.file('MMM-BirdNET.css')];
    },
    
    notificationReceived: function(notification, payload, sender) {
        switch(notification) {
            case "DOM_OBJECTS_CREATED":
                Log.log("let's go");
                this.loaded = true;
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