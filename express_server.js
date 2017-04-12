const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req,res) => {
  res.render("urls_new");
})

app.get("/urls/:id", (req,res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render("urls_show", templateVars)
})

app.get("/urls", (req,res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
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
});

app.post("/urls", (req,res) => {
let randomString = generateRandomString();
urlDatabase[randomString] = req.body.longURL;
res.redirect("/urls/" + randomString);
})

app.post("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
})

// app.use(function (req, res, next) {
//   res.status(404).send("Sorry, this page does not exist.")
// })

app.listen(PORT, ()=> {
  console.log(`Tinyapp listening on port ${PORT}!`);
});