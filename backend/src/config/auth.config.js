import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oidc";
import User from "../models/user.model.js";
import "dotenv/config";

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use('google',
  new GoogleStrategy({

    clientID: process.env['AUTH_CLIENT_ID'],
    clientSecret: process.env['AUTH_CLIENT_SECRET'],
    callbackURL: `${process.env.BASE_API_URL}/api/auth/google/redirect`,
    scope: ['profile', 'email']

  },async (issuer, profile, done) => {
    try {
      console.log("printing profile!!!!");
      console.log(profile);
      const id = profile.id;
      const user = await User.findOne({ googleId: id });

      if (user) {
        return done(null, user);
      } else {
        const newUser = await new User({
          email: profile.emails?.[0]?.value || "", 
          username: profile.displayName,
          googleId: id
        }).save();

        return done(null, newUser);
      }
    } catch (err) {
      return done(err, null);
    }
  })
)



export default passport;