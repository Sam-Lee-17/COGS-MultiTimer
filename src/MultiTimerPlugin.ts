import { CogsConnection } from "@clockworkdog/cogs-client";
import { TypedEventTarget } from 'typescript-event-target';
import {Timer} from "./Timer";
import {type} from "os";

export interface CogsConnectionParams {
    inputPorts: {
        "Timer 1 Default": number;
        "Timer 2 Default": number;
        "Timer 3 Default": number;
        "Timer 4 Default": number;
    }
    outputPorts: {
        "Timer 1": number;
        "Timer 2": number;
        "Timer 3": number;
        "Timer 4": number;
    }
    inputEvents: {
        "Start Timer": number;
        "Stop Timer": number;
        "Reset Timer": number;
        "Set Timer 1": number;
        "Set Timer 2": number;
        "Set Timer 3": number;
        "Set Timer 4": number;
    }
    outputEvents: {
        "Timer Started": number;
        "Timer Stopped": number;
        "Timer Finished": number;
        "Timer Reset": number;
        "Timer 1 Hits": number;
        "Timer 2 Hits": number;
        "Timer 3 Hits": number;
        "Timer 4 Hits": number;
    };
}

export class MultiTimerPlugin{
    connection: CogsConnection<CogsConnectionParams>;
    timer1: Timer;
    timer2: Timer;
    timer3: Timer;
    timer4: Timer;

    constructor() {
        this.connection = new CogsConnection<CogsConnectionParams>();
        this.timer1 = new Timer(1, this.connection);
        this.timer2 = new Timer(2, this.connection);
        this.timer3 = new Timer(3, this.connection);
        this.timer4 = new Timer(4, this.connection);
        this.connection.addEventListener('event', (event) => {
        //     const { key, value } = event.detail;
        //     let timer: Timer | null = null;
        //     if(/\d/.test(key)) {
        //         switch (key) {
        //             case "Set Timer 1": timer = this.timer1; break;
        //             case "Set Timer 2": timer = this.timer2; break;
        //             case "Set Timer 3": timer = this.timer3; break;
        //             case "Set Timer 4": timer = this.timer4; break;
        //         }
        //     }
        //     else {
        //         switch (value.toString()) {
        //             case "1": timer = this.timer1; break;
        //             case "2": timer = this.timer1; break;
        //             case "3": timer = this.timer1; break;
        //             case "4": timer = this.timer1; break;
        //         }
        //     }
        //     if(!timer)
        //         return;
        //     if(key === "Start Timer") {
        //         timer.start();
        //     }
        //     else if(key === "Stop Timer") {
        //         timer.stop();
        //     }
        //     else if(key === "Reset Timer") {
        //         timer.reset();
        //     }
        //     else if(key === `Set Timer ${timer.getId()}`) {
        //         timer.setCurrentTime(value);
        //     }
         });
        this.connection.addEventListener('message', (event) => {
            if(event.detail.type === "show_reset") {
                this.reset();
            }
        });
    }

    private reset(): void {
        this.timer1.reset();
        this.timer2.reset();
        this.timer3.reset();
        this.timer4.reset();
    }
}