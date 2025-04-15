import { AppDataSource } from "src/core/db/sql/data-source";
import { Ping } from "./entity";

export const PingRepository = AppDataSource.getRepository(Ping);
