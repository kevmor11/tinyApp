const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt")
const PORT = 8080;

// Bootstrap require
// const boot = require("bootstrap");
// app.use(express.static('public'));

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use("/urls", function(req, res, next) {
  if (req.session.user_id) {
    res.locals.userID = req.session["user_id"];
    next();
  } else {
    res.status(401).send("You must log in to access this page.<br><a href='/login'>Login</a>")
  }
})

app.set("view engine", "ejs");

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$jh4WoZ5.3SXsElEkHxFvAukLpH4BvWiRhkbivrFq5X/cKU8ngXj9q"

  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$f3RLWWcBer4cjGcI8dE6/OxOW3BJSCRfjvDg5Mfu1QLEeR2FZPLy."
  }
}

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "userRandomID"
  }
}

//generate alphanumberic string with 6 digits for the user id
function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

app.get('/', (req, res) => {
  res.redirect('/urls');
})

//pass urls_index the URL data
app.get("/urls", (req, res) => {
  let myLinks = {};
  for (shortURL in urlDatabase) {
    if (req.session["user_id"] === urlDatabase[shortURL].userID) {
      myLinks[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  let templateVars = {
    urls: myLinks,
  }
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
})

app.get("/urls/:id", (req, res) => {
  // const userID = req.session["user_id"];
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  }
  res.render("urls_show", templateVars)
})

app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  res.redirect("/urls");
})

app.get("/login", (req, res) => {
  res.render("urls_login", {user: req.session["user_id"]})
})

app.post("/login", (req, res) => {
  function authenticated(email, password) {
    for (user in users) {
      if (users[user].email === email && bcrypt.compareSync(password, users[user].hashed_password)) {
        return users[user];
      }
    }
  }

  const authenticatedUser = authenticated(req.body.email, req.body.password)

  if (authenticatedUser) {
    req.session["user_id"] = (authenticatedUser.id)
    res.redirect("/");
  } else {
    res.status(403).send("Sorry either that email is not registered or the password is incorrect.<br><a href='/register'>Sign Up</a><br><a href='/login'>Login</a>")
  }
})

// Update link
app.post("/urls/:id", (req, res) => {
  let newURL = req.body.updatelink;
  let shortURL = req.params.id;
  urlDatabase[shortURL].longURL = newURL;
  res.redirect(`/urls/${shortURL}`);
})

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL === undefined) {
    res.status(404).send("Sorry that link does not exist.<br><a href='/urls'>Return to Tiny App</a>");
  } else {
    res.redirect(longURL);
  }
})

app.get("/register", (req, res) => {
  res.render("urls_register");
})

function countUsers() {
  return Object.keys(users).length;
}

function doesUserExist(email) {
  for (user in users) {
    if ((users[user].email) === email) {
      return true;
    }
  }
}

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashed_password = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send("Please enter an email and password.<br><a href='/register'>Return to Registry</a>")
  } else if (doesUserExist(email)) {
    res.status(400).send("A user by that email is already registered.<br><a href='/register'>Return to Registry</a>")
  } else {
    users[id] = {
      id,
      email,
      hashed_password,
      urls: {}
    };
    req.session["user_id"] = id;
    res.redirect("/");
  }
})

app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: req.session["user_id"]
  };
  res.redirect("/urls/" + randomString);
})

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
})

app.use(function (req, res, next) {
  res.status(404).send("Sorry, this page does not exist.")
})

app.listen(PORT, ()=> {
  console.log(`Tinyapp listening on port ${PORT}!`);
});