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
    interactBoard.empty();
    // fetch Data from pendingOrder's orderId
    let orderData = JSON.parse(targetOrder.parentNode.getAttribute('data-order-detail'));
    showInteractBoard();
    console.log(orderData)
    // show order detail and accept button
    getUserByOrderId(orderData._id, (userInvolved) => {
        avatarRender(userInvolved.eater, interactBoard);
        renderOrder(orderData,interactBoard,false);
        if(userInvolved.hunter.user == null){
            //render acceptBtn
            getUserBySession((userData) => {
                avatarRender(userData, interactBoard);
                acceptBtn.querySelector('.interactSubmit').style.cssText = 'margin-left: 0; margin-right:20px;';
                interactBoard.append(acceptBtn);
            })
            
        }else{
            alert('Something went wrong this order has been picked by other hunter!');
        } 
    });
    
    // avatarRender(userInvolved.eater, interactBoard);
    
    // avatarRender(userInvolved.hunter, interactBoard);

    // if click mark in DB and call PendingInteract
}

const pendingInteract = () => {
    let dataGet;
    let hunter_wait = false;
    let eater_wait = false;
    pending()

    function init() {
        //clear interactBoard's child
        $('.menubar').addClass('black');
        $('#searchDismiss').addClass('active');
        $('#searchCollapse').removeClass('active');

        showInteractBoard();
        interactBoard.empty();
        //fetch Data from user's pendingOrder
        $.get('/fetchPendingData',(data,status)=>{
            dataGet = data;
            console.log(dataGet);
        })
    }
    
    function renderTemplate() {
        
        //render current progress (role)
        // avatar.querySelector('.avatar-text').innerText = dataGet.userDetail;
        //load template
        console.log(dataGet.userDetail.eaterDetail)
        avatarRender(dataGet.userDetail.eaterDetail,interactBoard)
        renderOrder(dataGet.orderDetail,interactBoard)
        avatarRender(dataGet.userDetail.hunterDetail,interactBoard)
        //show
        // interactBoard.append(avatar);
        // interactBoard.append(orderSummary);
        // console.log(avatar);
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
    
    async function pending() {
        const a = await init()
        await sleep(2000)
        const b = await renderTemplate(a)
        await sleep(500)
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

const renderOrder = (orderData,interactBoard,isDisplayPrice = false) => {
    orderSummary = document.getElementById('order-summary').content.cloneNode(true);
    orderSummary.querySelector('#orderId').innerText = orderData._id.slice(-6);
    for(let i=0;i<orderData.menu.length;i++){
        let orderList = orderSummary.querySelector('.order-list-container');
        listItem = document.getElementById('list-item').content.cloneNode(true);
        listItem.querySelector('.list-name').innerText = orderData.menu[i].name;
        listItem.querySelector('.countFood').value = orderData.menu[i].amount;
        if(!isDisplayPrice)listItem.querySelector('.priceFood').style.display = "none";
        orderList.appendChild(listItem);
    }
    interactBoard.append(orderSummary);
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


const avatarRender = (Data,interactBoard) => {
    if(Data&&Data.username&&Data.user)
    {
        console.log(user);
        avatar = document.getElementById('avatar').content.cloneNode(true);
        avatar.querySelector('.avatar-text').innerText = Data.username;
        avatar.querySelector('#userIMG').src = Data.user.picture;
        if(Data.role!=user.role) avatar.querySelector('.user-avatar').style.cssText = 'margin-left: 20px!important';
        else avatar.querySelector('.user-avatar').style.cssText = 'margin-right: 20px!important';
        interactBoard.append(avatar);
    }
}

