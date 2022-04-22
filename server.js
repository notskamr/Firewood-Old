import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import * as http from 'http'
import { Server } from "socket.io";
import User from './models/user.js'
import bcrypt from 'bcryptjs'
import * as validator from 'email-validator'
import jsonwebtoken from "jsonwebtoken"
import cookieParser from "cookie-parser"
import { v4 as uuidV4 } from 'uuid';



const app = express()
dotenv.config()

mongoose.connect(process.env.FIREWOOD_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

app.use(cors())
app.use(express.json())
app.use(cookieParser())
const server = http.Server(app)
const io = new Server(server)

app.set('view engine', 'ejs')
app.use(express.static("public"))

app.get('/', (req, res) => {
    var token = req.cookies['token']
        try {
            var user = jsonwebtoken.verify(token, process.env.JWT_SECRET)
            console.log("Current: ", user)
        } catch (error) {
            res.clearCookie()
            return res.render('home-no-user')
        }
    res.render('boilerplate', {data: user['username']})
})

app.get('/new-cabin', (req, res) => {
    res.redirect(`/cabin/${uuidV4()}`)
})

app.get('/cabin/:cabin', (req, res) => {
    res.render('cabin', { cabinAddress: req.params.cabin, userId: jsonwebtoken.verify(req.cookies['token'], process.env.JWT_SECRET)['id']})
})

io.on('connection', socket => {
    socket.on('join-cabin', ( cabinAddress, userId ) => {
        socket.join(cabinAddress)
        socket.to(cabinAddress).emit('user-connected', userId)
        socket.on('disconnect', () => {
            socket.to(cabinAddress).emit('user-disconnected', userId)
        })
    })
})

app.get('/register', (req, res) => {
    var token = req.cookies['token']
    if (token) {
        try {
            var user = jsonwebtoken.verify(token, process.env.JWT_SECRET)
            console.log("Current: ", user)
        } catch (error) {
            res.clearCookie()
            res.redirect('/register')
        }
        return res.redirect('/')
    }
    return res.render('register')

})

app.get('/login', (req, res) => {
    var token = req.cookies['token']
    if (token) {
        try {
            var user = jsonwebtoken.verify(token, process.env.JWT_SECRET)
            console.log("Current: ", user)
        } catch (error) {
            res.clearCookie()
            res.redirect('/login')
        }
        return res.redirect('/')
    }
    return res.render('login')
})

app.get('/logout', (req, res) => {
    res.clearCookie('token')
    res.redirect('/')
})

app.post('/api/login', async (req, res) => {
    var { usermail, password: passwordPlain } = req.body
    var user = null
    if(!usermail || !passwordPlain) {
        return res.json({status: 'error', error: 'Missing fields.'})
    }
    
    if (validator.validate(usermail)) {
        // input is an e-mail
        usermail = usermail.toLowerCase()
        console.log(usermail)
        if (typeof(usermail) !== 'string') {
            return res.json({status: 'error', error: 'Invalid e-mail'})
        }
        user = await User.findOne({ email: usermail }).exec()

    }
    else {
        usermail = usermail
        console.log(usermail)
        user = await User.findOne({ username: usermail }).exec()
    }

    if (!user) {
        return res.json({status: 'error', error: 'Invalid e-mail/username/password'})
    }
    
    console.log(passwordPlain)

    
    


    console.log(user)

    var hash = user['password']
    console.log(hash)
    if (await bcrypt.compare(passwordPlain, hash)) {
        // Found
        console.log('Logged in.')
        const token = jsonwebtoken.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET)
        res.cookie('token', token)
        return res.json({status: 'ok', data: token})
    }
    return res.json({status: "error", error: 'Invalid password'})
})

app.post('/api/register', async (req, res) => {
    console.log(req.body)
    if (! req.body.username || !req.body.email || !req.body.password || !req.body.confirmation) {
        return res.json({ status: 'error', error: 'Missing fields.'})
    }

    var { username, email, password, confirmation } = req.body
    email = email.toLowerCase()

    if (typeof(username) !== 'string') {
        return res.json({ status: 'error', error: 'Invalid username.'})
    }

    if (!validator.validate(email)) {
        return res.json({ status: 'error', error: 'Invalid E-mail'})
    }

    if (password.length < 6) {
        return res.json({ status: 'error', error: 'Password is too small. Should be atleast 7 characters.'})
    }

    if (password != confirmation) {
        return res.json({ status: 'error', error: "Passwords don't match."})
    }

    try {
        const response = await User.create({
            username,
            email,
            password
        })
        console.log("User created successfully " + response)
    } catch (error) {
        if (error.code === 11000) {
            // duplicate username
            return res.json({ status: 'error', error: 'Username already in use.'})
        }
        throw error
    }

    const user = await User.findOne({ email }).lean()
    const token = jsonwebtoken.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET)
    res.cookie('token', token)
    return res.json({status: 'ok'})

})

app.get('/api/state.json', (req, res) => {
    res.type('json')
    var state = null;
    var token = req.cookies['token']
    if (token) {
        try {
            var user = jsonwebtoken.verify(token, process.env.JWT_SECRET)
            state = "logged-in"
            return res.send(JSON.stringify({state: state, username: user['username']}))
        } catch (error) {
            state = "error"
            res.clearCookie()
            return res.send(JSON.stringify({state: state, username: null}))
        }
    }
    else {
        state = null
        return res.send(JSON.stringify({state: state, username: null}))
    }

})

server.listen(3000)