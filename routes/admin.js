const path = require('path');

const { body } = require('express-validator');

//const rootDir = require('../util/path');
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const express = require('express');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth.isLoggedIn, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth.isLoggedIn, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', [body('title').isString(),
                             body('price').isFloat(),
                             body('description').isString().isLength({max: 500})], 
    isAuth.isLoggedIn, adminController.postAddProduct);

router.get('/edit-product/:productID', isAuth.isLoggedIn, adminController.getEditProduct);

router.post('/edit-product',[body('title').isString(),
                             body('price').isFloat(),
                             body('description').isString().isLength({max: 500})], 
isAuth.isLoggedIn, adminController.postEditProduct);

router.delete('/product/:productID', isAuth.isLoggedIn, adminController.deleteProduct);

module.exports = router;