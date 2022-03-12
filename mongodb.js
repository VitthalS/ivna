//CRUD
// const mongodb = require('mongodb')
// const MongoClient = mongodb.MongoClient
// const ObjectID = mongodb.ObjectID

const {MongoClient, ObjectID} = require('mongodb')


const connectionURL = 'mongodb://db:27017'
const databaseName = 'task-manager'


MongoClient.connect(connectionURL, {useNewUrlParser: true}, (error, client) => {
    if(error){
        return console.log('Unable to connect to database')
       }
       
       
       const db = client.db(databaseName)


       db.collection('tasks').deleteOne({
           description: 'Pot plans'
       }).then((error) => {

        console.log(error)
       }).catch((result) => {
            console.log(result)
       })
    
})