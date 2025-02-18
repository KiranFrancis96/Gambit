
const isLoggedin =async function(req,res,next){
    try {
        // if(req.session.admin_id){
            next();
        // }else{
        //     res.redirect('/admin/')
        // }
    } catch (error) {
        console.log(error);
    }
}


const notLoggedin = async(req,res,next)=>{
    try {
        // if(req.session.admin_id){
        //     res.redirect('/admin/dashboard')
        // }else{
            next();
        // }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports={
    isLoggedin,
    notLoggedin
}