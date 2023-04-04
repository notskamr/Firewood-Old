import User from "../models/user.js";
import jsonwebtoken from "jsonwebtoken";

export const checkUser = async (req, res, next) => {
  // Get auth token from the cookies
  const token = req.cookies.token;
  // Check for validity
  authed = false;
  if (token !== null) {
    try {
      authed = jsonwebtoken.verify(token, process.env.JWT_SECRET);
      if (await User.exists({ _id: authed.id })) authed = true;
    } catch (error) {
      res.clearCookie("token");
    }
  }
  req.user = authed;
  next();
};

export const requireAuth = async (redirect = "/") => {
  return async (req, res, next) => {
    if (req.user) {
      next();
    } else {
      res.redirect(redirect);
    }
  };
};
