const Admin = require('../model/admin_schema')
const { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, differenceInDays, subMonths } = require('date-fns');
const Order = require('../model/order_schema');
const Products = require('../model/product_schema')
const Category = require('../model/category_schema')
const User = require('../model/user_schema')
const {getSalesReport} = require('../controllers/sales_controller')
const ExcelJS = require('exceljs');
const ReturnProductModel = require('../model/order_return_Schema');

const loadlogin = async function(req,res){
    try {
        res.render('login')
    } catch (error) {
        console.log(error);
        return res.redirect('/admin/404')
    }
}

const loadadminDashboard = async function (req, res) {
    try {
        
        const [orderData,productCount,categoryCount,userCount] = await Promise.all([Order.find(), Products.countDocuments(), Category.countDocuments(), User.countDocuments()])

        let bestSellingProducts = await Order.aggregate([{$unwind: '$items'},
            {$match:{'items.itemOrderStatus': 'delivered'}},
            {$group:{_id: '$items.product',totalSold:{$sum:'$items.quantity'}}},
            {$sort:{totalSold:-1}},{$limit:10},
            {$lookup:{from:'products',localField:'_id',foreignField:'_id',as:'products'}},
            {$unwind:{path:'$products',preserveNullAndEmptyArrays:true}},
            {$project:{_id:0,totalSold:0}},
        ]);
        console.log("mmmmmmmmmmmmmmmmmmm",bestSellingProducts);
        bestSellingProducts = bestSellingProducts.map((item) => item.products)
        console.log("bestttttsatydfytagdh",bestSellingProducts);
        
        let bestCategories = await Order.aggregate([
            {$unwind:'$items'},{$match:{'items.itemOrderStatus':'delivered'},},
            {$group:{_id:'$items.category',totalSold:{$sum:'$items.quantity'}}},{$sort:{totalSold:-1}},{$limit:10},
            {$lookup: {from: 'categories', localField: '_id',foreignField: '_id',as: 'categories'}},
            {$unwind:{path:'$categories',preserveNullAndEmptyArrays:true}},
            {$project:{_id:0,totalSold:0}}
        ])
        bestCategories = bestCategories.map((item) => item.categories)
        // console.log(bestCategories);
        
        const daily = {
            start: startOfDay(new Date()),
            end: endOfDay(new Date())
        }
        const weekly = {
            start: startOfWeek(new Date()),
            end: endOfWeek(new Date())
        }
        const monthly = {
            start: startOfMonth(new Date()),
            end: endOfMonth(new Date())
        }
        const totalRevenue = orderData.reduce((total, order) => total + order.totalAmount, 0);
        const dailyRevenue = orderData.filter(order => order.createdAt >= daily.start && order.createdAt <= daily.end).reduce((total, order) => total + order.totalAmount, 0);

        const weeklyRevenue = orderData.filter(order => order.createdAt >= weekly.start && order.createdAt <= weekly.end).reduce((total, order) => total + order.totalAmount, 0);

        const monthlyRevenue = orderData.filter(order => order.createdAt >= monthly.start && order.createdAt <= monthly.end).reduce((total, order) => total + order.totalAmount, 0);

        res.render('admin_Dashboard', {
            orderCount:orderData.length,
            totalRevenue,
            productCount,
            categoryCount,
            userCount,
            dailyRevenue,
            weeklyRevenue,
            monthlyRevenue,
            bestSellingProducts,
            bestCategories
        });
    } catch (error) {
        console.log(error);
        return res.redirect('/admin/500')
    }
};
const getAdminReport = async function(req,res){
    try {
        const { startDate, endDate, period } = req.query;
        if(startDate,endDate,period){
            const reportData = await getSalesReport(startDate, endDate, period);
            if(reportData){
                // console.log(reportData)
             return res.json({success:true,reportData})
            }
        } 
    } catch (error) {
        console.error(error)
        return res.status(500).json({success:false,message:'Internal server error'})
    }
}

const  logout = async function(req,res){
    try {
        req.session.destroy()
        res.redirect('/admin/')
    } catch (error) {
        console.log(error);
        return res.redirect('/admin/500')
    }
}


const verifyLogin = async function (req,res){
    try {
        const {email,password} = req.body
        const adminData = await Admin.findOne({email:email});
        if(password != adminData.password){
            res.render('login',{invalidpass:'invalid password'})
        }else if(adminData.isAdmin){
            req.session.admin_id = adminData._id
            res.redirect('/admin/dashboard')
        }
    } catch (error) {
        console.log(error);
        return res.redirect('/admin/404')
    }
}


const generateLedger = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'name email')
        const returns = await ReturnProductModel.find({}).populate('order', 'totalAmount orderDate')
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ledger');
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 30 },
            { header: 'User', key: 'user', width: 30 },
            { header: 'Order Date', key: 'orderDate', width: 25 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
            { header: 'Coupon Discount', key: 'couponDiscount', width: 20 },
            { header: 'Offer Discount', key: 'offerDiscount', width: 25 },
            { header: 'Return ID', key: 'returnId', width: 20 },
            { header: 'Return Date', key: 'returnDate', width: 25 },
            { header: 'Refund Amount', key: 'refundAmount', width: 15 },
            { header: 'Return Reason', key: 'returnReason', width: 30 },
        ];
        const returnMap = {};
        returns.forEach(returnItem => {
            returnMap[returnItem.order._id] = returnItem;
        });

        orders.forEach(order => {
            const returnItem = returnMap[order._id];  
            worksheet.addRow({
                orderId: order._id,
                user: order.user ? order.user.name : 'N/A',
                orderDate: format(typeof order.orderDate === 'object' ? order.orderDate : parseISO(order.orderDate), 'yyyy-MM-dd HH:mm:ss'),
                totalAmount: order.totalAmount,
                couponDiscount: order.couponDiscount,
                offerDiscount: order.offerDiscount,
                returnId: returnItem ? returnItem._id : '',
                returnDate: returnItem ? format(typeof returnItem.productReturnDate === 'object' ? returnItem.productReturnDate : parseISO(returnItem.productReturnDate), 'yyyy-MM-dd HH:mm:ss') : '',
                refundAmount: returnItem ? returnItem.productRefundAmount : 0,
                returnReason: returnItem ? returnItem.productReturnReason : '',
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=ledger.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    loadlogin,
    verifyLogin,
    loadadminDashboard,
    logout,
    getAdminReport,
    generateLedger,
}