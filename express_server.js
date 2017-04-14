const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const PORT = 8080;

// Bootstrap require
// const boot = require("bootstrap");
// app.use(express.static('public'));

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['tinyApp'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
}

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
  }
}

//generate alphanumberic string with 6 digits
function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

app.get('/', (req, res) => {
  res.redirect('/urls');
})

//pass urls_index the URL data
app.get("/urls", (req,res) => {
  let templateVars = {
    urls: urlDatabase,
    user: req.cookies["user_id"],
  };
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req,res) => {
  if (req.loggedIn) {
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id],
      user: req.cookies["user_id"],
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("../login");
  }
})

app.get("/urls/:id", (req,res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: req.cookies["user_id"],
  };
  res.render("urls_show", templateVars)
})

app.get("/urls", (req,res) => {
  let templateVars = {
    urls: urlDatabase,
    user: req.cookies["user_id"],
  };
  res.render("urls_index", templateVars);
})


app.get("/logout", (req,res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})

app.post("/logout", (req,res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})

app.get("/login", (req,res) => {
  let templateVars = {
    urls: urlDatabase,
    user: req.cookies["user_id"],
  };
  res.render("urls_login", templateVars)
})

app.post("/login", (req,res) => {
  function authenticated(email,password) {
    for (user in users) {
      if (users[user].email === email && users[user].password === password) {
        return users[user];
      }
    }
  }

  const authenticatedUser = authenticated(req.body.email,req.body.password)

  if (authenticatedUser) {
    res.cookie("user_id",authenticatedUser.id).redirect("/");
  } else {
    res.status(403).send("Sorry either that email is not registered or the password is incorrect.<br><a href='/register'>Sign Up</a><br><a href='/login'>Login</a>")
  }
})

// Update link
app.post("/urls/:id", (req,res) => {
  let newURL = req.body.updatelink;
  let shortURL = req.params.id;
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
})

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (longURL === undefined) {
    res.status(404).send("Sorry that link does not exist.<br><a href='/urls'>Return to Tiny App</a>");
  } else {
    res.redirect(longURL);
  }
})

app.get("/register", (req,res) => {
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

app.post("/register", (req,res) => {
  const { email, password } = req.body;
  const newUserId = `user${countUsers()+1}RandomId`;
  const id = generateRandomString();
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send("Please enter an email and password.<br><a href='/register'>Return to Registry</a>")
  } else if (doesUserExist(email)) {
    res.status(400).send("A user by that email is already registered.<br><a href='/register'>Return to Registry</a>")
  } else {
    users[newUserId] = {
      id,
      email,
      password
    };
    res.cookie("user_id", id)
    res.redirect("/");
  }
})

app.post("/urls", (req,res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect("/urls/" + randomString);
})

app.post("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
})

app.use(function (req, res, next) {
  res.status(404).send("Sorry, this page does not exist.")
})

app.listen(PORT, ()=> {
  console.log(`Tinyapp listening on port ${PORT}!`);
});