let interactPipe = undefined;
let orderId = 'thisIsOrderId';
let user = undefined;

const awakeInteractBoard = () => {
    let interactBoard = $('#interactBoard');
    interactBoard.css({
        "bottom":"0vh"
    });
    interactPipe = io('/interact');
    interactPipe.on('connect', function(data){
        interactPipe.emit("connectRoom", orderId);
    })
    interactPipe.on('ping', function(data){
        console.log(data);
    });
    
}

const killInteractBoard = () => {
    let interactBoard = $('#interactBoard');
    interactBoard.css({
        "bottom":"100vh",
    });
    if(interactPipe!=undefined)interactPipe.emit("disconnectRoom", orderId);
}