let user = undefined;

$(document).ready(function () {
    killInteractBoard();
    $('#dismiss, .overlay').on('click', function () {
        // hide sidebar
        $('#sidebar').removeClass('active');
        // hide overlay
        $('.overlay').removeClass('active');
        $('#dismiss').removeClass('active');
    });

    $('#sidebarCollapse').on('click', function () {
        // open sidebar
        $('#dismiss').addClass('active');
        $('#sidebar').addClass('active');
        // fade in the overlay
        $('.overlay').addClass('active');
        $('.collapse.in').toggleClass('in');
        $('a[aria-expanded=true]').attr('aria-expanded', 'false');
    });


    //Search form logic
    $('#searchDismiss').on('click', function () {
        // restore backward page scrolling
        $('html, body').css({
            overflow: 'auto',
            height: 'auto'
        });
        // console.log("click");
        $('#searchForm').removeClass('active');
        // hide dismiss button
        $('#searchDismiss').removeClass('active');

        $('.menubar').removeClass('black');

        $('#searchCollapse').addClass('active');
        $('#searchInput').val('');
        $('#searchResult').html('');
        $('#map + .choice-detail, .range-detail').hide();

        if(directionsDisplay != null) {
            directionsDisplay.setMap(null);
            directionsDisplay = null;
        }

        $('#choiceContainer').removeClass('up');
        $('#upArrow').show();
        $('#downArrow').hide();

        killInteractBoard();
    });
    $('#searchCollapse.not-allow').on('click', () => {
        alert('Your account is not fully activated! Please update your user data and activated your email first');
    });
    $('#searchCollapse.not-login').on('click', () => {
        alert('Please login before using Bingme');
    });
    $('#searchCollapse.allow').on('click', function () {
        // prevent backward page from scrolling
        $('html, body').css({
            overflow: 'hidden',
            height: '100%'
        });
        //lock input and show loading bar
        if(!mapLoaded){    
            $('.loader').show();
            $('#searchInput').prop('readonly', true);
        }
        // open search form
        $('.menubar').addClass('black');
        $('#searchDismiss').addClass('active');
        $('#searchForm').addClass('active');
        $('#searchCollapse').removeClass('active');
        if(user){
            if(user.role == 'Hunter') searchForHunter($('#searchRange').val()*1000);
        }
    });

    $('#searchRange').on('input', () => {
        showRangeDetail ();
        searchForHunter($('#searchRange').val()*1000);
    });

    var timeout = null;
    //user searching mechanism
    $('#searchInput').on('input',function(){
        clearTimeout(timeout);
        $('.search-load').css({"display":"block"});
        timeout = setTimeout(function () {
            if(user.role == 'Eater'){
                getPredictSearch($('#searchInput').val());
                $('.choice-detail').css({
                    "display":"none"
                });
                $('.search-load').css({"display":"none"});
            }else if(user.role == 'Hunter'){
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(getFreeOrder);
                }else alert('Please allow position service');
                $('.search-load').css({"display":"none"});
            }
            
        }, 700);
    });

    $('#searchArrow').click(()=>{
        if ($(window).width() < 960) {
            if($('#choiceContainer')[0].className == 'up'){
                $('#choiceContainer').removeClass('up');
                $('#upArrow').show();
                $('#downArrow').hide();
            }else{
                $('#choiceContainer').addClass('up');
                $('#upArrow').hide();
                $('#downArrow').show();
            }
        }
    }); 

    $('#uploadForm').submit(function() {
        $("#status").empty().text("File is uploading...");
        $(this).ajaxSubmit({

            error: function(xhr) {
        status('Error: ' + xhr.status);
            },

            success: function(response) {
        $("#status").empty().text(response);
                console.log(response);
            }
    });
        //Very important line, it disable the page refresh.
    return false;
    });
              
                   
});

const searchForHunter = (range) => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            getFreeOrder(position, range);
        });
    }else alert('Please allow position service');
    $('.search-load').css({"display":"none"});
}

const getUserByOrderId = (orderId, callback) => {
    $.post('/fetchUserByOrderId',{orderId: orderId},(data, status)=>{
        if(status=='success'){
            callback(data);
        }else console.log(status);
    })
}

const getUserBySession = (callback) => {
    $.get('/fetchUserBySession', (data, status) => {
        if(status=='success'){
            callback(data);
        }
    });
}



