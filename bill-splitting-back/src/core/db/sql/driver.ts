import "reflect-metadata";

import logger from "../../logger";
import { AppDataSource } from "./data-source";

export async function runSqlDriver(): Promise<void> {
    await AppDataSource.initialize();
    logger.info({ module: "sql", msg: "Connection has been verified" });
}
