const Socket = require('ws')

const ws = new Socket.Server({ port : 8080})

ws.on('connection',(ws)=>{
    ws.on('message',(message)=>{
        console.log(message)
    })
})