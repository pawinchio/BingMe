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
var text = document.getElementById('text').content.cloneNode(true);

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
                    amount: foodAmount,
                    price: null
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
    interactBoard.append(loader);
    getUserByOrderId(orderData._id, (userInvolved) => {
        
        if(userInvolved.hunter.user == null){
            //render acceptBtn
            getUserBySession((userData) => {
                avatarRender(userInvolved.eater, interactBoard);
                renderOrder(orderData,interactBoard,false);
                avatarRender(userData, interactBoard);
                acceptBtn.querySelector('.interactSubmit').dataset.orderId = orderData._id;
                acceptBtn.querySelector('.interactSubmit').style.cssText = 'max-width: 120px; margin-right:20px;';
                acceptBtn.querySelector('.interactSubmit').addEventListener('click', (e)=>{
                    orderData.isPickup = true;
                    orderData.hunterID = user._id;
                    $.post('/updateOrder',{orderId: orderData._id, updateObj: orderData}, (data, status)=>{
                        if(status == 'success'){
                            userData.user.refPending = orderData._id;
                            $.post('/updateUser',userData, (data, status)=>{
                                if(status == 'success'){
                                    pendingInteract();
                                }
                            });
                        }
                    });
                });
                interactBoard.append(acceptBtn);
                $('.loader').remove();
                
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
            // console.log(dataGet);
        })
        loaderRender(interactBoard)
    }
    
    function renderTemplate() {
        interactBoard.empty()
        console.log(dataGet);
        let state = checkstate(dataGet);
        console.log(state);
        //render current progress (role)
        // avatar.querySelector('.avatar-text').innerText = dataGet.userDetail;
        //load template
        if(state>=1){
            renderDetailState1(state,dataGet,interactBoard);
        }
        if(state>=2){
            renderDetailState2(state,dataGet,interactBoard);
        }
        if(state>=3){
            renderDetailState3(state,dataGet,interactBoard);
        }
        if(state==4){
            renderDetailState4(state,dataGet,interactBoard);
        }
        //show
        // interactBoard.append(avatar);
        // interactBoard.append(orderSummary);
        // console.log(avatar);
    }
    
    function pipeline() {
        //create pipeline
        interactPipe = io('/interact');
        interactPipe.on('connect', function(data){
            interactPipe.emit("connectRoom", dataGet.orderDetail._id);
        })
        interactPipe.on('ping', function(data){
            console.log(data);
        });
        interactPipe.on("thread", function(data) {
            $('.remove').remove()
            $('.loader').remove()
            dataGet.orderDetail=data;
            state = checkstate(dataGet);
            if(state==1){
                renderDetailState1(state,dataGet,interactBoard);
            }
            else if(state==2){
                renderDetailState2(state,dataGet,interactBoard);
            }
            else if(state==3){
                renderDetailState3(state,dataGet,interactBoard);
            }
            else if(state==4){
                renderDetailState4(state,dataGet,interactBoard);
            }
            bottomScript()
        });
        bottomScript()
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

    function bottomScript(){
        $("#payFee").on("click" , function(){
            console.log("pay fee");
            dataGet.orderDetail.isPaidFee = true;
            interactPipe.emit("interractData",dataGet.orderDetail,dataGet.orderDetail._id);
            this.remove();
        });
        $("#onArrive").on("click" , function(){
            $('.remove').remove();
            this.remove();
            textRender("กรุณายืนยันราคาสินค้าตามใบเสร็จ",'color: #00ff8; font-weight: bolder; font-size: 1rem;',"margin-top: 50px; text-align: center;",interactBoard,true);
            renderOrder(dataGet.orderDetail,interactBoard,true);
            bottomRender("ยืนยันราคา","conFirmFoodPrice",interactBoard,'width: 50%; height: 40px;');
            bottomScript();
        });
        $('#conFirmFoodPrice').on("click", ()=>{
            let confirmPrice = jQuery.makeArray($('#list').children());
            let checkNull = false;
            for(let i=0;i<confirmPrice.length;i++){
                dataGet.orderDetail.menu[i].price = confirmPrice[i].children[2].children[0].value;
                if(confirmPrice[i].children[2].children[0].value == "") checkNull = true;
            }
            console.log(dataGet.orderDetail.menu);
            if(checkNull) alert("Please input all menu price!!!");
            else{
                $('div.container')[1].remove();
                $('.remove').remove();
                $('#conFirmFoodPrice').remove();
                dataGet.orderDetail.isFullFilled = true;
                interactPipe.emit("interractData",dataGet.orderDetail,dataGet.orderDetail._id);
            }
        })
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

const renderOrder = (orderData,interactBoard,isDisplayPrice = false,summery = false) => {
    let totalCount = 0 ,totalPrice = 0;
    orderSummary = document.getElementById('order-summary').content.cloneNode(true);
    orderSummary.querySelector('#orderId').innerText = orderData._id.slice(-6);
    for(let i=0;i<orderData.menu.length;i++){
        let orderList = orderSummary.querySelector('#list.order-list-container');
        listItem = document.getElementById('list-item').content.cloneNode(true);
        listItem.querySelector('.list-name').innerText = orderData.menu[i].name;
        listItem.querySelector('.countFood').value = orderData.menu[i].amount;
        if(summery){
            listItem.querySelector('.priceFood').value = orderData.menu[i].price;
            totalCount += orderData.menu[i].amount;
            totalPrice += orderData.menu[i].price;
        }
        else listItem.querySelector('.priceFood').readOnly = false;
        if(!isDisplayPrice)listItem.querySelector('.priceFood').style.display = "none";
        orderList.appendChild(listItem);
    }
    if(!isDisplayPrice) orderSummary.querySelector('#list.order-list-container').id = "listDummy"
    if(summery){
        let orderList = orderSummary.querySelector('#summery.order-list-container');
        listItem = document.getElementById('list-item').content.cloneNode(true);
        listItem.querySelector('.list-name').innerText = "รวม";
        listItem.querySelector('.countFood').value = totalCount;
        listItem.querySelector('.priceFood').value = totalPrice;
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


const avatarRender = (Data,interactBoard,fee=null) => {
    if(Data&&Data.username&&Data.user)
    {
        avatar = document.getElementById('avatar').content.cloneNode(true);
        if(fee==null)avatar.querySelector('.avatar-text').innerText = Data.username;
        else{
            avatar.querySelector('.avatar-text').style.cssText  = 'float: right;padding-right: 19px;';
            avatar.querySelector('.avatar-text').innerHTML = '<table><tbody><tr><td style="float: left;">'+Data.username+'</td></tr><tr><td style="font-size: 0.69rem;">ค่าบริการ '+fee+'  บาท</td></tr></tbody></table>';
        }
        avatar.querySelector('#userIMG').src = Data.user.picture;
        if(Data.role != user.role) avatar.querySelector('.user-avatar').style.cssText = 'margin-left: 20px!important';
        else avatar.querySelector('.user-avatar').style.cssText = 'margin-right: 20px!important';
        interactBoard.append(avatar);
    }
}

const loaderRender = (interactBoard) =>{
    loader = $('#loader').html();
    interactBoard.append(loader);
}

const textRender = (inputText,styleText,styleDiv,interactBoard,classAdd=false) =>{
    text = document.getElementById('text').content.cloneNode(true);
    text.querySelector('#textAppend').innerText = inputText;
    text.querySelector('#textAppend').style.cssText = styleText;
    text.querySelector('#divStyle').style.cssText = styleDiv;
    if(classAdd)text.querySelector('#divStyle').className = 'remove';
    interactBoard.append(text);
}

const bottomRender = (text,id,interactBoard,styleAdd=null) =>{
    payBtn = document.getElementById('payBtn').content.cloneNode(true);
    payBtn.querySelector('.interactSubmit').innerText=text;
    if(styleAdd!=null) payBtn.querySelector('.interactSubmit').style.cssText += styleAdd;
    payBtn.querySelector('.interactSubmit').id = id;
    interactBoard.append(payBtn);
} 

const checkstate = (Data) => {
    if(Data.orderDetail.isComplete) return 4;
    else if(Data.orderDetail.isFullFilled) return 3;
    else if(Data.orderDetail.isPaidFee)return 2;
    else if(Data.orderDetail.isPickup)return 1
    else return 0;
}

function renderDetailState1(state,dataGet,interactBoard) {
    avatarRender(dataGet.userDetail.eaterDetail,interactBoard);
    renderOrder(dataGet.orderDetail,interactBoard);
    if(user.role=='Eater') textRender("ผู้จัดส่งตอบรับคุณแล้ว",'color: white; font-size: 1.2rem;',"margin-left: 20px;text-align: left;",interactBoard);
    else textRender("คุณได้ตอบรับลูกค้าท่านนี้แล้ว",'color: white; font-size: 1.2rem;',"margin-right: 20px;text-align: right;",interactBoard);
    avatarRender(dataGet.userDetail.hunterDetail,interactBoard,dataGet.orderDetail.fee);
    if(state==1){
        if(user.role=='Eater'){
            bottomRender("ชำระค่าจัดส่ง","payFee",interactBoard,'margin-right: 20px;');
            textRender("*ผู้จัดส่งจะยืนยันราคาอาหารในเมนูของคุณอีกครั้ง",'color: #00ff89; font-weight: bolder; font-size: 1rem;',"margin-right: 20px;text-align: right;",interactBoard,true);
            textRender("เพื่อให้คุณชำระเงินค่าสินค้า",'color: #00ff89; font-weight: bolder; font-size: 1rem;',"margin-right: 20px;text-align: right;",interactBoard,true);
        }
        else{
            loaderRender(interactBoard);
            textRender("กำลังรอการชำระเงิน",'color: white; font-weight: bolder; font-size: 1rem;',"text-align: center; margin-top: 50px;",interactBoard,true);
        }
    }
}

function renderDetailState2(state,dataGet,interactBoard){
    if(user.role=='Eater'){
        avatarRender(dataGet.userDetail.eaterDetail,interactBoard);
        textRender("ชำระค่าบริการแล้ว: "+dataGet.orderDetail.fee+" บาท",'color: white; font-size: 1rem;',"margin-right: 20px;text-align: right;",interactBoard);
        bottomRender("ดูใบเสร็จ","showBill",interactBoard,'margin-right: 20px;');
    }
    else{
        avatarRender(dataGet.userDetail.eaterDetail,interactBoard);
        textRender("ลูกค้าชำระค่าบริการแล้ว:",'color: white; font-size: 1rem;',"margin-left: 20px;text-align: left;",interactBoard);
        textRender(dataGet.orderDetail.fee+" บาท",'color: white; font-size: 1rem;',"margin-left: 20px;text-align: left;",interactBoard);
    }
    if(state==2){
        if(user.role=='Eater'){
            textRender("*ผู้จัดส่งจะยืนยันราคาอาหารในเมนูของคุณอีกครั้ง",'color: #00ff89; font-weight: bolder; font-size: 1rem;',"margin-right: 20px;text-align: right;",interactBoard,true);
            textRender("เพื่อให้คุณชำระเงินค่าสินค้า",'color: #00ff89; font-weight: bolder; font-size: 1rem;',"margin-bottom: 80px; margin-right: 20px;text-align: right;",interactBoard,true);
            loaderRender(interactBoard);
            textRender("ผู้จัดส่งกำลังเดินทาง",'color: white; font-weight: bolder; font-size: 1rem;',"text-align: center; margin-top: 50px;",interactBoard,true);
        }
        else{
            textRender("ออกเดินทางได้ทันที",'color: #00ff8; font-weight: bolder;',"text-align: center; margin-top: 50px;",interactBoard,true);
            textRender("คุณจะได้รับค่าบริการเมื่อการจัดส่งเสร็จสิ้น",'color: #00ff8; font-weight: bolder; font-size: 1rem;',"text-align: center;",interactBoard,true);
            bottomRender("คลิกที่นี่เมื่อถึงที่หมาย","onArrive",interactBoard,'width: 70%; height: 40px;');
        }
    }
}

function renderDetailState3(state,dataGet,interactBoard){
    if(user.role=='Eater'){
        textRender("ผู้จัดส่งยืนยันราคาอาหารแล้ว",'color: white; font-size: 1.2rem;',"margin-left: 20px;text-align: left;",interactBoard);
        renderOrder(dataGet.orderDetail,interactBoard,true,true);
    }
    else{
        textRender("คุณได้ยืนยันราคาอาหารแก่ลูกค้าแล้ว",'color: white; font-size: 1.2rem;',"margin-top: 20px;margin-right: 20px;text-align: right;",interactBoard);
        renderOrder(dataGet.orderDetail,interactBoard,true,true);
    }
    if(state==3){
        if(user.role=='Eater'){
            loaderRender(interactBoard);
            textRender("กำลังจัดส่ง*",'color: white; font-size: 1.2rem;',"text-align: center; margin-top:20px;",interactBoard,true);
            bottomRender("แสดง QR Code รับสินค้า","showQRCode",interactBoard,'width: 70%; height: 40px;');
            textRender("*กรุณาชำระเงินค่าสินค้าปลายทางอีกครั้ง",'color: #ff3100; font-size: 1rem;',"text-align: right; margin-top:20px; margin-right:20px;",interactBoard,true);
            textRender("ตามราคาที่ระบุในใบเสร็จรับเงิน",'color: #ff3100; font-size: 1rem;',"text-align: right; margin-top:20px; margin-right:20px;",interactBoard,true);
        }
        else{
            textRender("จัดส่งยังที่หมายได้ทันที",'color: #00ff8; font-size: 2rem;',"text-align: center;",interactBoard,true);
            textRender("คุณจะได้รับค่าบริการเมื่อการจัดส่งเสร็จสิ้น",'color: #00ff8; font-size: 1rem;',"text-align: center;",interactBoard,true);
            bottomRender("ยืนยันการจัดส่งด้วย QR Code","showQRCode",interactBoard,'width: 70%; height: 40px;');
        }
    }
}

function renderDetailState4(state,dataGet,interactBoard){
    interactBoard.append('<div style="text-align: center;"><i data-feather="check"></i></div>')
    feather.replace({'min-width': '40px','width': '30%','height': '30%','stroke-width': '3'});
    textRender("เสร็จสิ้น",'color: #00ff8; font-size: 2rem;',"text-align: center;",interactBoard);
    if(user.role=='Eater'){
        textRender("ขอขอบคุณที่ใช้บริการ",'color: #00ff8; font-size: 1.5rem;',"text-align: center;",interactBoard);
    }
    else{
        textRender("เราได้ส่งค่าบริการให้กับคุณแล้ว",'color: #00ff8; font-size: 1.5rem;',"text-align: center;",interactBoard);
    }
}