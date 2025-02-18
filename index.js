const express = require("express");
const app = express();
const session = require('express-session');
const passport = require('passport')
const  morgan = require('morgan');
const nocache = require('nocache');
const env = require('dotenv').config()
const db = require('./config/db')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const MongoStore = require("connect-mongo");
db();


const corsOptions = {
    origin: 'http://gambit.fun',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));
// middlewares
app.use(nocache())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL, // MongoDB connection URI
        ttl: 72 * 60 * 60, // Session expiration time in seconds
    }),
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:24*60*60*1000
    }
}))
app.use(passport.initialize())
app.use(passport.session())
// app.use(morgan('tiny'))

// routes 
const user_route = require('./routes/user_route');
const admin_route = require('./routes/admin_route');


// user
app.use('/',user_route);
// admin
app.use('/admin/',admin_route);

// app.all('*', (req, res) => {
//     res.redirect('/404');
// });

app.listen(4000,console.log("port 4000"))