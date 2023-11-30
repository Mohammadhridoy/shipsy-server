const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express()
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000; 

// middware
app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zfjzbub.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    

    const usrtypeCollection = client.db('shipsy').collection('user');
    const bookingsCollection = client.db('shipsy').collection('bookings')
    const reviewsCollection = client.db('shipsy').collection('reviews')

    // store user info in database
    app.post('/user', async(req, res)=>{
        const user = req.body;
        const query = {email: user.email}
        const haveUser = await usrtypeCollection.findOne(query)
        if(haveUser){
            return res.send({message: 'user already exists'})
        }

        const result = await usrtypeCollection.insertOne(user)
        res.send(result)
    })
    // get user data 
    app.get('/user', async(req, res)=>{
        const email = req.query.email
        
        const query = {role:"user", email:email}
        const result = await usrtypeCollection.find(query).toArray()
        res.send(result)
    })

    // update user info 
    app.put('/user/:id', async(req, res)=>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const options = { upsert: true }
        const updateduser = req.body; 
        const updateInfo = {
          $set:{
           image: updateduser.image
          },
        };
        const result = await usrtypeCollection.updateOne(filter, updateInfo, options)
        res.send(result)
    })

    app.get('/users', async(req, res) =>{

        
        const query = { role:'user' }
        
        const result = await usrtypeCollection.find(query).toArray()
        res.send(result)
    })
    // get all deliever man list from user collection
    app.get('/user/deliverman',async(req, res)=>{
        const query = {role: 'deliveryman'}
        const result = await usrtypeCollection.find(query).toArray()
        res.send(result)
    })
    // get deliver info 
    app.get('/user/delivery/:email', async(req, res)=>{
        const email = req.params.email
        
        const query = {email: email}
        const user = await usrtypeCollection.findOne(query)
        let delivery = false;
        
        if(user){
            delivery = user?.role === 'deliveryman'
        }
        
        res.send({delivery})
        
    })
    // make a deliveryman
    app.patch('/user/delivery/:id', async(req, res)=>{
        const id = req.params.id
        const filter = {_id: new ObjectId(id)}
        const updateInfo = {
            $set:{
                role:'deliveryman'
            }
        }
        const result = await usrtypeCollection.updateOne(filter, updateInfo)
        res.send(result)
    })
    // get admin info 
    app.get('/user/admin/:email', async(req, res)=>{
        const email = req.params.email;

        const query = {email: email}
        const user = await usrtypeCollection.findOne(query)
        let admin = false;
        if(user){
            admin = user?.role === 'admin'
        }
        res.send({admin})
    })
// make admin 
    app.patch('/user/admin/:id', async(req, res)=>{
        const id = req.params.id 
        const fillter = {_id: new ObjectId(id)}
        const updateDoc ={
            $set:{
                role: 'admin'
            }
        }
        const result = await usrtypeCollection.updateOne(fillter, updateDoc)
        res.send(result)
    })



    // start bookings apis 

    // parcels post in database 
    app.post('/bookings', async(req, res)=>{
        const bookingInfo= req.body;

        const result = await bookingsCollection.insertOne(bookingInfo)
        res.send(result)
    })
    // get booking info 
    app.get('/bookings', async(req, res)=>{

        let query = { };
      if(req.query?.email) {
        query = {userEmail:req.query.email}

      }

        const result = await bookingsCollection.find(query).toArray()
        res.send(result)
        
    })

    app.get("/bookings/:id", async(req, res ) =>{
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
  
        const result = await bookingsCollection.findOne(query)
        res.send(result)
  
      })

    app.put('/bookings/:id', async(req, res)=>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const options = { upsert: true }
        const updatedbooking = req.body; 
        const updateInfo = {
          $set:{
            userNumber: updatedbooking.number,
            parcelType: updatedbooking.parceltype,
            receiverName: updatedbooking.receivername,
            receiverNumber: updatedbooking.receiversnumber,
            deliveryAddress: updatedbooking.address,
            latitude: updatedbooking.latitude,
            longitude: updatedbooking.logitude,
            requestedDeliveryDate: updatedbooking.requestedDeliveryDate,
          },
        };
        const result = await bookingsCollection.updateOne(filter, updateInfo, options)
        res.send(result)
      })
    //   admin update bookings info 
    app.put('/bookings/admin/update/:id', async(req, res)=>{
        const id = req.params.id
        const filter ={_id: new ObjectId(id ) }
        const options = {upsert: true}
        const updatedInfo = req.body;
        const updateDoc = {
            $set:{
                status: "On The Way",
                approximateDeliveryDate: updatedInfo.approximateDeliveryDate,
                deliverymanid: updatedInfo.deliverymanid,
                deliverymanemail: updatedInfo.deliverymanemail
            }
        }
        
        const result = await bookingsCollection.updateOne(filter, updateDoc, options)
        res.send(result)
    })
    //   total bookigns fillter by email
    app.get('/bookings', async(req, res)=>{
        const email = req.query.email
        console.log(email)
        const query = {userEmail:email}
        const totalBookings = await bookingsCollection.countDocuments(query)
        res.send(totalBookings)

    })

    app.get('/bookings', async(req, res)=>{
        const result = await bookingsCollection.find().toArray()
        res.send(result)
    })

    // update status from bookings info 
    app.patch('/bookings/cancel/:id', async(req, res) =>{
        const id = req.params.id
        const filter = {_id: new ObjectId(id)}
        const updateStatus ={
            $set:{
                status: 'cancel'
            }
        }
        const result = await bookingsCollection.updateOne(filter, updateStatus)
        res.send(result)
    })
    // update status from bookings info 
    app.patch('/bookings/delivery/:id', async(req, res)=>{
        const id = req.params.id
        const filter= {_id: new ObjectId(id)}
        const updateStatus ={
            $set:{
                status:'delivered'
            }
        }
        const result = await bookingsCollection.updateOne(filter, updateStatus)
        res.send(result)
    })

    // get bookings information by filter delivery man id 
    app.get('/bookings/deliverinfo/:email', async(req, res)=>{
        const email = req.params.email 
        const query = {deliverymanemail:email}

        const result = await bookingsCollection.find(query).toArray()
       
        res.send(result) 
    })
//   post reviews in reviewsCollection 
   app.post('/reviews', async(req, res)=>{
        const review = req.body;

        const result = await reviewsCollection.insertOne(review)
        res.send(result)
   })
//    get reviews info base on email 
   app.get('/reviews/:email', async(req, res)=>{
        const email = req.params.email
        const filter = {delliveryManEmail: email}
        
        const result = await reviewsCollection.find(filter).toArray()
        res.send(result)
   })
// Payment information
app.post('/create-payment-intent', async(req, res)=>{
    const { price } = req.body;
    const amonut = parseInt(price*100)
    // console.log(price)
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amonut,  
        currency: "usd",
        payment_method_types: ['card']

      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });

})


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // s
  }
}
run().catch(console.dir);








app.get('/', (req, res) => {
    res.send(' website is running.....')
  })
  
  app.listen(port, () => {
    console.log(` listening on port ${port}`)
  })