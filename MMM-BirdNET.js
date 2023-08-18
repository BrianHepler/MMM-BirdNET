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
        // after a brief delay, set up the pull from the BirdNET website
        // var timer = setInterval(()=> {
        //     this.updateData();
        // }, this.config.updateInterval);
        Log.info("Starting module " + this.name);

        this.config.animationSpeed = 1000;
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

    buildMap: function() {
        // var mapCon = document.getElementById('BirdNET-map');
        var map = L.map('BirdNET-map')
        map.setView([this.config.lat, this.config.lon],this.config.zoomLevel); // create the map
        L.tileLayer(this.config.mapUrl, {maxZoom: 19, attribution: 'OpenStreetMap'}).addTo(map); // add map tiles
        
        // mapCon.appendChild(map);
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
        }
    },

  })