const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const stripe = require('stripe')('sk_test_ISveYs2XqYzCTCUlNbY65D8W00bPNO3bEE');

const ITEMS_PER_PAGE = 2;

const getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalProducts = null;
    Product.find()
        .countDocuments()
        .then( numberProducts => {
            totalProducts = numberProducts;
            return Product.find()
                    .skip((page - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);
        })
        .then(products => {
            res.render('shop/product-list', {
                productsToRender: products, 
                pageTitle: 'Products', 
                path: '/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE)
                // isAuthenticated: req.session.isLoggedIn,
                // csrfToken: req.csrfToken()
                //hasProducts: products.length > 0, 
                //activeShop: true, 
                //productCSS: true
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const getProductByID = (req, res, next) => {
    const productId = req.params.productID;
    Product.findById(productId)
        .then(product => {
            res.render('shop/product-detail', {
                productToRender: product,
                pageTitle: `Product Detail: ${product.title}`,
                path: '/products',
                // isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalProducts = null;
    Product.find()
        .countDocuments()
        .then( numberProducts => {
            totalProducts = numberProducts;
            return Product.find()
                    .skip((page - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);
        })
        .then(products => {
            res.render('shop/index', {
                productsToRender: products, 
                pageTitle: 'Shop', 
                path: '/',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE)
                // isAuthenticated: req.session.isLoggedIn,
                // csrfToken: req.csrfToken()
                //hasProducts: products.length > 0, 
                //activeShop: true, 
                //productCSS: true
            });
        })
        .catch(err => {
            console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products,
                // isAuthenticated: req.session.isLoggedIn
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const postCart = (req, res, next) => {
    const productID = req.body.productID;
    Product.findById(productID)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then( result => {
            console.log(result);
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const postCartDeleteProduct = (req, res, next) => {
    const productID = req.body.productID;
    req.user.deleteItemFromCart(productID)
        .then( data => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const getOrders = (req, res, next) => {
    Order.find({'user.userId': req.user._id})
        .then( orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Order',
                orders,
                // isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const getCheckout = (req, res, next) => {
    let products = null;
    let total = 0;
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            products = user.cart.items;
            total = 0;
            products.forEach(i => {
                total += i.quantity * i.productId.price;
            })
            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: products.map(i => {
                    return { 
                        name: i.productId.title,
                        description: i.productId.description,
                        amount: i.productId.price * 100,
                        currency: 'usd',
                        quantity: i.quantity
                    }
                }),
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
                cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
            });
        })
        .then( session => {
            res.render('shop/checkout', {
                path: '/Checkout',
                pageTitle: 'Checkout',
                products,
                total,
                sessionId: session.id
                // isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const getCheckoutSuccess = (req, res, next) => {
    console.log('ERROR 0')
    req.user.populate('cart.items.productId')
        .execPopulate()
        .then( user => {
            console.log('ERROR 1')
            const products = user.cart.items.map( i => {
                return { quantity: i.quantity, product: {...i.productId._doc} };
            })
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user._id
                }, 
                products
            });
            console.log('ERROR 2')
            return order.save();
        })
        .then(result => {
            console.log('ERROR 3')
            return req.user.clearCart();
        })
        .then(result => {
            console.log('ERROR 4')
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

// const getInvoice = (req, res, next) => {
//     const orderId = req.params.orderId;
//     Order.findById(orderId)
//         .then( order => {
//             if (!order) {
//                 return next(new Error('No order found!'));
//             }
//             if (order.user.userId.toString() !== req.user._id.toString()) {
//                 return next(new Error('Unathorized'));
//             }
//             const invoiceName = `invoice-${orderId}.pdf`;
//             const invoicePath = path.join('data', 'invoices', invoiceName);

//             const pdfDoc = new PDFDocument();
//             res.setHeader('Content-Type','application/pdf');
//             res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
//             pdfDoc.pipe(fs.createWriteStream(invoicePath));
//             pdfDoc.pipe(res);

//             pdfDoc.fontSize(26).text('Invoice', { underline: true });
//             pdfDoc.text('----------------------------');

//             let totalPrice = 0;
//             order.products.forEach(i => {
//                 totalPrice += i.product.price * i.quantity ;
//                 pdfDoc.text(`${i.product.title} - ${i.quantity}x $ ${i.product.price}`);
//             });

//             pdfDoc.text(`Total Price: $${totalprice}`);

//             pdfDoc.end();
//         })
//         .catch( err => next(err));
// }
const getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
      .then(order => {
        if (!order) {
          return next(new Error('No order found.'));
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
          return next(new Error('Unauthorized'));
        }
        const invoiceName = `invoice-${orderId}.pdf`;
        const invoicePath = path.join('data', 'invoices', invoiceName);
  
        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
  
        pdfDoc.fontSize(26).text('Invoice', { underline: true });
        pdfDoc.text('-----------------------');

        let totalPrice = 0;
        order.products.forEach(i => {
          totalPrice += i.quantity * i.product.price;
          pdfDoc.fontSize(14).text(`${i.product.title}-${i.quantity} x $${i.product.price}`);
        });
        pdfDoc.text('---');
        pdfDoc.fontSize(20).text(`Total Price: $${totalPrice}`);
  
        pdfDoc.end();
      })
      .catch(err => next(err));
  };


module.exports = {
    getProducts,
    getProductByID,
    getIndex,
    getCart,
    postCart,
    postCartDeleteProduct,
    getCheckout,
    getOrders,
    getCheckoutSuccess,
    getInvoice
}