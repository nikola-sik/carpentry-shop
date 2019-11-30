const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const db = require('./util/database');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const connectFlash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const shopRoutes = require('./routes/shop');
const restRoutes = require('./routes/rest');
const Message = require('./models/message');


const errorController = require('./controllers/error');
const mongoConnect = require('./util/databaseMongoDB').mongoConnect;

const MONGODB_URI = `${process.env.MONGODB_STRING}`;
const FACEBOOK = `${process.env.FACEBOOK}`;
const INSTAGRAM = `${process.env.INSTAGRAM}`;
const MY_LINK = `${process.env.MY_LINK}`;
const PHONE_NUMBER = `${process.env.PHONE_NUMBER}`;
const SHOP_EMAIL = `${process.env.SHOP_EMAIL}`;
const ADDRESS = `${process.env.ADDRESS}`;
app = express();
const csrfProtection = csrf();

const storeSession = new MongoDBStore({ //definidanje baze gdje se čuva sesija
  uri: MONGODB_URI,
  collection: 'sessions'
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/-/g, '').replace(/:/g, '') + ((file.originalname.length > 100) ? file.originalname.substring(file.originalname.lastIndexOf('.')) : file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.set('view engine', 'ejs');
app.set('views', 'views');          //nije potrebno, automatski gleda u views folder

const accessLogStream = fs.createWriteStream(
  path.join(__dirname,'access.log'),
  {flags: 'a'});

app.use(helmet());
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
  multer({ errorHandling: 'manual', storage: fileStorage, fileFilter: fileFilter, limits: { fileSize: 10000000 } })
    .single('image')(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        req.uploadImageError = 'Fajl je prevelik.'
      }
      next();
    })
});
app.use(express.static(path.join(__dirname, 'public'))); // setovanje public resursa
//app.use (express.static(path.join(__dirname,'images')));
app.use(session({ //setovanje session i baze za sesiju, čita i upisuje session cookie automatski
  secret: 'treba da bude neki dugi string',
  resave: false,
  saveUninitialized: false,
  store: storeSession
}));

app.use(csrfProtection);
app.use(connectFlash());


app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.isAdmin = req.session.isAdmin;
  res.locals.csrfToken = req.csrfToken();
  res.locals.numberOfUnreaded = 0;
  res.locals.facebook = FACEBOOK;
  res.locals.instagram = INSTAGRAM;
  res.locals.myLink = MY_LINK;
  res.locals.shopEmail = SHOP_EMAIL;
  res.locals.phoneNumber = PHONE_NUMBER;
  res.locals.address = ADDRESS;



  if (!req.session.user) { return next(); }
  const username = req.session.user.username;
  if (!username) { return next(); }
  if (req.session.user.admin == 1) {
    return Message.findUnreadedMessagesAdmin(username)
      .then(([messages]) => {
        if (messages.length > 0) {
          res.locals.numberOfUnreaded = messages.length;
        }

        next();
      })
      .catch(err => {
        next(new Error(err));
      });
  } else {
    return Message.findUnreadedMessagesUser(username)
      .then(([messages]) => {
        if (messages.length > 0) {
          res.locals.numberOfUnreaded = messages.length;
        }
        next();
      })
      .catch(err => {
        next(new Error(err));
      });
  }


});


app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/rest', restRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use('/500', errorController.get500);
app.use('/403', errorController.get403);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  res.status(500).render('500', {
    pageTitle: '500',
    path: '/500',
    isLoggedIn: (req.session) ? req.session.isLoggedIn : false,
    isAdmin: (req.session) ? req.session.isAdmin : false,
    facebook: FACEBOOK,
    instagram: INSTAGRAM,
    myLink: MY_LINK,
    shopEmail: SHOP_EMAIL,
    phoneNumber: PHONE_NUMBER,
    address: ADDRESS


  });
});

mongoConnect(() => {
  app.listen(process.env.PORT || 3000, () => { console.log('server running') });
});