//Initial coordenates for Atlanta Decatur, GA.

var q = {lat: 33.774828, lng: -84.296312, food: 'wine'}; 
document.addEventListener('DOMContentLoaded', ko.applyBindings(new ViewModel()));

function ViewModel() {
  var self = this;
  var markers = [];
  self.allLocations = ko.observableArray([]);
  var map = initializeMap();
  //if google map is unavailable alert a user
  if (!map){
    alert("Google Maps unavailable. Please, try later");
    return;     
  } 
  self.map = ko.observable(map);
  self.geocoder = ko.observable(initializeGeo(self.map()));
  self.clickHandler = function(data) { moveMap(data, self.map(), markers); };
  self.submitHandler = function() { updateLocation(self.map(), self.geocoder(), self.allLocations, markers); };

  self.submitHandler();
}

//initialize map with predefined parameters
function initializeMap() {
  geocoder = new google.maps.Geocoder();
  var mapOptions = {
      center: {lat: q.lat, lng: q.lng},
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  return new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}

function initializeGeo(map) {
  var cambridge = new google.maps.LatLng(q.lat, q.lng);
  var browserSupportFlag;
  var initialLocation;
  
  // Geolocation 
  if(navigator.geolocation) {
    browserSupportFlag = true;
    navigator.geolocation.getCurrentPosition(function(position) {
      initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      map.setCenter(initialLocation);
      q.lat = initialLocation.latitude;
      q.lng = initialLocation.longitude;

    }, function() {
      handleNoGeolocation(browserSupportFlag);
    });
  }
  // Browser doesn't support Geolocation 
  else {
    browserSupportFlag = false;
    handleNoGeolocation(browserSupportFlag);
  }

  return geocoder;
  // error handler: if geolocation failes set the map to the default location(Decatur)
  function handleNoGeolocation(errorFlag) {
    if (errorFlag === true) {
      initialLocation = cambridge;
    } else {
      initialLocation = cambridge;
    }
    map.setCenter(initialLocation);
  }
} 

//fetch data from Foursquare and set markers on the map accordingly 
function fetchFoursquare(map, allLocations, markers) {
  allLocations([]); // removes previous items from the list 
  
  //ForSquare API request
  var foursquareUrl = 'https://api.foursquare.com/v2/venues/search' +
  '?client_id=4YSOOB5NTUSTDRUFYNURTWA15YSFBGFEPLLKI0NHO41FM0C1' +
  '&client_secret=1VPU0UDKJSJNFI1UOMCDCXGFXN5JYHGFFRQRTYCS5WYXNMO0' +
  '&ll=' + q.lat +',' + q.lng +
  '&query='+ q.food +
  '&v=20140806' +
  '&m=foursquare';
  
  var dataArray = []; // Array of venues' names, longitudes and latitudes

  $.getJSON(foursquareUrl, function(data) {
    // Once we get the JSON data, put data into an observable array 
    data.response.venues.forEach(function(item) { 
      allLocations.push(item);
      // put data to dataArray 
      dataArray.push({lat: item.location.lat, lng: item.location.lng, 
                      name: item.name, loc: item.location.address + " " + item.location.city});
    });
    setMarkers(dataArray, map, markers);
  });
} 

// Take lng and lat from dataArray and apply them to set markers on the map 
function setMarkers(dataArray, map, markers) {
  dataArray.forEach(function(element) {   
    var newLatlng = new google.maps.LatLng(element.lat, element.lng);
    var marker = new google.maps.Marker({
      position: newLatlng,
      map: map,
      animation: google.maps.Animation.DROP, //adds drop animations to the markers
      content: element.name + "<br>" + element.loc // inforwindow content includes venue name and address 
    });
    markers.push(marker);
    
    /* create infowindows for each of the markers */
    var infowindow = new google.maps.InfoWindow();
    google.maps.event.addListener(marker, 'click', function() {
      
      infowindow.setContent(this.content); 
      infowindow.open(map, this);
         
    });
  });
}

//Submit handler 

// Take address (value from the input box), 
 //  convert it to new lat and lng and update the map.
   //Then call fetchFoursquare to update markers 
function updateLocation(map, geocoder, allLocations, markers) {
  var address = document.getElementById('address').value;
  if (address === '') fetchFoursquare(map, allLocations, markers);
  else geocoder.geocode( { 'address': address }, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      q.lat = results[0].geometry.location.k;
      q.lng = results[0].geometry.location.D;
      q.food = document.getElementById('food').value;
      clearMarkers(markers); /* clear previous markers */     
      fetchFoursquare(map, allLocations, markers);
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}
 
function clearMarkers(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
} 

//clickHandler 

//When the link in the list is clicked, take lat and lng from the passed data and set the map zoom 
 //  according to these parametres 
function moveMap(data, map, markers) {
  map.setCenter(new google.maps.LatLng(data.location.lat, data.location.lng));
  map.setZoom(14);
  for (var i = 0; i < markers.length; i++) {
    var content = markers[i].content.split('<br>');    
    if (data.name === content[0]) {  // checks only if names are the same, but not addresses    
      toggleBounce(markers[i]); // apply animation
    }
  }
}

// Create animation for the marker when its corresponding li is clicked 
function toggleBounce(currentIcon) {
  if (currentIcon.getAnimation() !== null) {
    currentIcon.setAnimation(null);
  } else {
   currentIcon.setAnimation(google.maps.Animation.BOUNCE);
   setTimeout(function(){ currentIcon.setAnimation(null); }, 1400);
  }
}