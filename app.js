const   express = require('express'),
        app = express(),
        mongoose = require('mongoose'),
        ejs = require('ejs'),
        passport = require('passport'),
        bodyParser = require('body-parser'),
        LocalStrategy = require('passport-local'),
        passportLocalMongoose = require('passport-local-mongoose');

const   UserAuth = require('./models/userAuth');

mongoose.connect('mongodb://db_admin:db_11121150@ds029541.mlab.com:29541/bingme-dev-db');
app.set('view engine','ejs');
app.use(require('express-session')({
        secret: 'bing me is about eating',
        resave:false,
        saveUninitialized:false
}));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(UserAuth.serializeUser());
passport.deserializeUser(UserAuth.deserializeUser());

app.get('/', (req,res) => {
        if(req.user){
                res.render('index',{
                        user: req.user
                })
        }
        else res.render('index',{
                user:null
        });
});

app.get('/logout', (req,res) => {
        req.logout();
        res.redirect('/');
});


//comment by Mark

app.listen(5500, () => console.log('Server run on port 5500'));