const express = require('express');
const passport = require('../config/passport')
const multer = require('multer')
const upload = multer()
// user middles
const userController = require('../controllers/user_controller')
const userAuth = require('../middlewares/user_session');
const errorController = require('../controllers/errorController')

// express 
const userRoute = express()

// set view engine
userRoute.set('view engine','ejs');
userRoute.set('views','./views/user');
 
// GET requests
userRoute.get('/',userController.loadHome)
userRoute.get('/register',userAuth.notLoggedin,userController.loadRegister)
userRoute.get('/login',userAuth.notLoggedin,userController.loadlogin)
userRoute.get('/userDashboard',userAuth.isLoggedin,userController.loadDashboard)
userRoute.get('/logout',userAuth.isLoggedin,userController.Logout)
userRoute.get('/forgot',userAuth.notLoggedin,userController.loadForgotPassword)
userRoute.get('/product-details/:id',userController.loadproducts)
userRoute.patch('/resendOtp',userController.resendOtp)
userRoute.get('/shop',userController.loadShop)
userRoute.get('/delete-address/:id',userAuth.isLoggedin,userController.deleteAdress)
userRoute.post('/add-address/:user_id',userController.addAddress)
// userRoute.get('/edit-address',userAuth.isLoggedin,userController.loadEditAddress)

//errror
userRoute.get('/500',errorController.load500)
userRoute.get('/404',errorController.load404)

// forgot
userRoute.post('/forgot/send-otp',userAuth.notLoggedin,userController.forgotSendOtp)
userRoute.patch('/forgot/verifyOtpAndChangePassword',userAuth.notLoggedin,userController.fogotPassAndChangePassword)


// POST requests
userRoute.post('/login',userController.verifyUser)
userRoute.post('/register',userController.registerAuth)
userRoute.put('/verify-otp',userController.verifyOtp)

userRoute.post('/update-address/:address_id',userAuth.isLoggedin,userController.updateAddress)


// cart
userRoute.get('/cart',userAuth.isLoggedin,userController.loadCart)
userRoute.get('/cart/validateCart/:id',userAuth.isLoggedin,userController.validateCart)
userRoute.get('/get-cart-summary',userAuth.isLoggedin,userController.getCartSummary)//this
userRoute.post('/addtoCart',userAuth.isLoggedin,userController.addtoCart)
userRoute.put('/update-cart',userController.updatecart)//this
userRoute.patch('/increase-quantity',userAuth.isLoggedin,userController.increaseItem)
userRoute.patch('/decrease-quantity',userAuth.isLoggedin,userController.decreaseQuantity)
userRoute.delete('/removeItem',userAuth.isLoggedin,userController.removeCartItem)
userRoute.post('/cart/applyCoupon',userAuth.isLoggedin,userController.applyCoupon)
userRoute.patch('/cart/removeCoupon',userAuth.isLoggedin,userController.removeCoupon)

// order 
userRoute.get('/checkoutpage/:user_id',userAuth.isLoggedin,userController.loadCheckout)
userRoute.post('/placeOrder',userAuth.isLoggedin,userController.placeOrder)
userRoute.get('/failedPayment/:id',userAuth.isLoggedin,userController.loadPaymentFailedPage)
userRoute.post('/failedPayment/:id',userAuth.isLoggedin,userController.paymentFailed)
userRoute.get('/retryPayment/:id',userAuth.isLoggedin,userController.retryPayment)
userRoute.post('/retryPayment',userAuth.isLoggedin,userController.retryPlaceOrder)
userRoute.post('/checkout/add-address/:id',userAuth.isLoggedin,userController.checkoutaddAddress)
userRoute.post('/checkout/update-address/:address_id',userAuth.isLoggedin,userController.checkoutupdateAddress)
userRoute.patch('/orders/cancelItem',userAuth.isLoggedin,userController.cancelOrderItem)
userRoute.patch('/orders/returnOrder',userAuth.isLoggedin,userController.returnOrder)
userRoute.get('/order/downloadInvoice/:id',userAuth.isLoggedin,userController.downloadInvoice)


//dashbord profile
userRoute.patch('/userDashboard/updatePersonal',upload.none(),userAuth.isLoggedin,userController.edituserPersonal) 
userRoute.patch('/userDashboard/changeEmail',upload.none(),userAuth.isLoggedin,userController.editUserEmail)
userRoute.patch('/userDashboard/changePassword',upload.none(),userAuth.isLoggedin,userController.changepassword)
userRoute.post('/userDashboard/verifyOtpAndChangePassword',userAuth.isLoggedin,userController.verifyOtpAndChangePassword)
userRoute.post('/userDashboard/verifyOtpAndChangeEmail',userAuth.isLoggedin,userController.verifyOtpAndChangeEmail)

// Razorpay
userRoute.post('/razorpay/createOrder',userAuth.isLoggedin,userController.createOrder)
userRoute.post('/razorpay/verify-payment',userAuth.isLoggedin,userController.verifyOrder)

// wallet
userRoute.post('/wallet/handledPayment',userAuth.isLoggedin,userController.handledPayment)

// wishlist
userRoute.get('/wishlist',userAuth.isLoggedin,userController.loadWishlist)
userRoute.post('/wishlist/:change',userController.addOrRemoveWishlist)
userRoute.delete('/wishlist/:change',userAuth.isLoggedin,userController.addOrRemoveWishlist)



userRoute.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
userRoute.get('/auth/google/callback',passport.authenticate('google',{successRedirect:"/auth/protected",failureRedirect:"/"}))  
userRoute.get('/auth/protected',userController.googleAuth)


module.exports = userRoute;