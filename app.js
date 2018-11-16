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
        uuid = require('uuid/v1');;

var     Eater  = require("./models/eater"),
        Hunter  = require("./models/hunter"),
        Menu  = require("./models/menu"),
        OrderPool  = require("./models/orderPool"),
        StoreHistory  = require("./models/storeHistory"),
        UserAuth = require('./models/userAuth'),
        UserActivation = require('./models/userActivation');

const   tools = require('./calculations.js');

mongoose.connect('mongodb://db_admin:db_11121150@ds029541.mlab.com:29541/bingme-dev-db',{ useNewUrlParser: true } );
app.set('view engine','ejs');

app.use(express.static("public"));
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
                        error: errSent
                })
        }
        else res.render('index',{
                user: null,
                error: errSent
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
        if(req.body.email.toLowerCase() == req.user.email.toLowerCase()){
                var code = uuid();
                var newActivation = new UserActivation({
                        userId: req.user._id,
                        code: code
                });
                newActivation.save().then(()=>{
                        var mailOptions = {
                                from: bingmeMail,
                                to: req.body.email,
                                subject: '[BINGME] Verification Email',
                        };
                        mailOptions.html = activateEmailTemplate_th(req.user.username,req.get('host')+'/activate?code='+code);
                        transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                  console.log(error);
                                } else {
                                  console.log('Email sent: ' + info.response);
                                }
                        });
                }).catch(err => {
                        console.log('Code Saving Failed'+err);
                });     
        }
        res.redirect('/');
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
        let menuID = [];
        let storeID ;
        let storeLocation;
        let orderPoolId;
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
                                        }
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
                                storeID = store[0]._id
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
                        eaterID: req.body.eaterId,
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
                await sleep(3000)
                const second = await addStore(first)
                await sleep(3000)
                const third = await addOrderPool(second)
                await sleep(3000)
                const four = await addPendingOrder(third)
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
                                                eaterData = {user: eaterData, username: null};
                                                hunterData = {user: hunterData, username:null};
                                                if(eater) eaterData = {
                                                        ...eaterData,
                                                        username: eater.username
                                                }
                                                if(hunter) hunterData = {
                                                        ...hunterData,
                                                        username: eater.username
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
                                        userDetail.eaterDetail = {user,username : req.user.username};
                                })
                        }
                        else{
                                console.log("Hunter")
                                Hunter.findById(req.user.userDataId,async (err,user)=>{
                                        if(err) console.log(err);
                                        poolRef = user.refPending;
                                        userDetail.hunterDetail = {user,username : req.user.username};
                                        
                                })
                        }
                }
                else{
                        console.log("NULL")
                }
        }
        function getDetailPending() {
                OrderPool.findById(poolRef, (err,pool)=>{
                        if(err) console.log(err);
                        orderDetail = pool;
                        if(userDetail.hunterDetail==null){
                                console.log("A")
                                UserAuth.findById(pool.hunterID,(err,userF)=>{
                                        Hunter.findById(userF.userDataId,async (err,user)=>{
                                                if(err) console.log(err);
                                                userDetail.hunterDetail = {user,username : userF.username};
                                        })
                                        
                                })  
                        }
                        else{
                                console.log("B")
                                UserAuth.findById(pool.eaterID,(err,userF)=>{
                                        Eater.findById(userF.userDataId,async (err,user)=>{
                                                if(err) console.log(err);
                                                userDetail.eaterDetail = {user,username : userF.username};
                                        })
                                        
                                })   
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
                        }
                }).find((error, results) => {
                        if (error) console.log(error);
                        res.send(results);
                });
        
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
        });
        client.on('disconnectRoom', function(roomName, clientID){
                //Check if clientID have permission to see roomName
                client.leave(roomName);
                console.log(roomName+" room is leaved!");
        });
});

server.listen(5500, () => console.log('Server run on port 5500'));