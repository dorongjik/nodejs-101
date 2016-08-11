var path = require("path");
var express = require("express");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var csurf = require("csurf");
var mongoose = require("mongoose");
var flash = require("connect-flash");
var passport = require("passport");
var socketio = require("socket.io");
var http = require("http");

var homeRouter = require("./routes/home");
var zigbangRouter = require("./routes/zigbang");
var watchaRouter = require("./routes/watcha");
var methodsRouter = require("./routes/methods");
var contactsRouter = require("./routes/contacts");
var apiRouter = require("./routes/api"); // api/index.js
var postsRouter = require("./routes/posts"); // api/index.js
var flashRouter = require("./routes/flash");
var authRouter = require("./routes/auth");
var chatRouter = require("./routes/chats");

var methodMiddleware = require("./middlewares/method");

var config = require("./config");


var app = express();
var httpServer = http.Server(app);
var io = socketio(httpServer);


mongoose.connect("mongodb://mongodb.dobest.io/suchan");
var db = mongoose.connection;


db.once("open", function() {
  console.log("Database is connected");
});


// Application Settings
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.set("jwtSecret", config.jwtSecret);

app.use( "/static/", express.static(path.join(__dirname, "public")) );

// 3rd Party Middlewares
app.use( morgan("combined") );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({extended: true}) );

// var cookieParser = require("cookie-parser");
// var session = require("express-session");
app.use( cookieParser() );
app.use( session({
  secret: "node.js",
  resave: true,
  saveUninitialized: true
}) );
app.use( flash() );


// passport
// Strategy -> passport.authenticate(...)
app.use( passport.initialize() );
app.use( passport.session() );

require("./config/passport")(passport);


// var csrfTokenMiddleware = csurf({cookie: true});
// function(req, res, next)
// app.use( csurf({cookie: true}) );


// app.use( methodMiddleware.getPostDataMiddleware() );


app.use( function(req, res, next) {
  // res.render(templateName, context);
  // context ( == res.locals )
  // res.locals.csrfToken = req.csrfToken();
  next();
});


app.use( function(req, res, next) {
  res.locals.flash = req.flash();

  next();
});


app.use( function(req, res, next) {
  res.locals.user = req.user;
  next();
});


// Routers
app.use("/", homeRouter);
app.use("/zigbang/", zigbangRouter);
app.use("/watcha/", watchaRouter);
app.use("/methods/", methodsRouter);
app.use("/contacts/", contactsRouter);
app.use("/posts/", postsRouter);
app.use("/api/", apiRouter);
app.use("/flash/", flashRouter);
app.use("/chats/", chatRouter);
app.use("/", authRouter);


// Error Handling Middleware
app.use(function(error, req, res, next) {
  res.status(error.status || 500);
  return res.render("error", {error: error});

  next();
});
// next(); ===> function(req, res, next);
// next(error); ===> function(error, req, res, next);


io.on("connect", function(socket) {
  console.log("Socket is connected: " + socket.id);

  socket.on("disconnect", function() {
    console.log("Socket is disconnected: " + socket.id);
  });
});


httpServer.listen(3000, function() {
  console.log("Server is listening");
});
