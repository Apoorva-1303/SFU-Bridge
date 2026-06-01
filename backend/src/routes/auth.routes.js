import { Router } from "express";
import passport from "passport";
import { googleAuth, googleRedirect, redirect, userLogin, userLoginError, userSignup, getProfile, userLogout } from "../controllers/auth.controller.js";
const router = Router();



router.post('/signup', userSignup);

router.post('/login', passport.authenticate('local', { failWithError: true }), userLogin, userLoginError);

router.get('/profile', getProfile);

router.post('/logout', userLogout);

router.route("/google").get(googleAuth);


router.route("/google/redirect").get(googleRedirect, redirect);


export default router;