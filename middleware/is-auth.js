const isLoggedIn = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        res.redirect('/');
    }
    next();
}

module.exports = {
    isLoggedIn
}