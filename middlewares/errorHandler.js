const errorHandler = (err,req,res,next)=> {
    console.log(req.url)
    console.log(req.method)
    console.log(err)
}

module.exports = {
    errorHandler
}