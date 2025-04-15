import { Options } from "amqplib";

export const queueConfig: Options.Connect = {
    hostname: process.env.RABBIT_HOST || "localhost",
    port: +(process.env.RABBIT_PORT || 5672),
    username: process.env.RABBIT_USER,
    password: process.env.RABBIT_PASS
};
