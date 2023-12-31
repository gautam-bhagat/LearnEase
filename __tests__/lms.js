/* eslint-disable no-undef */
const request = require("supertest");
const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");

let server, agent;
let csrfToken;

const extractCSRF = (res) => {
  let $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
};

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCSRF(res);
  res = await agent.post("/login").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

const firstName = "John";
const lastName = "Doe";
const email = "verify.quickjot@gmail.com";
const password = "1234567890";
const role = "teacher";

describe("Test Suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  // test("Create Todo", () => {
  //   expect(true).toBe(true);
  // });

  test("Redirecting to unauthorized users",async ()=>{

    const res = await request(app).get("/home")
    expect(res.status).toBe(302)

  })

  test("Signup", async () => {
    const r = await agent.get("/signup");
    csrfToken = extractCSRF(r);

    const res = await agent.post("/personas").send({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      role : role,
      _csrf: csrfToken,
    });

    expect(res.statusCode).toBe(302);
  });
  
  test("Verify Email", async () => {
    const r = await agent.get("/verify/1");
    expect(r.statusCode).toBe(200 || 302);
  });

  test("SignIn", async () => {
    await login(agent, email, password);
  });


  test("Go to Home Page if logged in", async () => {
    await login(agent, email, password);

    const response = await agent.get("/home");
    expect(response.statusCode).toBe(200);
  });


  test("Create a new course", async () => {
    await login(agent, email, password);

    const csrfToken = extractCSRF(await agent.get("/home"));
    const newCourse = {
      courseName: "New Course",
      courseDescription: "Description for the new course.",
      _csrf: csrfToken,
    };

    const createCourseRes = await agent.post("/addcourse").send(newCourse);
    expect(createCourseRes.statusCode).toBe(302);
  });


  test("Create a new chapter", async () => {
    await login(agent, email, password);

    const csrfToken = extractCSRF(await agent.get("/home"));
    const newChapter = {
      courseId :  1,
      chapterName: "New Chapter",
      chapterDescription: "Description",
      _csrf: csrfToken,
    };

    const createdChapter = await agent.post("/addchapter").send(newChapter);
    expect(createdChapter.statusCode).toBe(302);
  });

  test("Create a new page", async () => {
    await login(agent, email, password);

    const csrfToken = extractCSRF(await agent.get("/home"));
    const newPage = {
      chapterId :  1,
      title: "New Page",
      content: "Description",
      _csrf: csrfToken,
    };

    const createdPage = await agent.post("/addpage").send(newPage);
    expect(createdPage.statusCode).toBe(302);
  });

  
  test("Change Password", async () => {
    await login(agent, email, password);

    const csrfToken = extractCSRF(await agent.get("/home"));
    const changePass = {
      userId :  1,
      newpass: "123456789",
      cnewpass: "123456789",
      _csrf: csrfToken,
    };

    const changedPass = await agent.post("/changepass").send(changePass);
    expect(changedPass.statusCode).toBe(302);
  });

const stuEmail = "student@1.com"
const stuRole = "student"

  test("Create a student and verify", async () => {

    let r = await agent.get("/signup");
    csrfToken = extractCSRF(r);

    const res = await agent.post("/personas").send({
      firstName: firstName,
      lastName: lastName,
      email: stuEmail,
      password: password,
      role : stuRole,
      _csrf: csrfToken,
    });

    expect(res.statusCode).toBe(302);
     r = await agent.get("/verify/2");

     expect(r.statusCode).toBe(200);

  });
  
  test("Enroll into a course", async () => {

    await login(agent, stuEmail, password);

    const csrfToken = extractCSRF(await agent.get("/home"));

    const res = await agent.post("/enroll").send({   
      studentId:2,
      teacherId:1,
      courseId:1,
      chapterId:1,
      pageId:-1,
      completed:false,
      _csrf : csrfToken
    });

    expect(res.statusCode).toBe(302);
     
  });

  test("Mark a Page Complete", async () => {

    await login(agent, stuEmail, password);

    const csrfToken = extractCSRF(await agent.get("/home"));

    const res = await agent.post("/markpage").send({   
      studentId:2,
      teacherId:1,
      courseId:1,
      chapterId:1,
      pageId:1,
      completed:true,
      _csrf : csrfToken
    });

    expect(res.statusCode).toBe(302);
     
  });
  
  test("Delete Course", async () => {

    await login(agent, email, password);

    const csrfToken = extractCSRF(await agent.get("/home"));

    const res = await agent.get("/delete/course/1").send({   
      
    });

    expect(res.statusCode).toBe(302);
     
  });

  test("Sign out", async () => {
    let res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);

    res = await agent.get("/home");
    expect(res.statusCode).toBe(302);

  });

});
