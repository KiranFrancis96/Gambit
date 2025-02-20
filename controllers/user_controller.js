const mongoose = require('mongoose')
const User = require('../model/user_schema')
const bcrypt = require('bcrypt')
const PDFDocument = require('pdfkit')
const {format, parseISO, formatDate} = require('date-fns');

const Products = require('../model/product_schema')
const Category = require('../model/category_schema')
const Cart = require('../model/cart_schema')
const AddressModel = require('../model/address_schema')
const orderModel = require('../model/order_schema')
const nodemailer = require('../config/nodemailer');
const Return = require('../model/order_return_Schema')
const Wallet = require('../model/wallet_schema')
const Coupon = require('../model/coupon_schema')
const Wishlist = require('../model/wishlist_schema')
const Razorpay = require('../config/Razorpay');


require('dotenv').config()


function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
}

const loadlogin = async function(req,res){
    try {
        res.render('login')
    } catch (error) {
        console.log(error);
        return res.redirect('/500')
    }
}

const loadRegister = async function (req,res){
    try {
        res.render('registration')
    } catch (error) {
        console.log(error);
        return res.redirect('/500')
    }
}

const loadHome = async function(req,res){
    try {
        const categories = await Category.find({isListed:true})
        const products = await Products.find({isActive:true}).populate({path:'product_category',populate:{path:'offer'}}).populate('offer').limit(6)
        const sortedProducts = await Products.find({isActive:true}).sort({createdAt:-1}).limit(10)
        const wishlist = await Wishlist.findOne({ userId: req.session.user_id });
        res.render('home',{products,categories,sortedProducts,wishlist})
    } catch (error) {
        console.log(error);
        return res.redirect('/500')
    }
}

const loadDashboard = async function(req, res) {
    try {
   
        let query = {};
        if (mongoose.Types.ObjectId.isValid(req.session.user_id)) {
            query._id = req.session.user_id;
        } else {
            query.googleId = req.session.user_id;
        }

        const wallet = await Wallet.findOne({ user: req.session.user_id });
        if (wallet) {
            wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        const user = await User.findOne(query).populate('address');
        console.log('user',user)
        const orderData = await orderModel.find({ user: req.session.user_id }).sort({createdAt:-1,updatedAt:-1});

        return res.render('user_Dashboard', { user, orderData, wallet });
    } catch (error) {
        console.log(error);
        return res.redirect('/500')
    }
};


const loadForgotPassword = async function(req,res){
    try {
        res.render('forgot-password')
    } catch (error) {
        return res.redirect('/500')
    }
}

const Logout = async function (req,res){
    try {
        req.session.destroy()
        res.redirect('/')
    } catch (error) {
        console.log(error);
        return res.redirect('/500')
    }
}

const registerAuth = async function (req,res){
    try {
        const email = req.body.email
        const password = req.body.password;
        const passhash = await bcrypt.hash(password, 10);
        req.session.regitrationmail = email

 
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            if(!existingUser.isVerified){
                const otp = await generateOtp()
                console.log("OTP:",otp)
                let otpSession = {
                    otp:otp,
                    otpExp: new Date(Date.now() + 5 * 60 * 1000),
                    email:email
                }
                const mailcontent = `<h1> Thank you for choosing Gambit</h1>
                <p>please click on the link below to activate your account or use the code below:</p>
                ${otp}`
        
                const sendmail = await nodemailer(email,mailcontent,otp)
                req.session.otpSession = otpSession
                return res.render('otp-verification',{email,fail:'email already exists! verify your email'})
            }
            if(existingUser.isVerified){
                return res.render('login',{email,msg:'email already exists please login'})
            }
        }
      
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            password: passhash
        })

        const otp = generateOtp()
        console.log("OTP:",otp)
        let otpSession = {
            email:req.body.email,
            otp:otp,
            otpExp: new Date(Date.now() + 5 * 60 * 1000)
        }

        req.session.otpSession = otpSession
        // console.log(req.session.otpSession)

        await user.save();
        console.log("User saved to database");

       

        const mailcontent = `<h1> Thank you for choosing Gambit</h1>
        <p>please click on the link below to activate your account or use the code below:</p>
        ${otp}`
        const mailsend = await nodemailer(req.body.email,mailcontent,otp)
        if(mailsend){
        res.render('otp-verification',{success: "Registration successful! now verify your mail"})
        }

    } catch (error) {
        console.log("Error in registration",error.message);
        return res.redirect('/500')
    }
}

const verifyOtp = async function (req,res){
    try {
        const otp = req.body.otp
        if(!otp) {
            return res.status(400).json({success:false,message:'please enter otp'})
        }
        const {otp:sOtp,email:sEmail,otpExp:sOtpExp} = req.session.otpSession
        const userData = await User.findOne({email:sEmail})
        if(!userData || otp!=sOtp) {
            return res.status(400).json({success:false,message:'please check your otp again!'})
        }
        if(sOtpExp < Date.now()){
            req.session.otpSession = null
            return res.status(400).json({success:false,message:'otp Expired'})
        }    
        userData.isVerified = true
        await userData.save()
        req.session.otpSession = null
        return res.status(200).json({success:true,message:'otp verified successfully'})
    
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:'Internal Server Err0r'})
    }
}

const verifyUser = async function(req,res){
    try {
        const{email,password} = req.body;
        console.log("asdaffffffffffffffffffffffff",password)
        if(req.session.otpSession){
            req.session.otpSession = null
        }

        console.log("bodyyyyyyyyy",email)
      const userData = await  User.findOne({email:email})
      console.log("USERRRRRRRRRR",userData)
    if(!userData.isVerified){
        const otp = await generateOtp()
        console.log("OTPPPPPPP",otp)
        let otpSession = {
            otp:otp,
            otpExp: new Date(Date.now() + 5 * 60 * 1000),
            email:email
        }
        const mailcontent = `<h1> Thank you for choosing Gambit</h1>
        <p>please click on the link below to activate your account or use the code below:</p>
        ${otp}`

        const sendmail = await nodemailer(email,mailcontent,otp)
        req.session.otpSession = otpSession
        return res.render('otp-verification',{email,fail:'email already exists! verify your email'})
    }
      if(userData &&  !userData.googleId){
        const pasmatch = await bcrypt.compare(password, userData.password)

        if(!pasmatch){
            res.render('login',{msg:"invalid password"})
          }else{
            if(userData.block){
                return res.render('login',{msg:'user is blocked'})
            }
                req.session.user_id = userData._id;

                return res.redirect('/');
            
          }
      }else{
        res.render('login',{msg:'invalid email'})
      }
    } catch (error) {
        console.log(error);
        return res.redirect('/500')
    }
}
const googleAuth = async function(req, res) {
    try {
        // console.log('Full req.user object:', JSON.stringify(req.user, null, 2));
        // console.log(req.user);
        
        const { id, displayName, emails } = req.user;
        const email = emails && emails.length > 0 ? emails[0].value : null;
        // const mobile = phoneNumbers && phoneNumbers.length > 0 ? phoneNumbers[0].value : null;
        
        // console.log('ID:', id);
        // console.log('Display Name:', displayName);
        // console.log('Email:', email);
        // console.log('Phone number:', mobile);
        
       
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
          
            const newUser = new User({
                name: displayName,
                email,
                googleId: id,
                isVerified: true 
            });
            const savedUser = await newUser.save();
            
            req.session.user_id = savedUser._id;
        } else {
           
            req.session.user_id = existingUser._id;
        }

        
        return res.redirect('/');
    } catch (error) {
        console.error('Google authentication failure:', error);
        return res.redirect('/500')
    }
};


const loadproducts = async (req, res) => {
    try {
        const userId = req.session.user_id
        // console.log(mongoose.Types.ObjectId.isValid(userId))
        const product = await Products.findOne({ _id: req.params.id, isActive: true }).populate('product_category');
        
        if (!product) {
            return res.redirect('/404')
        }

        const relatedProducts = await Products.find({ product_category: product.product_category._id, isActive: true })
            .populate('product_category')
            .limit(4);

        let productIds = await Cart.findOne({user:userId})
        productIds = productIds?.items?.map(item => item.product.toString())
        // console.log(productIds);
        
        return res.render('product_details', { product, relatedProducts, productIds });
        
    } catch (error) {
        console.log(error.message);
        return res.redirect('/500')
    }
};


const resendOtp = async(req,res)=>{
    try {
        const otp = generateOtp()
        console.log( generateOtp())
        let email

        if(req.session.otpSession.email){
            email = req.session.otpSession?.email
            req.session.otpSession = null
        }
        const userData = await User.findOne({email:email})
        if(!userData){return res.status(404).json({success:false,message:'User not found'})}
        if(userData && userData.isVerified){return res.status(400).json({success:false,message:'user already verified'})}
        
        const mailcontent = `<h1> Thank you for choosing Gambit</h1>
        <p>please click on the link below to activate your account or use the code below:</p>
        ${otp}`
        
        req.session.otpSession ={
            email:email,
            otp:otp,
            otpExp:new Date(Date.now() + 5 * 60 * 1000)
        }
        const sendmail = await nodemailer(email,mailcontent,otp)
        if(sendmail){
           return res.status(200).json({success:true,message:'Otp send successfully verify email now'})
        }
        return res.status(300).json({success:false,message:'Network error Please check your connection'})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success:false,message:'Internal Server Error'})
    }
}
const loadShop = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6; 
        const skip = (page - 1) * limit;

        let query = {};
console.log("QUER",req.query.query)
        
        if (req.query.query || req.query.search) {  
            const searchTerm = req.query.query ? req.query.query.toLowerCase() : req.query.search 
            query.product_name = { $regex: searchTerm, $options: 'i' }; 
         
        }
         
        if (req.query.prev) {
            query = JSON.parse(req.query.prev);
            console.log("PREV:",req.query.prev);
            
        }

        if (req.query.categories) {
            const categories = Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories];
            query.product_category = { $in: categories };
        }

        if (req.query.inStock === 'true' && req.query.outOfStock !== 'true') {
            query.product_quantity = { $gt: 0 };
        } else if (req.query.outOfStock === 'true' && req.query.inStock !== 'true') {
            query.product_quantity = 0;
        }

        let sort = {};
        switch (req.query.sort) {
            case 'price-asc':
                sort = { product_sale_price: 1 };
                break;
            case 'price-desc':
                sort = { product_sale_price: -1 };
                break;
            case 'name-asc':
                sort = { product_name: 1 };
                break;
            case 'name-desc':
                sort = { product_name: -1 };
                break;
           
            case 'popularity':
                sort = { sales_count: -1 };
                break;
            case 'rating':
                sort = { rating: -1 };
                break;
            case 'discount':
                sort = { offerPrice: -1 };
                break;
            default:
                sort = { createdAt: -1 };
        }

        if (req.query.query) {
            const suggestions = await Products.find({ product_name: { $regex: req.query.query, $options: 'i' } })
                .limit(10)
                .select('product_name'); 
            return res.json({ success: true, suggestions: suggestions.map(product =>({id:product._id, name: product.product_name })) });
        }

        const products = await Products.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('product_category');

        const totalProducts = await Products.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        const categories = await Category.find();
        const wishlist = await Wishlist.findOne({ userId: req.session.user_id });
        // console.log('user',req.session.user_id)
        // console.log('wishlist',wishlist)
        res.render('shop', {
            wishlist,
            products,
            page,
            totalPages,
            categories,
            currentFilters: req.query,
            query: JSON.stringify(query)
        });
    } catch (error) {
        console.error(error);
        return res.redirect('/500')
    }
};






const checkoutaddAddress  =  async(req,res)=>{
    try {
        const {name,phone,alt_phone,Address,city,state,pincode}= req.body
        const addAddress = new AddressModel({
            fullname:name,
            mobile:phone,
            pincode,
            altMobile:alt_phone,
            state,
            city,
            Address
        })
        const savedAddress =  await addAddress.save()

        const user = await User.findById(req.params.id)
        
        
        user.address.push(savedAddress._id)
        await user.save()

           return res.redirect(`/checkoutpage/${user._id}`)

    } catch (error) {
        console.log(error.message);
        return res.redirect('/500')     
    }
}
const addAddress  =  async(req,res)=>{
    try {
        const {name,phone,alt_phone,Address,city,state,pincode}= req.body
        const addAddress = new AddressModel({
            fullname:name,
            mobile:phone,
            pincode,
            altMobile:alt_phone,
            state,
            city,
            Address
        })
       const savedAddress =  await addAddress.save()
        const user = await User.findById(req.params.user_id)
        user.address.push(savedAddress._id)
        await user.save()
        
        res.redirect('/userDashboard')
    } catch (error) {
        console.log(error.message);
        return res.redirect('/500') 
    }
}


const updateAddress = async(req,res)=>{
    const existingaddress = await AddressModel.findById(req.params.address_id)
    if(!existingaddress){
        console.log('no existing address');
    }
   
    try {

        const {name,phone,alt_phone,Address,city,state,pincode}=req.body
        await AddressModel.findByIdAndUpdate(req.params.address_id,{$set:{
            fullname:name,
            Address:Address,
            altMobile:alt_phone,
            city:city,
            mobile:phone,
            pincode:pincode,
            state:state
        }})

        
        
        return res.redirect('/userDashboard')
    } catch (error) {
        console.log(error.message);
        return res.redirect('/500')   
    }
}

const deleteAdress = async (req,res)=>{
   
    try {
        await AddressModel.findByIdAndDelete(req.params.id)
        await User.findOneAndUpdate({address:req.params.id},{$pull:{address:req.params.id}})
        return res.redirect('/userDashboard')
    } catch (error) {
        console.log(error.message);
        return res.redirect('/500')
    }
    
}


const edituserPersonal = async(req,res)=>{
    // console.log(req.body);
    
    const {name,mobile} = req.body
    if(!name || !mobile){
        return res.status(400).json({success:false,message:'please enter the required fields'})
    }
    const user = await User.findOne({_id:req.session.user_id});
    if(!user){
        return res.status(400).json({success:false,message:'user not found please login'})
    }

    try {
    
    user.name = name
    user.mobile = mobile
    const userData = await user.save()
    return res.status(200).json({success:true,message:'user name changed successfully',user:userData})   
    
    } catch (error) {
        return res.status(500).json({success:false,message:'server error'})
    }

}
const verifyOtpAndChangeEmail = async (req, res) => {
    const { email, otp, newEmail } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Please provide both email and OTP.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email.' });
        }

        if (user.otp === otp && user.otpexp > Date.now()) {
            user.otp = null;
            user.otpexp = null;
            user.email = newEmail;
            const userData = await user.save();
            return res.status(200).json({ success: true, message: 'OTP verified successfully', user: userData });
        } else if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        } else if (user.otpexp < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired.' });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

const editUserEmail = async (req, res) => {
    if (!req.body || !req.body.newEmail || !req.body.confirmNewEmail) {
        return res.status(400).json({ success: false, message: 'Please provide the new email address' });
    }
    const { newEmail, confirmNewEmail } = req.body;

    if (newEmail !== confirmNewEmail) {
        return res.status(400).json({ success: false, message: 'Emails do not match' });
    }

    const existingEmail = await User.findOne({ email: newEmail });
    if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already exists. Please enter another email.' });
    }

    try {
        const otp = generateOtp();
        const mailContent = `
            <h1>Changing Email</h1>
            <p>Please use the following code to verify your new email address:</p>
            <p><strong>${otp}</strong></p>`;

        const sendMailSuccess = await nodemailer(newEmail, mailContent, otp);
        if (!sendMailSuccess) {
            return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again later.' });
        }

        const user = await User.findById(req.session.user_id);
        if (!user) {
            return res.status(400).json({ success: false, message: 'No user found. Please log in again.' });
        }
        
        user.otp = otp;
        user.otpexp = new Date(Date.now() + 5 * 60 * 1000);
        const userData = await user.save();

        return res.status(200).json({ success: true, message: 'OTP sent successfully. Please check your email.', user: userData, newEmail });

    } catch (error) {
        console.error('Error in editUserEmail:', error);
        return res.status(500).json({ success: false, message: 'Internal server error. Please try again later.' });
    }
};


const changepassword = async(req,res)=>{
    if(!req.body){
        return res.status(400).json({success:false,message:'Please enter some credentials'})
    }
    
    const {currentPass,newPass,confirmNewPass} = req.body
    if(newPass!=confirmNewPass){
        return res.status(400).json({success:false,message:'confirm password is not same as new password'})
    }
    const user = await User.findById(req.session.user_id)
    if(!user){
        return res.status(400).json({success:false,message:'no user found please login'})
    }
    const passmatch = await bcrypt.compare(currentPass,user.password)
    if(!passmatch){
        return res.status(400).json({success:false,message:'Invalid password'})
    }
    try {
        const otp = generateOtp()
        const mailcontent = `<h1>Requested to change password</h1>
        <p>please confirm mail!  use the code below:</p>
        ${otp}`
        const sendmail = await nodemailer(user.email,mailcontent,otp)
        if(!sendmail){
            return res.status(400).json({success:false,message:'mail send failed please provide check your mail'})
        }
        user.otp = otp
        user.otpexp = new Date(Date.now() + 5 * 60 * 1000);
        const newpass = await bcrypt.hash(newPass,10)
        const userData = await user.save()

        return res.status(200).json({success:true,message:'Success! please verify your mail now',user:userData,newpass})
    } catch (error) {
        return res.status(500).json({success:false,message:'Internal server error'})
    }

}
const verifyOtpAndChangePassword = async(req,res)=>{
    if(!req.body){
        return res.status(400).json({success:false,message:'please enter the credentials'})
    }
    const {otp,newpass,email} = req.body

    const user= await User.findOne({email})
    if(!user){
        return res.status(400).json({success:false,message:'couldnt find the user try logging in again'})
    }
    try {
        if(user.otp == otp && user.otpexp>Date.now()){
            user.otp = null;
            user.otpexp = null;
            user.password = newpass;
            await user.save()
        }else if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        } else if (user.otpexp < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired.' });
        }

        return res.status(200).json({success:true,message:'otp verified successfully! password changed'})
    } catch (error) {
        return res.status(500).json({success:false,message:'Internal server error'})
    }
}
const forgotSendOtp = async (req, res) => {
    try {
        // console.log(req.body);
        const { email, newpass, currentpass, confirmPass } = req.body;
        
    
        if (!email || !newpass || !currentpass || !confirmPass) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

 
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'No user found with this email.' });
        }

        
        const passmatch = await bcrypt.compare(currentpass, user.password);
        if (!passmatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        if (newpass === currentpass) {
            return res.status(400).json({ success: false, message: 'New password must be different from the current password.' });
        }

        
        const newPassMatch = await bcrypt.compare(newpass, user.password);
        if (newPassMatch) {
            return res.status(400).json({ success: false, message: 'New password cannot be the same as the old password.' });
        }

        const otp = generateOtp();
        const mailContent = `
            <h1>Password Reset Request</h1>
            <p>Please use the following code to verify your request:</p>
            <p><strong>${otp}</strong></p>
        `;
        
        const sendmail = await nodemailer(user.email, mailContent, otp);
        console.log('mail send');
        
        if (!sendmail) {
            return res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
        }

        user.otp = otp;
        user.otpexp = new Date(Date.now() + 5 * 60 * 1000); 
        const hashpass = await bcrypt.hash(newpass,10)
        await user.save();

        return res.status(200).json({ success: true, message: 'OTP sent. Please check your email.', hashpass });

    } catch (error) {
        console.error('Error in forgotSendOtp:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
const  fogotPassAndChangePassword =async(req,res)=>{
    try {
        const {email,otp,newpass} = req.body
        // console.log(req.body)
        const user =await User.findOne({email})
        if(!user){
            return res.status(400).json({success:false,message:'no user found with this email'})
        }

        
        if(user.otp == otp && user.otpexp>Date.now()){
     
            
            user.otp = null;
            user.otpexp = null;
            user.password = newpass;
            await user.save()
            return res.status(200).json({success:true,message:'otp verified successfully! password changed'})
        }else if (user.otp !== otp) {
        
            
            
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        } else if (user.otpexp < Date.now()) {            
            return res.status(400).json({ success: false, message: 'OTP expired.' });
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal server error.'})        
    }
}



// -------------------cart part ---------------------------

const validateCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({_id: req.params.id}).populate('items.product');
        if (!cart) {
            return res.status(400).json({ success: false, message: 'Cart not found' });
        }

        for (const item of cart.items) {
            if (item.product.product_quantity < item.quantity) {
                return res.status(400).json({ success: false, message: 'Maximum quantity reached, check product quantity' });
            }
        }
        
        return res.status(200).json({ success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const loadCart = async (req, res) => {
    try {
        const user = req.session.user_id;

        let cart = await Cart.findOne({ user }).populate([
            { path: 'user', populate: { path: 'address' } },
            { path: 'items.product' }
        ]);

        if (!cart) {
            cart = {
                user: req.session.user_id,
                items: [],
                summary: {
                    subtotal: 0,
                    deliveryCharges: 0,
                    offerDiscount: 0,
                    couponDiscount: 0,
                    total: 0
                }
            };
        }

        let summary = calculateCartSummary(cart, 0, cart?.summary?.offerDiscount || 0);
        cart.summary = summary;

        const coupons = await Coupon.find({ isActive: true });

        return res.render('cart', { cart, coupons, summary });

    } catch (error) {
        console.log(error.message);
        return res.redirect('/500')
    }
};

const updatecart = async(req,res)=>{
    try {
        const userId = req.session.user_id
        if(!userId) {
            return res.status(400).json({success:false,message:'Please Login'})
        }
        const productId = new mongoose.Types.ObjectId(req.body.productId)
        let cartData = await Cart.findOne({user:userId})

        if(cartData && cartData.items && cartData.items.length > 0){
            const existingItem = cartData?.items.filter(item=>item.product.toString() === productId.toString())
            console.log('existingItem:',existingItem)
            if(existingItem.length>0){
                return res.status(404).json({success:false,message:'Item already exist in cart',itemExist:true})
            }
        }else{
            cartData = new Cart({ user: userId, items: [] });
        }
        const productDetails = await Products.findById(productId).populate('product_category');

        if(productDetails.product_quantity <= 0) {
            return res.status(404).json({success:false,message:'product is out  of stock'})
        }

        let itemOffer = {};
        if (productDetails) {
            if (productDetails.offerType === 'product' && productDetails.offer?.expiryDate > Date.now()) {
                // console.log('product offer workng');
                itemOffer = {
                    name: productDetails.offer?.name,
                    discountPercentage: productDetails.offer?.discountPercentage,
                    startDate: productDetails.offer?.startDate,
                    expiryDate: productDetails.offer?.expiryDate,
                    offerAmount: productDetails.product_sale_price - productDetails.offerPrice,
                    offerType: productDetails.offerType
                };
            } else if (productDetails.offerType === 'category' && productDetails.product_category.offer?.expiryDate > Date.now()) {
                // console.log('category offer workng');
                itemOffer = {
                    name: productDetails.product_category?.offer?.name,
                    discountPercentage: productDetails.product_category?.offer?.discountPercentage,
                    startDate: productDetails.product_category?.offer?.startDate,
                    expiryDate: productDetails.product_category?.offer?.expiryDate,
                    offerAmount: productDetails.product_sale_price - productDetails.offerPrice,
                    offerType: productDetails.offerType
                };
            }
        }

        const item = {
            product: productId,
            quantity: 1,
            price: productDetails.product_sale_price,
            regularPrice: productDetails.product_regular_price,
            itemOffer: itemOffer || {}
        };
        if(cartData.items && cartData.items.length > 0){
            cartData.items = [...cartData.items, item];
        }else{
            cartData.items = [item]
        }

        let existingOffer = cartData?.summary?.offerDiscount || 0;
        let offerDiscount = 0;

        if (Object.keys(itemOffer).length > 0) {
            offerDiscount = existingOffer + (productDetails.product_sale_price - productDetails.offerPrice);
            // console.log('this is item Offer',itemOffer);
        } else {
            offerDiscount = existingOffer;
        }
        
        const summary = calculateCartSummary(cartData,0,offerDiscount);
        cartData.summary = summary;

        await cartData.save();
       
        return  res.status(200).json({success:true,message:'Item Added to Cart'})

    } catch (error) {
        console.log(error)
        return res.status(500).json({success:false,message:'Internal Server Error'})
    }
}

const addtoCart = async (req, res) => {
    try {
        const { offerPrice, ogprice, price, product } = req.body;
        const userId = req.session.user_id;
        const productId = new mongoose.Types.ObjectId(product);

        let cart = await Cart.findOne({ user: userId });

        if (cart) {
            const existingCartItemIndex = cart.items.findIndex(item => item.product.toString() === productId.toString());
        if (existingCartItemIndex !== -1) {
                return res.redirect('/cart');
         }
        } else {
            cart = new Cart({ user: userId, items: [] });
        }

        
        const productDetails = await Products.findById(productId).populate('product_category');
        if(productDetails.product_quantity <= 0) { 
            return res.status(400).send(`<h4 style="color:red">product is out of stock</h4>
                                        <br> <a href="/shop">continue shopping</a>`)
        }
      
        let itemOffer = {};
        if (productDetails) {
            if (productDetails.offerType === 'product' && productDetails.offer?.expiryDate > Date.now()) {
                console.log('product offer workng');
                itemOffer = {
                    name: productDetails.offer?.name,
                    discountPercentage: productDetails.offer?.discountPercentage,
                    startDate: productDetails.offer?.startDate,
                    expiryDate: productDetails.offer?.expiryDate,
                    offerAmount: productDetails.product_sale_price - productDetails.offerPrice,
                    offerType: productDetails.offerType
                };
            } else if (productDetails.offerType === 'category' && productDetails.product_category.offer?.expiryDate > Date.now()) {
                console.log('category offer workng');
                
                itemOffer = {
                    name: productDetails.product_category?.offer?.name,
                    discountPercentage: productDetails.product_category?.offer?.discountPercentage,
                    startDate: productDetails.product_category?.offer?.startDate,
                    expiryDate: productDetails.product_category?.offer?.expiryDate,
                    offerAmount: productDetails.product_sale_price - productDetails.offerPrice,
                    offerType: productDetails.offerType
                };
            }
        }
        
        const item = {
            product: productId,
            quantity: 1,
            price: parseInt(price, 10),
            regularPrice: parseInt(ogprice, 10),
            itemOffer: itemOffer || {}
        };

        cart.items.push(item);

        await Coupon.findOneAndUpdate({ usedBy: userId }, { $pull: { usedBy: userId } });

        let existingOffer = cart?.summary?.offerDiscount || 0;
        let offerDiscount = 0;

        if (Object.keys(itemOffer).length > 0) {
            offerDiscount = existingOffer + (price - offerPrice);
            // console.log('this is item Offer',itemOffer);
        } else {
            offerDiscount = existingOffer;
        }
        // console.log(offerDiscount);
        
        const summary = calculateCartSummary(cart,0,offerDiscount);
        cart.summary = summary;

        await cart.save();
       
        return res.redirect('/cart');
        
    } catch (error) {
        console.log(error.message);
         return res.redirect('/500')
    }
};

const removeCartItem = async (req, res) => {
    try {
        const itemId = new mongoose.Types.ObjectId(req.query.itemId);

        
        const cart = await Cart.findOne({'items._id': itemId});

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        
        const item = cart.items.find(i => i._id.toString() === itemId.toString());
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart items' });
        }

        
        await Coupon.findOneAndUpdate(
            { usedBy: cart.user },
            { $pull: { usedBy: cart.user } }
        );

        
        cart.items = cart.items.filter(i => i._id.toString() !== itemId.toString());

        
        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            console.log('Cart deleted');
            return res.status(200).json({
                success: true,
                message: 'Cart removed successfully',
                isEmpty: true
            });
        }

        
        let totalOfferDiscount = 0;
        cart.items.forEach(i => {
            if (i.itemOffer && i.itemOffer.offerAmount) {
                totalOfferDiscount += i.itemOffer.offerAmount;
            }
        });

        const summary = calculateCartSummary(cart, 0, totalOfferDiscount);

        cart.summary = summary;

        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Item removed successfully',
            cart,
            summary
        });

    } catch (error) {
        console.error('Error removing item from cart:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};


const increaseItem = async (req, res) => {
    try {
        const itemId = req.query.itemId;
        const maxQuantity = 5;
        

        const cart = await Cart.findOne({ 'items._id': itemId }).populate('items.product');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        const item = cart.items.find(item => item._id.toString() === itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart items' });
        }

        if (item.quantity >= maxQuantity) {
            return res.status(400).json({ success: false, message: `Quantity cannot exceed ${maxQuantity}` });
        }
        if(item.quantity >= item.product.product_quantity){
            console.log('working the check quantithy')
            return res.status(400).json({ success: false, message: `Quantity cannot exceed ${item.product.product_quantity}`,eTitle:'Limit Reached',eStats:'info' });
        }

        const updatedCart = await Cart.findOneAndUpdate(
            { 'items._id': itemId },
            { $inc: { 'items.$.quantity': 1 } },
            { new: true }
        ).populate('items.product');

        if (!updatedCart) {
            return res.status(404).json({ success: false, message: 'Failed to update cart' });
        }

        let totalOfferDiscount = 0;
        updatedCart.items.forEach(i => {
            if (i.itemOffer && i.itemOffer.offerAmount) {
                totalOfferDiscount += (i.itemOffer.offerAmount * i.quantity);
            }
        });
        
        const summary = calculateCartSummary(updatedCart,0, totalOfferDiscount);
        updatedCart.summary = summary;
        // console.log(summary)
        await updatedCart.save();

        const updatedItem = updatedCart.items.find(item => item._id.toString() === itemId);
        if (!updatedItem) {
            return res.status(404).json({ success: false, message: 'Failed to find updated item in cart' });
        }

        return res.json({
            success: true,
            message: 'Quantity increased successfully',
            updatedQuantity: updatedItem.quantity,
            summary: summary
        });

    } catch (error) {
        console.error('Error increasing item quantity:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



const getCartSummary = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
        
        const summary = calculateCartSummary(cart);
        
        res.json(summary);
      } catch (error) {
        console.error('Error fetching cart summary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
};


function calculateCartSummary(cart,couponamount=0,offerDiscount= 0) {
    let subtotal = 0;
    cart.items.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    // console.log('couponamount:',couponamount,',offerDiscount:',offerDiscount);
    
    const deliveryCharges = 0; 
    const couponAmount = Math.ceil(couponamount);
    const offer = Math.ceil(offerDiscount);
    // console.log('offer:',offer);
    // console.log('couponAmount:',couponAmount);    
    const total = subtotal + deliveryCharges - couponAmount - offer
    // console.log('total:',total);
    
    return {
        subtotal: subtotal,
        deliveryCharges: deliveryCharges,
        total: total,
        offerDiscount:offer,
        couponDiscount:couponAmount
    };
}

const decreaseQuantity = async (req, res) => {
    try {
        const itemId = req.query.itemId;
        
        const cart = await Cart.findOne({ 'items._id': itemId }).populate('items.product');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        
        const item = cart.items.find(item => item._id.toString() === itemId)
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart items' });
        }

        
        if (item.quantity <= 1) {
            return res.status(400).json({ success: false, message: 'Quantity cannot be less than 1' });
        }
    

        const updatedCart = await Cart.findOneAndUpdate(
            { 'items._id': itemId },
            { $inc: { 'items.$.quantity': -1 } },
            { new: true }
        ).populate('items.product');

        if (!updatedCart) {
            return res.status(404).json({ success: false, message: 'Failed to update cart' });
        }

        
        let totalOfferDiscount = 0;
        updatedCart.items.forEach(i => {
            if (i.itemOffer && i.itemOffer.offerAmount) {
                totalOfferDiscount += (i.itemOffer.offerAmount * i.quantity);
            }
        });

        const summary = calculateCartSummary(updatedCart, 0, totalOfferDiscount);
        updatedCart.summary = summary;
        // console.log('summary:',summary);
        
        await updatedCart.save();

        const updatedItem = updatedCart.items.find(item => item._id.toString() === itemId);
        if (!updatedItem) {
            return res.status(404).json({ success: false, message: 'Failed to find updated item in cart' });
        }

        return res.json({
            success: true,
            message: 'Quantity decreased successfully',
            updatedQuantity: updatedItem.quantity,
            summary: summary
        });

    } catch (error) {
        console.error('Error decreasing item quantity:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const loadCheckout = async(req,res)=>{
    try {     
          
        const user_id = new mongoose.Types.ObjectId(req.params.user_id)
        
        const wallet = await Wallet.findOne({user:user_id})
        
        const cartdata = await Cart.findOne({ user:user_id  })
                 .populate([
                    { path: 'user', populate: { path: 'address' } },
                    { path: 'items.product', populate: { path: 'product_category' } }
                 ]);
                // console.log(cartdata);
        const coupons = await Coupon.find({isActive:true});
        let summary = 0
        if(cartdata){
           summary = cartdata.summary
        }
        let statesArray = [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
            "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
            "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
            "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
        ];
        // console.log('cartsummary',cartdata.summary);
        
        //   console.log('couponId',req.body.couponId)
          return  res.render('checkout',{cartdata,statesArray,wallet,couponId:req.body.couponId,coupons,summary})
        
    } catch (error) {
        console.error(error.message)
        return res.redirect('/500')
    }
}

const placeOrder = async (req, res) => {
    try {
        const { addressId, paymentMethod, cartId, paymentId } = req.body;

        
        if (!addressId || !cartId || !paymentMethod) {
            return res.status(400).send('Missing required fields');
        }

        const address = await AddressModel.findById(addressId);
        const cart = await Cart.findById(cartId).populate({
            path: 'items.product',
            populate: { path: 'product_category' }
        });

        if (!address || !cart) {
            return res.status(404).send('Cart or address not found');
        }
    

        const orderItems = cart.items.map(item => ({
            product: item.product?._id,
            productName: item.product?.product_name,
            brandName: item.product?.product_brand,
            category: item.product?.product_category?._id,
            categoryName: item.product?.product_category?.name,
            quantity: item.quantity,
            price: item.price,
            itemOrderStatus: 'confirmed',
            regularPrice: item.regularPrice,
            images: item.product?.product_images,
            itemOffer: item.itemOffer || null
        }));
        
        const orderdata = await new orderModel({
            items: orderItems,
            user: cart.user?._id,
            totalItems: cart.items.length,
            subTotalAmount: cart.summary?.subtotal,
            couponDiscount: cart.summary?.couponDiscount||0,
            offerDiscount:cart.summary?.offerDiscount||0,
            totalAmount: cart.summary?.total,
            orderDate: Date.now(),
            orderStatus: 'confirmed',
            onlinePaymentId: paymentId || null,
            paymentMethod,
            paymentStatus: ['razorpay', 'wallet'].includes(paymentMethod) ? 'completed' : 'pending',
            shippingAddress: address
        }).save();

        if (paymentMethod === 'wallet') {
            const wallet = await Wallet.findOne({ user: cart.user });
            if (!wallet) {
                return res.redirect('/404')
            }
            if (wallet.balance < cart.summary.total) {
                return res.redirect('/404')
            }

            const transaction = {
                orderId: orderdata._id,
                amount: cart.summary.total,
                status: 'success',
                type: 'debit',
                razorpaymentId: orderdata.paymentId || orderdata._id
            };

            wallet.transactions.push(transaction);
            wallet.balance -= transaction.amount;
            await wallet.save();
        }

        for (const item of orderItems) {
            await Products.findByIdAndUpdate(item.product, {
                $inc: { product_quantity: -item.quantity }
            });
        }

        const deleteCart = await Cart.findByIdAndDelete(cart._id);
        if (!deleteCart) {
            console.log('Cart is not deleted');
        }

        return res.render('ordercomplete', { orderdata });

    } catch (error) {
        console.error('Error placing order:', error.message);
         return res.redirect('/500')
    }
};

const checkoutupdateAddress = async(req,res)=>{
    const existingaddress = await AddressModel.findById(req.params.address_id)
    if(!existingaddress){
        console.log('no existing address');
    }
   
    try {

        const {name,phone,alt_phone,Address,city,state,pincode}=req.body
        await AddressModel.findByIdAndUpdate(req.params.address_id,{$set:{
            fullname:name,
            Address:Address,
            altMobile:alt_phone,
            city:city,
            mobile:phone,
            pincode:pincode,
            state:state
        }})

           return res.redirect(`/checkoutpage/${req.body.user_id}`)
        
    } catch (error) {
        console.log(error.message);
        return res.redirect('/500')
    }
}

const paymentFailed = async (req, res) => {
    try {

        const userId = req.params.id;
        // console.log('UserId:', userId);

        const { paymentId, selectAddressId } = req.body;
        // console.log('bosdy:', req.body);


        const cartData = await Cart.findOne({ user: userId }).populate({
            path: 'items.product',
            populate: { path: 'product_category' }
        });


        if (!cartData || cartData.items.length === 0) {
            return res.status(400).json({ success: false, message: 'No items in the cart to process the order.' });
        }

        // console.log('CartData:', cartData);

        const address = await AddressModel.findById(selectAddressId);
        if (!address) {
            return res.status(400).json({ success: false, message: 'Invalid shipping address.' });
        }

        // console.log('Address:', address);


        const orderItems = cartData.items.map(item => ({
            product: item.product?._id,
            productName: item.product?.product_name,
            brandName: item.product?.product_brand,
            category: item.product?.product_category?._id,
            categoryName: item.product?.product_category?.name,
            quantity: item.quantity,
            itemOrderStatus: 'pending',
            price: item.price,
            regularPrice: item.regularPrice,
            images: item.product?.product_images,
            itemOffer: item.itemOffer || null
        }));

        // console.log('OrderItems:', orderItems);


        const orderData = await new orderModel({
            items: orderItems,
            user: cartData.user?._id,
            totalItems: cartData.items.length,
            subTotalAmount: cartData.summary?.subtotal,
            couponDiscount: cartData.summary?.couponDiscount || 0,
            deliveryCharges: cartData.summary?.deliveryCharges || 0,
            offerDiscount: cartData.summary?.offerDiscount || 0,
            totalAmount: cartData.summary?.total,
            orderDate: Date.now(),
            orderStatus: 'pending',
            onlinePaymentId: paymentId || null,
            paymentMethod: 'razorpay',
            paymentStatus: 'failed',
            shippingAddress: address
        }).save();

        // console.log('OrderData:', orderData);


        await cartData.deleteOne();
        console.log('Cart deleted after order creation.');

        return res.status(200).json({ success: true, orderData });

    } catch (error) {
        console.error('Error in paymentFailed:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const loadPaymentFailedPage = async(req,res)=>{
    try {
        return res.render('paymentFailed',{orderId:req.params.id})
    } catch (error) {
        console.log(error)
        return res.redirect('/404')
    }
}


const retryPayment = async(req,res)=>{
    try {
        const orderId = req.params.id
        const orderData = await orderModel.findById(orderId).populate([
            {path:'user',populate:{path:'address'}},
            {path:'items.product',populate:{path:'product_category'}}])

        const wallet = await Wallet.findOne({user:orderData.user._id})
        
                console.log('orderData:',orderData);
        const coupons = await Coupon.find({isActive:true});
        let summary = {}
        if(orderData){
           summary = {
            subtotal:orderData.subTotalAmount,
            deliveryCharges:orderData?.deliveryCharges || 0,
            couponDiscount:orderData.couponDiscount,
            offerDiscount:orderData.offerDiscount,
            total:orderData.totalAmount
           }
        }
        let statesArray = [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
            "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
            "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
            "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
        ];
        // console.log('cartsummary',cartdata.summary);
        
        //   console.log('couponId',req.body.couponId)
         return  res.render('checkout',{cartdata:orderData,statesArray,wallet,coupons,summary})
        
    } catch (error) {
        console.log(error)
        return res.redirect('/500')
    }
}

const retryPlaceOrder = async(req,res)=>{
    try {
        const { addressId, paymentMethod, cartId, paymentId } = req.body;
        const address = await AddressModel.findById(addressId)
        const orderData = await orderModel.findById(cartId)
        if(!address || !orderData){
            console.log('address or orderData not found')
        }
        // console.log('orderData:',orderData)
        orderData.items.forEach(item=>{{
            item.itemOrderStatus = 'confirmed'
        }})
        
        orderData.orderStatus = 'confirmed'
        orderData.onlinePaymentId = paymentId
        orderData.paymentMethod = paymentMethod
        orderData.paymentStatus = 'completed'
        orderData.shippingAddress = address

        await orderData.save()

        if (paymentMethod === 'wallet') {
            const wallet = await Wallet.findOne({ user: orderData.user });
            if (!wallet) {
                return res.status(404).send('Wallet not found. Please check your wallet.');
            }
            if (wallet.balance < orderData.totalAmount) {
                return res.status(400).send('Insufficient balance');
            }

            const transaction = {
                orderId: orderData._id,
                amount: orderData.totalAmount,
                status: 'success',
                type: 'debit',
                razorpaymentId: orderData.paymentId || orderData._id
            };

            wallet.transactions.push(transaction);
            wallet.balance -= transaction.amount;
            await wallet.save();
        }

        for (const item of orderData.items) {
            await Products.findByIdAndUpdate(item.product, {
                $inc: { product_quantity: -item.quantity }
            });
        }



        return res.render('ordercomplete', { orderdata:orderData });
        

    } catch (error) {
        console.log(error)
        return res.redirect('/500')
    }
}


// ----------------------order Return and cancellation part---------------------

const returnOrder = async (req, res) => {
    try {
        const { itemId, orderStatus, reason } = req.body;

        if (!itemId || !orderStatus || !reason) {
            return res.status(400).json({ success: false, message: 'Please fill all fields' });
        }

        const itemObjectId = new mongoose.Types.ObjectId(itemId);

        const returnExists = await Return.findOne({ itemId: itemObjectId });
        if (returnExists) {
            return res.status(400).json({ success: false, message: 'Return request already exists.' });
        }

        const order = await orderModel.findOne({ "items._id": itemObjectId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const item = order.items.find(item => item._id.toString() === itemObjectId.toString());
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in the order' });
        }

        if (Date.now() > new Date(item.deliveredDate).getTime()) {
            return res.status(400).json({ success: false, message: 'Return time over' });
        }

        if (orderStatus !== 'delivered') {
            return res.status(400).json({ success: false, message: 'Item is not delivered' });
        }

        if (item.itemOrderStatus === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Item is cancelled' });
        }

        const returnOrder = new Return({
            order: order._id,
            orderItemId: item._id,
            product: item.product,
            productRefundAmount: item.price,
            productReturnDate: Date.now(),
            productReturnReason: reason,
            returnProductStatus: 'returnInitiated' 
        });

        const savedReturnOrder = await returnOrder.save();

        item.itemOrderStatus = savedReturnOrder.returnProductStatus;
        await order.save();

        return res.status(200).json({ success: true, message: 'Return has been initiated' });

    } catch (error) {
        console.error('Error in returnOrder:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const cancelOrderItem = async (req, res) => {
    try {
        const { orderId, itemOrderStatus, itemId } = req.body;

        if (!orderId || !itemOrderStatus || !itemId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const orderData = await orderModel.findById(orderId);
        const validStatuses = orderModel.schema.path('orderStatus').enumValues;
        if (!validStatuses.includes(itemOrderStatus)) {
            return res.status(400).json({ error: 'Invalid order status' });
        }
        console.log('validstatus:',validStatuses)
        console.log('itemorderstatus:',itemOrderStatus)
        
        if ((itemOrderStatus === "pending" || itemOrderStatus === "confirmed") && orderData.paymentMethod != 'COD') {

            const updateResult = await orderModel.updateOne(
                { _id: orderId, "items._id": itemId },
                { $set: { "items.$.itemOrderStatus": "cancelled" } }
            );

            if (updateResult.modifiedCount === 0) {
                return res.status(404).json({ error: 'Item not found in the order' });
            }

            
            if (!orderData) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const itemDetails = orderData.items.find(item => item._id.toString() === itemId.toString());
            if (!itemDetails) {
                return res.status(404).json({ error: 'Item not found in the order' });
            }

            let itemAmount = itemDetails.itemOffer?.offerAmount
                ? (itemDetails.price - itemDetails.itemOffer.offerAmount) * itemDetails.quantity
                : itemDetails.price * itemDetails.quantity;

            let discountAmount = 0;
            if (orderData.couponDiscount) {
                discountAmount = Math.ceil(orderData.couponDiscount * itemDetails.price*itemDetails.quantity / orderData.subTotalAmount);
                itemAmount -= discountAmount;
            }
            itemDetails.itemCouponPropotion = discountAmount
            orderData.offerDiscount = Math.max(0, orderData.offerDiscount - (itemDetails.itemOffer?.offerAmount*itemDetails.quantity || 0));
            orderData.subTotalAmount = Math.max(0, orderData.subTotalAmount - (itemDetails.price * itemDetails.quantity));
            orderData.totalAmount = Math.max(0, orderData.totalAmount - itemAmount);
            orderData.couponDiscount = Math.max(0, orderData.couponDiscount - discountAmount);

            await orderData.save();

            if (["razorpay", "wallet"].includes(orderData.paymentMethod)) {
                const transaction = {
                    orderId,
                    amount: itemAmount,
                    status: 'success',
                    type: 'credit',
                    razorpaymentId: orderData.onlinePaymentId || orderId.toString()
                };
                const wallet = await Wallet.findOne({ user: orderData.user });
                if (wallet) {
                    wallet.transactions.push(transaction);
                    wallet.balance += transaction.amount;
                    await wallet.save();
                } else {
                    await new Wallet({
                        user: orderData.user,
                        balance: transaction.amount,
                        transactions: [transaction]
                    }).save();
                }
            }

            const anyNotDelivered = orderData.items.some(item => item.itemOrderStatus !== "delivered");
            const allCancelled = orderData.items.every(item => item.itemOrderStatus === "cancelled");

            if (anyNotDelivered && allCancelled) {
                await orderModel.updateOne(
                    { _id: orderId },
                    { $set: { orderStatus: "cancelled", paymentStatus: "refunded", totalAmount: 0 } }
                );
            }

            if (itemDetails.product) {
                const updatedProduct = await Products.findByIdAndUpdate(
                    itemDetails.product,
                    { $inc: { product_quantity: itemDetails.quantity } },
                    { new: true }
                );

                if (!updatedProduct) {
                    return res.status(400).json({ error: 'Failed to update product stock' });
                }
            } else {
                return res.status(404).json({ error: 'Product not found' });
            }

            return res.status(200).json({
                success: true,
                message: 'Product stock updated successfully',
                returnStatus: false,
                allOrderCancelled: anyNotDelivered && allCancelled
            });

        } else if (itemOrderStatus === "delivered") {
            return res.status(200).json({
                message: "Product already delivered, return only",
                returnStatus: true
            });
        } else {
            return res.status(400).json({
                error: "Invalid status provided",
                success: false
            });
        }
    } catch (error) {
        console.error('Error in cancelOrderItem:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const downloadInvoice = async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.id).populate('items.product');
        
        if (!order) {
            return res.status(404).send('Order not found');
        }

        const createdAt = new Date(order.createdAt);
        if (isNaN(createdAt)) {
            return res.status(400).send('Invalid order date format');
        }

        const formattedDate = format(createdAt, 'yyyy-MM-dd');

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Invoice.pdf');

        doc.registerFont('Roboto-Bold', `G:\\E-commerce\\E-commerce\\E-commerce\\public\\fonts\\Roboto\\Roboto-Bold.ttf`);
        doc.registerFont('Roboto-MediumItalic', `G:\\E-commerce\\E-commerce\\E-commerce\\public\\fonts\\Roboto\\Roboto-MediumItalic.ttf`);
        doc.registerFont('Roboto-Regular', `G:\\E-commerce\\E-commerce\\E-commerce\\public\\fonts\\Roboto\\Roboto-Regular.ttf`);

        doc.pipe(res);

        doc.font('Roboto-Bold').fontSize(24).text('Invoice', { align: 'center' }).moveDown(0.5);
        doc.font('Roboto-Regular').fontSize(20).text('Gambit Pvt Ltd.', { align: 'center' });
        doc.font('Roboto-MediumItalic').fontSize(16).text('Kochi, Kerala', { align: 'center' }).moveDown(1);

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

        const leftColumnX = 50;
        const rightColumnX = 300;
        
        doc.font('Roboto-Bold').fontSize(14);
        doc.text(`Order ID: ${order._id}`, leftColumnX);
        doc.moveUp();
        doc.text('Shipped To:', rightColumnX);
        
        doc.font('Roboto-Regular').fontSize(12);
        doc.text(`Ordered Date: ${formattedDate}`, leftColumnX);
        doc.moveUp();
        doc.text(order.shippingAddress.fullname, rightColumnX);

        const address = order.shippingAddress;
        doc.text(address.Address, rightColumnX);
        doc.text(`${address.city}, ${address.state}`, rightColumnX);
        doc.text(`Pincode: ${address.pincode}`, rightColumnX);
        doc.text(`Phone: ${address.mobile}, ${address.altMobile}`, rightColumnX);

        doc.moveDown(0.5);
        doc.text(`Order Status: ${order.orderStatus}`, leftColumnX);

        doc.fontSize(10);
        doc.text('* Keep this invoice for warranty purposes', leftColumnX);

        doc.moveDown(1);

        const tableTop = doc.y + 10;
        const tableHeaders = ['Product', 'Quantity', 'Price', 'Offer', 'Total'];
        const columnWidth = 100;

        doc.font('Roboto-Bold').fontSize(12);
        tableHeaders.forEach((header, i) => {
            doc.text(header, leftColumnX + i * columnWidth, tableTop);
        });

        doc.moveTo(leftColumnX, tableTop + 20).lineTo(550, tableTop + 20).stroke();

        let yPosition = tableTop + 30;
        doc.font('Roboto-Regular').fontSize(10);

        let totalPrice = 0;
        let offerAmount = 0
        if (!Array.isArray(order.items) || order.items.length === 0) {
            doc.text('No items found in this order.', leftColumnX, yPosition);
        } else {
            order.items.forEach(item => {
                if (yPosition > 700) {
                    doc.addPage();
                    yPosition = 50;
                }
                doc.text(item.product.product_name, leftColumnX, yPosition, { width: columnWidth - 10 });
                doc.text(item.quantity.toString(), leftColumnX + columnWidth, yPosition);
                doc.text(`₹${item.price.toFixed(2)}`, leftColumnX + columnWidth * 2, yPosition);
                offerAmount = item.itemOffer?.offerAmount ? item.itemOffer.offerAmount * item.quantity : 0;
                doc.text(`- ₹${offerAmount.toFixed(2)}`, leftColumnX + columnWidth * 3, yPosition);
                totalPrice = item.price * item.quantity - offerAmount;
                doc.text(`₹${totalPrice.toFixed(2)}`, leftColumnX + columnWidth * 4, yPosition);
                yPosition += 20;
            });
        }
        
        doc.moveDown(2);
        doc.font('Roboto-Bold').fontSize(14);
        doc.text(`Total Amount: ₹${totalPrice.toFixed(2)}`, { align: 'right' });

        doc.end();
    } catch (error) {
        console.error('Error generating invoice:', error);
        return res.redirect('/500')
    }
};







// ---------------------RazorPayment Handling part-------------------------
const createOrder = async (req, res) => {
    try {
      const { userId, amount } = req.body;
      if (!userId || !amount) {
        return res.status(400).json({ success: false, message: 'Please provide userId and amount.' });
      }
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const key =  process.env.RZP_key_ID
      
      const order = await Razorpay.createOrder(amount, `receipt_${userObjectId}`);

      return res.status(200).json({
        success: true,
        message: 'Wallet money added successfully.',
        order,
        key 
      });
    } catch (error) {
      console.error('Error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  const verifyOrder = async (req, res) => {
    try {
        const{order_id,payment_id,signature}=req.body
        if(!order_id ||  !payment_id || !signature){
            return res.status(400).json({success:false,message:'Invalid request'})
        }
        const verifiedPaymentSignature = await  Razorpay.verifyPaymentSignature(order_id, payment_id, signature);
        if(!verifiedPaymentSignature){
            return res.status(400).json({success:false,message:'verification  failed'})
        }
        return res.status(200).json({success:true,message:'payment verification success',sign:verifiedPaymentSignature})

    } catch (error) {
        console.error('Error',error.message)
        return res.status(500).json({success:false,message:'internal server error'})
    }
  }

  const  handledPayment = async (req, res) => {
    try {
        const {amount,userId,razorpayOrderId,razorpaymentId,success} = req.body
        console.log(req.body)
        if (!amount || !userId || !razorpayOrderId || !razorpaymentId) {
            return res.status(400).json({ success: false, message: 'Invalid request data' });
        }
       
        
        const userObjectId = new mongoose.Types.ObjectId(userId)
        const wallet = await Wallet.findOne({user:userObjectId})
        if(!success){
         const transaction = {
            amount:amount/100,
            type:'credit',
            status:'failed',
            razorpaymentId,
        }
         if(!wallet){
            const newWallet = new Wallet({
                user:userObjectId,
                transactions:[transaction]
            })
            await newWallet.save()
            return res.status(200).json({success:true,message:'Wallet created successfully'})
         }
         wallet.transactions.push(transaction)
         await wallet.save()
         return res.status(200).json({success:true,message:'wallet updated successfully'})
        }
        const transaction ={
            amount:amount/100,
            type:'credit',
            status:'success',
            razorpaymentId,
        }
        if(!wallet){
           const newWallet = new Wallet({
            user:userObjectId,
            balance:amount/100,
            transactions:[transaction]
           }) 
           await newWallet.save()
           return res.json({success:true,message:'new wallet created  successfully'})
        }
        wallet.balance+=(amount/100)
        wallet.transactions.push(transaction)
        await wallet.save()
        return res.json({success:true,message:'wallet updated successfully',amount:wallet.balance})

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:error.message||'Internal server Error'})
    }
  }




//   -----------------------------coupon Part -------------------------------

const applyCoupon = async (req, res) => {
    try {
      const { coupon } = req.body;
      const userId = new mongoose.Types.ObjectId(req.body.userId);
      const orderId = new mongoose.Types.ObjectId(req.body.orderId);
  
      const couponData = await Coupon.findById(coupon);
      if (!couponData) {
        return res.status(400).json({ success: false, message: 'Coupon not found' });
      }
      if (!couponData.isActive) {
        return res.status(400).json({ success: false, message: 'Coupon is not active' });
      }
      if (couponData.usedBy.includes(userId)) {
        return res.status(400).json({ success: false, message: 'Coupon already used' });
      }
      if (couponData.expirationDate && couponData.expirationDate < Date.now()) {
        return res.status(400).json({ success: false, message: 'Coupon expired' });
      }
      if (couponData.usageLimit <= couponData.usedBy.length) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      }
  
      let couponAmount = 0;
      let summary = {};
      const cart = await Cart.findOne({ user: userId });
      const order = await orderModel.findById(orderId);
  
      if (cart && cart.user.toString() === userId.toString()) {
        if(couponData.minAmount > cart.summary?.total){
            return res.status(400).json({ success: false, message: 'Coupon minimum amount not reached' });
          }
        couponAmount = cart.summary.total * (couponData.discountPercentage / 100);
        couponAmount = Math.min(Math.ceil(couponAmount), couponData.maxAmount); 
  
        summary = calculateCartSummary(cart, couponAmount, cart.summary?.offerDiscount);
        couponData.usedBy.push(userId);
        cart.summary = summary;
        await cart.save();
      } else if (order && order._id.toString() === orderId.toString()) {
        if(couponData.minAmount > order.totalAmount){
          return res.status(400).json({ success: false, message: 'Coupon minimum amount not reached' });
        }
        couponAmount = order.totalAmount * (couponData.discountPercentage / 100);
        couponAmount = Math.min(Math.ceil(couponAmount), couponData.maxAmount); 
  
        order.couponDiscount = couponAmount;
        order.totalAmount -= couponAmount;
        await order.save();
  
        summary = {
          subtotal: order.subTotalAmount,
          offerDiscount: order.offerDiscount,
          deliveryCharges: order.deliveryCharges,
          total: order.totalAmount,
          couponDiscount: couponAmount,
        };
        // console.log('summary:', summary);
      }
  
      await couponData.save();
      return res.status(200).json({ success: true, message: 'Coupon applied successfully', summary, coupon: couponData });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
    
  
  const removeCoupon = async (req, res) => {
    try {
      const userId = new mongoose.Types.ObjectId(req.body.userId);
      const orderId = new mongoose.Types.ObjectId(req.body.orderId);
  
      await Coupon.findOneAndUpdate({ usedBy: userId }, { $pull: { usedBy: userId } });
  
      const cart = await Cart.findOne({ user: userId });
      const order = await orderModel.findById(orderId);
      let summary = {};
  
      if (cart && cart.user.toString() === userId.toString()) {
        summary = calculateCartSummary(cart, 0, cart.summary?.offerDiscount);
        cart.summary = summary;
        await cart.save();
      } else if (order && order._id.toString() === orderId.toString()) {
        console.log('working order: ', order);
        order.totalAmount += order.couponDiscount;
        order.couponDiscount = 0;
        summary = {
          subtotal: order.subTotalAmount,
          deliveryCharges: order.deliveryCharges,
          offerDiscount: order.offerDiscount,
          total: Math.ceil(order.totalAmount),
          couponDiscount: 0,
        };
        console.log(summary);
        await order.save();
      }
  
      return res.status(200).json({ success: true, message: 'Coupon removed successfully', summary });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  


// ----------------------wishList Part -----------------------

const loadWishlist = async (req,res)=>{
    try {
        const wishlist = await Wishlist.findOne({userId:req.session.user_id}).populate({path:'products',populate:{path:'product_category'}})
        return res.render('wishlist',{wishlist})
    } catch (error) {
        console.log(error.message);
        return res.redirect('/500')
    }
  }

  const addOrRemoveWishlist = async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(404).json({ success: false, message: 'Please login to use wishlist' });
        }

        const change = req.params.change;
        const productId = new mongoose.Types.ObjectId(req.body.productId);

        let updateOperation;
        if (change === 'add') {
            updateOperation = { $addToSet: { products: productId } };
        } else if (change === 'remove') {
            updateOperation = { $pull: { products: productId } };
        } else {
            return res.status(400).json({ success: false, message: 'Invalid change value' });
        }

        const updatedWishlist = await Wishlist.findOneAndUpdate(
            { userId: req.session.user_id },
            updateOperation,
            { new: true, upsert: true }
        );
        const inWishList = change == 'add'?  true : false;

        await Products.findByIdAndUpdate(productId,{$set:{inWishList}},{new:true,upsert:true})

        const action = change === 'add' ? 'added to' : 'removed from';
        return res.json({ success: true, message: `Product ${action} wishlist`, wishlist: updatedWishlist });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



module.exports = {
    // exports for user authentication.
    loadlogin,
    loadRegister,
    registerAuth,
    verifyOtp,
    resendOtp,
    verifyUser,
    Logout,
    loadForgotPassword,
    googleAuth,
    

    // exports of products pages in user side,
    loadHome,
    loadproducts,
    loadShop,

    // exports of dashboard pages in user side,
    loadDashboard,
    addAddress,
    updateAddress,
    deleteAdress,
    edituserPersonal,
    verifyOtpAndChangeEmail,
    editUserEmail,
    changepassword,
    verifyOtpAndChangePassword,
    forgotSendOtp,
    fogotPassAndChangePassword,

    // exports of cart pages in user side,
    updatecart,
    addtoCart,
    validateCart,
    loadCart,
    removeCartItem,
    increaseItem,
    decreaseQuantity,
    loadCheckout,
    placeOrder,
    getCartSummary,
    checkoutaddAddress,
    checkoutupdateAddress,
    paymentFailed,
    loadPaymentFailedPage,
    retryPayment,
    retryPlaceOrder,

    // exports of Order cancel and return  
    cancelOrderItem,
    returnOrder,
    downloadInvoice,
    
    // exports of payment handling
    createOrder,
    verifyOrder,
    handledPayment,

    // exports of coupons by user
    applyCoupon,
    removeCoupon,

    // exports of wishlists
    loadWishlist,
    addOrRemoveWishlist,
}