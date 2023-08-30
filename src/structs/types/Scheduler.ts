import { ExtendedClient } from "../ExtendedClient";

interface SchedulerProps {
    client: ExtendedClient
}

export type SchedulerType = & {
    name: string;
    run(props: SchedulerProps): void;
    wait_start: number;
    wait_run: number;
}

export class Scheduler {
    name = "default";
    run;
    wait_start = 0;
    wait_run = 0;
    constructor(options: SchedulerType) {
        this.name = options.name;
        this.run = options.run;
        this.wait_start = options.wait_start;
        this.wait_run = options.wait_run;
        Object.assign(this, options);
    }

    execute(client: ExtendedClient) {
        this.run({client});
        setTimeout(this.execute, this.wait_run);
    }
}