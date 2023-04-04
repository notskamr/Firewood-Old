import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import NodeMailer from "nodemailer";
import * as https from "https";
import * as http from "http";
import { Server } from "socket.io";
import User from "./models/user.js";
import bcrypt from "bcryptjs";
import * as validator from "email-validator";
import jsonwebtoken from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { v4 as uuidV4 } from "uuid";
import * as fs from "fs";
import fetch from "node-fetch";
import { ExpressPeerServer } from "peer";
import { ResetPassword } from "./models/reset.js";
import { resetMail } from "./mail/ResetPassword.js";
import { ObjectId } from "mongodb";
import { checkUser, requireAuth } from "./middlewares/authCheck.js";
const app = express();

dotenv.config();

mongoose.connect(process.env.FIREWOOD_DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const server = http.Server(app);
const io = new Server(server);

// Peer server and route
const peerServer = ExpressPeerServer(server, {
  path: "/firewood",
});

app.use("/peerjs", peerServer);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/sounds", express.static("sounds"));

app.use(checkUser);

app.get("/", (req, res) => {
  var token = req.cookies["token"];
  try {
    var user = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    console.log("Current: ", user);
  } catch (error) {
    res.clearCookie("token");
    return res.render("home-no-user");
  }
  res.render("home", { user: user });
});

app.get("/new-cabin", requireAuth, (req, res) => {
  const cabinAddress = uuidV4();
  res.redirect(`/cabin/${cabinAddress}`);
});

app.get("/cabin/:cabin?", requireAuth, (req, res) => {
  if (!req.params.cabin) return res.redirect("/");
  res.render("cabin", {
    cabinAddress: req.params.cabin,
    userId: jsonwebtoken.verify(req.cookies["token"], process.env.JWT_SECRET)[
      "id"
    ],
    username: jsonwebtoken.verify(req.cookies["token"], process.env.JWT_SECRET)[
      "username"
    ],
  });
});

io.on("connection", (socket) => {
  socket.on("join-cabin", (cabinAddress, userId, username) => {
    socket.join(cabinAddress);
    socket.to(cabinAddress).emit("user-connected", userId, username);
    console.log(`${username} (${userId}) connected to '${cabinAddress}'`);

    socket.on("data test", (data) => {
      console.log(data);
    });

    socket.on("disconnect", () => {
      console.log(
        `${username} (${userId}) disconnected from '${cabinAddress}'`
      );
      socket.to(cabinAddress).emit("user-disconnected", userId, username);
      socket.disconnect(true);
    });
  });
});
app.get("/register", (req, res) => {
  let token = req.cookies["token"];
  if (token) {
    try {
      let user = jsonwebtoken.verify(token, process.env.JWT_SECRET);
      console.log("Current: ", user);
    } catch (error) {
      res.clearCookie("token");
      res.redirect("/register");
    }
    return res.redirect("/");
  }
  return res.render("register");
});
app.get("/login", (req, res) => {
  var token = req.cookies["token"];
  if (token) {
    try {
      var user = jsonwebtoken.verify(token, process.env.JWT_SECRET);
      console.log("Current: ", user);
    } catch (error) {
      res.clearCookie("token");
      res.redirect("/login");
    }
    return res.redirect("/");
  }
  return res.render("login");
});

app.get("/forgot-password", async (req, res) => {
  return res.render("password/forgot-password");
});
app.get("/forgot-password/reset-:resetId?", async (req, res) => {
  if (!req.params.resetId) return res.redirect("/forgot-password");

  var resetId = req.params.resetId;
  console.log(resetId);
  const reset = await ResetPassword.findOne({ resetURL: resetId }).exec();
  if (!reset) return res.redirect("/forgot-password");
  console.log(reset);

  const user = await User.findById(reset["userId"]);
  if (!user) return res.redirect("/forgot-password");

  return res.render("password/change-password", {
    id: user["_id"],
    resetURL: resetId,
  });
});

app.post("/api/change-password", async (req, res) => {
  if (
    !req.body.password ||
    !req.body.confirmation ||
    !req.body.userId ||
    !req.body.resetURL
  )
    return res.json({ status: "error", error: "Missing fields." });
  if (req.body.password != req.body.confirmation)
    return res.json({
      status: "error",
      error: "Both password fields don't match.",
    });

  const password = req.body.password;
  if (!(password.length >= 7)) {
    return res.json({
      status: "error",
      error: "Password is too small. Should be atleast 7 characters.",
    });
  }

  const reset = await ResetPassword.findOne({
    resetURL: req.body.resetURL,
    userId: req.body.userId,
  }).exec();
  if (!reset) return res.redirect("/forgot-password");
  await ResetPassword.deleteOne({ resetURL: req.body.resetURL });
  const userId = req.body.userId;
  // Finding user
  const user = User.findById(req.body.userId)
    .then((user) => {
      if (!user)
        return res.json({
          status: "error",
          error:
            "Problem with the reset. Please try again or contact the developer.",
        });

      if (user.password == password)
        return res.json({
          status: "error",
          error: "This is already your password!",
        });

      user.password = password;
      user.save();
      console.log(user);
    })
    .catch((err) => console.log(err));

  const deleteOldResetLinks = await ResetPassword.deleteMany({
    userId: userId,
  });
  console.log(deleteOldResetLinks);
  return res.json({ status: "ok" });
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.post("/api/forgot-password", async (req, res) => {
  if (!req.body.usermail)
    return res.json({ status: "error", error: "No username/e-mail provided" });
  var usermail = req.body.usermail;
  var user;

  if (validator.validate(usermail)) {
    // input is an e-mail
    usermail = usermail.toLowerCase();
    console.log(usermail);
    if (typeof usermail !== "string") {
      return res.json({ status: "error", error: "Invalid e-mail/username" });
    }
    user = await User.findOne({ email: usermail }).exec();
  } else {
    usermail = usermail;
    console.log(usermail);
    user = await User.findOne({ username: usermail }).exec();
  }

  if (!user) {
    return res.json({ status: "error", error: "Invalid e-mail/username" });
  }

  const userId = user["_id"].valueOf();
  const resetURL = `${uuidV4()}`;

  const response = await ResetPassword.create({
    userId,
    resetURL,
  });
  console.log(response);
  var emailId = response["_id"].valueOf();

  const transporter = NodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: `${process.env.MAIL}`,
      pass: `${process.env.PASSWORD}`,
    },
  });

  let mail = await transporter
    .sendMail({
      from: '"Firewood [no-reply]" <app@firewood.ga>',
      to: user["email"],
      subject: `Firewood: Reset account password - #${emailId}`,
      html: resetMail(user["username"], resetURL, emailId),
    })
    .catch((err) => console.log(err));

  res.json({ status: "ok" });
});

app.post("/api/register", async (req, res) => {
  console.log(req.body);
  if (
    !req.body.username ||
    !req.body.email ||
    !req.body.password ||
    !req.body.confirmation
  ) {
    return res.json({ status: "error", error: "Missing fields." });
  }

  var { username, email, password, confirmation } = req.body;
  email = email.toLowerCase();

  if (typeof username !== "string") {
    return res.json({ status: "error", error: "Invalid username." });
  }

  if (!validator.validate(email)) {
    return res.json({ status: "error", error: "Invalid E-mail" });
  }

  if (!(password.length >= 7)) {
    return res.json({
      status: "error",
      error: "Password is too small. Should be atleast 7 characters.",
    });
  }

  if (password != confirmation) {
    return res.json({ status: "error", error: "Passwords don't match." });
  }
  var response;
  try {
    response = await User.create({
      username,
      email,
      password,
    });
    console.log("User created successfully " + response);
  } catch (error) {
    if (error.code === 11000) {
      // duplicate username or e-mail
      return res.json({
        status: "error",
        error: "Username/E-mail already in use.",
      });
    }
    throw error;
  }

  const token = jsonwebtoken.sign(
    { id: response._id, username: response.username },
    process.env.JWT_SECRET
  );
  res.cookie("token", token, { maxAge: 1000 * 60 * 60 * 24 * cookieAge });
  res.json({ status: "ok" });
});

app.get("/api/state", (req, res) => {
  res.type("json");
  var state = null;
  var token = req.cookies["token"];
  if (token) {
    try {
      var user = jsonwebtoken.verify(token, process.env.JWT_SECRET);
      state = "logged-in";
      return res.send(
        JSON.stringify({ state: state, username: user["username"] })
      );
    } catch (error) {
      state = "error";
      res.clearCookie();
      return res.send(JSON.stringify({ state: state, username: null }));
    }
  } else {
    state = null;
    return res.send(JSON.stringify({ state: state, username: null }));
  }
});

const listener = server.listen(process.env.PORT || 3000, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Listening on ${listener.address().port}`);
  }
});
