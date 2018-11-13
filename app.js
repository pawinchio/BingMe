const   express = require('express'),
        app = express(),
        url = require('url'),
        server = require('http').createServer(app),
        io = require('socket.io').listen(server),
        mongoose = require('mongoose'),
        ejs = require('ejs'),
        passport = require('passport'),
        bodyParser = require('body-parser'),
        eater  = require("./models/eater"),
        hunter  = require("./models/hunter"),
        LocalStrategy = require('passport-local'),
        passportLocalMongoose = require('passport-local-mongoose'),
        nodemailer = require('nodemailer'),
        uuid = require('uuid/v1');;

const   UserAuth = require('./models/userAuth');
const   UserActivation = require('./models/userActivation');

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

app.post('/Eater', (req,res) => {
        //eaterdata
                var newEater = new UserEater({
                        FirstName: req.user.name,
                        LastName: String,
                        PhoneNumber: String,
                        Gender: String,
                        Birthday: String,
                        Picture : String,
                        Address : String,
                        c_dCardNumber : String,
                        HolderName : String,
                        Expiration : String,
                        CVV : String,
                        BillingAddress : String,
                        Email : String,
                });
                newEater.save().catch(err => {
                        console.log('Code Saving Failed'+err);
                });     
        res.redirect('/Eater');
});

//pawinccccccc

server.listen(5500, () => console.log('Server run on port 5500'));