const multer = require('multer');

const productstorage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log(req.files)
        cb(null, './public/imgs/products');
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const categoryStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/imgs/categories');
    },
    filename: function(req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const product_upload = multer({
    storage: productstorage,
    fileFilter: function(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp)$/)) {
            req.fileValidationError = 'Only image files are allowed!';
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
})

const category_upload = multer({storage: categoryStorage});

module.exports = {
    product_upload,
    category_upload,
};