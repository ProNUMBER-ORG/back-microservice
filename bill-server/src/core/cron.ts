import { CronJob } from "cron";
import logger from "./logger";

export type Cron = {
    time: string;
    job: () => void;
};

export async function runCron(jobs: Cron[]): Promise<void> {
    jobs.forEach(({ time, job }) => new CronJob(time, job).start());
    logger.info({ module: "cron", msg: "Cron successfully registered" });
}
