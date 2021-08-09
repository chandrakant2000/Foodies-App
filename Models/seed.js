require("dotenv").config();
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
// const passport = require ("passport");
const connection = require("./User");
const UserItem = require("./userItems");
const User = connection.models.User;

const adminUser = new User({
    username: process.env.USER,
    phone: 6370275979,
    fullName: 'Admin User',
    admin: true
});

User.register(adminUser, process.env.PASSWORD, function(err, user) {
    if (err) { 
       console.log(err);
    } else {
        const userItem1 = new UserItem ({
            _id: user._id,
            cart: [],
            pendingOrders: [],
            orderHistory: []
        });

        userItem1.save((error, result) => {
            if(error) {
                console.log(error);
            } else {
                console.log("created an empty userItem collection successfully");
            }
        });
        console.log("Admin added successfully");
    }
});

