const path =require('path')
const Products = require('../model/product_schema')
const fs = require('fs')
const Category = require('../model/category_schema')
const mongoose = require('mongoose')



const loadProducts = async function (req, res) {
    const page = parseInt(req.query.page) || 1; 
    const limit = 10; 
    const skip = (page - 1) * limit; 

    try {
        const totalProducts = await Products.countDocuments(); 
        const products = await Products.find()
            .populate('product_category')
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit);
        
        const totalPages = Math.ceil(totalProducts / limit); 

        return res.render('products', { products, currentPage: page, totalPages });
    } catch (error) {
        console.log(error);
        return res.redirect('/admin/404')
    }
};

const loadAddproduct=async function(req,res){
    try {
        const categories = await Category.find()
        
        res.render('add_product',{categories})
    } catch (error) {
        console.log(error);
        return res.redirect('/admin/404')
    }
}
const addProduct = async function(req, res) {

    try {
        console.log(req.body)
        const { pro_name, pro_brand, pro_description, pro_category, pro_reg_price, pro_sale_price, pro_quantity, images } = req.body;
        console.log(req.files)
        const product_images = req.files ? req.files.map(file=>file.filename) : []

        const product = new Products({
            product_name: pro_name,
            product_sale_price: pro_sale_price,
            product_regular_price: pro_reg_price,
            product_category: pro_category,
            product_description: pro_description,
            product_quantity: pro_quantity,
            product_images, 
            product_brand: pro_brand,
        });


        const newProduct = await product.save();

        return res.redirect('/admin/products')

    } catch (error) {
        console.error('Error in addProduct:', error);
        return res.redirect('/admin/500')
    }
};


function saveBase64Image(base64Image) {
    const base64Data = base64Image.replace(/^data:image\/png;base64,/, "");
    const filename = `image-${Date.now()}.png`;
    fs.writeFileSync(`uploads/${filename}`, base64Data, 'base64');
    return filename;
}



const loadEditProduct = async function(req,res){
    try {
        const categories = await Category.find()
        const product = await Products.findOne({_id:req.params.id}).populate('product_category')
        // console.log(product);
     
        if(product){
            return res.render('edit-product',{product,categories})
        }else{
            res.redirect('/admin/products')
        }
    } catch (error) {
        console.log(error.message);
        return res.redirect('/admin/404')
    }
}
const  editProduct = async function(req,res){
    try {
        // existig products
        const existingProduct = await Products.findById(req.body.id);
        
        // console.log(existingProduct);
        
        const product_images = req.files.length > 0 ? req.files.map(file => file.filename) : existingProduct.product_images;
        // console.log(req.body);
        // console.log(req.files);
        
    
        const updatedProduct = await Products.findByIdAndUpdate(req.body.id, {
            $set: {
                product_name: req.body.pro_name || existingProduct.product_name,
                product_sale_price: req.body.pro_sale_price || existingProduct.product_sale_price,
                product_regular_price: req.body.pro_reg_price || existingProduct.product_regular_price,
                product_category: req.body.pro_category || existingProduct.product_category,
                product_description: req.body.pro_description || existingProduct.product_description,
                product_quantity: req.body.pro_quantity || existingProduct.product_quantity,
                product_images,
                // product_color:req.body.pro_colors || existingProduct.product_color,
                product_brand:req.body.pro_brand   || existingProduct.product_brand
            }
        });
       
    if (!updatedProduct) {
        return res.redirect('/admin/404')
    }
    

    try {
        if(req.files.length>0){
        existingProduct.product_images.forEach((image)=>{
            const oldImagePath = path.join(__dirname, '../public/imgs/products/', image)
            fs.unlinkSync(oldImagePath)
            console.log('successfully deleted file');
            
        })
    }
    } catch (error) {
        return res.redirect('/admin/404')
    }

    return res.redirect('/admin/products');


    } catch (error) {
        console.log(error.message);
        return res.redirect('/admin/500')
    }
}

const deleteImage = async function(req,res){
    try {
       const {productId,image}=req.body
       const oldImagePath = path.join(__dirname, '../public/imgs/products/', image)
       fs.unlinkSync(oldImagePath)
       
       const product = await Products.findByIdAndUpdate(productId,{$pull:{product_images:image}},{new:true})
        console.log(product);

        return res.status(200).json({success:true,message:'image deleted successfully'})

    } catch (error) {
        console.log(error)
        return res.redirect('/admin/500')
    }
}

const deactivateProduct = async function(req,res){
    try { 
        await Products.findByIdAndUpdate(req.params.id,{$set:{isActive:false}})
        
        return res.redirect('/admin/products')

    } catch (error) {
        return res.redirect('/admin/500')
    }
}

const activateProduct = async function(req,res){
    try {       
        await Products.findByIdAndUpdate(req.params.id,{$set:{isActive:true}})
        
        return res.redirect('/admin/products')

    } catch (error) {
        return res.redirect('/admin/500')
    }
}

const productdetail = async(req,res)=>{
    try {
        const product = await Products.findById(req.params.id).populate('product_category')
        return res.render('productDetails',{product})
    } catch (error) {
        console.log(error.message);
        return res.redirect('/admin/500')
    }
}

const addProductOfferPage = async(req,res)=>{
    try {
        return res.render('addProductOfferpage',{productId:req.params.id})
    } catch (error) {
        console.log(error.message);
        return res.redirect('/admin/500')
    }
}

const addProductOffer = async(req,res)=>{
    try {
        const { name,discountPercentage,startDate,expiryDate,description } = req.body
        const product = await Products.findById(req.params.id)
       
        if(product.offer){
            return res.status(400).render('addOfferPage',{error:'offer already exists for this product check product page'})
        }
        const discountAmount = Math.ceil( product.product_sale_price * discountPercentage/100 ) 
        
        const offer = {
            name,
            discountPercentage,
            startDate,
            expiryDate,
            description,
            discountAmount
        }

        product.offer = offer
        product.offerType = 'product'
        product.offerPrice = product.product_sale_price - discountAmount
        await product.save()
        return res.redirect(`/admin/products/productdetail/${product._id}`)        
        
    } catch (error) {
        console.log(error.message);
        return res.redirect('/admin/500')
    }
}

const editProductOffer = async(req,res)=>{
    try {
        const { name,discountPercentage,startDate,expiryDate,description } = req.body
        const product = await Products.findById(req.params.id)
       
        
        const discountAmount = Math.ceil( product.product_sale_price * discountPercentage/100 ) 
        
        const offer = {
            name,
            discountPercentage,
            startDate,
            expiryDate,
            description,
            discountAmount
        }

        product.offer = offer
        product.offerType = 'product'
        product.offerPrice = product.product_sale_price - discountAmount
        await product.save()
        return res.redirect(`/admin/products/productdetail/${product._id}`)        
        
    } catch (error) {
        console.log(error.message);
        return res.redirect('/admin/500')
    }
}

const editProductOfferPage = async(req,res)=>{
    try {
        const product = await Products.findById(req.params.id)
        return res.render('editProductOfferPage',{offer:product.offer,productId:product._id})
    } catch (error) {
        console.log(error.message);
        return res.redirect('/admin/500')
    }
} 

const removeProductOffer = async (req, res) => {
    try {
        const product = await Products.findById(req.params.id).populate('product_category');

        if (!product || !product.offer) {
            return res.status(400).json({ success: false, message: 'Product or offer not found' });
        }
        product.offerType = 'none';
        product.offer = null;
        product.offerPrice = null;

        if (product.product_category?.offer) {
            product.offerType = 'category';
            product.offerPrice = product.product_sale_price - (Math.ceil(product.product_sale_price * (product.product_category.offer.discountPercentage / 100)))
        }

        await product.save();

        return res.status(200).json({ success: true, message: 'Product offer removed successfully' });

    } catch (error) {

        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



const changeOfferStatus = async(req,res)=>{
    try {
        
        const product = await Products.findById(req.params.id).populate('product_category')
        const status = req.body.status
        
        if(!product || !product.offer){
            return res.status(400).json({success:false,message:'product/offer not found'})
        }
        if(product.offer.status == status){
            return res.status(400).json({success:false,message:'same status'})
        }
        if(!status && !(product.product_category?.offer?.status)){
            product.offerType = 'none'
        }
        product.offer.status = status
        await product.save()
        const update = status == 'true' ? 'Activated' : 'Deactivated'
        return res.status(200).json({success:true,message:`offer ${update} successfully`})

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal Server Error'})
    }
}

const updateOfferPrice = async(req,res)=>{
    try {
        
        const offerType = req.body.offerType
        const productId = new mongoose.Types.ObjectId(req.params.id)
        const product = await Products.findById(productId).populate('product_category')
        // console.log(product);
        if(!product){
            return res.status(400).json({success:false,message:'product not found'})
        }
        
        
        if(offerType == 'category'){
            console.log('category offer Added');
            
            product.offerPrice = product.product_sale_price - Math.ceil(product.product_sale_price * product.product_category.offer.discountPercentage/100)
            product.offerType = 'category'
        }
        if(offerType == 'product'){
            console.log('product offer Added');
            product.offerPrice = product.product_sale_price - Math.ceil(product.product_sale_price * product.offer.discountPercentage/100)
            product.offerType = 'product'
        }
        await product.save()
        return res.status(200).json({success:true,message:'offer price updated successfully'})
       
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal Server Error'})        
    }
}
const removeAllOffers = async(req,res)=>{
    try {
        const productId  = req.params.id
        const product = await Products.findById(productId)
        product.offerType = 'none'
        product.offerPrice = 0
        await product.save()
        return res.status(200).json({success:true,message:'all offers removed successfully'})
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({success:false,message:'Internal Server Error'})
    }
}

module.exports = {
    loadProducts,
    loadAddproduct,
    addProduct,
    loadEditProduct,
    editProduct,
    deactivateProduct,
    activateProduct,
    productdetail,
    addProductOfferPage,
    addProductOffer,
    editProductOfferPage,
    editProductOffer,
    removeProductOffer,
    changeOfferStatus,
    updateOfferPrice,
    removeAllOffers,
    deleteImage
}