function initMap (){
    if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(renderMap);
    }else alert('This browser is not support please use on Android or PC');
}

var mapLoaded = false;
var myinitialLocation=null;
var map = null;
var markerArray = [];
// Initialize and add the map
function renderMap(position) {
    // console.log(position);
    myinitialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    
    // var uluru = {lat: -25.344, lng: 131.036};
    // The map, centered at Uluru
    
    map = new google.maps.Map(
        document.getElementById('map'), {
            zoom: 15, 
            center: myinitialLocation,
            gestureHandling: 'greedy',
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            zoomControl: false
    });
    
    // waitMapLoaded(map);

    map.panBy(0, 150)
    var marker = new google.maps.Marker({
        position: myinitialLocation,
        map: map,
        title: "You're Here"
    });
   markerArray.push(marker);
}

const clearMarker = (markerArray) => {
    for(let i=0; i<markerArray.length;i++){
        markerArray[i].setMap(null);
    }
}

const waitMapLoaded = (mapObj) => {
    google.maps.event.addListener( map, 'idle', function() {
        mapLoaded = true;
        $('.loader').hide();
        $('#searchInput').prop('readonly', false);
        $.getScript('https://cdn.sobekrepository.org/includes/gmaps-markerwithlabel/1.9.1/gmaps-markerwithlabel-1.9.1.min.js');
    });
    mapObj.addListener('tilesloaded', function () {
        mapLoaded = true;
        $('.loader').hide();
        $('#searchInput').prop('readonly', false);
        $.getScript('https://cdn.sobekrepository.org/includes/gmaps-markerwithlabel/1.9.1/gmaps-markerwithlabel-1.9.1.min.js');
    });
}

var directionsService =null;
var directionsDisplay = null;

function calculateAndDisplayRoute(destId) {
    clearMarker(markerArray);
    if(directionsDisplay != null) {
        directionsDisplay.setMap(null);
        directionsDisplay = null;
    }
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);
    directionsService.route({
      origin: myinitialLocation,
      destination: {'placeId':destId},
      travelMode: 'DRIVING'
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
}
function showChoiceDetail (choice){
    var details = JSON.parse(choice.getAttribute('data-place-detail'));
    $('.choice-detail').css({
        "display":"block"
    });
    $('#choice-distance').text(details.distance);
    $('#choice-rating').text(details.rating);
}

var displaySuggestions = function(predictions) {
    var target = document.getElementById('searchResult');
    target.innerHTML ='';
    while (target.firstChild) {
        target.removeChild(target.firstChild);
    }

    var distanceService = new google.maps.DistanceMatrixService();

    predictions.forEach(function(prediction) {
      let templ = document.getElementById('choice-template').content.cloneNode(true);
      templ.querySelector('.choice').id = prediction.place_id;
      templ.querySelector('.choice-name').innerText = prediction.name;
      
      let thisChoice = templ.querySelector('.choice');
      let thisDuration = templ.querySelector('.choice-duration');
      let thisFee = templ.querySelector('.choice-fee');

      distanceService.getDistanceMatrix({
          origins:[myinitialLocation],
          destinations:[{
            'placeId':prediction.place_id
          }],
          travelMode: 'DRIVING'
      },function(response){
            // console.log(response);
            var distance = response.rows[0].elements[0].distance.text;
            var duration = response.rows[0].elements[0].duration.text;
            var pricePerKM = 2;
            var fixedPrice = 25;
            var calculatedPrice = ((parseFloat(distance,10)*pricePerKM)+fixedPrice).toFixed(2);
            thisChoice.dataset.placeDetail = JSON.stringify({
                ...prediction,
                distance: distance,
                duration: duration,
                fee: calculatedPrice
            });
            thisDuration.innerText = duration;
            thisFee.innerText = calculatedPrice;
      });

      templ.querySelector('.choice-fee').innerText = '0.00';
      templ.querySelector('.choice').addEventListener('click', function(e){
        
        $('.choice').css({
            "background":"white",
            "color": "unset",
        });
        this.style.background="#27292d";
        this.style.color="#00FF89";
        $('#searchResult').scrollTo(this);
        showChoiceDetail(this);
        calculateAndDisplayRoute(prediction.place_id);
      })
      target.appendChild(templ);
      $('#choiceContainer').addClass('up');
      $('#upArrow').hide();
      $('#downArrow').show();
      feather.replace({'min-width': '50px','width': '50px','height': '50px','stroke-width': '3'});
    });
};

function getPredictSearch (searchValue) {
    // console.log("get search");
    var request = {
        location:myinitialLocation,
        type: ['restaurant'],
        keyword:searchValue,
        openNow: true,
        rankBy: google.maps.places.RankBy.DISTANCE
    }
    var placeService = new google.maps.places.PlacesService(map);
    placeService.nearbySearch(request, function(result,status){
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            $('div.gm-style-cc').remove();
            // console.log(result);
            displaySuggestions(result);
        }
    });
    // var autoCompleteService = new google.maps.places.AutocompleteService();
    // autoCompleteService.getPlacePredictions({ input: searchValue, location: myinitialLocation, radius: 25000 ,types:['establishment']}, displaySuggestions);
}

const getFreeOrder = (position, range) => {
    $('#choiceContainer').removeClass('up');
    $('#upArrow').show();
    $('#downArrow').hide();
    $('.loader').show();
    let distance = range;
    let hunterLat = position.coords.latitude;
    let hunterLng = position.coords.longitude;
    $.post('/fetchFreeOrder',{h_lat: hunterLat, h_lon: hunterLng, dist:distance}, (data, status) => {
        renderHunterChoice(data,hunterLat,hunterLng);
        $('.loader').hide();
    });
    
}

const renderHunterChoice = (data,hunterLat,hunterLng) => {
    var target = document.getElementById('searchResult');
    target.innerHTML ='';
    while (target.firstChild) {
        target.removeChild(target.firstChild);
    }
    
    for(let i=0; i<data.length; i++){
        // console.log(templ);
        showRangeDetail(data.length);
        let templ = document.getElementById('hunter-choice-template').content.cloneNode(true);
        let thisChoice = templ.querySelector('.choice');
        thisChoice.dataset.orderDetail = JSON.stringify(data[i]);
        templ.querySelector('.orderStoreName').innerText = data[i].storeName;
        templ.querySelector('.orderQuantity').innerText = data[i].menu.length;
        templ.querySelector('.orderFee').innerText = data[i].fee;

        templ.querySelector('.choice').addEventListener('click', function(e){
            $('.choice').css({
                "background":"white",
                "color": "unset",
            });
            this.style.background="#27292d";
            this.style.color="#00FF89";

            //send hunterLat/Long to plotHunterDirection
            plotHunterDirection(data[i], hunterLat, hunterLng);
            
        });

        target.appendChild(templ);
        feather.replace({'min-width': '40px','width': '40px','height': '40px','stroke-width': '3', 'padding-right': '0!important'});
    }

    $('#choiceContainer').addClass('up');
    $('#upArrow').hide();
    $('#downArrow').show();
}

const plotHunterDirection = (targetOrder, hunterLat, hunterLng) => {
    clearMarker(markerArray);
    if(directionsDisplay != null) {
        directionsDisplay.setMap(null);
        directionsDisplay = null;
    }
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
    directionsDisplay.setMap(map);
    let hunterOrigin = new google.maps.LatLng(hunterLat, hunterLng);
    let storeLocation = new google.maps.LatLng(targetOrder.storeLocation.coordinates[1],targetOrder.storeLocation.coordinates[0]);
    let eaterLocation = new google.maps.LatLng(targetOrder.locationEater.Latitude, targetOrder.locationEater.Longitude);
    let directionRequest = {
        origin: hunterOrigin,
        destination: eaterLocation,
        waypoints: [{
            location: storeLocation,
            stopover: true
        }],
        optimizeWaypoints: false,
        travelMode: google.maps.DirectionsTravelMode.DRIVING
    };
    directionsService.route(directionRequest, (response, status) => {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
            var leg = response.routes[0].legs;

            icon_config = {
                scale: .50,
                strokeWeight: 1.0,
                strokeColor: 'black',
                strokeOpacity: 1,
                fillColor: '#00ff89',
                fillOpacity: 1.0
            }
            
            let mark1 = new MarkerWithLabel({
                position: leg[0].start_location,
                map: map,
                labelContent: "ตำแหน่งของคุณ",
                labelAnchor: new google.maps.Point(20, 0),
                icon: {
                        path: fontawesome.markers.TAXI,
                        ...icon_config
                    },
                labelClass: 'map-label'
            });
            markerArray.push(mark1);
            
            let mark2 = new MarkerWithLabel({
                position: leg[0].end_location,
                map: map,
                labelContent: "ซื้อสินค้าที่นี่",
                labelAnchor: new google.maps.Point(20, 0),
                icon: {
                        path: fontawesome.markers.SHOPPING_CART,
                        ...icon_config
                    },
                labelClass: 'map-label',
            });
            markerArray.push(mark2);

            let mark3 = new MarkerWithLabel({
                position: leg[1].end_location,
                map: map,
                labelContent: "ส่งของที่นี่",
                labelAnchor: new google.maps.Point(20, 0),
                icon: {
                        path: fontawesome.markers.MALE,
                        ...icon_config
                    },
                labelClass: 'map-label',
                labelStyle: {

                }
            });
            markerArray.push(mark3);
            
        }else console.log(status);
    });
}

function showRangeDetail (numberResult){
    $('.range-detail').css({
        "display":"block"
    });
    $('#choice-range').text($('#searchRange').val() + ' KM');
    if(numberResult)$('#choice-number').text(numberResult);
}
