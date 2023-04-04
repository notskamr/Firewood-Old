import { json, Router } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import User from "../../../models/user.js";

const authRouter = Router;
authRouter.use(json());
authRouter.use(cors());
authRouter.use(cookieParser());

const cookieAge = 3; // in days

app.post("/login", async (req, res) => {
  let { usermail, password: passwordPlain } = req.body;
  if (!usermail || !passwordPlain) {
    return res.json({ status: "error", error: "Missing fields." });
  }

  if (validator.validate(usermail)) {
    // input is an e-mail
    usermail = usermail.toLowerCase();
    if (typeof usermail !== "string") {
      return res.json({
        status: "error",
        error: "Invalid e-mail/username/password",
      });
    }
    var user = await User.findOne({ email: usermail }).exec();
  } else {
    var user = await User.findOne({ username: usermail }).exec();
  }

  if (!user) {
    return res.json({
      status: "error",
      error: "Invalid e-mail/username/password",
    });
  }

  let hash = user.password;
  if (await bcrypt.compare(passwordPlain, hash)) {
    // Found
    const token = jsonwebtoken.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET
    );
    res.cookie("token", token, {
      secure: process.env.NODE_ENV !== "dev",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * cookieAge,
    });
    return res.json({ status: "ok", token: token });
  }
  return res.json({
    status: "error",
    error: "Invalid e-mail/username/password",
  });
});
