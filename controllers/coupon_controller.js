const Coupons = require('../model/coupon_schema')

const loadCoupon =  async (req, res) => {
    try {
        const coupon = await Coupons.find()
            .sort({createdAt:-1})
        return res.render('coupons',{coupon})
    } catch (error) {
        console.log(error.message);
        return res.redirect('/admin/404')  
    }
}

const loadAddCouponpage = async (req,res)=>{
    try {
        return res.render('addCoupon')
    } catch (error) {
        console.log(error.message)
        return res.redirect('/admin/404')

    }
}

const addCoupon = async (req,res)=>{
    try {
        const {couponCode,discountPercentage,maxAmount,minAmount,
            expirationDate,usageLimit} = req.body
           
            if(!couponCode || !discountPercentage || !maxAmount || !minAmount){
            return res.render('addCoupon',{error:"Please fill required fields"})                
            }
        const existCoupon = await Coupons.findOne({code:couponCode})

        if(existCoupon){
            return res.render('addCoupon',{error:"coupon already exist"})
        }

        const coupon = new Coupons({
            code:couponCode,
            discountPercentage,
            maxAmount,
            minAmount,
            expirationDate:expirationDate||null,
            usageLimit:usageLimit||Infinity
        })
        await coupon.save()

        return res.redirect('/admin/coupons')

    }catch(err){
        console.log(err.message)
        return res.redirect('/admin/500')
    }
} 

const changeCouponStats = async(req,res)=>{
    try {
        const couponId = req.params.id
        const change = req.body.change=='block'?false : true
        const coupon = await Coupons.findByIdAndUpdate(couponId,{$set:{isActive:change}},{new:true,upsert:true})
        let status = coupon.isActive ? 'Activated' : 'Deactivated'
        return res.status(200).json({success:true,message:`coupon is ${status}`,coupon})
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal server error'})
    }
}

const  loadEditCouponpage = async (req,res)=>{
    try {
        const couponId = req.params.id
        const coupon = await Coupons.findById(couponId)
        return res.render('edit-coupon',{coupon})
    } catch (error) {
      console.log(error.message);
      return res.redirect('/admin/500')
    }
}
const editCoupon = async (req,res)=>{
    try {
        const couponId = req.params.id
        const {couponCode,discountPercentage,maxAmount,minAmount,
            expirationDate,usageLimit,} = req.body
            if(!couponCode || !discountPercentage || !maxAmount || !minAmount){
                return res.status(400).send('Please fill necessary fields')
            }
        const coupon = await Coupons.findByIdAndUpdate(couponId,{$set:{code:couponCode,discountPercentage,maxAmount,minAmount,usageLimit:usageLimit||Infinity,expirationDate:expirationDate||null}},{new:true,upsert:true})
        if(!coupon){
            return res.status(404).send('coupon not found')
        }
        return res.redirect('/admin/coupons')
    } catch (error) {
        console.log(error.message);
        return res.redirect('/admin/500')
    }
}

module.exports = {
    loadCoupon,
    loadAddCouponpage,
    addCoupon,
    changeCouponStats,
    loadEditCouponpage,
    editCoupon
};