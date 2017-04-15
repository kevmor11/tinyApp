// Requiring and invoking the express framework, which facilitates the the HTTP
// request/response methods, sets the port/view egine, and uses the essential middle
const express = require("express");
const app = express();
// Requiring our body-parser which allows us to recieve incoming client
// JSON requests and parses them for use through via the request body (req.body)
const bodyParser = require("body-parser");
// Requiring cookie-session and bcyrpt which allow for encrypted cookies/password storage
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt")
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id'],

  // Cookie Options (session cookies expire after 24 hours)
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// User authorization middleware that requires the user to be logged in
// to view any pages in the /urls directory
app.use("/urls", function(req, res, next) {
  if (req.session.user_id) {
    res.locals.userID = req.session["user_id"];
    next();
  } else {
    res.status(401).send("You must log in to access this page.<br><a href='/login'>Login</a>")
  }
})

// Setting the view engine to ejs so that we can write templates containing HTML and JS together
app.set("view engine", "ejs");

// User database - note the passwords are stored in hashes
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hashed_password: "$2a$10$jh4WoZ5.3SXsElEkHxFvAukLpH4BvWiRhkbivrFq5X/cKU8ngXj9q"

  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    hashed_password: "$2a$10$f3RLWWcBer4cjGcI8dE6/OxOW3BJSCRfjvDg5Mfu1QLEeR2FZPLy."
  }
}

// URL database - note each url is assigned to the user who created it
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

// Generates a 6 character string which is used for the shortURL code and the userID
function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

// Renders the register page when the user requests the /register URI
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/");
  } else {
    res.render("urls_register");
  }
})

// The user submits their registry info
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

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/");
  } else {
    res.render("urls_login", {user: req.session["user_id"]})
  }
})

app.post("/login", (req, res) => {
  function authenticated(email, password) {
    for (user in users) {
      if (users[user].email === email && bcrypt.compareSync(password, users[user].hashed_password, 10)) {
        return users[user];
      }
      // Break up the if statement into multiple if statements to be able to respond with relevant messages depending on if the email or password does not match
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

app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  // Give the user a message telling them they have successfully logged out
  res.redirect("/login");
})

app.get('/', (req, res) => {
  res.redirect('/urls');
})

// pass urls_index the URL database via templateVars
app.get("/urls", (req, res) => {
  let myLinks = {};
  for (shortURL in urlDatabase) {
    if (req.session["user_id"] === urlDatabase[shortURL].userID) {
      myLinks[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  // console.log(users[req.session["user_id"]].email);
  let templateVars = {
    urls: myLinks,
    email: users[req.session["user_id"]]
  }
  res.render("urls_index", templateVars);
})

app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: req.session["user_id"]
  };
  res.redirect("/urls/" + randomString);
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {email: users[req.session["user_id"]]});
})

app.get("/urls/:id", (req, res) => {
  // const userID = req.session["user_id"];
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("Sorry that link does not exist.<br><a href='/urls'>Return to Tiny App</a>");
  } else {
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      email: users[req.session["user_id"]]
    }
    res.render("urls_show", templateVars)
  }
})

// Update link
app.post("/urls/:id", (req, res) => {
  let newURL = req.body.updatelink;
  let shortURL = req.params.id;
  urlDatabase[shortURL].longURL = newURL;
  res.redirect(`/urls/${shortURL}`);
})

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
})

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("Sorry that link does not exist.<br><a href='/urls'>Return to Tiny App</a>");
  } else {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    if (longURL === undefined) {
      res.status(404).send("Sorry that link does not exist.<br><a href='/urls'>Return to Tiny App</a>");
    } else {
      res.redirect(longURL);
    }
  }
})

// function countUsers() {
//   return Object.keys(users).length;
// }

function doesUserExist(email) {
  for (user in users) {
    if ((users[user].email) === email) {
      return true;
    }
  }
}

app.use(function (req, res, next) {
  res.status(404).send("Sorry, this page does not exist.")
  // Add a response redirect
})

app.listen(PORT, ()=> {
  console.log(`Tinyapp listening on port ${PORT}!`);
});