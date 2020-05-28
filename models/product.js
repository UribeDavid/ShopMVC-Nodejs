const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: { type: String, required: true },
    imageURL: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Product', productSchema);
// const mongodb = require('mongodb');

// const getDB = require('../util/database').getDB;

// class Product {
//     constructor(title, imageURL, price, description, id, userId) {
//         this.title = title;
//         this.imageURL = imageURL;
//         this.price = price;
//         this.description = description;
//         this._id = id ? mongodb.ObjectId(id) : null;
//         this.userId = userId;
//     }

//     save() {
//         const db = getDB();
//         let dbOp = null;
//         if (this._id) {
//             // Update the product
//             dbOp = db.collection('products').updateOne({ _id: this._id}, {$set: this} );
//         } else {
//             dbOp = db.collection('products').insertOne(this);
//         }
//         return dbOp
//             .then(result => {
//                 console.log(result);
//             })
//             .catch( err => {
//                 console.log(err);
//             });
//     }

//     static fetchAll() {
//         const db = getDB();
//         return db.collection('products').find().toArray()
//             .then(products => {
//                 console.log(products);
//                 return products;
//             })
//             .catch( err => console.log(err));
//     }

//     static findById(id) {
//         const db = getDB();
//         return db.collection('products').find({ _id: new mongodb.ObjectID(id) }).next()
//             .then(product => {
//                 console.log(product);
//                 return product;
//             })
//             .catch( err => console.log(err));
//     }

//     static deleteById(id){
//         const db = getDB();
//         return db.collection('products').deleteOne({ _id: new mongodb.ObjectId(id) })
//             .then(result => {
//                 console.log('DELETED!');
//             })
//             .catch( err => console.log(err));
//     }
// }

// module.exports = Product;