const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const passport = require('passport');

module.exports = function (app, myDataBase) {
    app.use(passport.initialize());
    app.use(passport.session());
    
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
            done(null, doc);
        });

    });

    passport.use(new LocalStrategy((username, password, done) => {
        myDataBase.findOne({ username: username }, (err, user) => {
            console.log(`User ${username} attempted to log in.`);
            if (err) return done(err);
            if (!user) return done(null, false);
            if (!bcrypt.compareSync(password, user.password)) {
                return done(null, false);
            }
            return done(null, user);
        });
    }));
}
