const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

mongoose.connect(require('./config/keys').mongoURI, {useNewUrlParser: true})
    .then(() => {
        console.log('Database is connected')
    })
    .catch(err => {
        console.log(err)
    });

app.use(express.json());

app.use(cookieParser());

app.use('/api', require('./routes/routes'));

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running port ${PORT}...`)
});