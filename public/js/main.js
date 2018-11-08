$(document).ready(function () {
    $('#dismiss, .overlay').on('click', function () {
        // hide sidebar
        console.log("click");
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
        // hide sidebar
        // console.log("click");
        $('#searchForm').removeClass('active');
        // hide dismiss button
        $('#searchDismiss').removeClass('active');

        $('.menubar').removeClass('black');

        $('#searchCollapse').addClass('active');
        $('#searchInput').val('');
        $('#searchResult').html('');
    });

    $('#searchCollapse').on('click', function () {
        // open sidebar
        // console.log("click");
        $('.menubar').addClass('black');
        $('#searchDismiss').addClass('active');
        $('#searchForm').addClass('active');
        $('#searchCollapse').removeClass('active');
    });

    var timeout = null;
    //searching mechanism
    $('#searchInput').on('input',function(){
        clearTimeout(timeout);
        $('.search-load').css({"display":"block"});
        timeout = setTimeout(function () {
            getPredictSearch($('#searchInput').val());
            $('.choice-detail').css({
                "display":"none"
            });
            $('.search-load').css({"display":"none"});
        }, 700);
    });
    
    // var myCarousel = new floatingCarousel('.scrollcard',{
    //     autoScroll : true,
    //     autoScrollDirection : 'left',
    //     autoScrollSpeed : 5000,
    //     scrollSpeed : 'medium',
    // });
});

