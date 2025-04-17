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
                case QueueTags.PROCESS_TEXT:
                    await this.service.parseData(id, data);
                    break;
                default:
                    logger.warn(`Unknown tag received: ${tag}`);
            }
        } catch (error) {
            logger.error(`Error processing message ${id}:`, error);
            throw error;
        }
    }

    route = () => {
        channel.consume("bill-server", async (message) => {
            try {
                const content = message.content.toString();
                console.log(content);
                const collection = JSON.parse(content);
                for (const ctx of collection) {
                    await this.processMessage(ctx);
                }
            } catch (error) {
                logger.error("Error processing queue message:", error);
            }
            channel.ack(message);
        });
    };
}

export default new QueueRouter(BillServiceInstance);
