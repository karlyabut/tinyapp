const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
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
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "test@test.com",
    password: "test"
  }
}

const emailExist = function(emailStr) {
  for(let user in users) {
    if(emailStr === users[user].email) {
      console.log(users[user].email);
      console.log(emailStr);
      return true;
    }
  }
}

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
  if(!users[req.cookies.user_id]) {
    // res.redirect("/login");
    templateVars = { user: users[req.cookies.user_id], 
      urls: urlDatabase };
      console.log(templateVars);
    res.render("urls_index", templateVars);
  } else {
    templateVars = { user: users[req.cookies.user_id], 
      urls: urlsForUser(req.cookies.user_id) };
      console.log(templateVars);
    res.render("urls_index", templateVars);
  };
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] };
  if(!users[req.cookies.user_id]){
    res.redirect("/login")
  } else {
    res.render("urls_new", templateVars);
  }
});

// Generate random letters for key and assign the long url as value
app.post("/urls", (req, res) => {
  let key = generateRandomString();
  urlDatabase[key] = { longURL: req.body.longURL, 
  userID: req.cookies.user_id};
  
  console.log("daksjdalkjdkasjdlkasjdlk", urlDatabase);
  res.redirect(`/urls/${key}`);
});

//Login function
app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  for(let user in users) {
    if(users[user].email === req.body.email && users[user].password === req.body.password && emailExist(req.body.email)) {
      console.log("success");
      res.cookie("user_id", users[user].id)
      // successLogin = true;
      // res.cookie("user_id", users[user].id)
      // res.redirect("/urls");
      res.redirect("/urls");
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
  let templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let randomUserID = generateRandomString();
  if(req.body.email === "" || req.body.password === "" || emailExist(req.body.email)) {
    console.log("DUDE put in some values");
    res.statusCode = 400;
    res.send("AAAANNDD NOPE!");
  } else {
    users[randomUserID] = { id: randomUserID, email: req.body.email, password: req.body.password };
    res.cookie("user_id", randomUserID);
    res.redirect("/urls");
  }
})

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {};
  if(!users[req.cookies.user_id]){
    templateVars = { user: users[req.cookies.user_id],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL };
       res.render("urls_show", templateVars);
  } else {
    templateVars = { user: users[req.cookies.user_id],
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
  if(!users[req.cookies.user_id] || users[req.cookies.user_id].id !== urlDatabase[req.params.shortURL].userID){
    res.sendStatus(403);
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if(!users[req.cookies.user_id] || users[req.cookies.user_id].id !== urlDatabase[req.params.shortURL].userID){
    res.sendStatus(403);
    console.log(users[req.cookies.user_id].id, "???", urlDatabase[req.params.shortURL].userID);
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});