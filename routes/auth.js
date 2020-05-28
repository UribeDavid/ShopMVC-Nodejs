const express = require('express');

const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();


router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignUp);

router.post('/signup', check('email').isEmail().withMessage('Please enter a valid email').normalizeEmail()
                        .custom((value, { req } ) => {
                            return User.findOne({email: value})
                                .then(userResult => {
                                    if (userResult) {
                                        return Promise.reject('Email exists already!');
                                    }
                                })
                        }), 
                        body('password', 'The password must be a least 5 digits').isLength({ min: 5}), 
                        body('confirmPassword').custom((value, { req }) => {
                            if (value !== req.body.password) {
                                throw new Error('The passwords have to match!');
                            }
                            return true;
                        }), 
                        authController.postSignUp);

router.post('/login', body('email', 'Enter a valid Email').isEmail().normalizeEmail(), authController.postLogin);

router.post('/logout', authController.postLogOut);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;