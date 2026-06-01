import MongoStore from 'connect-mongo';

const secret = process.env.SESSION_CONFIG_SECRET||"" ;
const dbUrl = process.env.MONGO_URI || '';

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
      secret: secret
  }
});

const sessionConfig ={
  store,
  name:'session',
  secret:secret,
  resave: false,
  saveUninitialized: true,
  cookie:{
    httpOnly: true,
    expires: new Date(Date.now()+ 1000*60*60*24*30),
    maxAge: 1000*60*60*24*30
  }
};

export default sessionConfig;