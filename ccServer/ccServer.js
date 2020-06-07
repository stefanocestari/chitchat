const ccConfig = require ('./config/cc.config.js');
const mqtt = require('mqtt');
const redis = require('redis');
const mqttClient = mqtt.connect(ccConfig.mqtt.url, ccConfig.mqtt.config);
const redisClient = redis.createClient( process.env.DOCKER ? { host: 'redis', port: 6379} : null );
var request = require('request');
var express = require('express');
var app = express();

const TOPICS = {
    USERS : 'CCTopic/users',
    ROOMS : 'CCTopic/rooms',
    CHAT :  'CCTopic/chat'
} 

redisClient.on('error',
    (err) => console.error(err) 
)

mqttClient.on('connect', () => {
    console.log('Connected to Chat Server');
    mqttClient.subscribe('CCTopic/#');
});

mqttClient.on('close', () => {
    console.log('Chat Server closed');
});

mqttClient.on('message', (topic, message) => {

    console.log(topic, JSON.parse(message));

    if (topic === TOPICS.USERS) {
        manageUsersMessage(message)
    } else if (topic === TOPICS.ROOMS) {
        manageRoomsMessage(message)
    } else if (topic.includes(TOPICS.CHAT) ) {
        manageChatMessage(message, topic);
    }

});

/* USER ACTIONS |-------------------------------------------------------------------*/

manageUsersMessage = (message) => {
    let msg = JSON.parse(message)

    if (msg.action === 'join') {
        redisClient.sismember('users', msg.users[0].name, (err, value) => {
            if(value) {
                rejectUser(msg.users[0]);
            } else {
                acceptUser(msg.users[0]);
            }
        });
    }
    if (msg.action === 'accept') {
        addUser(msg.users[0]);
        updateRooms();
    }
    if (msg.action === 'leave') {
        removeUser(msg.users[0]);
    }
}

rejectUser = (user) => {
    mqttClient.publish(TOPICS.USERS, JSON.stringify({ action: 'reject', users : [user] }))
}

acceptUser = (user) => {
    mqttClient.publish(TOPICS.USERS, JSON.stringify({ action: 'accept', users : [user] }))
}

addUser = (user) => {
    redisClient.sadd('users', user.name, () => {
        updateUsers();
    });
}

removeUser = (user) => {
    if (user) {
        redisClient.srem('users', user.name, () => {
            updateUsers();
        });
        redisClient.smembers('rooms', (err, rooms) => {
            rooms.forEach(room => {
                redisClient.smembers('room:users:' + room, (err, users) => {
                    if (users.indexOf(user.name) != -1) {
                        redisClient.srem('room:users:' + room, user.name, () => {
                           updateRooms();
                        });
                    }
                })
            })
        })
    }
}

updateUsers = () => {
    redisClient.smembers('users', (err, users) => {
        if(users){
            let userArray = [];
            users.forEach(name => userArray.push({name:name}));
            mqttClient.publish(TOPICS.USERS, JSON.stringify({ action: 'update', users : userArray })) 
        }
    })
    
}

/* ROOMS ACTIONS -----------------------------------------------------------------*/

manageRoomsMessage = (message) => {
    let msg = JSON.parse(message);

    if (msg.action === 'create') {
        redisClient.sismember('rooms', msg.rooms[0].name, (err, value) => {
            if(value) {
                rejectRoom(msg.users[0], msg.rooms[0]);
            } else {
                acceptRoom(msg.users[0], msg.rooms[0]);
            }
        })
    } else if (msg.action === 'accept') {
        addRoom(msg.rooms[0]);
    } else if (msg.action === 'enter') {
        addUserToRoom(msg.users[0], msg.rooms[0]);
    } else if (msg.action === 'leave') {
        if (msg.users) {
            removeUserFromRoom(msg.users[0], msg.rooms[0]);
        }
    }
}

rejectRoom = (user, room) => {
    mqttClient.publish(TOPICS.ROOMS, JSON.stringify({ action: 'reject', users: [user], rooms : [room] })) 
}

acceptRoom = (user, room) => {
    mqttClient.publish(TOPICS.ROOMS, JSON.stringify({ action: 'accept', users: [user], rooms : [room] })) 
    
}

addRoom = (room) => {
    redisClient.sadd('rooms', room.name, () => {
        updateRooms();
    });
}

updateRooms = () => {
    redisClient.smembers('rooms', (err, rooms) => {
        let roomArray = [];
        
        let getRoomInfo = ( i ) => {
            if (i < rooms.length) {
                redisClient.smembers('room:users:' + rooms[i], (err, users) => {
                    let userArray = [];
                    users.forEach( name => userArray.push({ name:name }));
                    roomArray.push({ name:rooms[i], users: userArray })
                    getRoomInfo(i+1);
                }) 
            } else {
                //console.log('roomArray', roomArray);
                mqttClient.publish(TOPICS.ROOMS, JSON.stringify({ action: 'update', rooms : roomArray })) 
            }
        }
        
        getRoomInfo(0);
    })
}

addUserToRoom = (user, room) => {
    redisClient.sadd('room:users:' + room.name, user.name, () => {
        updateRooms();
    })
}

removeUserFromRoom = (user, room) => {
    redisClient.srem('room:users:' + room.name, user.name, () => {
        updateRooms();
    })
}

/* CHAT ACTIONS ------------------------------------------------------------------*/

manageChatMessage = (message, topic) => {

    let msg = JSON.parse(message);
    let room = topic.split('/').pop();

    //console.log('room', room.toString())

    console.log('message', msg);

    if (msg.action === 'send') {
        storeChatMessage(room, msg.chatMessage)
    }
}

storeChatMessage = (room, message) => {

    request.post(
        ccConfig.api.url,
        { json: 
            { 
                room: room,
                user: message.user,
                text: message.text
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('success', body);
            } else if (error) {
                console.error(error);
            }
        }
    );
}

app.get('/', (req, res) => {
    console.log("ccServer is up and running");
})

app.listen(process.env.PORT || 3000, () => {
    console.log("listening to ", process.env.PORT || 3000 )
})
