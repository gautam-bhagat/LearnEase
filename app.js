/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();

// const port = 4000;

const { Persona } = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const csrf = require("csurf");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Secret_Token"));
app.use(csrf({ cookie: true }));
app.use(flash());

app.set("view engine", "ejs");

const path = require("path");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "my-super-secret-key-21728172615261562",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Persona.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            // console.log("Loggedd In", user);
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch(() => {
          return done(null, false, {
            message: "Account doesn't exist for this mail",
          });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Persona.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

const saltRounds = 10;
const PASSWORD_SECRET = "LEARNEASE";
const encryptPassword = (password) => {
  const hash = bcrypt.hashSync(password, saltRounds);
  return hash;
};

app.get("/", (req, res) => {
if (req.isAuthenticated()) {
        return res.redirect("/home");
}
  if (req.accepts("html")) {
    res.render("index");
  }
});

app.get("/signup", (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect("/home");
      }
  if (req.accepts("html")) {
    res.render("signup", { csrfToken: req.csrfToken() });
  }
});

app.get("/login", (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect("/home");
      }
  if (req.accepts("html")) {
    res.render("signin", { csrfToken: req.csrfToken() });
  }
});

app.post(
    "/login",
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    (request, response) => {
      // Authentication was successful
      if (request.user.role === "student") {
        response.redirect("/home");
      } else if (request.user.role === "teacher") {
        response.redirect("/home");
      } else {
        response.redirect("/login");
      }
    },
  );

app.get("/home",connectEnsureLogin.ensureLoggedIn(),(req,res)=>{
    if (req.accepts("html")) {
        res.render("home", { csrfToken: req.csrfToken() });
      }
})

app.post("/personas", async (req, res) => {
  try {
    let flag = false;
    let { firstName, lastName, email, password, role } = req.body;

    if (firstName.length === 0 || lastName.length === 0) {
      flag = true;
      req.flash("error", "Name cannot be empty");
    }

    if (password.length < 8) {
      flag = true;
      req.flash("error", "Password length cannot be less than 8");
    }
    if (role === "none") {
      flag = true;
      req.flash("error", "Kindly select a role");
    }

    const ifExsits = await Persona.findOne({ where : {email:email}})
    if(ifExsits){
        flag = true;
      req.flash("error", "Email already in use");
    }
    if (flag) {
      return res.redirect("/signup");
    }

    password = encryptPassword(password);
    const person = await Persona.createPersona({
      firstName,
      lastName,
      email,
      password,
      role,
    });
    console.log(person);

    req.login(person, (err) => {
      if (err) {
        console.log(err);
      }

      // Redirect based on the user's role
      if (person.role === "teacher") {
        res.redirect("/teacher-dashboard");
      } else if (person.role === "student") {
        res.redirect("/student-dashboard");
      } else {
        // Handle other roles or scenarios as needed
        res.redirect("/signup");
      }
    });
  } catch (error) {
    console.log(error)
    res.redirect("/home");
  }
});

module.exports = app;
