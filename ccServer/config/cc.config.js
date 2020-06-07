module.exports = {
    mqtt: {
        url: 'ws://broker.hivemq.com',
        config: {
            port: 8000,
            path: '/mqtt',
            keepalive: 30,
            resubscribe:true
        }
    },
    mongo: {
        url: process.env.DOCKER ? 'mongodb://mongo:27017/cc' : 'mongodb://localhost:27017/cc',
        config: { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        }
    },
    api: {
        url: ( process.env.DOCKER ? 'http://cc-api:8080' : 'http://localhost:8080') + '/api/chatmessages'
    }
};