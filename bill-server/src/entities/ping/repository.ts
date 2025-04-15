import { AppDataSource } from "../../core/db/sql/data-source";
import { Ping } from "./entity";

export const PingRepository = AppDataSource.getRepository(Ping);
