require('dotenv').config()
const mongoose = require('mongoose')
const app = require('./app')

const PORT = process.env.PORT || 4000
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/movies'

if (require.main === module) {
  mongoose.connect(MONGO).then(()=> {
    console.log('Connected to MongoDB')
    app.listen(PORT, ()=> console.log('Server running on', PORT))
  }).catch(err=> {
    console.error('Mongo connection error', err)
  })
}

module.exports = app
