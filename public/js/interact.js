let interactPipe = undefined;
let orderId = undefined;
let user = undefined;

const awakeInteractBoard = (e) => {
    let placeData = e.target.parentNode.getAttribute('data-place-detail');
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

const addMenu = () =>{
    //grabbing new food text from input
    var Food = $("#inputFood").val();
    $("#inputFood").val("");
    //create a new li and add to ul
    $("#showFood").append("<div class=d-flex justify-content-between><div class= 'mr-auto p-2' id=Food>"+Food +"</div><div class= 'p-2'><input class=countFood type=text ></div><div class= 'p-2' style='color:black;'>X</div></div>");
    $(".countFood").val("1");
}
    

$("#inputFood").keypress(function(event){
	if(event.which === 13){
		addMenu();
	}
});

$("#addBot").on("click",addMenu);