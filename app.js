const   express = require('express'),
        app = express(),
        url = require('url'),
        server = require('http').createServer(app),
        io = require('socket.io').listen(server),
        mongoose = require('mongoose'),
        ejs = require('ejs'),
        passport = require('passport'),
        bodyParser = require('body-parser'),
        LocalStrategy = require('passport-local'),
        passportLocalMongoose = require('passport-local-mongoose'),
        nodemailer = require('nodemailer'),
        multer = require('multer'),
        path = require('path'),
        uuid = require('uuid/v1');;

var     Eater  = require("./models/eater"),

        Hunter  = require("./models/hunter"),
        Menu  = require("./models/menu"),
        OrderPool  = require("./models/orderPool"),
        StoreHistory  = require("./models/storeHistory"),
        UserAuth = require('./models/userAuth'),
        methodOverride = require("method-override"),
        UserActivation = require('./models/userActivation');

const fileUpload = require('express-fileupload');
const fs = require('fs');
const mkdirp = require('mkdirp');



const   tools = require('./calculations.js');

mongoose.connect('mongodb://db_admin:db_11121150@ds029541.mlab.com:29541/bingme-dev-db',{ useNewUrlParser: true } );
app.set('view engine','ejs');
// app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(fileUpload());
app.use(express.static("public"));
app.use(express.static("userSrc"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(require('express-session')({
        secret: 'bing me is about eating',
        resave:false,
        saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(UserAuth.authenticate()))
passport.serializeUser(UserAuth.serializeUser());
passport.deserializeUser(UserAuth.deserializeUser());

let bingmeMail = 'bingmeinc@gmail.com'
var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: bingmeMail,
          pass: '11121150'
        }
      });

function sleep(ms){
        return new Promise(resolve=>{
                setTimeout(resolve,ms)
        })
}

app.get('/', (req,res) => {
        let errSent = null;
        if(Object.keys(req.query).length > 0) errSent = req.query;
        
        if(req.user){
                res.render('index',{
                        user: req.user,
                        error: errSent,
                        flag: null
                })
        }
        else res.render('index',{
                user: null,
                error: errSent,
                flag: null
        });
});

app.post('/register', (req,res) => {
        let input = req.body;
        //Let the Passport.js handle the registration
        UserAuth.register(new UserAuth({
                username: input.username,
                email: input.registerEmail,
                phone: input.registerPhone,
                role: input.role,
                isFirst: true,
                isActivated: false,
                userDataId: null
        }), input.password, (err, user) => {
                if(err){
                        return res.redirect(url.format({
                                pathname:"/",
                                query: {
                                        errorTopic: 'Registration Failed',
                                        errorDesc: err.message
                                }
                        }));
                }
                        //if there's no error log the user in
                passport.authenticate('local')(req,res, ()=>{
                        res.redirect('/'); 
                })
        });
        console.log(req.user);
});
app.post('/login', passport.authenticate('local',{
        successRedirect: '/',
        failureRedirect: url.format({
                pathname:"/",
                query: {
                        errorTopic: 'Login Failed',
                        errorDesc: 'Username / Password was invalid'
                }
        })
}),(req,res)=>{
        
});

app.post('/logout', (req,res) => {
        req.logout();
        res.redirect('/');
        if(req.user==undefined)console.log('User Logged-off');
});

app.post('/activate', (req,res) => {
        //User request verification email
        console.log('activation invoked!');
        if(req.body.email.toLowerCase() == req.user.email.toLowerCase()){
                var code = uuid();
                var newActivation = new UserActivation({
                        userId: req.user._id,
                        code: code
                });
                console.log(newActivation);
                var mailOptions = {
                        from: bingmeMail,
                        to: req.body.email,
                        subject: '[BINGME] Verification Email',
                };
                mailOptions.html = activateEmailTemplate_th(req.user.username,req.get('host')+'/activate?code='+code);
                newActivation.save().then(()=>{
                        transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                        console.log(error);
                                        res.send('failed');
                                } else {
                                        console.log('Email sent: ' + info.response);
                                        res.send('created');
                                }
                        });
                }).catch(err => {
                        if (err.name === 'MongoError' && err.code === 11000){
                                console.log('Activation code was create before\n'+err);
                                UserActivation.findOne({userId: req.user._id,}, (err, activation) => {
                                        if(!err){
                                                mailOptions.html = activateEmailTemplate_th(req.user.username,req.get('host')+'/activate?code='+activation.code);
                                                transporter.sendMail(mailOptions, function(error, info){
                                                        if (error) {
                                                                console.log(error);
                                                                res.send('failed');
                                                        } else {
                                                                res.send('repeat');
                                                                console.log('Email sent: ' + info.response);
                                                        }
                                                });
                                        }else res.send('failed');
                                });
                        }
                        else{
                                console.log('Code Saving Failed'+err);
                                res.send('failed');
                        }
                });     
        }else res.send('failed');
});

const activateEmailTemplate_th = (name, link)=>{
        return '<link href="https://fonts.googleapis.com/css?family=Kanit" rel="stylesheet"><div style="font-family:\'Kanit\'"><p>สวัสดี '+name+'</p><p style="text-indent: 50px;">ขอขอบคุณสำหรับการสมัครสมาชิกของคุณกับ BINGME เพื่อเริ่มต้นใช้งานบัญชีของคุณอย่างเต็มรูปแบบ โปรดคลิกที่ลิงก์ด้านล่างนี้เพื่อยืนยันอีเมลของคุณ</p><a href="'+link+'">'+link+'</a></div>'
}

app.get('/activate', (req,res) => {
        //User click link in email to verify
        let receivedCode = req.query.code;
        UserActivation.findOne({code: receivedCode}, (err,entry) => {
                if(!entry){
                        res.redirect(url.format({
                                pathname:"/",
                                query: {
                                        flag: {
                                                toActivate: true
                                        },
                                        errorTopic: 'Activation Failed',
                                        errorDesc: 'Your activation link is not exist or expired'
                                }
                        }));
                }
                else{
                        UserAuth.findOne({_id:entry.userId}, (err,user)=>{
                                if(user){
                                        user.isActivated = true;
                                        user.save();
                                        entry.remove(()=>{
                                                res.redirect(url.format({
                                                        pathname:"/",
                                                        query: {
                                                                flag: {
                                                                        toActivate: true
                                                                },
                                                                errorTopic: 'Account Activated',
                                                                errorDesc: 'Account activation success!'
                                                        }
                                                }));
                                        });
                                }
                        });
                }
        });
});

app.post('/createOrder', (req,res) => {
        // console.log(req.body);
        var menuID = [];
        var storeID ;
        var storeLocation;
        var orderPoolId;
        interect();
        
        async function addMenu() {
                for(const menu of req.body.menu) {
                // req.body.menu.forEach(menu => {
                        await Menu.find({Name: menu.name},async (err,menuData)=>{
                                if(menuData[0]==null){
                                        console.log("Add New Food : "+menu.name);
                                        menuTemp = {
                                                img: null,
                                                Name: menu.name,
                                                priceAvg: 0,
                                                COPAvg: 0
                                        }
                                        await Menu.create(menuTemp,async(err,Data)=>{
                                                await Data.save(async ()=>{
                                                        await Menu.find({Name: menu.name},async (err,menuData)=>{
                                                                await menuID.push(menuData[0]._id);  
                                                        })
                                                });     
                                                
                                        })
                                        
                                }
                                else{
                                        console.log("Found Food : "+menu.name);
                                        await menuID.push(menuData[0]._id);
                                        
                                }
                        });
                };
        }
        
        async function addStore() {
                StoreHistory.find({storeName: req.body.storeData.name}, async (err,store)=>{
                        // console.log("Menu ID : "+menuID);
                        // console.log(store);
                        // console.log(req.body.storeData.geometry.location.lng);

                        if(store[0]==null){
                                console.log("Add New Store : "+req.body.storeData.name);
                                storeData={
                                        img: null,
                                        storeName: req.body.storeData.name,
                                        historyMenu: menuID,
                                        priceAvg: null,
                                        COPAvg: null,
                                        locationStore:{
                                                type : 'Point',
                                                coordinates: [
                                                        req.body.storeData.geometry.location.lng,
                                                        req.body.storeData.geometry.location.lat
                                                ]
                                        },
                                        address: req.body.storeData.vicinity
                                }
                                StoreHistory.create(storeData,(err,store)=>{
                                        if(err) console.log(err)
                                        store.save((err)=>{
                                                if(err) console.log(err)
                                                StoreHistory.find({storeName: req.body.storeData.name}, (err,store)=>{
                                                        storeID = store[0]._id;
                                                        storeLocation = store[0].locationStore;
                                                })
                                        });
                                })
                        }
                        else{
                                console.log("Found Store : " + req.body.storeData.name);
                                await menuID.forEach((menu)=>{
                                        if (store[0].historyMenu.indexOf(menu) === -1) store[0].historyMenu.push(menu)
                                })
                                await StoreHistory.findByIdAndUpdate(store[0]._id,store[0])
                                storeID = store[0]._id;
                                storeLocation = store[0].locationStore;
                        }
                }) 
        }

        function addOrderPool() {
                var orderPenData={
                        locationEater:{
                                Latitude: req.body.locationEater.Latitude,
                                Longitude: req.body.locationEater.Longitude
                        },
                        storeName: req.body.storeData.name,
                        eaterID: req.user._id,
                        menu: req.body.menu,
                        storeId: storeID,
                        storeLocation: storeLocation,
                        fee: req.body.storeData.fee,
                        isPickup: false,
                        hunterID: null,
                        locationHunter: {Latitude : null,Longitude : null},
                        isPaidFee: false,
                        feePaidTime: null,
                        isFullFilled: false,
                        qr: null,
                        isComplete: false,
                        dateCreated: Date()  
                }
                console.log(orderPenData);
                OrderPool.create(orderPenData,(err,order)=>{
                        orderPoolId = order._id;
                        order.save((err)=>{
                                if(err) console.log(err);
                        });
                })   
        }
        function addPendingOrder() {
                console.log("Update Eater Pending Order")
                UserAuth.findById(req.user._id,(err,user)=>{
                        Eater.findById(user.userDataId,async (err,user)=>{
                                function updateData()
                                {
                                        if (user.refStoreHistory.indexOf(storeID) === -1) user.refStoreHistory.push(storeID);
                                        if (user.refHistory.indexOf(orderPoolId) === -1) user.refHistory.push(orderPoolId);
                                        user.refPending = orderPoolId;
                                }
                                await updateData();
                                await Eater.findByIdAndUpdate(user._id,user);
                        })
                })
                
        }

        
        async function interect(){
                const first = await addMenu()
                await sleep(1000)
                const second = await addStore(first)
                await sleep(1000)
                const third = await addOrderPool(second)
                await sleep(1000)
                const four = await addPendingOrder(third)
                await sleep(1000)
                await res.send("A");
        }
});

app.post('/fetchUserByOrderId', (req,res) => {
        OrderPool.findById(req.body.orderId, (err, order) => {
                UserAuth.findById(order.eaterID, (err,eater) => {
                        UserAuth.findById(order.hunterID, (err,hunter)=>{
                                let eaterDataId = null;
                                let hunterDataId = null;
                                if(eater) eaterDataId = eater.userDataId;
                                if(hunter) hunterDataId = hunter.userDataId;
                                Eater.findById(eaterDataId, (err,eaterData)=>{
                                        Hunter.findById(hunterDataId, (err, hunterData) => {
                                                eaterData = {user: eaterData, username: null, role:null};
                                                hunterData = {user: hunterData, username:null, role:null};
                                                if(eater) eaterData = {
                                                        ...eaterData,
                                                        username: eater.username,
                                                        role: eater.role
                                                }
                                                if(hunter) hunterData = {
                                                        ...hunterData,
                                                        username: hunter.username,
                                                        role: hunter.role
                                                }
                                                res.send({eater: eaterData, hunter: hunterData});
                                        })
                                })
                        })
                })
        });
});

app.get('/fetchPendingData',(req,res)=>{
        let poolRef;
        let userDetail = {
                eaterDetail: null,
                hunterDetail: null
        }
        let orderDetail;

        fetchData()

        function findOrderRef() {
                if(req.user){
                        if(req.user.role == "Eater"){
                                console.log("Eater")
                                Eater.findById(req.user.userDataId,async (err,user)=>{
                                        if(err) console.log(err);
                                        poolRef = user.refPending;
                                        userDetail.eaterDetail = {user,username : req.user.username,role : req.user.role};
                                })
                        }
                        else{
                                console.log("Hunter")
                                Hunter.findById(req.user.userDataId,async (err,user)=>{
                                        if(err) console.log(err);
                                        poolRef = user.refPending;
                                        userDetail.hunterDetail = {user,username : req.user.username,role : req.user.role};
                                        
                                })
                        }
                }
                else{
                        console.log("NULL")
                }
        }
        function getDetailPending() {
                //add poolRef in order ID
                OrderPool.findById(poolRef, (err,pool)=>{
                        if(err) console.log(err);
                        orderDetail = pool;
                        if(userDetail.hunterDetail==null){
                                if(pool.hunterID!=null){
                                        //console.log(pool);
                                        UserAuth.findById(pool.hunterID,(err,userF)=>{
                                                Hunter.findById(userF.userDataId,async (err,user)=>{
                                                        if(err) console.log(err);
                                                        userDetail.hunterDetail = {user,username : userF.username,role : userF.role};
                                                })
                                                
                                        }) 
                                }
                                else userDetail.hunterDetail=null;   
                        }
                        else{
                                if(pool.eaterID != null){
                                        //console.log(pool);
                                        UserAuth.findById(pool.eaterID,(err,userF)=>{
                                                Eater.findById(userF.userDataId,async (err,user)=>{
                                                        if(err) console.log(err);
                                                        userDetail.eaterDetail = {user,username : userF.username,role : userF.role};
                                                })
                                                
                                        })   
                                }
                                else userDetail.eaterDetail=null;
                        }
                })
        }
        
        async function fetchData(){
                const first = await findOrderRef();
                await sleep(500)
                const second = await getDetailPending(first); 
                await sleep(1000)
                await res.send({userDetail,orderDetail});
        }
})

app.post('/fetchFreeOrder', (req,res) => {
        // OrderPool.find(null,null,(err,order)=>{
        //         console.log(order);
        // });
        OrderPool.find({
                        storeLocation: {
                                $near: {
                                        $maxDistance: req.body.dist,
                                        $geometry: {
                                                type: "Point",
                                                coordinates: [req.body.h_lon, req.body.h_lat]
                                        }
                                }
                        }, isPickup: false
        }).find((error, results) => {
                if (error) console.log(error);
                res.send(results);
        }); 
});

app.get('/fetchUserBySession', (req,res) => {
        if(req.user){
                if(req.user.role == 'Eater'){
                        Eater.findById(req.user.userDataId, (err, eater) => {
                                res.send({
                                        user: eater,
                                        username: req.user.username,
                                        role: req.user.role
                                })
                        })
                }else if(req.user.role == 'Hunter'){
                        console.log('find hunter');
                        Hunter.findById(req.user.userDataId, (err, hunter) => {
                                res.send({
                                        user: hunter,
                                        username: req.user.username,
                                        role: req.user.role
                                })
                        })
                }
        }
});

app.post('/getStoreDataByStoreID',(req,res)=>{
        if(req.body.storeId!=null){
                StoreHistory.findById(req.body.storeId,(err,storeData)=>{
                        if(err)console.log(err);
                        console.log(storeData);
                        res.send(storeData);
                });
        }
});

app.post('/updateOrder', (req,res) => {
        // console.log(req.body);
        OrderPool.findByIdAndUpdate(req.body.orderId,req.body.updateObj, (err, order)=> {
                if(!order) console.log(err);
                else res.send('Acquire Success!');
        });
});

app.post('/updateUser', (req,res) => {
        console.log(req.body);
        if(req.body.user.refPending=='')req.body.user.refPending=null;
        if(req.body.role == 'Eater'){
                Eater.findByIdAndUpdate(req.body.user._id, req.body.user, (err, userData)=> {
                        if(!userData) console.log(err);
                        else res.send('Update Success!');
                });
        }else if(req.body.role == 'Hunter'){
                Hunter.findByIdAndUpdate(req.body.user._id, req.body.user, (err, userData)=> {
                        if(!userData) console.log(err);
                        else res.send('Update Success!');
                });
        }
});

app.post('/updateMenu',(req,res)=>{
        
        // for(const menu of req.body.menu){console.log(menu.name);}
        for(const menu of req.body.menu){
                // req.body.menu.forEach(menu => {
                Menu.find({Name:menu.name}, (err,menuData)=>{
                        menuData[0].COPAvg = menuData[0].COPAvg+Number(menu.amount);
                        menuData[0].priceAvg = (menuData[0].priceAvg+Number(menu.price))/menuData[0].COPAvg;
                        Menu.findByIdAndUpdate(menuData[0]._id,menuData[0],(err,menu)=>{
                                if(err) console.log(err);
                                res.send('Update Success!');
                        })              
                });
        }
})

app.post('/checkqr',(req,res)=>{
        //0: orderID, 1: eaterID
        const data = req.body.text.split(",");
        Eater.findById(data[1],(err,eaterData)=>{
               if(eaterData){
                       if(eaterData.refPending == data[0]){
                               OrderPool.findById(data[0], (err, order)=>{
                                        if(order) res.send('completed');
                                        else res.send('failed');
                               });
                       }else res.send('failed');
                }else res.send('failed');
        });

});

app.post('/eaterDataForm', (req,res) => {
        var MongoClient = require('mongodb').MongoClient;
        let input = req.body;
        console.log("pass")
        var newEater = new Eater({
                firstName: input.firstname,
                lastName: input.lastname,
                phoneNumber: input.phone,
                gender: input.gender,
                birthday: input.birthDay,
                address : input.ADDRESS,
                email : req.user.email,
                picture : $(location).attr('protocol')+'://'+$(location).attr('hostname')+'/photos/'+req.user._id+'/avatar/'+req.user._id+'.jpg',
                c_dCardNumber : input.Cardnumber,
                holderName : input.CardName,
                expiration_m : input.expireMonth,
                expiration_y : input.expireYear,
                cvv : input.CVV,
                billingAddress: input.BillingAddress,
                refPending : null,
                costTotal : 0,
                discount : 100
        });
        console.log(newEater);
        newEater.save((err, eaterData)=>{
                if(err) {
                        res.redirect(url.format({
                                pathname:"/",
                                query: {
                                        errorTopic: 'Account Setting Failed',
                                        errorDesc: err.message
                                }
                        }));
                }
                UserAuth.findOneAndUpdate({_id:req.user._id},{userDataId:eaterData._id},(err,eaterID)=>{
                        if(err) {
                                res.redirect(url.format({
                                        pathname:"/",
                                        query: {
                                                errorTopic: 'Account Setting Failed',
                                                errorDesc: err.message
                                        }
                                }));
                        }
                        res.redirect('/');
                        console.log("updated")
                        
                }); 
        })
        console.log("save!!!!");
});



app.post('/upload', (req, res) => {
        uploadHandler(req,res);
        //อ่านจาก database     
});
  
const uploadHandler = (req, res) => {
        if(req.files){
                let fileUploaded = req.files.fileUpload;
                let fileName = req.user._id+'.jpg';
                console.log(req.user._id.toString());
                let filePath = path.join('userSrc','photos',req.user._id.toString(),'avatar');
                console.log(filePath);
                console.log('Files named '+fileName+' was uploaded! to ->'+filePath);
                !fs.existsSync(path.resolve('userSrc','photos',req.user._id.toString())) && fs.mkdirSync(path.resolve('userSrc','photos',req.user._id.toString()));
                !fs.existsSync(path.resolve(filePath)) && fs.mkdirSync(path.resolve(filePath));
                fileUploaded.mv(path.join(filePath,fileName), (err) =>{
                        if(err) {
                                console.log("Can't save file recieved\n"+err);
                                res.status(500).send(err);
                        }
                        else {
                                console.log("save!!!!")
                                res.send('/photos/'+req.user._id+'/avatar/'+req.user._id+'.jpg');
                        } 
                });
        }
} 

app.post('/contactUs', (req,res) => {
        var contactemailback = {
                from: bingmeMail,
                to: req.body.conEmail,
                subject: '[BINGME] Thank you for contact us !'
        };
        contactemailback.text = 'Thank you " '+ req.body.conusername + ' " for contact us , we got message from you as "' + req.body.content + '" We will contact you as soon as possible'
        
        transporter.sendMail(contactemailback, function(error, info){
                if (error) {
                        console.log(error);
                } else {
                        console.log('Email sent: ' + info.response);
                }
        });
        res.redirect('/');
});

app.get('/dashboard', (req,res) => {
        // ZAAAAAAAAAAAAAAAAAAAAAA
});

var interact = io.of('/interact');
interact.on('connection', function(client){
        client.on('connectRoom', function(roomName, clientID){
                //Check if clientID have permission to see roomName
                client.join(roomName);
                console.log(roomName+" room is created!");
                client.room = roomName;
                interact.emit('ping','server is hello');
                client.on('interractData', function(Data,roomID,temp){
                        OrderPool.findByIdAndUpdate(Data._id,Data,(err)=>{
                                if(err) console.log(err);
                                else if(temp){
                                        console.log(Data);
                                        client.emit("thread", Data);
                                }
                                else{
                                        client.emit("thread", Data);
                                        client.broadcast.to(roomID).emit("thread", Data);
                                }
                        })
                });
        });
        client.on('disconnectRoom', function(roomName, clientID){
                //Check if clientID have permission to see roomName
                client.leave(roomName);
                console.log(roomName+" room is leaved!");
        });
        
});
server.listen(process.env.PORT || 5500, () => console.log('Server run on port 5500'));
