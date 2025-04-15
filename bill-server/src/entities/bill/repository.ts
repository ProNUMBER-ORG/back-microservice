import { AppDataSource } from "../../core/db/sql/data-source";
import { Bill } from "./entity";

export const BillRepository = AppDataSource.getRepository(Bill);
