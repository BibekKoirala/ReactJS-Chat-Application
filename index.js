const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Socket = require('ws');
const config = require('./config');
const authenticate = require('./authenticate');
const passport = require('passport');
const mongoose = require('mongoose');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const User = require('./models/users');
const loginRouter = require('./Routes/authenticationRoute');
const Thread = require('./models/threads');
const Messages = require('./models/messages');
const path = require('path')

if(process.env.NODE_ENV === "production") {

    app.use(express.static('chat_app/build')) 

    app.get("*", (req,res) =>{
        res.sendFile(path.resolve(__dirname, 'chat_app', 'build', 'index.html'))
    })
}

//const hostname = '192.168.1.79';
const port = process.env.PORT || 4000;

//Connecting To MongoDB SERVER
mongoose.connect(config.mongoUrl, { useNewUrlParser: true })
    .then(() => {
        console.log('Successfully connected to MongoDB server');
}).catch(err => console.log(err));




const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('Secret-Key'));
app.use(bodyParser.json());


app.use(passport.initialize());
app.use(cors())


const ws = new Socket.Server({ port : 8080})
const clients =[]


//Web Socket Server...
ws.on('connection',(ws)=>{

    function getInitialThreads(userId){
        
        Thread.find({users: {$in: [userId]}})
        .lean()
        .exec((err,threads)=>{
            if(!err && threads){
               
                threads.map(async (thread,i)=> {
                    
                    let currentUser = []
                    await thread.users.filter(us=>us !==userId).map(async (userId,j)=>{
                        
                        await User.find({_id : userId})
                        .exec((err2,users)=>{
                            currentUser.push(users[0])
                            console.log(currentUser)
                            thread.profiles=currentUser
                            if (i === threads.length -1 && users.length - 1 === j){
                               ws.send(JSON.stringify({
                                    type: 'INITIAL_THREADS',
                                    data: threads
                                }))
                            }
                        })
                    })
                    
                })
            }
        })
    }

    //To remove the current web socket instance from the client's stack.
    ws.on('close',(req)=>{
        console.log('Closing...')
        let clientIndex = -1
        clients.map((c,i)=>{
            if(c.ws._closeCode === req){
                clientIndex = i
            }
        });

        if(clientIndex > -1) {
            clients.splice(clientIndex, 1)
        }
    })

    //To handle incoming messages from the web socket...
    ws.on('message',(message)=>{
        const user = JSON.parse(message)
        switch(user.type){

            //To add a new web socket instance in client stack during connection.

            case "NewConnection":{
                let client ={
                    ws:ws,
                    id : user.user.id 
                }
                clients.push(client)
                getInitialThreads(client.id)
                break;
            }

            //Searching specific user in the users collection

            case "Search":{
                User.findOne({username: user.search},(err,user)=>{
                    if(!err && user){
                        ws.send(JSON.stringify({
                            type:'GOT_USER',
                            userdata: {
                                username: user.username,
                                email: user.email,
                                company: user.company,
                                designation: user.designation,
                                status: user.status,
                                id: user._id
                            }
                        }))
                    }
                })
                break;
            }

            //Creating a new thread or finding an existing thread from threads collections

            case 'Find_Create_Thread':{
                console.log(user.data[0])
                
                Thread.findOne({users: user.data})
                .exec((err,thread)=>{
                    if(!err && thread) {
                        clients.filter(u=>thread.users.indexOf(u.id.toString()) > -1).map(client=>{
                            client.ws.send(JSON.stringify({
                                type: 'ADD_THREAD',
                                data: thread
                            }))
                        })
                    } 
                    else {
                        Thread.create({
                            last_updated : new Date(),
                            users: user.data
                        },(err2,thread)=>{
                            if(!err2 && thread) {
                                clients.filter(u=>thread.users.indexOf(u.id.toString()) > -1).map(client=>{
                                    client.ws.send(JSON.stringify({
                                        type: 'ADD_THREAD',
                                        data: thread
                                    }))
                                })
                            }    
                        });
                    }
                })                    
                
                break;
            }

            //Loading the messages from the messages instance of a certain thread..
            case 'THREAD_LOAD': {
                
                Messages.find({threadId : user.data})
                .sort([['date',1]])
                .limit(100)
                .exec((err,messages)=>{
                    if(!err && messages){
                        ws.send(JSON.stringify({
                            type : 'THREAD_LOAD',
                            data : { threadId : user.data , message : messages}
                        }))
                    }
                })
              break;  
            }

            //Handling New Messages
            case 'NEW_MESSAGE':{

                Thread.findById(user.data.threadId)
                .exec((err,thread)=>{
                    console.log('New message is comming',thread)
                    Messages.insertMany({
                        content : user.data.message,
                        date : new Date(),
                        seenBy : false,
                        threadId : thread._id,
                        sender : user.data.sentBy
                    },(err,msg)=>{
                        console.log(thread)
                        clients.filter(client=>thread.users.indexOf(client.id.toString()) > -1).map(client =>{
                            client.ws.send(JSON.stringify({
                                type : 'NEW_MESSAGE',
                                threadId : user.data.threadId,
                                message: msg
                            }))
                        })
                    })
                })

                break;
            }

            case 'DELETE_MESSAGE': {
                console.log('........deleting.......',user.messageID)

                Messages.findByIdAndRemove(user.messageID._id).exec(err=>{
                    if(!err){
                        Thread.findById(user.messageID.threadId)
                        .exec((err,thread)=>{
                            clients.filter(client=>thread.users.indexOf(client.id.toString()) > -1).map(client =>{
                                client.ws.send(JSON.stringify({
                                    type : 'DELETE_MESSAGE',
                                    message: user.messageID._id
                                }))
                            })
                        })
                    }
                })
                
                break;
            }
            default :
        }
    })
})


app.use('/',loginRouter);


app.listen(port,()=>{
    console.log("Application running at port 4000");
});

