const { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, differenceInDays } = require('date-fns');
const Order = require('../model/order_schema');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');

const salesReport = async (req, res) => {
    try {
        return res.render('salesReport');
    } catch (error) {
        console.log(error.message);
        return res.redirect('/500')
    }
}; 

const generateReport = async (req, res) => {
    try {
        const { startDate, endDate, period } = req.query;
        const reportData = await getSalesReport(startDate, endDate, period);
        res.json(reportData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const downloadReport = async (req, res) => {
    try {
        const { format: fileFormat, startDate, endDate, period } = req.query;
        const reportData = await getSalesReport(startDate, endDate, period);
          
 
        if (fileFormat === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');

            worksheet.columns = [
                { header: 'Order ID', key: '_id', width: 30 },
                { header: 'Date', key: 'createdAt', width: 25 },
                { header: 'Total Amount', key: 'totalAmount', width: 20 },
                { header: 'Coupon Discount', key: 'couponDiscount', width: 20 },
                { header: 'Offer Discount', key: 'offerDiscount', width: 25 },
                // { header: 'Order Status', key: 'orderStatus', width: 20 },
            ];

            reportData.orders.forEach((order) => {
                
                worksheet.addRow({
                    _id: order._id,
                    createdAt: format(typeof(order.createdAt)=='object' ? order.createdAt : parseISO(order.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                    totalAmount: order.totalAmount,
                    couponDiscount: order.couponDiscount,
                    offerDiscount: order.offerDiscount,
                    // orderStatus: order.orderStatus
                });
            });
            // console.log('working')
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

            await workbook.xlsx.write(res);
            res.end();
        } else if (fileFormat === 'pdf') {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');

            doc.registerFont('Roboto-Medium',path.join(__dirname,'../public/fonts/Roboto/Roboto-Medium.ttf'))
            doc.registerFont('Roboto-Light',path.join(__dirname,'../public/fonts/Roboto/Roboto-Light.ttf'))
            doc.pipe(res);
            doc.font('Roboto-Medium')
            doc.fontSize(22).text('Sales Report', { align: 'center', underline: true });
            doc.moveDown(2);

            doc.fontSize(12).text(`Sales Count: ${reportData.overallSalesCount}`);
            doc.fontSize(12).text(`Order Amount: ₹ ${reportData.overallOrderAmount.toFixed(2)}`);
            doc.fontSize(12).text(`Total Discount: ₹ ${reportData.overallDiscount.toFixed(2)}`);
            doc.moveDown(3);


            let startX = 40
            let startY = 180
            let endX = 570
            doc.moveTo(startX,startY).lineTo(endX,startY).stroke()
            doc.moveDown(2)

           
            const tableTop = 220;
            const tableLeft = 10;
            const columnWidth = 80;
            doc.font('Helvetica-Bold');
            doc.text('Order ID', tableLeft, tableTop);
            doc.text('Date', tableLeft + columnWidth+30, tableTop);
            doc.text('Total Amount', tableLeft + columnWidth*2 , tableTop);
            doc.text('Coupon Discount', tableLeft + columnWidth* 3 + 20 , tableTop);
            doc.text('Offer Discount', tableLeft + columnWidth *4 + 60 , tableTop);
            // doc.text('Order Status',tableLeft + columnWidth *5 +70 , tableTop);

            doc.font('Roboto-Light');
            let yPosition = tableTop + 20;
            reportData.orders.forEach((order, index) => {
                if (yPosition > 700) {
                    doc.addPage();
                    yPosition = 50;
                }
                doc.text(order._id.toString().split('').splice(0,10).join(''), tableLeft, yPosition);
                doc.text(format(typeof(order.createdAt)=='object' ? order.createdAt : parseISO(order.createdAt), 'yyyy-MM-dd'), tableLeft + columnWidth, yPosition);
                doc.text(`₹${order.subTotalAmount.toFixed(2)}`, tableLeft + columnWidth*2+10 , yPosition);
                doc.text(`₹${order.couponDiscount.toFixed(2)}`, tableLeft + columnWidth * 3+40, yPosition);
                doc.text(`₹${order.offerDiscount.toFixed(2)}`, tableLeft + columnWidth * 4 + 60, yPosition);
                // doc.text(`${order.orderStatus}`,tableLeft+columnWidth*5 + 90,yPosition)
                yPosition += 20;
            });

            doc.end();
        } else {
            res.status(400).json({success:false,message:'Invalid format'});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
 
const getSalesReport = async (startDate='', endDate='', period) => {
    let start, end;

    if (period === 'day') {
        start = startOfDay(new Date());
        end = endOfDay(new Date());
    } else if (period === 'week') {
        start = startOfWeek(new Date());
        end = endOfWeek(new Date());
    } else if (period === 'month') {
        start = startOfMonth(new Date());
        end = endOfMonth(new Date());
    } else if (period === 'year') {
        start = new Date(new Date().getFullYear(), 0, 1);
        end = new Date(new Date().getFullYear(), 11, 31);
    } else if (startDate && endDate) {
        start = startOfDay(parseISO(startDate));
        end = endOfDay(parseISO(endDate));
    } else {
        throw new Error('Invalid date range');
    }

    const orders = await Order.find({
        orderDate: { $gte: start, $lte: end },
    });

    const overallSalesCount = orders.length;
    const overallOrderAmount = orders.reduce((acc, order) => acc + order.subTotalAmount, 0);
    const overallDiscount = orders.reduce((acc, order) => acc + order.couponDiscount + order.offerDiscount, 0);

    return {
        overallSalesCount,
        overallOrderAmount,
        overallDiscount,
        orders,
    };
};



module.exports = {
    salesReport,
    generateReport,
    downloadReport,
    getSalesReport
};
