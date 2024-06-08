var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
const { response } = require('../app')
const ObjectId = require('mongodb').ObjectId
//const Razorpay = require('razorpay');
//var instance = new Razorpay({
  //key_id: 'rzp_test_NIB6x9wpyeluPv',
  //key_secret: 'svee5zrCeu7nIg0G5Er1bRK5',
//});
module.exports = {
    userSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            console.log(userData);
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then()
            resolve(userData)
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            var loginStatus = false
            const response = {}
            const user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log("login success")
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("login failed");
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('login failed');
                resolve({ status: false })
            }
        })

    },
    addtoCart: (proId, userId) => {
        let proObj = {
            item: new ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            const userCart = await db.get().collection(collection.USER_CART).findOne({ user: new ObjectId(userId) })
            console.log(userCart);
            if (userCart) {
                let productExist = userCart.products.findIndex(product => product.item == proId)

                if (productExist != -1) {
                    db.get().collection(collection.USER_CART).
                        updateOne({ user: new ObjectId(userId), 'products.item': new ObjectId(proId) },
                            {

                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {

                    db.get().collection(collection.USER_CART).updateOne({ user: new ObjectId(userId) },
                        {
                            $push: { products: (proObj) }

                        }).then((response) => {
                            resolve(response)
                        })
                }

            } else {
                const userObj = {
                    user: new ObjectId(userId),
                    products: [proObj]

                }
                db.get().collection(collection.USER_CART).insertOne(userObj).then((response) => {
                    resolve(response)
                })
            }

        })
    },
    showCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            const cartItems = await db.get().collection(collection.USER_CART).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }
                    }
                },
            ]).toArray()
            resolve(cartItems)
            console.log(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.USER_CART).findOne({ user: new Object(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.USER_CART).
                    updateOne({ _id: new ObjectId(details.cart) },
                        {
                            $pull: { products: { item: new ObjectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            }
            else {
                db.get().collection(collection.USER_CART).
                    updateOne({ _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({status:true})
                    })
            }
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
          let total = await db
            .get()
            .collection(collection.USER_CART)
            .aggregate([
              {
                $match: { user: new ObjectId(userId) },
              },
              {
                $unwind: "$products",
              },
              {
                $project: {
                  item: "$products.item",
                  quantity: "$products.quantity",
                },
              },
              {
                $lookup: {
                  from: collection.PRODUCT_COLLECTION,
                  localField: "item",
                  foreignField: "_id",
                  as: "products",
                },
              },
              {
                $project: {
                  item: 1,
                  quantity: 1,
                  product: { $arrayElemAt: ["$products", 0] },
                },
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: {
                      $multiply: [
                        { $toInt: "$quantity" },
                        { $toInt: "$product.price" },
                      ],
                    },
                  },
                },
              },
            ])
            .toArray();
            if (total.length > 0) {
                resolve(total[0].total);
              } else {
                resolve(0); // or whatever default value you want to return
              }
        });
      },
      Placeorderdetails:(order,products,total)=>{
       return new Promise((resolve,reject)=>{
        console.log(order,products,total);
        let status=order.payment==='Cash On Delivery'?'placed':'pending'
        let orderObj={
            deliveryDetails:{
            name:order.firstname,
            email:order.email,
            address:order.address,
            city:order.city,
                mobile:order.mobile,
                state:order.state,
                pin:order.pin
            },
            userId:new ObjectId(order.userId),
            paymentmethod:order.payment,
            products:products,
            totalAmount:total,
            status:status,
            date:new Date()
        }
        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
            db.get().collection(collection.ORDER_COLLECTION).deleteOne({user:new ObjectId(order.userId)})
            resolve(response.insertedId[0])
        })
       })
      },
      getproductlist:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.USER_CART).findOne({user:new ObjectId(userId)})
            resolve(cart.products)
        })
      },
      getUserOrders: (userId) => {
        return new Promise(async(resolve, reject) => {
          let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId: new ObjectId(userId)}).toArray();
          console.log(orders);
          resolve(orders);
        });
      },
       getOrderlist:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderproducts=db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {_id: new ObjectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }
                    }
                },
            ]).toArray()
            resolve(orderproducts)
            console.log(orderproducts)
        })
       },
       generateRazaorpay:(orderId,total)=>{
        console.log('orderId:', orderId);
        return new Promise((resolve,reject)=>{
           
            var options={
                amount:total,
                currency:'INR',
                receipt: "order:"+new Object(orderId) 

            }
            
              
            instance.orders.create(options,(err,order)=>{
                if(err){
                    console.log(err);
                }
                else{
                console.log("New Order:",order);
                 resolve(order)
                }
            })

        })
       },
       removeProduct: (details) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.USER_CART)
            .updateOne(
              { _id:new  ObjectId(details.cart) },
              {
                $pull: { products: { item: new ObjectId(details.product) } },
              }
            )
            .then((response) => {
              resolve({ removeProduct: true });
            });
        });
      }
      }
    