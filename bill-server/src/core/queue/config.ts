import { Options } from "amqplib";

export const queueConfig: Options.Connect = {
    hostname: process.env.RABBITMQ_HOST || "localhost",
    port: +(process.env.RABBITMQ_PORT || 5672),
    username: process.env.RABBITMQ_USER,
    password: process.env.RABBITMQ_PASSWORD
};
