import { boundClass } from "autobind-decorator";
import { Request, Response } from "express";
import { BaseController } from "src/common/types/controller";
import { pushToQueue } from "src/core/queue/driver";
import { AbstractBillService, BillServiceInstance } from "./service";

@boundClass
class Controller extends BaseController {
    constructor(private readonly service: AbstractBillService) {
        super("bill");
    }

    async saveBill(req: Request, res: Response) {
        try {
            const [img] = [req.files.image].flat();
            const bill = await this.service.createBill();
            const url = await this.service.addImage(bill.id, img);

            await pushToQueue("bill-processor", "new", { id: bill.id, url });

            res.status(201).json({ id: bill.id, url });
        } catch (error) {
            this.logError(error as Error);
            res.status(500).json({ message: "Something went wrong" });
        }
    }

    async getBillStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const status = await this.service.getStatus(id);
            if (!status) {
                res.status(404).json({ message: "BILL_NOT_FOUND" });
                return;
            }
            res.status(200).json({ status });
        } catch (error) {
            this.logError(error as Error);
            res.status(500).json({ message: "Something went wrong" });
        }
    }

    async getBillData(req: Request, res: Response) {
        try {
            const result = await this.service.getBill(req.params.id);
            if (!result) {
                res.status(404).json({ message: "BILL_NOT_FOUND" });
                return;
            }
            return result;
        } catch (error) {
            this.logError(error as Error);
            res.status(500).json({ message: "Something went wrong" });
        }
    }
}

export default new Controller(BillServiceInstance);
