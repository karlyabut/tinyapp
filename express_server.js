const express = require("express");
const app = express();
const cookieParser = require("cookie-session");
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { getUserByEmail } = require("./helpers");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser({name: "user_id", keys: ["id"]}));
app.set("view engine", "ejs");

const generateRandomString = function() {
  let randomStr = "";
  const alphaNumStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    randomStr += alphaNumStr.charAt(Math.floor(Math.random() * alphaNumStr.length));
  }
  return randomStr;
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", 10)
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "test@test.com",
    password: bcrypt.hashSync("test", 10)
  }
}

// const getUserByEmail = function(email, database) {
//   for(let user in database) {
//     if(email === database[user].email) {
//       console.log(database[user].email);
//       console.log(email);
//       return user;
//     }
//   }
// }

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  i3gOlr: { longURL: "https://www.gooasgle.ca", userID: "userRandomID" }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) =>  {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

const urlsForUser = function(id) {
  const filterArray = [];
  for(key of Object.keys(urlDatabase)) {
    if(urlDatabase[key].userID === id) {
      let filteredObject = {};
      filteredObject.shortURL = key;
      filteredObject.longURL = urlDatabase[key].longURL;
      filterArray.push(filteredObject);
    }
  }
  return filterArray;
}

app.get("/urls", (req, res) => {
  // console.log(users);
  let templateVars = {};
  if(!users[req.session.user_id]) {
    // res.redirect("/login");
    templateVars = { user: users[req.session.user_id], 
      urls: urlDatabase };
    res.render("urls_index", templateVars);
  } else {
    templateVars = { user: users[req.session.user_id], 
      urls: urlsForUser(req.session.user_id) };
    res.render("urls_index", templateVars);
  };
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  if(!users[req.session.user_id]){
    res.redirect("/login")
  } else {
    res.render("urls_new", templateVars);
  }
});

// Generate random letters for key and assign the long url as value
app.post("/urls", (req, res) => {
  let key = generateRandomString();
  urlDatabase[key] = { longURL: req.body.longURL, 
  userID: req.session.user_id};
  res.redirect(`/urls/${key}`);
});

//Login function
app.get("/login", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  for(let user in users) {
    if(users[user].email === req.body.email && bcrypt.compareSync(req.body.password, users[user].password) && getUserByEmail(req.body.email, users)) {
      req.session.user_id = user;
      return res.redirect("/urls");
    }   
  }
  res.statusCode = 403;
  res.sendStatus(403);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

//Register
app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let randomUserID = generateRandomString();
  if(req.body.email === "" || req.body.password === "" || getUserByEmail(req.body.email, users)) {
    res.statusCode = 400;
    res.sendStatus(400);
  } else {
    users[randomUserID] = { id: randomUserID, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) };
    // res.cookie("user_id", randomUserID);
    req.session.user_id = randomUserID;
    res.redirect("/urls");
  }
})

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {};
  if(!users[req.session.user_id]){
    //To still show the user all the URLs if they are not logged in
    templateVars = { user: users[req.session.user_id],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL };
       res.render("urls_show", templateVars);
  } else {
    templateVars = { user: users[req.session.user_id],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL };
       res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//Update function
app.post("/urls/:shortURL", (req, res) => {
  if(!users[req.session.user_id] || users[req.session.user_id].id !== urlDatabase[req.params.shortURL].userID){
    res.sendStatus(403);
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if(!users[req.session.user_id] || users[req.session.user_id].id !== urlDatabase[req.params.shortURL].userID){
    res.sendStatus(403);
    console.log(users[req.session.user_id].id, "???", urlDatabase[req.params.shortURL].userID);
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});