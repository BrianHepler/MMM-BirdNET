# MMM-BirdNET
This is a module for the [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror) framework that displays the nearby submissions to the [BirdNET](https://birdnet.cornell.edu) repository at Cornell University. BirdNET is a research project that uses mobile apps and lightweight applications to listen for birdsongs and then matches them using a machine learning algorithm.

![MMM-BirdNET interface](display.png)

## Features
* Plots the uses of BirdNET service in the nearby area
* Displays the name, species, photo, and confidence of a random submission via popup
* Several included map options
* Custom map option available
* Configurable speed of popups, marker color

## Dependencies
* An installation of MagicMirror<sup>2</sup>
* No addtional packages, all libraries are included.

## Installation
Clone the repository and add the config settings.
1. Clone the repository into your `~/MagicMirror/modules` folder.
2. Configure your `~/MagicMirror/config/config.js` file.
```
{
	module: "MMM-BirdNET",
	position: "bottom_left",
	config: {
		lat: 42.453583743,
		lon: -76.47363144,
	}
},
```
## Configuration Options
All configuration options are optional. There are no mandatory parameters.
| Option | Default | Description |
|:------:| ------- | ----------- |
| updateInterval | 3600000 (one hour) | How often the BirdNET data is pulled from the website.|
| popInterval | 30000 (30 seconds)| How often (in milliseconds) the popup switches to a new entry |
| popDelay | 0 (off) | How long (in milliseconds) between the closing of one popup and the opening of the next, with a pan to origin lat/long in between |
| mapMode | 'dark' | Which map to use. Supported values are: `dark`, `light`, `atlas`, `stark`, `terrain`, `satellite`, `custom` and `metal`.
| lat | 42.453583743 | Latitude for the center of the map display. |
| lon | -76.47363144 | Longitude for the center of the map display. |
| markerColor | 'LightGreen' | Sets the color of the markers on the map representing submissions. Accepts [HTML standard color names](https://www.w3schools.com/cssref/css_colors.php) or hex format.|
| markerDistance | 300 | Distance in kilometers from the center of the map to display BirdNET submissions. If you encounter performance issues, try reducing this number. BirdNET regularly receives 30-50K submissions daily and we can _maybe_ display 10K. |
| zoomLevel | 7 | How far in the map is zoomed. See [Leaflet](https://leafletjs.com/examples/zoom-levels/) documentation for more details. |
| mapUrl | null | If you set the mapMode parameter to `custom`, this parameter will activate. You can supply your own [Leaflet](https://leafletjs.com/reference.html#map-example)-supported map URL here. |
| dataUrl | https://birdnet.cornell.edu/map/requeststats| Where to pull the data |

Note: Width & height of the map are controlled via the `BirdNETmap` classname. Override via your `custom.css`. Default is 400px x 400px. See the `MMM-BirdNET.css` file for examples.

## Upcoming Features
* Enable notification broadcasts
* Translations for common names of birds

## Version History
### v0.1.2
* Added the ability to pan back to origin coords between popups. Controlled by `popDelay` parameter.
* Popup colors & fonts accessible via `name-label`, `species-label`, `confidence` CSS values.

### v0.1.1
* Fixed issue with popups double-tapping after an hour
* Fixed issue with displaying submissions in exceptionally high-density areas
* Submission markers are now dots instead of map markers
* Can set marker color with `markerColor` parameter
* Can set distance limit on which markers are displayed with `markerDistance` parameter

### v0.1.0
* Initial release


## Thanks To
* [thgmirror](https://forum.magicmirror.builders/user/thgmirror) over at the MagicMirror Forum for the inspiration.
* [cyberdie](https://forum.magicmirror.builders/user/cyberdie) for the idea about the bird images.