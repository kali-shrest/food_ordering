require('dotenv').config()
const express = require('express')
const app = express()
const ejs = require('ejs')
const path = require('path')
const expresslayout = require('express-ejs-layouts')
const PORT = process.env.PORT || 3300
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoStore = require('connect-mongo')
const passport = require('passport')
const eventEmitter = require('events')

// Database connection
const url = 'mongodb://localhost/food';
mongoose.connect(url, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology:true, useFindAndModify: true});
const connection = mongoose.connection;
connection.once('open', ()=>{
    console.log('Database connected.');
}).catch(err =>{
    console.log('connection failed.')
});



//session store
const mongoStore = new MongoStore({
    mongoUrl: url,
    collection: 'session'
});


//session config
app.use(session({
    secret: process.env.COOKIE_SECRET,
    //resave: false,
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost/food'}),
    cookies: { maxAge: 1000 * 60 * 60 * 24 } // 24 hour
}))

//passport configstore
const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

//assets
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

//glocal middleware---use to get // for layout session
app.use((req, res, next) => {
    res.locals.session = req.session
    res.locals.user = req.user
    //next will pass or it will stuck in reloac 
    next()
})

// #set template engine
app.use(expresslayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')

//routs --this routs should be after templets engine bolcks
// app.get('/', function(req, res){
//     res.render('home')
// })
//main lines full of routess
require('./routes/web')(app)
app.use((req, res) => {
    res.status(404).render('errors/404')
})

const server = app.listen(PORT , () => {
            console.log(`Listening on port ${PORT}`)
        })

// Socket

const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
      socket.on('join', (orderId) => {
        socket.join(orderId)
      })
})

// eventEmitter.on('orderUpdated', (data) => {
//     io.to(`order_${data.id}`).emit('orderUpdated', data)
// })

// eventEmitter.on('orderPlaced', (data) => {
//     io.to('adminRoom').emit('orderPlaced', data)
// })

