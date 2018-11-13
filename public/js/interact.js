let interactPipe = undefined;
let orderId = undefined;
let user = undefined;

const awakeInteractBoard = (e) => {
    let placeData = e.target.parentNode.getAttribute('data-place-detail');
    let interactBoard = $('#interactBoard');
    interactBoard.css({
        "bottom":"0vh"
    });

    // show menu form and storeName from placeData
    // if form send create new order in db from data that currently got
    // call PendingInteract    
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
    //render current progress
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