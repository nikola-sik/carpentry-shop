exports.get404 = (req,res,next) => {
    res.status(404).render('404',{
        pageTitle : '404', 
        path: '/404',
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.isAdmin
    });
} ;

exports.get403 = (req,res,next) => {
    res.status(403).render('403',{
        pageTitle : '403', 
        path: '/403',
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.isAdmin
    });
} ;

exports.get500 = (req,res,next) => {
    res.status(500).render('500',{
        pageTitle : 'Greška!', 
        path: '/500',
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.isAdmin
    });
} ;