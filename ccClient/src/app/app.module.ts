import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgxMqttClientModule } from './ngx-mqtt-client';
import { MatButtonModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
library.add(fas, far);

/*
var getMyUser = ():any =>  {
    let user = sessionStorage.getItem('ccUser');
    if(user){
        return { action: 'leave', users: [ { user: user } ] };
    } else {
        return { action: 'void' }
    }
}
*/

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        MatButtonModule,
        FormsModule,
        HttpClientModule,
        FontAwesomeModule,
        NgxMqttClientModule.withOptions({
            host: 'broker.hivemq.com',
            protocol: 'ws',
            port: 8000,
            path: '/mqtt',
            keepalive: 30
        })
        /*
        NgxMqttClientModule.withOptions({
            host: 'broker.hivemq.com',
            protocol: 'ws',
            port: 8000,
            path: '/mqtt',
            keepalive: 30,
            */
            /*  
            will: {
                topic: 'CCTopic/users',
                payload: getMyUser(),
                qos: 1,
                retain: true
            }
            */
        //})
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
