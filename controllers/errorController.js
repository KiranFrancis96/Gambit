

const loadErrorPage = async (req,res)=>{
    try {
       return res.render('error')        
    } catch (error) {
        console.log(error)
       return res.redirect('/500')
    }
}

const load500 = async (req,res)=>{
    try {
        return res.render('500')
    } catch (error) {
        console.log(error)
       return res.redirect('/error/')
    }
}

const load404 = async (req,res)=>{
    try {
        return res.render('404')
    }
    catch (error) {
        console.log(error)
        return res.redirect('/500')
    }
}

module.exports = {
    loadErrorPage,
    load500,
    load404,
}