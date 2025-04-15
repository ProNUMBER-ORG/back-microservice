import logger from "../../core/logger";

export class BaseController {
    constructor(private readonly module: string) {}

    logError(error: Error): void {
        logger.error({ module: this.module, msg: error instanceof Error ? error.message : "Unknown error", additional: error });
        console.log(error);
    }

    logInfo(message: { msg: string; additional?: any }): void {
        logger.info({ module: this.module, ...message });
    }
}
