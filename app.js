/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();

// const port = 4000;

const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const csrf = require("csurf");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const saltRounds = 10;

// app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser("Secret_Token"));
// app.use(csrf({ cookie: true }));
// app.use(flash());

// app.set("view engine", "ejs");

// const path = require("path");
// app.set("views", path.join(__dirname, "views"));
// app.use(express.static(path.join(__dirname, "public")));

// app.use(
//   session({
//     secret: "my-super-secret-key-21728172615261562",
//     cookie: {
//       maxAge: 24 * 60 * 60 * 1000, //24hours
//     },
//   }),
// );
// app.use(passport.initialize());
// app.use(passport.session());
// app.use(function (request, response, next) {
//   response.locals.messages = request.flash();
//   next();
// });

// passport.use(
//   new LocalStrategy(
//     {
//       usernameField: "email",
//       passwordField: "password",
//     },
//     (username, password, done) => {
//       User.findOne({ where: { email: username } })
//         .then(async function (user) {
//           const result = await bcrypt.compare(password, user.password);
//           if (result) {
//             // console.log("Loggedd In", user);
//             return done(null, user);
//           } else {
//             return done(null, false, { message: "Invalid password" });
//           }
//         })
//         .catch(() => {
//           return done(null, false, {
//             message: "Account doesn't exist for this mail",
//           });
//         });
//     },
//   ),
// );

// passport.serializeUser((user, done) => {
//   console.log("Serializing user in session", user.id);
//   done(null, user.id);
// });

// passport.deserializeUser((id, done) => {
//   User.findByPk(id)
//     .then((user) => {
//       done(null, user);
//     })
//     .catch((error) => {
//       done(error, null);
//     });
// });



module.exports = app;
