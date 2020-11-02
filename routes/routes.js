const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Task = require('../models/Post');

//Sign user up
router.post('/signup', async (req, res) => {
    const userExists = await User.findOne({username: req.body.username})
    if(userExists) {
        res.json('Username is taken');
    }
    else if(req.body.password.length < 6) {
        res.json('Password should be at least 6 characters long');
    }
    else {
        const hashedPassword = await bcrypt.hash(req.body.password, await bcrypt.genSalt(10))
        const user = new User({
        username: req.body.username,
        password: hashedPassword
        });
        try {
            const savedUser = await user.save()
            res.json(savedUser)
        }
        catch(err) {
            res.json(err)
        }
    }
});

//Log user in
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({username: req.body.username})
        if(!user) {
            res.json('Invalid username')
        }
        else {
            if(bcrypt.compare(req.body.password, user.password)) {
                const token = jwt.sign({id: user._id}, require('../config/auth').jwtSecret)
                res.cookie('auth_token', token)
                res.json('Logged in')
            }
            else {
                res.json('Invalid password')
            }
        }
    }
    catch(err) {
        res.json(err)
    }
});

//Log user out
router.get('/logout', (req, res) => {
    const cookie = req.cookies['auth_token']
    if(!cookie) {
        res.json('You were not logged in')
    }
    else {
        res.clearCookie('auth_token');
        res.json('Logged out');
    }
});

//Get all tasks
router.get('/tasks', authUser, async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const tasks = await Task.find({author: res.user.username})
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const count = await Task.countDocuments();

        res.json({
        tasks,
        totalPages: Math.ceil(count / limit),
        currentPage: page
        });
    } catch (err) {
        res.json(err);
    }
});

//Get task
router.get('/tasks/:id', authUser, async (req, res) => {
    try{
        task = await Task.findById(req.params.id)
        if(!task) {
            res.json('This task does not exist')
        }
        else if(task.author == res.user.username) {
            res.json(task)
        }
        else {
            res.json('This task is not yours')
        }
    }
    catch(err) {
        res.json(err)
    }
});

//Create task
router.post('/tasks', authUser, async (req, res) => {
    const task = new Task({
        title: req.body.title,
        memo: req.body.memo,
        author: res.user.username
    });
    try {
        if(req.body.title == "") {
            res.json('Please enter a title')
        }
        else {
            const savedTask = await task.save()
            res.json(savedTask)
        }
    }
    catch(err) {
        res.json(err)
    }
});

//Update task
router.patch('/tasks/:id', authUser, async (req, res) => {
    try{
        task = await Task.findById(req.params.id)
        if(!task) {
            res.json('This task does not exist')
        }
        else if(task.author == res.user.username) {
            if(req.body.title != "") {
                task.title = req.body.title
            }
            if(req.body.memo != "") {
                task.memo = req.body.memo
            }
            const updatedTask = await task.save()
            res.json(updatedTask)
        }
        else {
            res.json('This task is not yours')
        }
    }
    catch(err) {
        res.json(err)
    }
});


//Delete task
router.delete('/tasks/:id', authUser, async (req, res) => {
    try{
        task = await Task.findById(req.params.id)
        if(!task) {
            res.json('This task does not exist')
        }
        else if(task.author == res.user.username) {
            await task.remove()
            res.json('Task deletd')
        }
        else {
            res.json('This task is not yours')
        }
    }
    catch(err) {
        res.json(err)
    }
});

//Authenticate user
async function authUser(req, res, next) {
    const token = req.cookies['auth_token']
    if(!token) {
        res.json('Please login first')
    }
    else {
        const decode = jwt.decode(token, require('../config/auth').jwtSecret)
        let user
        try {
            user = await User.findOne({_id: decode.id});
            res.user = user;
            next()
        }
        catch(err) {
                res.json('Something went wrong, please try logging in again')
       }
    }
}

module.exports = router;