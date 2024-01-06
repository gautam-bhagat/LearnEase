/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();

// const port = 4000;

const { Persona, Course, Chapter, Page, Enroll } = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const csrf = require("csurf");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
// let alert = require("alert");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Secret_Token"));
app.use(csrf({ cookie: true }));
app.use(flash());

app.set("view engine", "ejs");

const path = require("path");
const sendEmail = require("./utils/sendEmail");
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
          if (!user.verified) {
            return done(null, false, {
              message: "Verify your account through mail sent",
            });
          }

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
  // console.log(req.user.role);
  try {
    if (req.accepts("html")) {
      if (req.user.role === "student") {
        let courses = await Course.findAll();

        let teachers = [];

        return res.render("home", {
          csrfToken: req.csrfToken(),
          user: req.user,
          courses,
          teachers,
        });
      }

      let teachers = [];
      const courses = await Course.findAll({
        where: { teacherId: parseInt(req.user.id) },
      });
      courses.forEach(async (element) => {
        teachers.push(req.user.firstName + " " + req.user.lastName);
      });

      return res.render("home", {
        csrfToken: req.csrfToken(),
        user: req.user,
        courses,
        teachers,
      });
    }
  } catch (error) {
    return res.redirect("/");
  }
});

app.get(
  "/viewcourse/:courseid",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.role === "student") {
      try {
        const course = await Course.findOne({
          where: { id: parseInt(req.params.courseid) },
        });

        const chapters = await Chapter.findAll({
          where: { courseId: parseInt(req.params.courseid) },
        });

        const teacher = await Persona.findByPk(course.teacherId);
        let enrolled = await Enroll.findOne({
          where: {
            courseId: parseInt(req.params.courseid),
            studentId: req.user.id,
          },
        });
        let ebool = false;

        if (enrolled) {
          ebool = true;
        }

        return res.render("viewcourse", {
          csrfToken: req.csrfToken(),
          user: req.user,
          teacher: teacher,
          course: course,
          enrolled: ebool,
          chapters,
        });
      } catch (error) {
        return res.redirect("/home");
      }
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
        return res.render("viewcourse", {
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
      try {
        if (req.accepts("html")) {
          const chapter = await Chapter.findOne({
            where: { id: parseInt(req.params.chapterid) },
          });
          const pages = await Page.findAll({
            where: { chapterId: parseInt(req.params.chapterid) },
          });
          const course = await Course.findOne({
            where: { id: chapter.courseId },
          });
          let enrolled = Enroll.findOne({
            where: { studentId: req.user.id, courseId: course.id },
          });
          if (!enrolled) {
            return res.redirect(`/viewcourse/${course.id}`);
          }
          return res.render("viewchapter", {
            csrfToken: req.csrfToken(),
            user: req.user,
            chapter,
            pages,
            course,
          });
        }
      } catch (error) {
        return res.redirect("/home");
      }
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
        return res.render("viewchapter", {
          csrfToken: req.csrfToken(),
          user: req.user,
          chapter,
          pages,
          course,
        });
      }
    } catch (error) {
      return res.redirect("/home");
    }
  }
);

app.get(
  "/addpage/:chapterid",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.role === "student") {
      return res.redirect("/");
    }
    if (req.accepts("html")) {
      try {
        // let chapterid = req.params.chapterid
        const chapter = await Chapter.findOne({
          where: { id: parseInt(req.params.chapterid) },
        });
        const pages = await Page.findAll({
          where: { chapterId: parseInt(req.params.chapterid) },
        });
        console.log(pages);
        return res.render("addpage", {
          csrfToken: req.csrfToken(),
          user: req.user,
          chapter,
          pages,
        });
      } catch (error) {
        return res.redirect("/");
      }
    }
  }
);

app.get(
  "/viewpage/:chapterid/:pageindex",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.role === "student") {
      try {
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

        let completed = false;
        const checkCompleted = await Enroll.findOne({
          where: {
            studentId: req.user.id,
            chapterId: chapter.id,
            pageId: allPages[index].id,
          },
        });
        if (checkCompleted) {
          completed = true;
        }

        return res.render("viewpage", {
          csrfToken: req.csrfToken(),
          user: req.user,
          page: allPages[index],
          chapter,
          course,
          pageIndex: index,
          allPages,
          completed,
        });
      } catch (error) {
        console.log(error);
        return res.redirect("/home");
      }
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
        return res.render("viewpage", {
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
      return res.redirect("/home");
    }
  }
);

const getEnrolled = async (courses) => {
  let enrolled = [];
  var dict = {};
  for (i = 0; i < courses.length; i++) {
    let enrols = await Enroll.findAll({
      where: { courseId: courses[i].id, pageId: -1 },
    });
    let courseId = courses[i].id;

    dict[courseId] = enrols.length;
    enrolled.push(dict);
  }

  return dict;
};

app.get("/report", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  if (req.accepts("html")) {
    try {
      if (req.user.role === "teacher") {
        let courses = await Course.findAll({where :{ teacherId: req.user.id }});
        console.log(courses)
        console.log("User Courses : ",courses.length)
        let enrolled = await getEnrolled(courses);
        console.log(enrolled);

        var items = Object.keys(enrolled).map((key) => {
          return [key, enrolled[key]];
        });

        items.sort((first, second) => {
          return first[1] - second[1];
        });

        const popularCourseId = parseInt(items[items.length - 1][0]);
        const popularCourse = await Course.findByPk(popularCourseId);
        console.log(popularCourse);
        return res.render("teachstats", {
          csrfToken: req.csrfToken(),
          user: req.user,
          enrolled,
          courses,
          popularCourse,
        });
      }

      if (req.user.role === "student") {
        var totalPageDict = {};

        const enrollCourses = await Enroll.findAll({
          where: { studentId: req.user.id, pageId: -1 },
        });
        for (let e = 0; e < enrollCourses.length; e++) {
          let courseId = enrollCourses[e]["courseId"];
          const chapters = await Chapter.findAll({
            where: { courseId: courseId },
          });
          console.log("Chapter Length " + chapters.length);
          var totalPages = 0;
          for (let i = 0; i < chapters.length; i++) {
            const pages = await Page.findAll({
              where: { chapterId: chapters[i].id },
            });
            let len = pages.length;
            console.log("Length : ", len);
            totalPages += len;
          }
          totalPageDict[courseId] = totalPages;
        }

        var completedPages = {};
        for (let i = 0; i < enrollCourses.length; i++) {
          let courseId = enrollCourses[i].courseId;
          const pages = await Enroll.findAll({
            where: { studentId: req.user.id, courseId: courseId },
          });
          let len = pages.length;
          completedPages[courseId] = len - 1;
        }

        console.log("Hello Total ", totalPageDict);
        console.log("Hello Completed ", completedPages);
        let existing = enrollCourses.filter((item) => {
          return totalPageDict[item.courseId] > 0;
        });

        let courses = [];
        for (let i = 0; i < existing.length; i++) {
          const cour = await Course.findByPk(existing[i].courseId);
          // console.log(cour)
          courses.push(cour);
        }

        console.log(courses[0].courseName);
        return res.render("stustats", {
          csrfToken: req.csrfToken(),
          user: req.user,
          courses,
          completedPages,
          totalPageDict,
        });
      }
    } catch (error) {
      return res.redirect("/");
    }
  }
});

//API Requests
// var pdf = require("pdf-creator-node");
// var fs = require('fs')

// const {jsPDF} = require('jspdf');

// function generatePDFfromHTML(htmlContent, outputPath) {
//   const doc = new jsPDF('p');
//   doc.text(htmlContent, 10, 10);
//   doc.save(outputPath);
//   console.log('PDF generated successfully');
// }

// app.post(
//   "/certificate",
//   connectEnsureLogin.ensureLoggedIn(),
//   async (req, res) => {
//     try {
//       let { courseId } = req.body;
//       console.log("course : ", courseId);
//       let course = await Course.findByPk(courseId);
//       let person = await Persona.findByPk(course.teacherId);
//       const teacherName = person.firstName + " " + person.lastName;
//       const studentName = req.user.firstName + " " + req.user.lastName;
//       const courseName = course.courseName;
//       // console.log({ teacherName, studentName, courseName });

//       var html = fs.readFileSync('./certificate.html','utf8')

//       let mapObj = {
//         "{{teacherName}}": teacherName,"{{studentName}}":studentName,"{{courseName}}":courseName
//       }
//       html = html.replace(/{{teacherName}}|{{studentName}}|{{courseName}}/gi,(matched)=>{ return mapObj[matched]})
//       console.log(html)
      
//       generatePDFfromHTML(html, './custom.pdf');
//       // var document = {
//       //   html: html,
//       //   path: "./output.pdf",
//       //   type: "",
//       // };
//       // var options = {
//       //   format: "A4",
//       //   orientation: "portrait",
//       //   border: "10mm",
//       //   header: {
//       //       height: "45mm",
//       //       contents: '<div style="text-align: center;">Author: Shyam Hajare</div>'
//       //   },
//       //   footer: {
//       //       height: "28mm",
//       //       contents: {
//       //           first: 'Cover page',
//       //           2: 'Second page', // Any page number is working. 1-based index
//       //           default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
//       //           last: 'Last Page'
//       //       }
//       //   }}
//       // pdf
//       //   .create(document, options)
//       //   .then((res) => {
//       //     console.log(res);
//       //   })
//       //   .catch((error) => {
//       //     console.error(error);
//       //   });

//       return res.redirect("/report");
//     } catch (error) {
//       console.log(error);
//       return res.redirect("/report");
//     }
//   }
// );

app.post("/changepass", async (req, res) => {
  try {
    const { userId, newpass, cnewpass } = req.body;
    if (newpass === cnewpass) {
      const password = encryptPassword(newpass);
      await Persona.update({ password: password }, { where: { id: userId } });
      req.flash("error", "Password Changed!");
      return res.redirect("/");
    }
    req.flash("error", "Password doesnt match");
    return res.redirect("/");
  } catch (error) {
    req.flash("error", "Error Occurred! Couldn't change password");
    return res.redirect("/");
  }
});

app.get("/verify/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const person = await Persona.findByPk(id);
    if (person.verified) {
      return res.redirect("/login");
    }

    await Persona.update({ verified: true }, { where: { id: id } });
    return res.send("Email Verified");
  } catch (error) {
    res.send("invalid link");
  }
});

app.get(
  "/delete/:type/:typeid",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.role === "teacher") {
      let type = req.params.type;
      let typeid = parseInt(req.params.typeid);

      if (type === "page") {
        const page = await Page.findByPk(typeid);
        try {
          await Page.destroy({ where: { id: typeid } });
          await Enroll.destroy({ where: { pageId: typeid } });
          return res.redirect("/viewchapter/" + page.chapterId);
        } catch (error) {
          console.log(error);
          return res.redirect("/viewchapter/" + page.chapterId);
        }
      }

      if (type === "chapter") {
        const chapter = await Chapter.findByPk(typeid);
        try {
          await Chapter.destroy({ where: { id: typeid } });
          await Page.destroy({ where: { chapterId: typeid } });
          await Enroll.destroy({ where: { chapterId: typeid } });
          return res.redirect("/viewcourse/" + chapter.courseId);
        } catch (error) {
          console.log(error);
          return res.redirect(`/viewcourse/${chapter.courseId}`);
        }
      }

      if (type === "course") {
        try {
          const course = await Course.findByPk(typeid);
          await Course.destroy({ where: { id: typeid } });
          await Chapter.destroy({ where: { courseId: typeid } });
          await Page.destroy({ where: { courseId: typeid } });
          await Enroll.destroy({ where: { courseId: course.id } });
          const t = Enroll.findAll({ where: { courseId: typeid } });
          console.log(t);
          return res.redirect("/home");
        } catch (error) {
          console.log(error);
          return res.redirect("/");
        }
      }
    }

    return res.redirect("/");
  }
);

app.post("/enroll", async (req, res) => {
  let { studentId, teacherId, courseId, chapterId, pageId, completed } =
    req.body;
  console.log(req.body);
  try {
    const pg = await Enroll.create({
      studentId,
      teacherId,
      courseId,
      chapterId,
      pageId,
      completed,
    });
    console.log(pg);
    return res.redirect(`/viewcourse/${courseId}`);
  } catch (error) {
    console.log(error);
    return res.redirect(`/viewcourse/${courseId}`);
  }
});

app.post("/markpage", async (req, res) => {
  let {
    pageIndex,
    studentId,
    teacherId,
    courseId,
    chapterId,
    pageId,
    completed,
  } = req.body;
  console.log(req.body);
  try {
    const pg = await Enroll.create({
      studentId,
      teacherId,
      courseId,
      chapterId,
      pageId,
      completed,
    });
    console.log(pg);
    return res.redirect(`/viewpage/${chapterId}/${pageIndex}`);
  } catch (error) {
    console.log(error);
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

      return res.redirect(`/viewcourse/${courseId}`);
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

    const base_url = req.protocol + "://" + req.headers.host;
    const verify_url = base_url + "/verify/" + person.id;
    sendEmail(person.email, "Verify your account", verify_url);
    req.flash("error", "Verify your account through mail sent");
    return res.redirect("/login");

    // req.login(person, (err) => {
    //   if (err) {
    //     console.log(err);
    //   }

    //   if (person.role === "teacher") {
    //     res.redirect("/home");
    //   } else if (person.role === "student") {
    //     res.redirect("/home");
    //   } else {
    //     res.redirect("/signup");
    //   }
    // });
  } catch (error) {
    console.log(error);
    res.redirect("/home");
  }
});

module.exports = app;
