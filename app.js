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
        EaterPic =require("./models/eaterPicture"),
        Hunter  = require("./models/hunter"),
        Menu  = require("./models/menu"),
        OrderPool  = require("./models/orderPool"),
        StoreHistory  = require("./models/storeHistory"),
        UserAuth = require('./models/userAuth'),
        UserActivation = require('./models/userActivation');

const   tools = require('./calculations.js');

mongoose.connect('mongodb://db_admin:db_11121150@ds029541.mlab.com:29541/bingme-dev-db',{ useNewUrlParser: true } );
app.set('view engine','ejs');
// app.use(expressSanitizer());
//app.use(methodOverride('_method'));
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
        interect();
        
        async function addMenu() {
                for(const menu of req.body.menu) {
                // req.body.menu.forEach(menu => {
                        await Menu.find({Name: menu.name},async (err,menuData)=>{
                                if(menuData[0]==null){
                                        console.log("notfound : "+menu.name);
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
                                        console.log("found : "+menu.name);
                                        await menuID.push(menuData[0]._id);
                                        
                                }
                        });
                };
        }
        
        async function addStore() {
                StoreHistory.find({storeName: req.body.storeData.name}, async (err,store)=>{
                        console.log("Menu ID : "+menuID);
                        // console.log(store);
                        // console.log(req.body.storeData.geometry.location.lng);

                        if(store[0]==null){
                                console.log("Add New Store : "+req.body.storeData.name);
                                storeData={
                                        img: null,
                                        locationStore:{
                                                type : 'Point',
                                                coordinates: [
                                                        req.body.storeData.geometry.location.lng,
                                                        req.body.storeData.geometry.location.lat
                                                ]
                                        },
                                        storeName: req.body.storeData.name,
                                        historyMenu: menuID,
                                        priceAvg: null,
                                        COPAvg: null
                                }
                                StoreHistory.create(storeData,(err,store)=>{
                                        // console.log(err);
                                        store.save(()=>{
                                                StoreHistory.find({storeName: req.body.storeData.name}, (err,store)=>{
                                                        storeID = store[0]._id;
                                                        storeLocation = store[0].locationStore;
                                                })
                                        });
                                })
                        }
                        else{
                                console.log("found : " + req.body.storeData.name);
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
                        order.save();
                        // console.log(order);
                })   
        }

        function sleep(ms){
                return new Promise(resolve=>{
                    setTimeout(resolve,ms)
                })
            }
        
        async function interect(){
                const first = await addMenu()
                await sleep(3000)
                const second = await addStore(first)
                await sleep(3000)
                const third = await addOrderPool(second);

        }
                
        res.send('request received by Backend');
});

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


app.post('/eaterDataForm', (req,res) => {
        //eaterdata
        var MongoClient = require('mongodb').MongoClient;
        let input = req.body;
        // console.log(req.body)
        console.log("pass")
                var newEater = new Eater({
                        firstName: input.firstname,
                        lastName: input.lastname,
                        phoneNumber: input.phone,
                        gender: input.gender,
                        birthday: input.birthDay,
                        address : input.ADDRESS,
                        email : input.email,
                        picture : '/photos/'+req.user._id+'/avatar/'+req.user._id+'.jpg',
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
                // console.log(newEater);
                // console.log(req.user._id);
                newEater.save().catch(err => {
                        console.log('Code Saving Failed'+err);
                        
                });
                console.log("save!!!!");
                // collection.update({_id:"req.user._id"}, {userDataId:"res.user._id"});
                // MongoClient.connect(url, function(err, db) {
                // if (err) throw err;
                // var dbo = db.db("mydb");
                // var myquery = { _id:req.user._id };
                // var newvalues = { $set: { userDataId: res.user._id } };
                // dbo.collection("customers").updateOne(myquery, newvalues, function(err, res) {
                //         if (err) throw err;
                //         console.log("1 document updated");
                //         db.close();
                //         });
                // });
                
                // req.user._id   find in userauth update userdata_id
                
                   

});

// ajax with jquery


// ------------------------------------------------------
const fileUpload = require('express-fileupload');
const fs = require('fs');
const mkdirp = require('mkdirp');
// const path = require('path');
app.use(fileUpload());
app.use(express.static("userSrc"));

app.post('/upload', (req, res) => {
        uploadHandler(req,res, () =>{
                res.send('/photos/'+req.user._id+'/avatar/'+req.user._id+'.jpg');
        });
        //อ่านจาก database
        
        
});
      
//-----------------------------------------------------------
const uploadHandler = (req, res, callback) => {
        if(req.files){
                let fileUploaded = req.files.fileUpload;
                let fileName = req.user._id+'.jpg';
                console.log(req.user._id.toString());
                let filePath = path.join('userSrc','photos',req.user._id.toString(),'avatar');
                console.log(filePath);
                console.log('Files named '+fileName+' was uploaded! to ->'+filePath);
                fs.mkdir(path.join(__dirname,filePath), {recursive:true}, (err) => {
                        if(!err){
                                fileUploaded.mv(path.join(filePath,fileName), (err) =>{
                                        if(err) {
                                                console.log("Can't save file recieved");
                                                res.status(500).send(err);
                                        }
                                        console.log("save!!!!")
                                        callback();
                                });
                        }
                });
                // if(!fs.existsSync(path.join(__dirname,filePath,' '))){
                //         fs.mkdirSync(path.join(__dirname,filePath,' '));
                // }
                // fileUploaded.mv(filePath+fileName, (err) =>{
                //         if(err) {
                //                 console.log("Can't save file recieved");
                //                 res.status(500).send(err);
                //         }
                //         console.log("save!!!!")
                //         callback();
                // });

        }
        // res.send(req.files);
        // เก็บลงDatabase

} 
        
        

//-----------------------------------------------------------

server.listen(5500, () => console.log('Server run on port 5500'));