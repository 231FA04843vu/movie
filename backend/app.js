require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const recRoutes = require('./routes/recommendations')
const moviesRoutes = require('./routes/movies')
const activityRoutes = require('./routes/activity')
const traktRoutes = require('./routes/trakt')
const authRoutes = require('./routes/auth')

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use('/api/recommendations', recRoutes)
app.use('/api/movies', moviesRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/external', traktRoutes)
app.use('/api/auth', authRoutes)

module.exports = app
