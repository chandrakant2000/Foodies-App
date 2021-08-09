require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var flash = require("connect-flash");

var routes = require("./routes");

// Package documentation - https://www.npmjs.com/package/connect-mongo
const MongoStore = require("connect-mongo");
 
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use("/reset/:token", express.static(__dirname + "/public"));
app.use("/admin-page/:file", express.static(__dirname + "/public"));
app.set("view engine", "ejs");

const url = 'mongodb+srv://' + process.env.DATABASE_USER + ':' + process.env.DATABASE_PASSWORD + 
'@cluster0.lwfr8.mongodb.net/' + process.env.DATABASE_NAME + '?retryWrites=true';

const sessionStore = new MongoStore({
  mongoUrl: url,
  collection: "sessions",
});


app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Equals 1 day (1 day * 24 hr/1 day * 60 min/1 hr * 60 sec/1 min * 1000 ms / 1 sec)
    }
  })
);

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! ... Shutting down...');
    console.log(err.name, err.message);
    process.exit();
});

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});


app.use(passport.initialize());
app.use(passport.session());


const connection = require("./Models/User");
const User = connection.models.User;

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use(flash());
// require("./Models/seed"); for adding an admin user
app.use(routes);

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started and running");
});