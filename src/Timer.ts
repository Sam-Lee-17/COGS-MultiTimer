import {CogsConnection} from "@clockworkdog/cogs-client";
import {CogsConnectionParams, MultiTimerPlugin} from "./MultiTimerPlugin";

const ONE_DAY = 864000;

interface TimerParams {
    getName: () => string;

    start: () => void;

    stop: () => void;

    reset: () => void;

    setDefault: (time: number) => void;

    modify: (amount: number) => void;

    getCurrentTime: () => number;

    isRunning: () => boolean;
}

export class Timer implements TimerParams {
    private readonly name: string;
    private readonly plugin: MultiTimerPlugin;
    private defaultTime: number;
    private currentTime: number;
    private intervalId?: NodeJS.Timeout;

    constructor(name: string, plugin: MultiTimerPlugin, defaultTime: number = 30) {
        this.name = name;
        this.plugin = plugin;
        this.defaultTime = defaultTime;
        this.currentTime = defaultTime;
    }

    getName(): string {
        return this.name;
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
        this.plugin.connection.sendEvent("Timer Reset", this.name);
    }

    start(): void {
        if(this.intervalId || this.defaultTime <= 0 || this.currentTime <= 0)
            return;
        this.setActive(true);
        this.plugin.connection.sendEvent("Timer Started", this.name);
    }

    stop(): void {
        if(!this.intervalId)
            return;
        this.setActive(false);
        this.plugin.connection.sendEvent("Timer Stopped", this.name);
    }

    setCurrentTime(newTime: number) {
        this.currentTime = Timer.clamp(0, ONE_DAY, newTime);
        if(this.isSelected()) {
            this.plugin.connection.setOutputPortValues({'Selected Timer Time': this.currentTime});
        }
    }

    isRunning(): boolean {
        return this.intervalId !== undefined;
    }

    isSelected(): boolean {
        return this.plugin.isSelectedTimer(this);
    }

    isActive(): boolean {
        return this.intervalId !== undefined;
    }

    setActive(active: boolean) {
        if(active) {
            if(this.intervalId)
                return;
            this.intervalId = setInterval(() => {
                this.setCurrentTime(this.currentTime - 1);
                if(this.currentTime === 0) {
                    clearInterval(this.intervalId);
                    this.intervalId = undefined;
                    this.plugin.connection.sendEvent("Timer Finished", this.name);
                    this.reset();
                }
            }, 1000);
        }
        else {
            if(!this.intervalId)
                return;
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        this.plugin.connection.setOutputPortValues({'Selected Timer Active': active});
    }

    getDefaultTime(): number {
        return this.defaultTime;
    }

    setDefault(time: number): void {
        this.defaultTime = Timer.clamp(0, ONE_DAY, time);
        if(this.defaultTime < this.currentTime && !this.isRunning())
            this.setCurrentTime(this.defaultTime);
        if(this.isSelected()) {
            this.plugin.connection.setOutputPortValues({'Selected Timer Default Time': this.defaultTime});
        }
    }
    static clamp(min: number, max: number, value: number): number {
        return Math.min(Math.max(min, value), max);
    }
}
