import { UploadedFile } from "express-fileupload";
import { BillStatus } from "../../common/enums/bill-status";
import { UpdateBill } from "../../common/types/queue";
import { socketSend } from "../../core/http";
import { Bill } from "../../entities/bill/entity";
import { BillRepository } from "../../entities/bill/repository";

export abstract class AbstractBillService {
    async createBill(): Promise<Bill> {
        const bill = new Bill();
        await BillRepository.save(bill);
        return bill;
    }

    async addImage(billId: string, image: UploadedFile): Promise<string | boolean> {
        const billFindStatus = await BillRepository.findOneBy({ id: billId });
        if (!billFindStatus) return false;
        const dir = `/${billId}.${image.name.split(".").at(-1)}`;
        const url = `${process.env.APP_DOMAIN}${dir}`;

        billFindStatus.link = dir;
        await BillRepository.save(billFindStatus);
        image.mv(`./data${dir}`, (error) => {
            if (error) {
                console.log(error.message);
            }
        });

        return url;
    }

    async getStatus(billId: string): Promise<BillStatus | boolean> {
        const billFindStatus = await BillRepository.findOneBy({ id: billId });
        if (!billFindStatus) return false;

        return billFindStatus.status;
    }

    async updateBill(id: string, payload: UpdateBill) {
        const { status, ...data } = payload;

        const billFindStatus = await BillRepository.findOneBy({ id });
        if (!billFindStatus) return;

        billFindStatus.status = status;
        if (data?.additional) billFindStatus.additional = data.additional;
        if (data?.error) billFindStatus.error = data.error;

        await BillRepository.save(billFindStatus);
        socketSend({ to: id, event: "bill", payload: { status } });
    }

    async getBill(billId: string): Promise<Bill | boolean> {
        const billFindStatus = await BillRepository.findOneBy({ id: billId });
        if (!billFindStatus) return false;

        return billFindStatus;
    }

    async parseData(id: string, payload: any) {
        const { status, ...data } = payload;
        console.log(data.additional);
        console.log(status);
    }
}

class Service extends AbstractBillService {}
export const BillServiceInstance = new Service();
