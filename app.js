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
        passportLocalMongoose = require('passport-local-mongoose');

const   UserAuth = require('./models/userAuth');

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

app.get('/', (req,res) => {
        let errSent = null;
        if(Object.keys(req.query).length > 0) errSent = req.query;
        console.log(req.user);
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
        UserAuth.register(new UserAuth({username: input.username}), input.password, (err, user) => {
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
});
app.post('/login', passport.authenticate('local',{
        successRedirect: '/',
        failureRedirect: '/'
}),(req,res)=>{
        console.log(req.body);
});

app.post('/logout', (req,res) => {
        req.logout();
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
        });
        client.on('disconnectRoom', function(roomName, clientID){
                //Check if clientID have permission to see roomName
                client.leave(roomName);
                console.log(roomName+" room is leaved!");
        });
});

server.listen(5500, () => console.log('Server run on port 5500'));