import amqp, { Channel } from "amqplib";
import logger from "../logger";
import { queueConfig } from "./config";

export let channel: Channel;

export type QueueMessage = {
    [key: string]: any;
};

export abstract class QueueRoute {
    route = () => {};
}
export interface IQueueRouting {
    instance: QueueRoute;
    queue: string;
}

export async function pushToQueue(queue: string, tag: string, payload: QueueMessage) {
    return channel.sendToQueue(queue, Buffer.from(JSON.stringify({ tag, ...payload })));
}

export async function runQueueDriver(routing: IQueueRouting[]): Promise<void> {
    const _connection = await amqp.connect(queueConfig);
    const _channel = await _connection.createChannel();

    channel = _channel;

    routing.forEach(({ instance, queue }) => {
        _channel.assertQueue(queue);
        instance.route();
    });

    logger.info({ module: "queue", msg: "Connection has been verified" });
}
