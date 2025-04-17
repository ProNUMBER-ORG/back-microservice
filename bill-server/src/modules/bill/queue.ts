import { QueueTags } from "../../common/enums/queue-tags";
import logger from "../../core/logger";
import { channel } from "../../core/queue/driver";
import { AbstractBillService, BillServiceInstance } from "./service";

class QueueRouter {
    constructor(private readonly service: AbstractBillService) {}

    private async processMessage(ctx: any) {
        const { tag, id, ...data } = ctx;

        try {
            switch (tag) {
                case QueueTags.UPDATE_BILL:
                    await this.service.updateBill(id, data);
                    break;
                // case QueueTags.PROCESS_TEXT:
                //     await this.service.parseData(id, data);
                //     break;
                default:
                    throw new Error(JSON.stringify(ctx));
                // logger.warn(`Unknown tag received: ${tag}`);
            }
        } catch (error) {
            logger.error(`Error processing message ${id}:`, error);
            throw error;
        }
    }

    route = () => {
        channel.consume("bill-server", async (message) => {
            const content = message.content.toString();
            try {
                const collection = JSON.parse(content);
                for (const ctx of collection) {
                    await this.processMessage(ctx);
                }
                channel.ack(message);
            } catch (error) {
                channel.nack(message);
                logger.error({ module: "queue-parser", msg: "Error processing queue message:" + error, additional: content });
            }
        });
    };
}

export default new QueueRouter(BillServiceInstance);
