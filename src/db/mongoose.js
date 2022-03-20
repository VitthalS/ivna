const mongoose = require('mongoose')

mongoose.connect('mongodb://mongo:27017/task-manager-api', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})

// https://github.com/VitthalS/ivna