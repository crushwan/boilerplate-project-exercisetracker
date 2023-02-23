const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
mongoose.set('strictQuery', true);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema

app.use(cors())
app.use(express.static('public'))
app.use("/", bodyParser.urlencoded({extended: false}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

const userSchema = new Schema({
  username: { type: String, required: true }
})
let userModel = mongoose.model("user", userSchema) 

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: {type:String, required: true},
  duration: {type: Number, required: true},
  date: { type: Date, default: new Date() }
})
let exerciseModel= mongoose.model("exercise", exerciseSchema)
  
app.post('/api/users', (req,res) => {
  let username = req.body.username;
  let newUser = userModel({username: username});
  newUser.save();
  res.json(newUser);
})

app.get('/api/users', (req,res) => {
  userModel.find({}).then(users => {
    res.json(users)
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  let userId = req.params._id;
  let exerciseObj = {
    userId: userId,
    description: req.body.description,
    duration: req.body.duration
  }
  if(req.body.date != ""){
    exerciseObj.date = req.body.date
  }

  let newExercise = new exerciseModel(exerciseObj);

  userModel.findById(userId, (err, userFound) => {
    if(err) console.log(err)
    newExercise.save();
    res.json({
      _id: userFound._id,
      username: userFound.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString()
    })
  })
} )

app.get('/api/users/:_id/logs', (req,res) => {
  let userId = req.params._id;

  let resObj = {};

  let limitParam = req.query.limit;
  let toParam = req.query.to;
  let fromParam = req.query.from;

  limitParam = limitParam ? parseInt(limitParam) : limitParam;

  let queryObj = {userId: userId};

  if(fromParam || toParam){
    queryObj.date = {};

    if(fromParam){
      queryObj.date['$gte'] = fromParam;
    }
    if(toParam){
      queryObj.date['$lte'] = toParam;
    }
    
  }
    

    userModel.findById(userId,(err, userFound) => {
    if(err) console.log(err)

    let username = userFound.username;
    let userId = userFound._id;
    resObj = {_id: userId, username: username}

    exerciseModel.find(queryObj).limit(limitParam).exec((err, exercises) => {

      exercises = exercises.map(i=> {
        return {
          description: i.description,
          duration: i.duration,
          date: i.date.toDateString()
        }
      }) 
      
      resObj.log = exercises
      resObj.count = exercises.length;
      res.json(resObj)
      }
    )
  })
  
})