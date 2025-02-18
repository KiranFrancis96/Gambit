const { default: mongoose } = require('mongoose');
const User = require('../model/user_schema')

const isLoggedin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            let query = {};
            
            if (mongoose.Types.ObjectId.isValid(req.session.user_id)) {
                query._id = req.session.user_id;
            } else {
                query.googleId = req.session.user_id;
            }
    
            const user = await User.findOne(query);

   
            if (user) {
                if (user.block === false) {
                    return next();
                } else {
                    return res.redirect('/login');
                }
            } else {
                
                return res.redirect('/login');
            }
        } else {
           
            return res.redirect('/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const notLoggedin = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            let query = {};
            
            if (mongoose.Types.ObjectId.isValid(req.session.user_id)) {
                query._id = req.session.user_id;
            } else {
                query.googleId = req.session.user_id;
            }const user = await User.findOne(query);

   
            if (user) {
                if (user.block === false) {
                    return res.redirect('/userDashboard')
                } else {
                    return next()
                }
            } else {
                
                return next()
            }
        } else {
           
            return next()
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}


module.exports={
    isLoggedin,
    notLoggedin
}