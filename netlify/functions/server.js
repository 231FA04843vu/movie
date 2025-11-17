const serverless = require('serverless-http')
const mongoose = require('mongoose')
const path = require('path')

// require the app exported from backend/app.js
const app = require(path.join(__dirname, '..', '..', 'backend', 'app'))

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/movies'

let connPromise = null
const serverlessHandler = serverless(app)

module.exports.handler = async function(event, context) {
  if (!connPromise) {
    connPromise = mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => console.log('Mongo connected (lambda)'))
      .catch(err => {
        console.error('Mongo connection error (lambda)', err)
        throw err
      })
  }
  await connPromise
  return serverlessHandler(event, context)
}
