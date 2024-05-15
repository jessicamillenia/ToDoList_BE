export class Interval {
    private asyncFn: () => Promise<void>;
    private delayMs: number;
    private running: boolean;

    constructor(asyncFn: () => Promise<void>, delayMs: number) {
        this.asyncFn = asyncFn;
        this.delayMs = delayMs;
        this.running = false;
    }

    private async cycle(forced?: boolean): Promise<void> {
        await this.asyncFn();
        await this.delay(this.delayMs);
        if (!forced && this.running) {
            await this.cycle();
        }
    }

    public start(): void {
        if (this.running) return;
        this.running = true;
        this.cycle();
    }

    public stop(): void {
        if (this.running) {
            this.running = false;
        }
    }

    public forceExecution(): void {
        if (this.running) {
            this.cycle(true);
        }
    }

    // This function is just an arbitrary delay to be used with async/await pattern
    private delay(ms: number): Promise<number> {
        return new Promise((res) =>
            setTimeout(() => res(1), ms)
        );
    }
}

export const createInterval = (asyncFn: () => Promise<void>, delayMs: number): Interval => {
    return new Interval(asyncFn, delayMs);
};

export default Interval;
