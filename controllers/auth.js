const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: { api_key: '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' }
}));

const getLogin = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split('=')[1];
    let message = req.flash('error');
    if ( message.length > 0 ) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        path: 'login',
        pageTitle: 'Login',
        // isAuthenticated: false,
        errorMessage: message,
        email: '',
        validationErrors: []
    });
}

const getSignUp = (req, res, next) => {
    let message = req.flash('error');
    if ( message.length > 0 ) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Sign Up',
        errorMessage: message,
        email: '',
        validationErrors: []
        // isAuthenticated: false
    });
}

const postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(422).render('auth/login', {
            path: 'login',
            pageTitle: 'Login',
            // isAuthenticated: false,
            errorMessage: errors.array()[0].msg,
            email
        });
    }
    User.findOne({email})
        .then(user => {
            console.log(user);
            if (!user) {                
                console.log('Email no encontrado');
                return res.render('auth/login', {
                    path: 'login',
                    pageTitle: 'Login',
                    // isAuthenticated: false,
                    errorMessage: 'Invalid email or password',
                    email,
                    validationErrors: []
                });
            }
            if (bcrypt.compareSync(password, user.password)) {
                req.session.user = user;
                req.session.isLoggedIn = true;
                return req.session.save(err => {
                    console.log(err);
                    res.redirect('/');
                    console.log(req.session);
                });
            } else {
                console.log('Contraseña invalida');
                req.flash('error', 'Invalid Email or Password');
                return res.render('auth/login', {
                    path: 'login',
                    pageTitle: 'Login',
                    // isAuthenticated: false,
                    errorMessage: 'Invalid email or password',
                    email,
                    validationErrors: []
                });
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const postLogOut = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
}

const postSignUp = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Sign Up',
            errorMessage: errors.array()[0].msg,
            email,
            validationErrors: errors.array()
            // isAuthenticated: false
        })
    }
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email,
                password: hashedPassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(() => {
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'daviduribe1997@outlook.com',
                subject: 'Successful Sign Up',
                html: '<h1>You successfully signed up!</h1>'
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const getReset = (req, res, next) => {
    let message = req.flash('error');
    if ( message.length > 0 ) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
}

const postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
            .then(user => {
                if (!user) {
                    req.flash('error', 'Email not found!');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                    to: req.body.email,
                    from: 'daviduribe1997@outlook.com',
                    subject: 'Reset Password',
                    html: `<p>You requested a password reset</p>
                           <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>`
                });
            })
            .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    });
}

const getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now() }})
        .then(user => {
            let message = req.flash('error');
            if ( message.length > 0 ) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'Update Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser = null;
    User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, _id: userId })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12)
        })
        .then(hashedNewPassword => {
            resetUser.password = hashedNewPassword;
            resetUser.resetToken = null;
            resetUser.resetTokenExpiration = null;
            return resetUser.save();
        })
        .then(() => {
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

module.exports = {
    getLogin,
    getSignUp,
    postLogin,
    postLogOut,
    postSignUp,
    getReset,
    postReset,
    getNewPassword,
    postNewPassword
};