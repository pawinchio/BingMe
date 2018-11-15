let interactPipe = undefined;
let orderId = undefined;

const awakeInteractBoard = (e) => {
    let placeData = e.target.parentNode.getAttribute('data-place-detail');
    let interactBoard = $('#interactBoard');
    interactBoard.css({
        "bottom":"0vh"
    });
    
    interactBoard.append('<div class="container" id="createFood"><h5 style="color:black">สร้างรายการคำสั่งซื้อ</h5><div><input id="inputFood" type="text" ><span><i id="addBot" data-feather="plus-circle"></i></span></div><div id="showFood"></div></div><div id="sendMenu">ส่งรายการสั่งซื้อ</div>');
    // show menu form and storeName from placeData
    $("#inputFood").keypress(function(event){
        if(event.which === 13){
            addMenu();
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
        let eaterId = user._id;
        let menuList = jQuery.makeArray($('#showFood').children());
        let menuArray = [];
        menuList.forEach((child) => {
            let foodName = child.childNodes[0].innerText;
            let foodAmount = child.childNodes[1].childNodes[0].value;
            let menuObj = {
                name: foodName,
                amount: foodAmount
            }
            menuArray.push(menuObj);
        });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                let eaterLocation = {
                    Latitude: position.coords.latitude,
                    Longitude: position.coords.longitude
                };
                $.post('/createOrder',{
                    eaterId: eaterId,
                    storeData: JSON.parse(placeData),
                    menu: menuArray,
                    locationEater: eaterLocation
                }, (data, status) => {
                    console.log(JSON.parse(placeData));
                    if(status == 'success'){
                        // call PendingInteract 
                        pendingInteract(user.role);
                    }
                });
            });
        }
    });

       
}

const awakeInteractBoardByHunter = (e) => {
    let orderId = e.target.parentNode.getAttribute('data-orderid');
    let interactBoard = $('#interactBoard');
    interactBoard.css({
        "bottom":"0vh"
    });

    // fetch Data from pendingOrder's orderId
    // show accept button
    // if click mark in DB and call PendingInteract
}

const pendingInteract = (role) => {
    //clear interactBoard's child
    //fetch Data from user's pendingOrder
    //render current progress (role)
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

const killInteractBoard = () => {
    let interactBoard = $('#interactBoard');
    interactBoard.css({
        "bottom":"100vh",
    });
    if(interactPipe!=undefined)interactPipe.emit("disconnectRoom", orderId);
}

const addMenu = () =>{
    //grabbing new food text from input
    var Food = $("#inputFood").val();
    if (Food) {
        $("#inputFood").val("");
        //create a new li and add to ul
        $("#showFood").append("<div id='listMenu' class=d-flex justify-content-between><div class= 'mr-auto p-2' id=Food>"+Food +"</div><div class= 'p-2'><input class=countFood type=text ></div><div id='remove' class= 'p-2' style='color:black;'>X</div></div>");
        $(".countFood").val("1");
    }
    
}

