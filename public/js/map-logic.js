function initMap (){
    if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(renderMap);
    }
}

var myinitialLocation=null;
var map = null;
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
    
    if($('#searchForm').attr('class')=='active') waitMapLoaded(map);

    map.panBy(0, 150)
    var marker = new google.maps.Marker({
        position: myinitialLocation,
        map: map,
        title: "You're Here"
    });
}

const waitMapLoaded = (mapObj) => {
    $('.loader').show();
    $('#searchInput').prop('readonly', true);
    mapObj.addListener('tilesloaded', function () {
        console.log('Map loaded');
        $('.loader').hide();
        $('#searchInput').prop('readonly', false);
    });
}

var directionsService =null;
var directionsDisplay = null;

function calculateAndDisplayRoute(destId) {
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
            var pricePerKM = 5;
            thisChoice.dataset.placeDetail = JSON.stringify({
                ...prediction,
                distance: distance,
                duration: duration,
                fee: (parseFloat(distance,10)*pricePerKM).toFixed(2)
            });
            thisDuration.innerText = duration;
            thisFee.innerText = (parseFloat(distance,10)*pricePerKM).toFixed(2);
      });

      templ.querySelector('.choice-fee').innerText = '0.00';
      templ.querySelector('.choice').addEventListener('click', function(e){
        
        $('.choice').css({
            "background":"white",
            "color": "unset",
        });
        this.style.background="black";
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

const getFreeOrder = (position) => {
    let distance = 15000;
    let hunterLat = position.coords.latitude;
    let hunterLong = position.coords.longitude;
    $.post('/fetchFreeOrder',{h_lat: hunterLat, h_lon: hunterLong, dist:distance}, (data, status) => {
        renderHunterChoice(data);
    });
    
}

const renderHunterChoice = (data) => {
    console.log(data);
    let templ = document.getElementById('hunter-choice-template').content.cloneNode(true);
    for(let i=0; i<data.length; i++){
        
        console.log(data[i]);
    }
}
