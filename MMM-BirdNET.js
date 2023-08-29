Module.register("MMM-BirdNET", {
    defaults: {
        updateInterval: 60 * 60 * 1000, // one hour
        popInterval: 30 * 1000, // thirty seconds
        dataUrl: 'https://birdnet.cornell.edu/map/requeststats',
        mapUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        mapMode: 'dark',
        lat: 42.453583743,
		lon: -76.47363144,
        width: '400px',
        height: '400px',
        zoomLevel: 7,
        markerDistance: 300,
        markerColor: 'LightGreen' // distance from map center to put markers
    },
  
    start: function () {
        this.updateTimer = setInterval(()=> {
            this.updateData();
        }, this.config.updateInterval);
        Log.info("Starting module " + this.name);

        // one map to rule them all
        this.mapWrapper = null;

        this.config.animationSpeed = 1000;
        this.imageUrl = "https://birdnet.cornell.edu/map/static/img/150px_crops3K/";
        this.birdData = {};
        this.birdMap = null;
        this.markersLayer = new L.layerGroup();
        this.locations = [];

        this.popupOptions = {
            closeButton: false,
            closeOnClick: true,
        };
        this.mapOptions = {
            zoomControl: false,
            boxZoom: false,
            doubleClickZoom: false
        }

        this.mapSelector = "Jawg.Dark";
        


        if (this.config.mapMode == 'dark') { 
        } else {

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
        var wrapper;
        if (this.mapWrapper != null) {
            wrapper = this.mapWrapper;
        } else {
            wrapper = document.createElement("div");
            wrapper.className = "BirdNETmap";
            wrapper.id = "BirdNET-map";
            this.mapWrapper = wrapper;
        }
        
        if (!this.loaded) {
            wrapper.innerHTML = this.translate('LOADING');
            wrapper.innerClassName = 'dimmed light small';
            return wrapper;
        } else { 
            // this.buildMap();
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
        this.locations = [];
        var skipped = 0;
        var markerRadius = this.birdMap.getZoom() - 2;
        markers.clearLayers(); // clear markers ahead of data load

        var observations = this.birdData.observations;
        for (let index = 0; index < observations.length; index++) {
            var entry = observations[index];
            var lat = entry.lat;
            var lon = entry.lon;
            var dist = this.getDistance(this.config.lat,this.config.lon, lat, lon); 
            if (dist < this.config.markerDistance) { // remove entries further than 300 km
                // ensure only one marker per lat/lon to nearest 10th.
                var loc_code = ((lat * 5).toFixed(0) / 5) + ";" + ((lon * 5).toFixed(0) / 5); 
                if (this.locations.includes(loc_code)) {
                    skipped++;
                    continue;
                } else (this.locations.push(loc_code));

                // split species into common & Latin
                var species_split = entry.species.split(";");
                var name = species_split[0];
                var species = species_split[1];
                var percent = entry.score;
                var ts = entry.ts;
            
                // var marker = L.marker([lat, lon]); 
                var circle = L.circleMarker([lat,lon], {
                    stroke: false,
                    fill: true,
                    fillColor: this.config.markerColor,
                    radius: markerRadius,
                    fillOpacity: 1
                });
                var popup = this.createPopup(name, species, percent, ts);
                circle.bindPopup(popup, this.popupOptions);
                markers.addLayer(circle);
            } else { skipped++;}
        }
        Log.info("Processed " + observations.length + " bird hits. (skipped " + skipped +")");
    },

    createPopup: function(name, species, percent, ts) {
        var wrapper = document.createElement("div");
        wrapper.className = "popup";
        wrapper.id = "BirdNET-popup-" + ts;

        var labelEntry = labeldata[species + "_" + name];
        var imageSource = "";
        if (labelEntry != null) {
            imageSource = encodeURIComponent(labelEntry.icon);
        }

        var table = document.createElement("table");
        var tr = document.createElement("tr");
        var tdI = document.createElement("td");
        var tdT = document.createElement("td");
        
        var image = document.createElement("img");
        image.className = "popup-image";
        image.setAttribute("width", "75px");
        image.setAttribute("height", "75px");
        image.setAttribute("src", this.imageUrl + imageSource);
        tdI.append(image);
  
        // var stack = document.createElement("div");
        var nameLabel = document.createElement("div");
        nameLabel.className = "name-label"
        nameLabel.innerHTML = name
        var specLabel = document.createElement("div");
        specLabel.className = "species-label";
        specLabel.innerHTML = species;
        var ciLabel = document.createElement("div");
        ciLabel.className = "confidence";
        ciLabel.innerHTML = "Confidence: " + (Number(percent) * 100).toFixed(2) + "%";

        tdT.append(nameLabel);
        tdT.append(specLabel);
        tdT.append(ciLabel);

        tr.appendChild(tdI);
        tr.appendChild(tdT);
        table.appendChild(tr);
        wrapper.append(table);

        return wrapper;
    },

    randomPopup: function() {
        var markers = this.markersLayer;
        var markerArray = markers.getLayers();
        var index = Math.floor(Math.random() * markerArray.length);

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

            switch (this.config.mapMode) {
                case 'light': 
                    L.tileLayer.provider('CartoDB.Positron',{maxZoom: 19}).addTo(map);
                    break;
                case 'dark':
                    L.tileLayer.provider('CartoDB.DarkMatter',{maxZoom:19}).addTo(map);
                    break;
                case 'atlas': 
                    L.tileLayer.provider('OpenStreetMap.Mapnik',{maxZoom:19}).addTo(map);
                    break;
                case 'stark':
                    L.tileLayer.provider('Thunderforest.MobileAtlas',{apikey: '74ede731b29042d6aea1f834ad451250',maxZoom:19}).addTo(map);
                    break;
                case 'terrain': 
                    L.tileLayer.provider('GeoportailFrance.orthos',{maxZoom: 19}).addTo(map);
                    break;
                case 'metal':
                    L.tileLayer.provider('Thunderforest.SpinalMap', {apikey: '74ede731b29042d6aea1f834ad451250',maxZoom:19}).addTo(map);
                    break;
                case 'satellite':
                    L.tileLayer.provider('USGS.USImageryTopo',{maxZoom: 19}).addTo(map);
                    break;
                case 'custom':
                    L.tileLayer(this.config.mapUrl, {maxZoom: 19, attribution: 'Unknown'}).addTo(map); // add map tiles
            } // end case statement

            this.birdMap = map;
        }

        if (this.markersLayer == null) { 
            Log.info("Creating markers layer.");
            this.markersLayer = L.layerGroup().addTo(this.birdMap);
        } else { 
            this.markersLayer.addTo(this.birdMap);
        }
    
    },

    getScripts: function() {
        return [this.file('leaflet/leaflet-src.js'),this.file('label_data_icons.js'),this.file('leaflet/leaflet-providers.js')];
    },
    
    getStyles: function() {
        return [this.file('leaflet/leaflet.css'),this.file('MMM-BirdNET.css')];
    },
    
    notificationReceived: function(notification, payload, sender) {
        switch(notification) {
            case "DOM_OBJECTS_CREATED":
                this.loaded = true;
                this.buildMap();
                this.updateData();
                this.schedulePopInterval();
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