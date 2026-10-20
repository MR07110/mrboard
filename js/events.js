// js/events.js - Event Bus (Pub/Sub)

class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    emit(event, data) {
        const set = this.listeners.get(event);
        if (set) {
            set.forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`[EventBus] Error in handler for "${event}":`, err);
                }
            });
        }
    }

    off(event, callback) {
        const set = this.listeners.get(event);
        if (set) {
            set.delete(callback);
            if (set.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    clear() {
        this.listeners.clear();
    }
}

export const Events = new EventEmitter();
export default Events;
