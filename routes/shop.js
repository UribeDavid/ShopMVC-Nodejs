const express = require('express');

const path = require('path');

//const rootDir = require('../util/path');
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productID', shopController.getProductByID);

router.get('/cart', isAuth.isLoggedIn, shopController.getCart);

router.post('/cart', isAuth.isLoggedIn, shopController.postCart);

router.get('/orders', isAuth.isLoggedIn, shopController.getOrders);

router.get('/checkout', isAuth.isLoggedIn, shopController.getCheckout);

router.get('/checkout/success', shopController.getCheckoutSuccess);

router.get('/checkout/cancel', shopController.getCheckout);

router.post('/cart-delete-item', isAuth.isLoggedIn, shopController.postCartDeleteProduct);

router.get('/orders/:orderId', isAuth.isLoggedIn, shopController.getInvoice);

module.exports = router;