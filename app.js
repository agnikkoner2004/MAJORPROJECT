if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}
console.log("Loaded Token:", process.env.MAPBOX_TOKEN);


const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');

const experiencesRoute = require('./routes/experiences.js');
const servicesRoute = require('./routes/services.js');


const listingsRoute = require('./routes/listings.js');
const reviewsRoute = require('./routes/reviews.js');
const userRoute = require('./routes/user.js');


const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');





// const MONGODB_URL = "mongodb://127.0.0.1:27017/Stayclave";
const dbUrl= process.env.ATLASDB_URL;


main().then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Error connecting to MongoDB:", err);
});


async function main() {
    await mongoose.connect(dbUrl);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret:process.env.SECRET,
    },
    touchAfter: 24 * 3600
});

store.on("error", (e) => {
    console.log("Session Store Error", e);
});

const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAge:7 * 24 * 60 * 60 * 1000,
        httpOnly:true,
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.get('/', (req, res) => {
    res.redirect('/listings');
}); 


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
        res.locals.currentUser = req.user;
    // expose Mapbox token to templates (set via .env or environment)
    res.locals.mapboxToken = process.env.MAPBOX_TOKEN;
    res.locals.request = req;
    res.locals.currentPath = req.path;



    next();
});





app.use('/listings', listingsRoute);

app.use('/listings/:id/reviews', reviewsRoute);

app.use('/users', userRoute);

app.use('/experiences', experiencesRoute);

app.use("/services", servicesRoute); 

app.use((req, res, next) => {
    next(new ExpressError(400,"Page Not Found"));
});



//custom error handling middleware
app.use((err, req, res, next) => {
    let{statusCode=500, message="Something went wrong"}=err;
    //res.status(statusCode).send(message);
   res.status(statusCode).render('error.ejs',{message});
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

