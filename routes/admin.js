var express = require('express');
const { response } = require('../app');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
//var session=require('express-session')
/* GET adimin listing. */
// const veryfyLogin = (req, res, next) => {
//   if (req.session.admin.loggedIn) {
//     next()
//   }else{
//     res.redirect('/admin-login')
//   }
// }
router.get('/', async function (req, res) {
  
 if(req.session.admin){
  productHelpers.getallproducts().then((products) => {
   
    res.render('admin/view-products', { admin: true, products,adminlog:req.session.admin})
  })
 }
 else{
  res.render('admin/admin-login',{admin:true})
 }
})
router.get('/admin-login', (req, res) => {
  
  res.render('admin/admin-login',{admin:true})
})
router.post('/admin-login', (req, res) => {
  productHelpers.adminLogin(req.body).then((response) => {
    let { email, password } = req.body;
    
    if (!email) {
      req.session.loginError = "Admin doesn't exist";
      res.render('admin/admin-login', { loginError: req.session.loginError });
      delete req.session.loginError;
    } else {
      if (response.status) {
        req.session.admin = response.admin;
        req.session.admin.loggedIn = true;
        console.log(req.session.admin);
        res.redirect('/admin');
      } else {
        req.session.loginError = "Invalid email or password";
        res.render('admin/admin-login', { loginError: req.session.loginError });
        delete req.session.loginError;
      }
    }
  });
});
router.get('/admin-logout', (req, res) => {
  req.session.admin = null
  res.redirect('/admin')
})
router.get('/add-product', function (req, res) {

  res.render('admin/add-product', { admin: true })
})
router.post('/add-product',(req, res) => {
  productHelpers.addProduct(req.body, async (id) => {
    console.log(id);
    const image = await req.files.image
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!done) {
        res.render('admin/add-product', { admin: true })
      }
      else {
        ("Erorr Found" + err)
      }
    })
  })
})
router.get('/delete-product:id', (req, res) => {
  const proid = req.params.id
  console.log(proid);
  productHelpers.deleteProduct(proid).then((response) => {
    res.redirect('/admin')
  })
})
router.get('/edit-product/:id', (req, res) => {
  productHelpers.editProduct(req.params.id).then((product) => {
    res.render('admin/edit-product', { admin: true, product })
  })
})
router.post('/edit-product/:id', (req, res) => {
  console.log(req.params.id);
  const id = req.params.id
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin')
    if (req.files.image) {
      const proid = req.params.id
      const image = req.files.image
      image.mv('./public/product-images/' + id + '.jpg')
    }
  })
})
router.get('/all-orders', (req, res) => {
  productHelpers.showAllOrders().then((order) => {
    res.render('admin/all-orders', { admin: true, order: order });
  });
});
router.get('/all-users', (req, res) => {
  productHelpers.showAllUsers().then((user) => {
    res.render('admin/all-users', { admin: true, users: user })
  })
})
module.exports = router;