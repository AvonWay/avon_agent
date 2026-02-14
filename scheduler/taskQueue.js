export class TaskQueue {
    constructor() {
        this.queue = [];
    }

    enqueue(task) {
        this.queue.push(task);
    }

    dequeue() {
        return this.queue.shift();
    }

    isEmpty() {
        return this.queue.length === 0;
    }
}
