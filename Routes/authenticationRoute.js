const express = require('express');
const bodyParser = require('body-parser');
const User = require('../models/users');
const passport = require('passport');
const path = require('path');
const authenticate = require('../authenticate');
const Socket = require('ws');


const router = express.Router();
router.use(bodyParser.json());



router.post('/signup', (req, res, next) => {
  console.log(req.body)
  User.register(new User({username: req.body.values.username, email: req.body.values.email,
                         company: req.body.values.company,
                         designation: req.body.values.designation, status : 'online'}),
   req.body.values.password, (err, user)=>{
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err : err})
    }
    else {
        console.log(user)
       
        var token = authenticate.getToken({_id: user._id});
        res.cookie('jwt',token, {signed : true});
        res.statusCode = 200;

        res.json({loggedin : true,
          status : user.status, 
          username : user.username,
          email : user.email,
          _id : user._id,
          designation : user.designation,
          company : user.company,
          token : token});
    }
  });
});

router.post('/login', passport.authenticate('local'),(req, res, next) => {
  console.log("done") 
  var token = authenticate.getToken({_id: req.user._id});
    res.cookie('jwt',token, {signed : true});
    res.statusCode = 200;

    res.json({loggedin : true,
      status : req.user.status, 
      username : req.user.username,
      email : req.user.email,
      _id : req.user._id,
      designation : req.user.designation,
      company : req.user.company,
      token : token});
})

router.get('/logout',authenticate.verifyUser, (req, res, next) => {
  if (req.signedCookies) {
    res.clearCookie('jwt');
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

module.exports = router;