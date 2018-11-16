let interactPipe = undefined;
let orderId = undefined;
let interactBoard = $('#interactBoard');

function sleep(ms){
    return new Promise(resolve=>{
            setTimeout(resolve,ms)
    })
}
//load template
var orderSummary = document.getElementById('order-summary').content.cloneNode(true);
var listItem = document.getElementById('list-item').content.cloneNode(true);
var loader = document.getElementById('loader').content.cloneNode(true);
var acceptBtn = document.getElementById('acceptBtn').content.cloneNode(true);
var payBtn = document.getElementById('payBtn').content.cloneNode(true);
var avatar = document.getElementById('avatar').content.cloneNode(true);

const awakeInteractBoard = (source) => {
    let placeData = source.parentNode.getAttribute('data-place-detail');
    // console.log(source.parentNode);
     console.log(placeData);
    showInteractBoard();
    interactBoard.empty();
    interactBoard.append($('#create-order').html());
    // show menu form and storeName from placeData
    $("#inputFood").keypress(function(event){
        if(event.which === 13){
            addMenu(event);
        }
    });
    $("#addBot").on("click",addMenu);

    //remove menu
    $("div#showFood").on("click" ,"div#remove.p-2", function(event){
        $(this).parent().fadeOut(500,function(){
            $(this).remove();
        });
        event.stopPropagation();
    });

    // if form send create new order in db from data that currently got
    $("#sendMenu").on("click",()=>{
        var loader = $('#loader').html();
        interactBoard.append(loader);

        let eaterId = user._id;
        let menuList = jQuery.makeArray($('#showFood').children());
        let menuArray = [];
        call();

        function getmenuData() {
            menuList.forEach((child) => {
                let foodName = child.children[0].innerText;
                let foodAmount = child.children[1].children[0].value;
                let menuObj = {
                    name: foodName,
                    amount: foodAmount
                }
                menuArray.push(menuObj);
            });
        }
        
        function sentData() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    let eaterLocation = {
                        Latitude: position.coords.latitude,
                        Longitude: position.coords.longitude
                    };
                    console.log(menuArray);
                    $.post('/createOrder',{
                        eaterId: eaterId,
                        storeData: JSON.parse(placeData),
                        menu: menuArray,
                        locationEater: eaterLocation
                    }, (data, status) => {
                        console.log(data);
                        if(status == 'success'){
                            // call PendingInteract 
                            pendingInteract(user);
                        }
                    });
                });
            }
        }

        async function call() {
                const a = await getmenuData();
                const b = await sentData(a);
        }
        
    });

       
}

const awakeInteractBoardByHunter = (targetOrder) => {
    // fetch Data from pendingOrder's orderId
    let orderData = JSON.parse(targetOrder.parentNode.getAttribute('data-order-detail'));
    showInteractBoard();

    // show order detail and accept button
    orderList = orderSummary.querySelector('.order-list-container');

    interactBoard.append(orderSummary)
    // if click mark in DB and call PendingInteract
}

const pendingInteract = () => {
    let dataGet;
    let hunter_wait = false;
    let eater_wait = false;
    peding()

    function init() {
        //clear interactBoard's child
        $('.menubar').addClass('black');
        $('#searchDismiss').addClass('active');
        $('#searchCollapse').removeClass('active');

        showInteractBoard();
        interactBoard.empty();
        //fetch Data from user's pendingOrder
        $.get('/fetchData',(data,status)=>{
            dataGet = data;
        })
    }
    
    function renderTemplate() {
        //render current progress (role)
        //load template

        //show
        interactBoard.append(avatar);
        interactBoard.append(orderSummary);
        console.log(avatar);
    }
    
    function pipeline() {
        //create pipeline
        interactPipe = io('/interact');
        interactPipe.on('connect', function(data){
            interactPipe.emit("connectRoom", orderId);
        })
        interactPipe.on('ping', function(data){
            console.log(data);
        });
        //determine next action from progress (use role)
            //do or wait
            //do -> sent action through pipeline 
            //wait -> wait action from pipeline 

            //action has some button to tricker Backend to update order in DB
    }
    
    async function peding() {
        const a = await init()
        await sleep(3000)
        const b = await renderTemplate(a)
        await sleep(3000)
        const c = await pipeline(b)
    }
}

const killInteractBoard = () => {
    let interactBoard = $('#interactBoard');
    interactBoard.css({
        "bottom":"100vh"
    });
    $('#interact-footer').css({
        "bottom":"100vh"
    });
    if(interactPipe!=undefined)interactPipe.emit("disconnectRoom", orderId);
}

const addMenu = () =>{
    //grabbing new food text from input
    var Food = $("#inputFood").val();
    $("#inputFood").val("");
    var listOfMenu = $('#showFood').children();
    let i;
    for(i=0;i<listOfMenu.length;i++){
        // console.log(listOfMenu[i].childNodes);
        if((listOfMenu[i].childNodes[1].innerText)==Food){
            listOfMenu[i].childNodes[3].childNodes[1].value++;
            break;
        }
    }
    if(i>=listOfMenu.length){
        //create a new li and add to ul
        let listItem = jQuery.parseHTML($('#create-order-list').html())[1];
        listItem.childNodes[1].innerText = Food;
        $("#showFood").append(listItem);
    }
    $(".dismissMenu").click((event)=>{
        event.target.parentNode.remove();
    });
}

const showInteractBoard = () => {
    let interactBoard = $('#interactBoard');
    interactBoard.css({
        "bottom":"0vh"
    });
    $('#interact-footer').css({
        "bottom":"0vh"
    });
}

