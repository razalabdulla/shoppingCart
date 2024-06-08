var db = require('../config/connection')
var collection = require('../config/collection')
const { response } = require('../app')
var ObjectId = require('mongodb').ObjectId
var bcrypt = require('bcrypt')


module.exports = {


    addProduct: (product, callback) => {
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            callback(data.insertedId)
        })

    },
    getallproducts: () => {
        return new Promise(async (resolve, reject) => {
            const products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new ObjectId(proId) }).then((response) => {
                resolve(response)
                console.log(response);
            })

        })
    },
    editProduct: (proId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(proId) }).then((product) => {
                resolve(product)
                console.log(product);

            })

        })
    },
    updateProduct: (proId, productDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: new ObjectId(proId) }, {
                $set: {
                    Name: productDetails.Name,
                    Category: productDetails.Category,
                    price: productDetails.price,
                    description: productDetails.description


                }
            }).then((response) => {
                resolve(response)
            })
        })

    },
    showAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .find()
                    .toArray();
                resolve(orders);
            } catch (error) {
                reject(error);
            }
        });
    },
    showAllUsers: () => {
        // return new Promise((resolve, reject) => {
        //     const users = db.get().collection(collection.USER_COLLECTION).find().toArray()
        //     resolve(users)

        // })
        return new Promise((resolve,reject)=>{
            const users=db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    adminLogin: (adminData) => {
        return new Promise((resolve, reject) => {
            let response = {}
            if (adminData.email === "admin@gmail.com" && adminData.password ==="admin111") {
                response.admin = adminData.email
                response.status = true
                console.log(response.admin);
                console.log("login success");
                resolve(response)
            } else {
                response.status = false
                console.log("login failed");
                resolve(response)
            }
        })
        
    }
   
   

}





