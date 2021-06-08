const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q1a8q.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000

const app = express()

app.use(cors());
app.use(bodyParser.json());




var serviceAccount = require("./burj-al-arabb-b8d26-firebase-adminsdk-ko5rj-9277bedd28.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});






const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");
  // console.log('db connected')

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
    // console.log(newBooking);
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    //  console.log(bearer)
    if (bearer && bearer.startsWith('Bearer')) {
      const idToken = bearer.split(' ')[1];
      // console.log({ idToken });
      admin.auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => { 
          const tokenEmail = decodedToken.email;
          const  queryEmail =req.query.email;
          // console.log(tokenEmail,queryEmail);
          if (tokenEmail ==queryEmail) {
            bookings.find({ email: req.query.email })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
          else{
            res.status(401).send('un-authorized access')
          }
        }).catch((error) => {
         res.status(401).send('un-authorized access')
        });
    }
    else{
      res.send('Un Authorized access')
    }
  })

});


app.get('/', (req, res) => {
  res.status(401).send('Hello World!')
})

app.listen(port)