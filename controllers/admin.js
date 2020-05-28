const mongoose = require('mongoose');

const Product = require('../models/product');
const fileHelper = require('../util/file');

const { validationResult } = require('express-validator');

const getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product', 
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
        // isAuthenticated: req.session.isLoggedIn
        //activeAddProduct: true, 
        //productCSS: true, 
        //formsCSS: true
    });
}

const postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product', 
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            errorMessage: 'Attached file is not a image',
            validationErrors: [],
            product: { title, price, description }
        });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product', 
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            product: { title, price, description }
        });
    }
    const imageURL = image.path;
    console.log(image);
    const product = new Product({ title, imageURL, price, description, userId: req.user._id });
    product.save()
        .then(result => {
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const productID = req.params.productID;
    Product.findById(productID)
    //Product.findByPk(productID)
        .then( product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product', 
                path: '/admin/edit-product',
                editing: editMode,
                hasError: false,
                product,
                errorMessage: null,
                validationErrors: []
                // isAuthenticated: req.session.isLoggedIn
                //activeAddProduct: true, 
                //productCSS: true, 
                //formsCSS: true
            });
        })    
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const postEditProduct = (req, res, next) => {
    const productID = req.body.productID;
    const updatedTitle = req.body.title;
    const image = req.file;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product', 
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            errorMessage: null,
            validationErrors: [],
            product: { title: updatedTitle, price: updatedPrice, description: updatedDescription, _id: productID }
        });
    }

    Product.findById(productID)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = updatedTitle;
            if (image) {
                fileHelper.deleteFile(product.imageURL);
                product.imageURL = image.path;
            }
            product.price = updatedPrice;
            product.description = updatedDescription;
            return product.save()
                .then(result => {
                console.log('UPDATED PRODUCT!');
                res.redirect('/admin/products');
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

const deleteProduct = (req, res, next) => {
    const productID = req.params.productID;
    Product.findById(productID)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found.'));
            }
            fileHelper.deleteFile(product.imageURL);
            return Product.findOneAndDelete({ _id: productID, userId: req.user._id });
        })
        .then(() => {
            console.log('PRODUCT WAS ELIMINATED!');
            res.status(200).json({
                message: 'Success!'
            });
        })
        .catch(err => {
            res.status(500).json({
                message: 'Deleting product failed!'
            })
        });
}

const getProducts = (req, res, next) => {
    Product.find({userId: req.user._id})
//     req.user.getProducts()
        .then(products => {
            res.render('admin/products', {
                productsToRender: products, 
                pageTitle: 'Admin Products', 
                path: '/admin/products',
                // isAuthenticated: req.session.isLoggedIn
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

module.exports = {
    getAddProduct,
    postAddProduct,
    getEditProduct,
    postEditProduct,
    deleteProduct,
    getProducts
}