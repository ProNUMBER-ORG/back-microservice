import "reflect-metadata";

import path from "path";
import { runCron } from "./core/cron";
import { runSqlDriver } from "./core/db/sql/driver";
import { runHttpServer } from "./core/http";
import logger from "./core/logger";
import { runQueueDriver } from "./core/queue/driver";
import { CronSchedule } from "./modules/_cron";
import { onConnection as connectionHandler } from "./modules/_event";
import { QueueRouting } from "./modules/_queue";
import { HttpRouting } from "./modules/_routes";

process.env.NODE_EXTRA_CA_CERTS = path.resolve(__dirname, "certs");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

void (async function () {
    await runSqlDriver();
    await runQueueDriver(QueueRouting);
    await runCron(CronSchedule);
    await runHttpServer(HttpRouting, connectionHandler);
})().catch((error) => {
    logger.error({ module: "server", msg: error.message, additional: error });
    console.log(error);
    process.exit(1);
});
