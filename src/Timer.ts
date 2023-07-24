import {CogsConnection} from "@clockworkdog/cogs-client";
import {CogsConnectionParams} from "./MultiTimerPlugin";

const ONE_DAY = 864000;

interface TimerParams {
    start: () => void;

    stop: () => void;

    reset: () => void;

    setDefault: (time: number) => void;

    modify: (amount: number) => void;

    getCurrentTime: () => number;

    isRunning: () => boolean;
}

export class Timer implements TimerParams {
    private readonly id: number;
    private readonly connection: CogsConnection<CogsConnectionParams>;
    private defaultTime: number;
    private currentTime: number;
    private intervalId?: NodeJS.Timeout;

    constructor(id: number, connection: CogsConnection<CogsConnectionParams>, defaultTime: number = 30) {
        this.id = id;
        this.connection = connection;
        this.defaultTime = defaultTime;
        this.currentTime = defaultTime;
        this.connection.addEventListener('updates', e => {
            const key = Object.keys(e.detail).find(k => k === `Timer ${id} Default`)
            if(key !== undefined) {
                // @ts-ignore
                this.updateListener(key, e.detail[key])
            }
        });
        this.connection.addEventListener('event', e => this.eventListener(e.detail.key, e.detail.value));
    }

    private updateListener(key: string, value: number): void {
        console.log(key)
        if(key === `Timer ${this.id} Default`) {
            this.setDefault(value);
        }
    }

    private eventListener<K extends keyof CogsConnectionParams["inputEvents"], V extends CogsConnectionParams["inputEvents"][K]>(key: K, value: V): void {
        if(key === `Set Timer ${this.id}`) {
            this.setCurrentTime(value);
        }
        else if(value === this.id) {
            switch(key) {
                case "Start Timer": this.start(); break;
                case "Stop Timer": this.stop(); break;
                case "Reset Timer": this.reset(); break;
            }
        }
    }

    getCurrentTime(): number {
        return this.currentTime;
    }

    modify(amount: number): void {
        this.setCurrentTime(this.currentTime + amount);
    }

    reset(): void {
        if(this.intervalId)
            this.stop();
        this.setCurrentTime(this.defaultTime);
        this.connection.sendEvent("Timer Reset", this.id);
    }

    start(): void {
        if(this.intervalId || this.defaultTime <= 0 || this.currentTime <= 0)
            return;
        this.intervalId = setInterval(() => {
            this.setCurrentTime(this.currentTime - 1);
            // @ts-ignore
            this.connection.sendEvent(`Timer ${this.id} Hits`, this.currentTime);
            if(this.currentTime === 0) {
                clearInterval(this.intervalId);
                this.intervalId = undefined;
                this.connection.sendEvent("Timer Finished", this.id);
                this.reset();
            }
        }, 1000);
        this.connection.sendEvent("Timer Started", this.id);
    }

    stop(): void {
        if(!this.intervalId)
            return;
        clearInterval(this.intervalId);
        this.intervalId = undefined;
        this.connection.sendEvent("Timer Stopped", this.id);
    }

    setCurrentTime(newTime: number) {
        this.currentTime = Timer.clamp(0, ONE_DAY, newTime);
        this.connection.setOutputPortValues({ [`Timer ${this.id}`]: this.currentTime })
    }

    isRunning(): boolean {
        return this.intervalId !== undefined;
    }

    setDefault(time: number): void {
        this.defaultTime = Timer.clamp(0, ONE_DAY, time);
        if(this.defaultTime < this.currentTime && !this.isRunning())
            this.setCurrentTime(this.defaultTime);
    }

    getId(): number {
        return this.id;
    }

    static clamp(min: number, max: number, value: number): number {
        return Math.min(Math.max(min, value), max);
    }
}
