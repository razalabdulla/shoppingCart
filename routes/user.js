var express = require('express');
const session = require('express-session');
const { response } = require('../app');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelper = require('../helpers/user-helper')
/* GET home page. */
const veryfyLogin=(req,res,next)=>{
  if(req.session.user.loggedIn)
 {
   next()
  }
  else
 {
   res.redirect('/login')
  }
}
router.get('/',async function(req, res) {
  const user=req.session.user
  console.log(user);
  let showCartCount=null
  if(req.session.user){
   showCartCount=await userHelper.getCartCount(req.session.user._id)
   console.log(showCartCount);
  }
  productHelpers.getallproducts().then((products) => {
    res.render('user/view-product', { products,user,showCartCount })
  })
});
router.get('/login', (req, res) => {
  if(req.session.user)
  {
    res.redirect('/')
  }
  else{
    res.render('user/login',{LoginError :req.session.userLoginErr})
    req.session.userLoginErr=false
  }
})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})
router.post('/signup', (req, res) => {
  userHelper.userSignup(req.body).then((response) => {
    console.log(response)
    req.session.loggedIn=true
    req.session.user=response
    res.render('user/signup')
  })
})
router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
   if(response.status)
   {
    
    req.session.user=response.user
    req.session.user.loggedIn=true
    res.redirect('/')
    
   }
   else
   {
    req.session.userLoginErr=true
    res.redirect('/login')
    
   }
  })  
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  res.redirect('/')
})
router.get('/cart', async (req, res) => {
  if (req.session.user) {
    const showproducts = await userHelper.showCartProducts(req.session.user._id);
    let totalValue = await userHelper.getTotalAmount(req.session.user._id);
    console.log('***' + req.session.user._id);

    // Check if cart is empty
    const isCartEmpty = showproducts.length === 0;

    res.render('user/cart', { showproducts, user: req.session.user._id, totalValue, isCartEmpty });
  } else {
    res.render('user/login');
  }
});


 

router.get('/add-to-cart/:id',(req,res)=>{
  console.log('API CALL')
 
  userHelper.addtoCart(req.params.id,req.session.user._id).then(()=>{
   
    res.json({status:true})
  })
})
router.post('/change-product-quantity',async(req,res)=>{
  console.log(req.body);
  userHelper.changeProductQuantity(req.body).then(async(response)=>{ 
  response.total=await userHelper.getTotalAmount(req.body.user)
    
    res.json(response)

  })
})

router.get('/place-order',veryfyLogin,async(req,res)=>{
 let total=await userHelper.getTotalAmount(req.session.user._id)
   
    res.render('user/place-order',{total,user:req.session.user})
  })
  router.post('/place-order',async(req,res)=>{
    let product=await userHelper.getproductlist(req.body.userId)
    let totalPrice=await userHelper.getTotalAmount(req.body.userId)
    userHelper.Placeorderdetails(req.body,product,totalPrice).then((orderId)=>{
      if(req.body['payment']=='Cash On Delivery'){
        res.json({cashOnDeliverySuccess:true})
      }else{
        userHelper.generateRazaorpay(orderId,totalPrice).then((response)=>{
          res.json(response)

        })
      }
      
    })
  console.log(req.body)
 })
  //router.get('/order-now/:id',veryfyLogin,async(req,res)=>{
  // let product=await productHelpers.editProduct(req.params.id)
   //console.log(product);
   // res.render('user/order-now',{product})
    
 // })
router.get('/success',(req,res)=>{
  //res.render('user/success',{user:req.session.user})
  res.render('user/image')
})
router.get('/orders', async (req, res) => {
  if (!req.session.user) {
    // Handle the case where the user is not logged in
    res.redirect('/login');
    return;
  }
  let orders = await userHelper.getUserOrders(req.session.user._id);
  res.render('user/orders', { user: req.session.user, orders });
});
router.get('/view-order-product/:id',async(req,res)=>{
  let showorderproducts=await userHelper.getOrderlist(req.params.id)
  res.render('user/view-order-product',{user:req.session.user,showorderproducts})

})
router.post('/verify-Payment',(req,res)=>{
  console.log(req.body);
})

router.post('/remove-product',(req,res)=>[
  userHelper.removeProduct(req.body).then((response)=>{
    res.json(response)
  })
])

module.exports = router;
