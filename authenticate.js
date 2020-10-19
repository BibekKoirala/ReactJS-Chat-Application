const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const user = require('./models/users');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

var config = require('./config');

exports.local = passport.use(new LocalStrategy(user.authenticate()));

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

exports.getToken = function(user){
    return jwt.sign(user, config.secretKey,
        {expiresIn:3600});
};



exports.jwtPassport = passport.use(new JwtStrategy({
    jwtFromRequest: req => req.signedCookies['jwt'],
    secretOrKey: config.secretKey,
  },
    (jwt_payload, done)=>{
        console.log("JWT Payload:",jwt_payload);
        user.findOne({_id: jwt_payload._id}, (err, User)=>{
            if(err){
                return done(err,false);
            }
            else if (User){
                return done(null, User);
            }
            else{
                return done(null, false);
            }
        });
    })
);

exports.verifyUser = passport.authenticate('jwt',{session: false});
