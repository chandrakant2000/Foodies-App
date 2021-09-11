require("dotenv").config();
const router = require("express").Router();
const passport = require("passport");
const connection = require("../Models/User");
const nodemailer = require("nodemailer");
const User = connection.models.User;
const _ = require("lodash");

const Menu = require("../Models/menu");
const UserItem = require("../Models/userItems");
const Order = require("../Models/orders");

// Options passed to new Date().toLocaleDateString(undefined, options) method to get date in required format
const options = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};
 
var itemsArray = [];
var cartLength = 0;
var pendingOrders = 0;
var orderStatusNotification = "";

Menu.find({}, function(err,items){
    itemsArray = items;
});

///////////////////////////////////////////////  GET AND POST REQUESTS FROM USERS ///////////////////////////////////////////

// Generating custom tokens for sending emails to users
function customToken() {
    var buffreValue = Buffer.alloc(64);
    for (var i = 0; i < buffreValue.length; i++) {
        buffreValue[i] = Math.floor(Math.random() * 256);
    }
    var token = buffreValue.toString('base64').replace(/\//g,'_').replace(/\+/g,'-');
    return token;
}

// ROUTES
// GET REQUEST TO home.ejs
router.get("/", function (req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect("/menu");
    } else {
        res.render("home");
    }
});

// GET REQUEST TO menu.ejs
router.get("/menu", function (req, res, next) {
    if(req.isAuthenticated()) {
        Menu.find({}, function (err, items) {
            itemsArray = items;
        });
        UserItem.findById(req.user._id, function(error, useritem) {
            cartLength = useritem.cart.length;
            pendingOrders = useritem.pendingOrders.length;
        });
        res.render("menu", { menu: itemsArray, cartLength: cartLength, pendingOrders: pendingOrders });
    } else {
        res.redirect("/");
    }
});

// POST REQUEST FROM menu.ejs which saves items to user's cart
router.post("/menu", function(req, res, next) {

    Menu.findOne({menuCategory: req.body.category}, function(err, item){
        if(err) {
            console.log(err);
        } else { 
            item.menuItems.forEach(function(item){
                //check the requested item and it's size in menu database and retrieve the corresponding price of that item
                if(item.dishName === req.body.menuItem && item.size === req.body.size) {
                    UserItem.findById(req.user._id, function(error, userItem){
                        if(error) {
                            console.log(error);
                        } else {
                            userItem.cart.push({
                                itemName: item.dishName,
                                size: req.body.size,
                                quantity: req.body.qty,
                                price: item.price
                            });
                            userItem.save();
                            cartLength = userItem.cart.length;
                        }
                    });
                }

            });
        }
    });
    res.redirect("/menu");
});

// GET REQUEST TO profile.ejs
router.get("/profile", function (req, res, next) {
    if(req.isAuthenticated()) {
        UserItem.findById(req.user._id, function(error, useritem) {
            cartLength = useritem.cart.length;
            pendingOrders = useritem.pendingOrders.length;
        });
        res.render("profile", {user: req.user, cartLength: cartLength, pendingOrders: pendingOrders } );
    } else {
        res.redirect("/");
    }
});

// DELETE MY ACCOUNT REQUEST FROM profile.ejs 
// callback function is required for findByIdAndDelete method to execute
router.post("/deleteMyAccount", function(req, res){
    // first save the user ID before logging out user
    const userID = req.body.userID;
    //then logout the user
    req.logout();
    // find the user in UserItem collection and delete user's document
    UserItem.findByIdAndDelete(userID, function(err, useritem){
        if(err){console.log(err);}
    });
    // find the user in User collection and delete user's document
    User.findByIdAndDelete(userID, function(err, user){
        if(err){console.log(err);}
    });
    res.redirect('/');
});

//GET REQUEST TO cart.ejs 
router.get("/cart", function (req, res, next) {
    if(req.isAuthenticated()) {
        UserItem.findById(req.user._id, function(err, useritem) {
            if (err) {
                console.log(err);
            } else {
                let totalPrice = 0;
                useritem.cart.forEach(function(item){
                    totalPrice += item.quantity * item.price;
                });
                UserItem.findById(req.user._id, function (error, useritem) {
                    cartLength = useritem.cart.length;
                    pendingOrders = useritem.pendingOrders.length;
                });
                res.render("cart", {
                    userCart: useritem.cart,
                    totalPrice: totalPrice,
                    cartLength: cartLength,
                    pendingOrders: pendingOrders,
                });
            }
        });
    } else {
        res.redirect("/");
    }
});

//POST REQUEST FROM cart.ejs to remove an item from cart
// filter methods filters the array
router.post("/removeCartItem", function(req, res){
    UserItem.findById(req.user._id, function(err, useritem) {
        if (err) {
            console.log(err);
        } else {
            useritem.cart = useritem.cart.filter((item) => ( item.itemName !== req.body.itemName || (item.itemName === req.body.itemName && item.size !== req.body.size ) ));
            useritem.save();
            cartLength = useritem.cart.length;
            res.redirect("/cart");
        }
    });
});

//POST REQUEST FROM cart.ejs to clear the user's cart
router.post("/clearCart", function(req, res) {
    UserItem.findById(req.user._id, function(err, useritem) {
        if (err) {
            console.log(err);
        } else {
            useritem.cart = [];
            useritem.save();
            cartLength = useritem.cart.length;
            res.redirect("/cart");
        }
    }); 
});

//POST REQUEST FROM cart.ejs to place order
//It clears the user's cart and place the items in user's pending requests and add the items to Orders collection
router.post("/placeOrder", function(req, res) {
    UserItem.findById(req.user._id, function(err, useritem) {
        if (err) {
            console.log(err);
        } else {
            Order.find({}, function (error, order) {
                if (error) {
                    console.log(error);
                } else {
                    const orderNo = order.length;
                    let total = 0;
                    useritem.cart.forEach(function(item) {
                        total += item.price * item.quantity;
                    });
                    // create a new order and save it in orders collection
                    var currentTime = new Date();
                    var currentOffset = currentTime.getTimezoneOffset();
                    var ISTOffset = 330;   // IST offset UTC +5:30 
                    var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);

                    const date = ISTTime.toLocaleDateString(undefined, options);
                    const newOrder = new Order({
                        orderID: orderNo + 1,
                        user: {
                            userID: req.user._id,
                            email: req.user.username,
                            phone: req.user.phone,
                            fullName: req.user.fullName
                        },
                        status: "",
                        total: total,
                        date: date,
                        item: useritem.cart
                    });
                    newOrder.save();
                    // create a new pending order and save it to user's pendingorders
                    const newPendingOrder = {
                        totalPrice: total,
                        orderNo: orderNo + 1,
                        orderDate: date,
                        orderedItems: useritem.cart
                    };
                    // clear cart and add it to pending orders
                    useritem.pendingOrders.push(newPendingOrder);
                    useritem.cart = [];
                    useritem.save();
                    cartLength = useritem.cart.length;
                    pendingOrders = useritem.pendingOrders.length;
                    res.redirect("/cart");
                }
            });             
        }
    });
});

//GET REQUEST TO pending.ejs
router.get("/pending", function (req, res, next) {
    if(req.isAuthenticated()) {
        UserItem.findById(req.user._id, function(err, useritem) {
            if (err) {
                console.log(err);
            } else {
                UserItem.findById(req.user._id, function (error, useritem) {
                    cartLength = useritem.cart.length;
                    pendingOrders = useritem.pendingOrders.length;
                });
                const orderStatus = orderStatusNotification;
                orderStatusNotification = "";
                res.render("pending", {
                    PendingOrders: useritem.pendingOrders,
                    userFullName: req.user.fullName,
                    cartLength: cartLength,
                    pendingOrders: pendingOrders,
                    orderStatus: orderStatus 
                });
            }
        });
    } else {
        res.redirect("/");
    }
});

//GET REQUEST TO history.ejs
router.get("/history", function (req, res, next) {
    if(req.isAuthenticated()) {
        UserItem.findById(req.user._id, function(err, useritem) {
            if (err) {
                console.log(err);
            } else {
                UserItem.findById(req.user._id, function (error, useritem) {
                    cartLength = useritem.cart.length;
                    pendingOrders = useritem.pendingOrders.length;
                });
                res.render("history", {
                    orderHistory: useritem.orderHistory,
                    userFullName: req.user.fullName,
                    userID: req.user._id,
                    cartLength: cartLength,
                    pendingOrders: pendingOrders,
                });
            }
        });
    } else {
        res.redirect("/");
    }
});

//POST REQUEST FROM history.ejs TO CLEAR USER ORDER HISTORY
router.post("/clearUserOrderHistory", function(req, res){
    UserItem.findById(req.body.userID, function(err, useritem){
        if(err) {
            console.log(err);
        } else {
            useritem.orderHistory = [];
            useritem.save();
        }
    });
    res.redirect("/history");
});

////////////////////////////////////////  AUTHENTICATION AND AUTHORIZATION  //////////////////////////////////////

//LOGOUT CURRENT USER .... from home.ejs
router.get("/logout", function (req, res, next) {
    req.logout();
    res.redirect("/");
});

//SIGNUP A NEW USER .... from home.ejs
router.post('/signup', function(req, res, next) {
    // create a new object form request
    const registeredUser = new User({
      username: req.body.username,
      phone: req.body.phone,
      fullName: req.body.fullName,
      admin: false
    });
    // register the user and send error if the user is already registered
    User.register(registeredUser, req.body.password, function(err, user) {
        if (err) { 
            // email is already registered error, is shown and it is handled by client js file index.js
            return res.send(false);
        } else {
            const userItem1 = new UserItem ({
                _id: user._id,
                cart: [],
                pendingOrders: [],
                orderHistory: []
            });

            userItem1.save((err, result) => {
                if(err) {
                    console.log(err);
                }
            });

            passport.authenticate('local')(req, res, function() {
                return res.send(true);
            });
        }   
    });
});

//LOGIN A USER .... from home.ejs
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {return next(err); }
    // INCORRECT credentials
    if (!user) {
        return res.send(user);
    }
    // CORRECT credentials
    req.logIn(user, function(err) {
        if (err) {return next(err); }
        else {
            return res.send(true);
        } 
    });
  })(req, res, next);
});


////////////////////////////////////////////////////////    CHANGE PASSWORD SECTION    //////////////////////////////////////

let sessionExpired = false;

// GET REQUEST TO forgot.ejs 
router.get("/forgot", function(req, res, next) {
    if (req.isAuthenticated()) {
        //user is alreay logged in
        return res.redirect('/menu');
    } else {
        //UI with one input for email
        if (sessionExpired) {
            sessionExpired = false;
            res.render('forgot', {errorMessage: "", successMessage: "", sessionExpiredMessage: 'Password reset token is invalid or has expired. Please fill the form again.' });
        } else {
            res.render('forgot', {errorMessage: "", successMessage: "", sessionExpiredMessage: ""});
        }
    }
});

//POST REQUEST FROM forgot.ejs
router.post('/forgot', function (req, res) {
    if (req.isAuthenticated()) {
        //user is alreay logged in
        return res.redirect('/menu');
    } else {
        // find the user in User collection using entered email ID
        User.findOne({username: req.body.username}, function(err, user) {
            if(err) {
                console.log(err);
            } else {
                // IF email ID is not registered
                if(!user) {
                    res.render("forgot", {errorMessage: "Requested email id is not registered.", successMessage: "", sessionExpiredMessage: ""});
                } else {
                    // IF email ID is registered generate a random token and set a time for password expiry(Here 1 hour) and save these 2 item 
                    // in user's database
                    const getToken = customToken();
                    user.resetPasswordToken = getToken;
                    user.resetPasswordExpires = Date.now() + 6.5 * 3600000; // 1 hour time + 5.5 hour because of delay between IST and Z.
                    user.save(function (err) {
                        if(err) {
                            console.log(err);
                        } else {
                            console.log("Saved user successfully");
                        }
                    });
                    // setting up nodemailer
                    const transporter = nodemailer.createTransport({
                      service: "gmail",
                      auth: {
                        user: process.env.USER,
                        pass: process.env.PASSWORD,
                      },
                    });
                    // composing mail 
                    const mailOptions = {
                        to: user.username,
                        from: process.env.USER,
                        subject: 'Foodies Password Reset',
                        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' + 'Please click on the following link, or paste this into your browser to complete the process:\n\n' + 'http://' + req.headers.host + '/reset/' + getToken + '\n\n' + 'The link will be valid for 60 minutes only.\n If you did not request this, please ignore this email and your password will remain unchanged.\n\n Thank you\n Team Foodies'
                    };
                    // Sending mail to the user
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        }
                    });

                    res.render("forgot", {
                      errorMessage: "",
                      successMessage: user.username,
                      sessionExpiredMessage: ""
                    });
                }
            }
        });
    }
});

// GET REQUEST TO reset.ejs along with a token that is attached to password reset link sent to user's email
router.get('/reset/:token', function (req, res) {
    if (req.isAuthenticated()) {
        //user is alreay logged in
        return res.redirect('/menu');
    } else {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() + 5.5 * 3600000 } }, function(err, user) {
            if (!user) {
                //if time of 1hour is expired give error 'Password reset token is invalid or has expired.'
                sessionExpired = true;
                return res.redirect('/forgot');
            } else {
                // else send the user reset.ejs page to enter new password
                res.render('reset', {user: user});
            }
        });
    }
});

// POST REQUEST FROM reset.ejs along with a token that is attached to password reset link sent to user's email
router.post('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() + 5.5 * 3600000 } }, function(err, user) {
        if (!user) {
          //req.flash("error", "Password reset token is invalid or has expired.");
          sessionExpired = true;
          return res.redirect("/forgot");
        } else {
            // set new password
            user.setPassword(req.body.password, function() {
                user.save();
            });
            // remove the token and expiry time of user from User collection
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            // setting up nodemailer
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                user: process.env.USER,
                pass: process.env.PASSWORD,
                },
            });
            // composing mail 
            const mailOptions = {
                to: user.username,
                from: process.env.USER,
                subject: 'Your password has been changed',
                text: 'Hello,\n' + 'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n\n Thank You\n Team Foodies'
            };
            // Sending mail to the user that password has been changed
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                }
            });  
            
            // Login the user 
            req.logIn(user, function (err) {
              if (err) {
                return next(err);
              }
              return res.redirect('/menu');
            });
        }
    });
});

/////////////////////////////////////////////    ADMIN SECTION    /////////////////////////////////

// GET REQUEST TO adminLogin.ejs
//Admin login Page
router.get('/admin', function(req, res, next) {
    if(req.user) {
        if(req.user.admin === false) {
            // If current user is not a admin render him unauthorized.ejs page
            res.render("unauthorized");
        } else {
            // If the current user is a admin render him adminHome.ejs page
            res.render("adminHome");
        }
    } else {
        // render adminLogin.ejs  page if there is no logged in user
        res.render("adminLogin", {errorMessage: ""});
    }
});

// POST REQUEST FROM adminLogin.ejs
router.post('/admin', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
    if (err) {console.log(err); }
    else if (!user) {
        // Incorrect login credentials
        res.render('adminLogin', {errorMessage: "Incorrect email address or password."})
    } else {
        // Correct login credentials
        req.logIn(user, function(err) {
            if (err) {return next(err); }
            // If the user is NOT an admin first logout the user and send him unauthorized.ejs page
            else if (user.admin === false) {
                req.logout();
                currentUser = undefined;
                console.log("Logged out successfully");
               
                res.render("unauthorized");
            } else {
                // If the user is an admin send him adminHome.ejs page
                return res.render('adminHome');
            }
        });
    }
  })(req, res, next);
});

//////////////////////////////////// ADMIN SECTION ... REQUESTS TO Menu COLLECTION //////////////////////////

// POST REQUEST FROM adminItems.ejs .... add a new item to an existing menu category 
router.post('/addItem', function(req, res, next) {
    console.log(req.body);
    
    Menu.findOne({menuCategory: req.body.category}, function(err, category) {
        if(err) {
            console.log(err);
        } else {         
            // remove items(if any) with same itemName as requested
            category.menuItems = category.menuItems.filter((item) => item.dishName !==  _.toLower(req.body.itemName));  
            // add new requested item
            category.sizes.forEach(function (size, sizeIndex) {
                category.menuItems.push({
                    dishName: _.toLower(req.body.itemName),
                    price: req.body.Price[sizeIndex],
                    size: req.body.Size[sizeIndex],
                });
            });
            category.save(function(err, result) {
                if(err) {
                    console.log(err);
                } else {
                    Menu.find({}, function (err, items) {
                      itemsArray = items;
                    });
                }
            });     

            res.redirect("/admin-page/items");       
        }
    });
});

// POST REQUEST FROM adminItems.ejs .... update price of an item in existing menu category 
router.post("/updatePrice", function(req, res) {
    // First find the category in which requested item lies
    Menu.findOne({_id: req.body.categoryID}, function(err, category){
        if(err) {
            console.log(err);
        } else {
            const item = category.menuItems.id(req.body.itemID);
            // update price
            item["price"] = req.body.price;
            category.save(function(err, result) {
               if(err) {
                    console.log(err);
                } else {
                    Menu.find({}, function (err, items) {
                      itemsArray = items;
                    });
                } 
            });
            res.redirect("/admin-page/items");
        }
    });

});

// POST REQUEST FROM adminItems.ejs .... remove an item from an existing menu category 
router.post("/removeItem", function(req, res) {
    // First find the category in which requested item lies and delete the item
    Menu.findByIdAndUpdate(
    req.body.categoryID, { $pull: { "menuItems": { dishName: req.body.itemName } } }, { safe: true, upsert: true },
    function(err, node) {
        if (err) { console.log(err); }
        else {
            Menu.find({}, function (err, items) {
                itemsArray = items;
            });
        }
        res.redirect("/admin-page/items");  
    });

});

// POST REQUEST FROM adminItems.ejs .... add a new menu category 
router.post("/newCategory", function(req, res) {
   Menu.findOne({menuCategory: _.toLower(req.body.categoryName)}, function(err, className) {
    if(err) {
        console.log(err);
    } else {
        if(className) {
            // If the menu category already exists
            res.render("adminItems", {
              errorMessage: "Entered category already exists.",
              successMessage: "",
              itemsArray: itemsArray
            });
        } else {
            // add a new category if the requested menu category doesnot exists
            const sizeArray = [];
            if(req.body.size1 != '') { sizeArray.push(_.toLower(req.body.size1)); }
            if(req.body.size2 != '') { sizeArray.push(_.toLower(req.body.size2)); }
            if(req.body.size3 != '') { sizeArray.push(_.toLower(req.body.size3)); }
            if(req.body.size4 != '') { sizeArray.push(_.toLower(req.body.size4)); }
            if(req.body.size5 != '') { sizeArray.push(_.toLower(req.body.size5)); }
            const newCategory = new Menu({
                menuCategory: _.toLower(req.body.categoryName),
                sizes: sizeArray,
                menuItems: []
            });
            newCategory.save(function(err){
                if(err) {
                    console.log(err);
                }
            });
            itemsArray.push(newCategory);
            res.render("adminItems", {
              successMessage: "Successfully added new Item Category.",
              errorMessage: "",
              itemsArray: itemsArray
            });
        }
    }
   });
});

// POST REQUEST FROM adminItems.ejs .... delete a existing menu category
router.post("/removeCategory", function(req, res) {
    
    Menu.findOneAndRemove({menuCategory: _.toLower(req.body.categoryName)}, function(err, category) {
        if(err) {
            console.log(err);
        } else {
            Menu.find({}, function (error, items) {
                itemsArray = items;
            });
            res.redirect("/admin-page/items");
        }
        
    })
})

// HANDLES GET REQUESTS FROM adminHome.ejs, adminOrders.ejs, adminItems.ejs, adminUsers.ejs, adminHistory.ejs 
router.get("/admin-page/:file", function(req, res) {
    if(!req.user){
        res.redirect("/admin");
    }

    const fileToRender = "admin" + _.capitalize(req.params.file) + ".ejs";
    
    if(req.params.file === "items") {
        res.render(fileToRender, {
          successMessage: "",
          errorMessage: "",
          itemsArray: itemsArray
        });
    } else if(req.params.file === "orders" || req.params.file === "history") {
        Order.find({}, function(err, orders){
           if(err) {
               console.log(err);
           } else {
                res.render(fileToRender, {orders: orders});
           }
        });
    } else if(req.params.file === "users") {
        User.find({}, function(err, user){
           if(err) {
               console.log(err);
           } else {
                res.render(fileToRender, {users: user});
           }
        });
    } else {
        res.render(fileToRender); 
    }
});

// POST REQUEST FROM adminOrders.ejs
// Accept or reject order by admin .... request from adminOrders.ejs
router.post("/orderStatus", function(req, res) {
    // Find the user who ordered
    Order.findById(req.body.orderID, function(err, order){
        order.status = req.body.status;
        order.save();

        // based on status send an email to the user 
        // Success Message 
        let successOrderMessage = '<p>Hi, ' + order.user.fullName + '</p>' +
        '<h3>Thank you for your Order.<br> ✔ Your order is confirmed. It will be delivered soon.</h3>' + 
        '<p> Your order details: </p>' + 
        "<p><b> 1. Order No: " + order.orderID + '</b></p>' +
        "<p><b> 2. Date : " + order.date + "</b></p>" +
        '<table style="border: 2px solid #333; width: 100%; border-collapse: collapse; font-family: arial, sans-serif;">' +
        '<caption><h2> Items Ordered </h2></caption>' +
        '<tr style="background-color: #111; color: white">' +
        '<th style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse"> Item Name </th>' +
        '<th style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse"> Size </th>'  +
        '<th style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse"> Quantity </th>'  +
        '<th style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse"> Price </th>'  +
        '</tr>';
        order.item.forEach(function(orderItem, itemIndex) {
            if(itemIndex % 2 == 1) {
            successOrderMessage += 
                '<tr style="background-color: #dddddd;">' +
                '<td style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse">' + orderItem.itemName + '</td>' +
                '<td style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse">' + orderItem.size + '</td>' +
                '<td style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse">' + orderItem.quantity + '</td>' +
                '<td style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse">' + '₹' + orderItem.price + '</td>' +
                '</tr>'
            } else {
                successOrderMessage += 
                '<tr>' +
                '<td style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse">' + orderItem.itemName + '</td>' +
                '<td style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse">' + orderItem.size + '</td>' +
                '<td style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse">' + orderItem.quantity + '</td>' +
                '<td style="padding: 5px; text-align: center; border: 2px solid #333; border-collapse: collapse">' + '₹' + orderItem.price + '</td>' +
                '</tr>'
            }
        });
        successOrderMessage += '</table>' + 
        "<br><h3> 3. Total Amount: ₹" + order.total + " </h3>" +
        '<p> Thank You </p>' +
        '<p> Team Foodies </p>';
        // Failure Message
        let failureOrderMessage = "<p>Hi, " + order.user.fullName + "</p>" +
        '<p> We thank for your order No ' + order.orderID + ' dated ' + order.date + '. </p>' +
        '<p> But we regret to inform you that we will not able to supply your order. <p>' +
        '<p> We apologize for the inconvenience.' +
        '<p> Thank You </p>' +
        '<p> Team Foodies </p>';
        // Generating random token. customToken function is written at the top 
        const getToken = customToken();
        // setting up nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
            user: process.env.USER,
            pass: process.env.PASSWORD,
            },
        });
        // composing mail 
        let mailOptions = {
            to: order.user.email,
            from: process.env.USER,
        };
        // composing mail depending on order status
        if (req.body.status === 'accept') {
            mailOptions.subject = "Acceptance of Order";
            mailOptions.html = successOrderMessage;
        } else {
            mailOptions.subject = "Refusal of Order";
            mailOptions.html = failureOrderMessage;
        }
        // Sending mail to the user
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
        });
        // Remove the order form user's pending order array and add it to users orders history array
        UserItem.findById(req.body.personID, function(error, useritem){
            let removedPendingOrder = useritem.pendingOrders.filter((item) => item.orderNo == parseInt(req.body.orderNo));
            useritem.pendingOrders = useritem.pendingOrders.filter((item) => item.orderNo != parseInt(req.body.orderNo));
            
            // Add the removedPendingOrder to history of user with status flag
            const orderHistory = {
                totalPrice: parseInt(req.body.totalPrice),
                status: req.body.status,
                orderNo: parseInt(req.body.orderNo),
                orderDate: removedPendingOrder[0].orderDate,
                orderedItems: removedPendingOrder[0].orderedItems
            };
            useritem.orderHistory.push(orderHistory);

            useritem.save();
            pendingOrders = useritem.pendingOrders.length;
            //give user status messgae on pendingOrders page and message them to check email further details
            orderStatusNotification = "We received your Order request. Kindly check your email for further information."
        });
        res.redirect("/admin-page/orders");
    });
});




// export the router
module.exports = router;

