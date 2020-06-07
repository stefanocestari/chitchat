import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MqttService, SubscriptionGrant } from './ngx-mqtt-client';
import { HttpClient } from '@angular/common/http';


export interface CCUser {
    name: string;
}

export interface CCRoom {
    name: string;
    users: CCUser[];
}

export interface CCChatMessage{
    user: CCUser;
    text: string;
    createdAt: string;
}

export interface CCUserAction {
    action: string,
    users: CCUser[],
}

export interface CCRoomAction {
    action: string,
    users: CCUser[],
    rooms: CCRoom[]
}

export interface CCChatAction {
    action: string;
    chatMessage: CCChatMessage;
}

const TOPICS = {
    USERS : 'CCTopic/users',
    ROOMS : 'CCTopic/rooms',
    CHAT :  'CCTopic/chat'
} 

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
    /*
    @HostListener('window:beforeunload', ['$event'])
    beforeunloadHandler(event) {
        if(this.loggedUser){
            this.logout();
        }
        this.mqttService.end();
    }
    */
   @ViewChild("endPage") endPage: ElementRef;

    status: string[] = [];
    users: CCUser[];
    rooms: CCRoom[];
    messages: CCChatMessage[];

    userName:string = '';
    roomName:string = '';
    chatMessage:string = '';

    loggedUser: CCUser;
    currentRoom: CCRoom;
    loginError;

    showRoomUsers = false;
    menuOpen = true;

    constructor(
        private mqttService: MqttService,
        private httpClient: HttpClient
        ) {

        /*
        this.mqttService.status().subscribe((s: ConnectionStatus) => {
            const status = s === ConnectionStatus.CONNECTED ? 'CONNECTED' : 'DISCONNECTED';
            this.status.push(`Mqtt client connection status: ${status}`);
        });
        */
    }

    join():void {
        this.loginError = '';
        this.initUserManager();
    }

    /* USER ACTIONS -------------------------------------------*/

    initUserManager = () => {
        if (this.userName) {
            let user = { name: this.userName };

            this.mqttService.connect({
                host: 'broker.hivemq.com',
                protocol: 'ws',
                port: 8000,
                path: '/mqtt',
                keepalive: 30,
                resubscribe:true,
                will: {
                    topic: 'CCTopic/users',
                    payload: JSON.stringify({ action: 'leave', users: [user] }),
                    qos: 1,
                    retain:true
                }
            })
            
            this.mqttService.subscribeTo<CCUserAction>(TOPICS.USERS).subscribe(
                msg => {
                    console.log('msg', msg);
                    if (msg instanceof SubscriptionGrant) {
                        console.log('subscriptionGrant')
                        this.mqttService.publishTo<CCUserAction>( 
                            TOPICS.USERS, {action: 'join', users:[user]}
                            ).subscribe( 
                                join => { this.initRoomManager()})

                    } else {
                        console.log('otherMessage', msg)
                        this.manageClientUserAction(msg);
                    }
                }
            )
        }
    }

    manageClientUserAction = (msg:CCUserAction) => {
        
        console.log('manageClientUserAction for msg', msg);

        if (msg.action == 'reject' && msg.users[0].name == this.userName) {
            this.mqttService.unsubscribeFrom(TOPICS.USERS).subscribe(
                unsub => {
                    this.loginError = this.userName + ' is already taken, please pick another.';
                })
        } else if (msg.action == 'update') {
            this.users = msg.users;
        } else if ( msg.action == 'accept' && msg.users[0].name !== this.userName) {
            this.status.push(msg.users[0].name + ' joined the server')
        } else if (msg.action == 'accept' && msg.users[0].name == this.userName) {     
            this.loggedUser = { name : this.userName };
            sessionStorage.setItem('ccUser',this.userName );
            this.userName = '';
        }
    }

    logout() {
        window.location.reload();
    }

    /* ROOM ACTIONS -------------------------------------------*/

    initRoomManager = () => {
        this.mqttService.subscribeTo<CCRoomAction>(TOPICS.ROOMS).subscribe(
            msg => this.manageClientRoomAction(msg as CCRoomAction)
        )
    }

    manageClientRoomAction = (msg:CCRoomAction) => {
        console.log('msg', msg);

        if (msg.action === 'reject') {

            this.status.push(this.roomName + ' already exists, please pick another name for the room');
        } else if (msg.action === 'accept' && msg.users[0].name == this.loggedUser.name) {

            this.moveToRoom( msg.rooms[0] );

        } else if(msg.action === 'update') {

            this.rooms = msg.rooms;
            
            if(this.currentRoom ){
                this.currentRoom = msg.rooms.find(r => this.currentRoom.name == r.name);
            }

        } else if (msg.action === 'enter') {

            if ( msg.users[0].name === this.loggedUser.name ) {
                this.initChatManager(msg.rooms[0]);
            } else if (this.currentRoom && msg.rooms[0].name === this.currentRoom.name ) {
                this.status.push('User ' + msg.users[0].name + ' just entered the room ' + msg.rooms[0].name)
            }

        } else if (msg.action === 'leave') {

            if ( msg.users[0].name === this.loggedUser.name ) {
                this.killChatManager(msg.rooms[0]);
            } else if (this.currentRoom && msg.rooms[0].name === this.currentRoom.name ) {
                this.status.push('User ' + msg.users[0].name + ' just entered the room ' + msg.rooms[0].name)
            }

        }

        
    } 

    createRoom = () :void => {
        if (this.roomName) {
            this.mqttService.publishTo<CCRoomAction>( 
                TOPICS.ROOMS, {action: 'create', users: [this.loggedUser], rooms: [{ name: this.roomName, users: [] }]}
            ).subscribe();
            this.roomName = '';
        }
    }

    moveToRoom = (room: CCRoom) :void => {
        if(this.loggedUser){
            this.menuOpen = false;
        }
        if(this.currentRoom) {
            this.leaveRoom(this.currentRoom);
        } 
        this.enterRoom(room);
    }

    enterRoom = (room: CCRoom) :void => {
        this.mqttService.publishTo<CCRoomAction>( 
            TOPICS.ROOMS, {action: 'enter', users: [this.loggedUser], rooms: [ room ]}
        ).subscribe()
    }

    leaveRoom = (room: CCRoom) :void => {
        this.menuOpen = true;
        this.mqttService.publishTo<CCRoomAction>( 
            TOPICS.ROOMS, {action: 'leave', users: [this.loggedUser], rooms: [ room ]}
        ).subscribe()
    }

    /* CHAT ACTIONS ------------------------------------------------------------------*/

    initChatManager = (room:CCRoom) => {
        let wl = window.location;
        this.currentRoom = room;
        this.showRoomUsers = true;
        this.messages = [];
        this.httpClient.get(
           wl.protocol + '//' + wl.hostname + ':8080/api/chatmessages?room=' + room.name,
        ).subscribe(
            messages => {
                this.messages = messages as CCChatMessage[];
                setTimeout( this.scrollMessageIntoView ,0);
                console.log('init chat manager for room', room.name)
                this.mqttService.subscribeTo<CCChatAction>( TOPICS.CHAT + '/' + room.name ).subscribe(
                    msg => {
                        console.log('recieving chat message ', msg)
                        this.manageClientChatAction(msg as CCChatAction)
                    }
                )
            }
        )
    }

    killChatManager = (room:CCRoom) => {
        this.currentRoom = undefined;
        this.showRoomUsers = false;
        this.mqttService.unsubscribeFrom(TOPICS.CHAT + '/' + room.name).subscribe();
    }

    manageClientChatAction = (msg:CCChatAction) => {
        console.log ('manageClientChatAction msg', msg);
        if (msg.action == 'send') {
            this.messages.push(msg.chatMessage);
            setTimeout( this.scrollMessageIntoView ,0);
        }

    }

    sendChatMessage = (room: CCRoom, text: string) => {
        
        if (this.chatMessage) {

            this.mqttService.publishTo<CCChatAction>(
                TOPICS.CHAT + '/' + room.name,
                {
                    action: 'send',
                    chatMessage: {
                        user: this.loggedUser,
                        text: text,
                        createdAt: new Date().toISOString()
                    }
                }
            ).subscribe()
            this.chatMessage = '';
        }

    }

    /*- CLEANUP ----------------------------------------------------------------------*/

    ngOnDestroy(): void {
        this.mqttService.end(); 
    }

    /*- UTILS --------------------------------------------------------------------------*/

    scrollMessageIntoView = () => {
            this.endPage.nativeElement.scrollIntoView({ behavior: "smooth", block: "end" })
    }
    
    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

}
