const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(
  cors({
    origin: "http://localhost:5173", // Allow only your frontend
    credentials: true, // Allow cookies, authorization headers, etc.
  })
);
app.use(express.json());
app.use(cookieParser());

const logger = (req, res, next) => {
  console.log('inside the logger');
  next();
}
const verifyToken = (req, res, next) => {
  // console.log('inside verify token middleware')
  const token = req?.cookies?.token;

  if(!token) {
    return res.status(401).send({message: 'Unauthorized access'})
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message: 'UnAuthorized access'})
    }
    req.user = decoded;
    next();
  })
}

app.get('/',(req,res)=>{
    res.send('Job is falling from the key')
})
app.listen(port, () => {
    console.log(`Job is waiting at : ${port}`)
})

// job-portal-user
// XMrJJ0qk2muXnRsb



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hvsn9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // jobs related api
    const jobCollection = client.db('Job-portal').collection('Jobs');
    // job application api
    const jobApplicationCollection = client.db('Job-portal').collection('job_applications');
    // auth related api

    app.post('/jwt', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .send({success: true});
    })

    app.post('/logout', (req, res) => {

      res.clearCookie('token',{
        httpOnly:true,
        secure: false
      })
      .send({success:true})
    })
    
    

    app.get('/jobs', logger, async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
          query = { hr_email: email }
      }
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
  });

    // specific data
    app.get('/jobs/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await jobCollection.findOne(query);
      res.send(result)
    })

    // insert job application APIs
      // query job application
  app.get('/job-application', verifyToken,async(req, res) => {
    const email = req.query.email;
    const query = {applicant_email:email}

    console.log(req.cokies?.token)

    if(req.user.email !== req.query.email){
      return res.status(403).send({message: 'forbidden access'})
    }
    
    const result = await jobApplicationCollection.find(query).toArray();

    // aggregate data
    for (const application of result) {
      console.log(application.job_id);
      const query1 = {_id: new ObjectId(application.job_id)}
      const job = await jobCollection.findOne(query1);
      if(job){
        application.title = job.title;
        application.location = job.location;
        application.company = job.company;
        application.company_logo = job.company_logo;
      }
    }
    
    res.send(result)
  })
  
  app.post('/job-applications', async (req, res) => {
          const application = req.body;
          const result = await jobApplicationCollection.insertOne(application);

          const id = application.job_id;
          const query = { _id: new ObjectId(id) }
          const job = await jobCollection.findOne(query);
          let newCount = 0;
          if (job.applicationCount) {
              newCount = job.applicationCount + 1;
          }
          else {
              newCount = 1;
          }

          // now update the job info
          const filter = { _id: new ObjectId(id) };
          const updatedDoc = {
              $set: {
                  applicationCount: newCount
              }
          }
          const updateResult = await jobCollection.updateOne(filter, updatedDoc);

          
          res.status(201).send(result);
  });


  // app.get('/job-applications/:id') ==> get a specific job application by id

  app.get('/job-applications/jobs/:job_id', async (req, res) => {
    const jobId = req.params.job_id;
    const query = { job_id: jobId }
    const result = await jobApplicationCollection.find(query).toArray();
    res.send(result);
  })
  

  // job inserted/post
  app.post('/jobs', async(req, res) => {
    const newJob = req.body;
    const result = await jobCollection.insertOne(newJob);
    res.send(result)
  })

  // data update
  app.patch('/job-applications/:id', async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const filter = {_id: new ObjectId(id)};
    const updatedDoc = {
      $set: {
        status: data.status
      }
    }
    const result = await jobApplicationCollection.updateOne(filter,updatedDoc);
    res.send(result);
  })


    
    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

