exports.notLoggedIn = function(req, res, next) {
    if (!req.session.newUserId && req.url != '/register' && req.url != '/log-in') {
        return res.redirect('/register');
    }
    next();
};

exports.loggedIn = (req, res, next) => {
    if (req.session.newUserId && req.url != '/thank-you') {
        return res.redirect('/thank-you');
    }
    next();
};
