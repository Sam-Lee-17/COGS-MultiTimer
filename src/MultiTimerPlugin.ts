import { CogsConnection } from "@clockworkdog/cogs-client";
import { Timer } from "./Timer";

export interface CogsConnectionParams {
    inputPorts: {
        "Select Timer": string;
    }
    outputPorts: {
        "Selected Timer": string;
        "Selected Timer Time": number;
        "Selected Timer Default Time": number;
        "Selected Timer Active": boolean;
    }
    inputEvents: {
        "Create Timer": string;
        "Delete Timer": string;
        "Start Timer": string;
        "Stop Timer": string;
        "Reset Timer": string;
        "Set Time": number;
        "Set Default Time": number;
    }
    outputEvents: {
        "Timer Started": string;
        "Timer Stopped": string;
        "Timer Finished": string;
        "Timer Reset": string;
    };
}

export class MultiTimerPlugin{
    connection: CogsConnection<CogsConnectionParams>;
    timers: Map<string, Timer>;
    activeTimer?: Timer;

    constructor() {
        this.connection = new CogsConnection<CogsConnectionParams>();
        this.timers = new Map<string, Timer>();
        this.connection.addEventListener('updates', event => {
            if(event.detail['Select Timer'] !== undefined) {
                this.setSelectedTimer(event.detail['Select Timer']);
            }
        });
        this.connection.addEventListener('event', ({detail: {key, value}}) => {
            let timer
            if(typeof value === 'string') {
                if(key === 'Create Timer') {
                    timer = this.createTimer(value);
                    this.setSelectedTimer(value)
                }
                else if(key === 'Delete Timer') {
                    this.deleteTimer(value);
                }
                else {
                    timer = this.getTimer(value)
                }
            }
            else if(typeof value === 'number') {
                timer = this.activeTimer;
            }
            if(!timer)
                return;
            else if(key === 'Start Timer') {
                timer.start();
            }
            else if(key === 'Stop Timer') {
                timer.stop();
            }
            else if(key === 'Reset Timer') {
                timer.reset();
            }
            else if(key === 'Set Time' && typeof value === 'number') {
                timer.setCurrentTime(value);
            }
            else if(key === 'Set Default Time' && typeof value === 'number') {
                timer.setDefault(value);
            }
        });
        this.connection.addEventListener('message', (event) => {
            if(event.detail.type === "show_reset") {
                this.reset();
            }
        });
    }
    
    private createTimer(name: string) {
        if(name in this.timers.keys()) {
            return this.timers.get(name);
        }
        const timer = new Timer(name, this);
        this.timers.set(name, timer);
        return timer;
    }

    private deleteTimer(name: string): void {
        let timer = this.timers.get(name);
        if(timer?.isSelected()) {
            this.activeTimer = Array.from(this.timers)[0][1];
            timer?.reset();
        }
        this.timers.delete(name);
    }

    private setSelectedTimer(name: string): void {
        if(this.timers.has(name)) {
            this.activeTimer = this.timers.get(name)
            this.connection.setOutputPortValues({
                'Selected Timer': this.activeTimer?.getName() ?? "None",
                'Selected Timer Time': this.activeTimer?.getCurrentTime() ?? 0,
                'Selected Timer Default Time': this.activeTimer?.getDefaultTime() ?? 0,
                'Selected Timer Active': this.activeTimer?.isActive() ?? false
            });
        }
    }

    isSelectedTimer(timer: Timer): boolean {
        return this.activeTimer === timer;
    }

    getTimer(timer?: string): Timer | undefined {
        if(timer) {
            let retTimer = this.timers.get(timer)
            if(retTimer)
                return retTimer;
        }
        return this.activeTimer;
    }

    private reset(): void {
        this.timers.forEach((timer, _) => timer.reset());
    }
}