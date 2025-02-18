const express = require('express')
const adminRoute = express()
const multer = require('../config/multer')
const imageResizer = require('../config/sharp')



 // admin middlewares 
const admin_session = require('../middlewares/admin_session')
const admin_controller = require('../controllers/admin_controller')
const admin_customer_controller = require('../controllers/admin_customer_controller')
const categories_controller = require('../controllers/categories_controller')
const product_controller = require('../controllers/product_controller')
const order_controller = require('../controllers/order_controller')
const coupon_controller = require('../controllers/coupon_controller')
const sales_controller = require('../controllers/sales_controller')
const errorController = require('../controllers/errorController')
const { errorHandler } = require('../middlewares/errorHandler')


// set view engine
adminRoute.set('view engine','ejs');
adminRoute.set('views','./views/admin');

// error
adminRoute.get('/500',errorController.load500)
adminRoute.get('/404',errorController.load404)

adminRoute.get('/',admin_session.notLoggedin,admin_controller.loadlogin)
adminRoute.get('/logout',admin_controller.logout)

adminRoute.post('/',admin_controller.verifyLogin)

// Dashboard
adminRoute.get('/dashboard',admin_session.isLoggedin,admin_controller.loadadminDashboard);
adminRoute.get('/dashboard/fetchReport',admin_session.isLoggedin,admin_controller.getAdminReport)
adminRoute.get('/dashboard/generateLedger',admin_session.isLoggedin,admin_controller.generateLedger)


// customer page request
adminRoute.get('/customers',admin_session.isLoggedin,admin_customer_controller.loadCustomer)

adminRoute.post('/customers/block/:id',admin_session.isLoggedin,admin_customer_controller.blockCustomer) 
adminRoute.post('/customers/unblock/:id',admin_session.isLoggedin,admin_customer_controller.unblockCustomer)

// request of products page 
adminRoute.get('/products',admin_session.isLoggedin,product_controller.loadProducts);
adminRoute.get('/products/addproduct',admin_session.isLoggedin,product_controller.loadAddproduct);
adminRoute.get('/products/edit-product/:id',admin_session.isLoggedin,product_controller.loadEditProduct)
adminRoute.get('/products/productdetail/:id',admin_session.isLoggedin,product_controller.productdetail)
adminRoute.post('/products/edit-product',admin_session.isLoggedin,multer.product_upload.array("pro_images",3),imageResizer.multimageCrop,product_controller.editProduct)
adminRoute.post('/products/addproduct', multer.product_upload.array('pro_images', 3),product_controller.addProduct);
adminRoute.post('/products/deactivate-product/:id',admin_session.isLoggedin,product_controller.deactivateProduct)
adminRoute.post('/products/activate-product/:id',admin_session.isLoggedin,product_controller.activateProduct)
adminRoute.get('/products/addProductOfferPage/:id',admin_session.isLoggedin,product_controller.addProductOfferPage)
adminRoute.get('/products/editProductOfferPage/:id',admin_session.isLoggedin,product_controller.editProductOfferPage)
adminRoute.post('/products/addProductOffer/:id',admin_session.isLoggedin,product_controller.addProductOffer)
adminRoute.delete('/products/removeProductOffer/:id',admin_session.isLoggedin,product_controller.removeProductOffer)
adminRoute.put('/products/changeOfferStatus/:id',admin_session.isLoggedin,product_controller.changeOfferStatus)
adminRoute.patch('/products/updateOfferPrice/:id',admin_session.isLoggedin,product_controller.updateOfferPrice)
adminRoute.delete('/products/removeAllOffers/:id',admin_session.isLoggedin,product_controller.removeAllOffers)
adminRoute.delete('/product/remove-image',admin_session.isLoggedin,product_controller.deleteImage)

 

// categories
adminRoute.get('/category/',admin_session.isLoggedin,categories_controller.loadCategory);
adminRoute.get('/category/edit-category/:id',admin_session.isLoggedin,categories_controller.LoadeditCategory)
adminRoute.get('/category/add-category',admin_session.isLoggedin,categories_controller.LoadAddCategory)
adminRoute.post('/category/unlist-category/:id',admin_session.isLoggedin,categories_controller.unlistCategory)
adminRoute.post('/category/relist-categroy/:id',admin_session.isLoggedin,categories_controller.relistCategory)
adminRoute.post('/category/add-category',admin_session.isLoggedin,multer.category_upload.single('image'),imageResizer.singleimageCrop,categories_controller.addCategory)
adminRoute.post('/category/update-category/:id',admin_session.isLoggedin,multer.category_upload.single('image'),imageResizer.singleimageCrop,categories_controller.updateCategory)
adminRoute.get('/category/details/:id',admin_session.isLoggedin,categories_controller.loadCategoryDetails)
adminRoute.get('/category/addOffer/:id',admin_session.isLoggedin,categories_controller.loadAddCategoryPage)
adminRoute.post('/category/addOffer/:id',admin_session.isLoggedin,categories_controller.addCategoryOffer)
adminRoute.get('/category/editOffer/:id',admin_session.isLoggedin,categories_controller.loadEditCategoryOfferPage)
adminRoute.delete('/categories/removeCategoryOffer/:id',admin_session.isLoggedin,categories_controller.removeCategoryOffer)
adminRoute.put('/categories/changeCategoryOfferStatus/:id',admin_session.isLoggedin,categories_controller.changeOfferStatus)

// order managment
adminRoute.get('/orders',admin_session.isLoggedin,order_controller.orderList)
adminRoute.get('/orders/orderDetails/:id',admin_session.isLoggedin,order_controller.orderDetails)
adminRoute.patch('/orders/update-status',admin_session.isLoggedin,order_controller.updateOrderStatus)
adminRoute.get('/orders/returns',admin_session.isLoggedin,order_controller.returnList)
adminRoute.get('/orders/return-status-change',admin_session.isLoggedin,order_controller.returnStatusChange)

// coupon managment
adminRoute.get('/coupons',admin_session.isLoggedin,coupon_controller.loadCoupon)
adminRoute.get('/coupons/add-coupon',admin_session.isLoggedin,coupon_controller.loadAddCouponpage)
adminRoute.get('/coupons/edit-coupon/:id',admin_session.isLoggedin,coupon_controller.loadEditCouponpage)
adminRoute.post('/coupons/edit-coupon/:id',admin_session.isLoggedin,coupon_controller.editCoupon)
adminRoute.post('/coupons/add-coupon',admin_session.isLoggedin,coupon_controller.addCoupon)
adminRoute.patch('/coupons/:id',admin_session.isLoggedin,coupon_controller.changeCouponStats)

// sales report
adminRoute.get('/sales-report',admin_session.isLoggedin,sales_controller.salesReport)
adminRoute.get('/generate-report',admin_session.isLoggedin,sales_controller.generateReport)
adminRoute.get('/download-report',admin_session.isLoggedin,sales_controller.downloadReport)

adminRoute.use(errorHandler)

module.exports = adminRoute;
