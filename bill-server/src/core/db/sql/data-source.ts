import "reflect-metadata";

import { DataSource } from "typeorm";
import entities from "../../../entities/_index";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST,
    port: 5432,
    username: process.env.POSTGRES_USER || "root",
    password: process.env.POSTGRES_PASS || "root",
    database: process.env.POSTGRES_DB,
    synchronize: true,
    logging: false,
    entities,
    subscribers: [],
    migrations: [],
    migrationsTableName: "migrations-metadata"
});
