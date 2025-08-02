import express from 'express';
import bcrypt from 'bcryptjs';
import User from "../mongo.js";
import Query from '../query.js';

const router = express.Router();


router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  const newuser = new User({
    name,
    email,
    password: hash
  });

  await newuser.save();

  req.session.user = {
    name: newuser.name,
    email: newuser.email,
    id: newuser._id
  };

  console.log("✅ User signed up:", req.session.user);

  res.redirect("/"); // Ya /chat ya kahi bhi bhejo
});

router.get('/signup', (req, res) => {
  res.render('signup');
});

router.get("/", async (req, res) => {
  const sessionUser = req.session.user;  // 🔹 Line 1

  if (!sessionUser) {                    // 🔹 Line 2
    return res.redirect("/signup");      // 🔹 Line 3
  }

  const history = await Query.find({ userId: sessionUser.id }); // 🔹 Line 4
  res.render("index", { user: sessionUser, history });          // 🔹 Line 5
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.send("User not found");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send("Wrong password");

  req.session.user = { name: user.name, email: user.email, id: user._id    };
  res.redirect("/chat");
});

router.get('/logout',async(req,res)=>{
res.render("signup");




});
router.get('/admin', async (req, res) => {
  const sessionUser = req.session.user;

  if (!sessionUser) {
    return res.send("❌ Not logged in");
  }

  const user = await User.findOne({ email: sessionUser.email });

  if (!user) {
    return res.send("❌ User not found");
  }

  if (user.role !== "admin") {
    return res.send("⛔ Not admin, access denied");
  }

  const allUsers = await User.find();
  const totalUsers = await User.countDocuments();
  const blockedUsers = await User.countDocuments({ isBlocked: true });
  const activeUsers = await User.countDocuments({ isBlocked: false });

  const queries = await Query.find();
  const weeklyQueries = [5, 10, 2, 3, 7, 4, 8]; 

  res.render('dashbored', {
    employees: allUsers,
    totalUsers,
    blockedUsers,
    activeUsers,
    weeklyQueries,
     queries 
  });
});




router.get('/delete/:id', async (req, res) => {
 const  id=req.params.id;
 try{
 await User.findByIdAndDelete(id);
 console.log("user delete succesfully:",id);
 res.redirect('/admin');


 }

 catch(err){
  console.log(err);
   res.send("❌ Error deleting user");
 }
 



});

router.get('/block/:id', async (req, res) => {
  const id = req.params.id;

  const user = await User.findById(id);
  if (!user) {
    return res.send("❌ User not found");
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  res.redirect('/admin');
});



router.post("/ask", async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) return res.send("❌ Not logged in");

  const { question } = req.body;

  const newQuery = new Query({
    userId: sessionUser.id,
    question:question
  });

  await newQuery.save();

  res.send("✅ Query saved successfully!");
});


router.post("/admin/answer/:id", async (req, res) => {
  const { answer } = req.body;
  const query = await Query.findById(req.params.id);
  query.answer = answer;
  query.status = "closed";
  query.answeredAt = new Date();
  await query.save();

  res.redirect("/admin");
});



router.get("/history", async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) return res.send("❌ Not logged in");

  const queries = await Query.find({ userId: sessionUser.id }).sort({ createdAt: -1 });

  res.render("history", { queries });
});



export default router;
