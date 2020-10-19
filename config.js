
if ( process.env.NODE_ENV === "production"){
    
    module.exports = {
        'secretKey':'12345-67890-09876-54321',
        'mongoUrl' : process.env.mongoUrl
    }
}
module.exports={
    'secretKey':'12345-67890-09876-54321',
    'mongoUrl':'mongodb+srv://bibekKoirala:tL6C6qfbpmaqaf6@cluster0.meddl.mongodb.net/Cluster0?retryWrites=true&w=majority',
}