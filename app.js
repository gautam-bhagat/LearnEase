/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();

// const port = 4000;

const { Persona, Course, Chapter, Page,Enroll } = require("./models");
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
    res.render("index", { csrfToken: req.csrfToken() });
  }
});

app.get("/signup", (req, res) => {
  if (req.accepts("html")) {
    res.render("signup", { csrfToken: req.csrfToken() });
  }
});

app.get("/login", (req, res) => {
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
  }
);

app.get("/home", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  
  console.log(req.user.role);
  if (req.accepts("html")) {
    if (req.user.role === "student") {

      
      let courses = await Course.findAll();


      let teachers = []

      return res.render("home", {csrfToken: req.csrfToken(),user: req.user,courses,teachers});
    }



    let teachers = [];
    const courses = await Course.findAll({
      where: { teacherId: parseInt(req.user.id) },
    });
    courses.forEach(async (element) => {
      teachers.push(req.user.firstName+" "+req.user.lastName)
    });

    res.render("home", { csrfToken: req.csrfToken(), user: req.user, courses,teachers });
  }
});

app.get(
  "/viewcourse/:courseid",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.role === "student") {
      const course = await Course.findOne({
        where: { id: parseInt(req.params.courseid) },
      });
    
      const chapters = await Chapter.findAll({
        where: { courseId: parseInt(req.params.courseid) },
      });

      const teacher = await  Persona.findByPk(course.teacherId)
      let enrolled = await Enroll.findOne({ where : { courseId : parseInt(req.params.courseid),studentId : req.user.id  }})
      let ebool = false;
      
      if(enrolled){
        ebool = true
      }

      return res.render("viewcourse", {
        csrfToken: req.csrfToken(),
        user: req.user,
        teacher: teacher,
        course: course,
        enrolled : ebool,
        chapters,
      });
    }



    try {
      if (req.accepts("html")) {
        const course = await Course.findOne({
          where: { id: parseInt(req.params.courseid) },
        });
        if (course.teacherId !== req.user.id) {
          return res.redirect("/home");
        }
        const chapters = await Chapter.findAll({
          where: { courseId: parseInt(req.params.courseid) },
        });
        res.render("viewcourse", {
          csrfToken: req.csrfToken(),
          user: req.user,
          course: course,
          chapters,
        });
      }
    } catch (error) {
      return res.redirect("/home");
    }
  }
);

app.get(
  "/viewchapter/:chapterid",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.role === "student") {
      return res.redirect("/signup");
    }
    try {
      if (req.accepts("html")) {
        // let chapterid = req.params.chapterid
        const chapter = await Chapter.findOne({
          where: { id: parseInt(req.params.chapterid) },
        });
        const pages = await Page.findAll({
          where: { chapterId: parseInt(req.params.chapterid) },
        });
        const course = await Course.findOne({
          where: { id: chapter.courseId },
        });
        if (course.teacherId !== req.user.id) {
          return res.redirect("/home");
        }
        res.render("viewchapter", {
          csrfToken: req.csrfToken(),
          user: req.user,
          chapter,
          pages,
          course,
        });
      }
    } catch (error) {
      res.redirect("/home");
    }
  }
);

app.get(
  "/addpage/:chapterid",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.role === "student") {
      return res.redirect("/signup");
    }
    if (req.accepts("html")) {
      // let chapterid = req.params.chapterid
      const chapter = await Chapter.findOne({
        where: { id: parseInt(req.params.chapterid) },
      });
      const pages = await Page.findAll({
        where: { chapterId: parseInt(req.params.chapterid) },
      });
      console.log(pages);
      res.render("addpage", {
        csrfToken: req.csrfToken(),
        user: req.user,
        chapter,
        pages,
      });
    }
  }
);

app.get(
  "/viewpage/:chapterid/:pageindex",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.role === "student") {
      return res.redirect("/signup");
    }
    try {
      if (req.accepts("html")) {
        let index = req.params.pageindex;
        const allPages = await Page.findAll({
          where: { chapterId: parseInt(req.params.chapterid) },
        });

        const chapter = await Chapter.findOne({
          where: { id: allPages[0].chapterId },
        });
        const course = await Course.findOne({
          where: { id: chapter.courseId },
        });
        if (course.teacherId !== req.user.id) {
          console.log("Error : Not yours");
          return res.redirect("/home");
        }
        res.render("viewpage", {
          csrfToken: req.csrfToken(),
          user: req.user,
          page: allPages[index],
          chapter,
          course,
          pageIndex: index,
          allPages,
        });
      }
    } catch (error) {
      console.log("Error : ", error);
      res.redirect("/home");
    }
  }
);

//API Requests

app.post("/enroll", async (req, res) => {
  let {studentId,teacherId,courseId,chapterId,pageId,completed} = req.body
  console.log(req.body);
  try {
    const pg = await Enroll.create({studentId,teacherId,courseId,chapterId,pageId,completed});
    console.log(pg);
    return res.redirect(`/viewcourse/${courseId}`);

  } catch (error) {
    console.log(error)
    return res.redirect(`/viewcourse/${courseId}`);
  }
});


app.post("/addpage", async (req, res) => {
  let { chapterId, title, content } = req.body;
  console.log(req.body);
  try {
    const pg = await Page.create({ chapterId, title, content });
    console.log(pg);
    return res.redirect(`/viewchapter/${chapterId}`);
  } catch (error) {
    return res.redirect(`/viewchapter/${chapterId}`);
  }
});

app.post(
  "/addchapter",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    console.log(req.body);
    let { courseId, chapterName, chapterDescription } = req.body;
    try {
      const chapter = await Chapter.createChapter({
        courseId,
        chapterName,
        chapterDescription,
      });

      res.redirect(`/viewcourse/${courseId}`);
    } catch (error) {
      console.log(error);
      res.redirect(`/viewcourse/${courseId}`);
    }
  }
);

app.post(
  "/addcourse",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      let { teacherId, courseName, courseDescription } = req.body;
      teacherId = parseInt(teacherId);
      const courseObj = await Course.createCourse({
        teacherId,
        courseName,
        courseDescription,
      });
      console.log(courseObj);
      res.redirect("/home");
    } catch (error) {
      console.log(error);
      res.redirect("/home");
    }
  }
);

app.get("/signout", (request, response, next) => {
  //signout
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

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

    const ifExsits = await Persona.findOne({ where: { email: email } });
    if (ifExsits) {
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
        res.redirect("/home");
      } else if (person.role === "student") {
        res.redirect("/home");
      } else {
        // Handle other roles or scenarios as needed
        res.redirect("/signup");
      }
    });
  } catch (error) {
    console.log(error);
    res.redirect("/home");
  }
});

module.exports = app;
