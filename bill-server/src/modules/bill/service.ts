import { UploadedFile } from "express-fileupload";
import { BillStatus } from "../../common/enums/bill-status";
import { UpdateBill } from "../../common/types/queue";
import { socketSend } from "../../core/http";
import { Bill } from "../../entities/bill/entity";
import { BillRepository } from "../../entities/bill/repository";
import gigaChatApi from "../../external/sber-api";

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
        const url = `${process.env.APP_DOMAIN}/images${dir}`;

        billFindStatus.link = `/images${dir}`;
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

    private extractJsonBlock(text: string): string | null {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        return match ? match[1].trim() : null;
    }

    async parseData(id: string, payload: { status: BillStatus; additional: string }) {
        const { status, additional } = payload;

        console.log("RAW ADDITIONAL:", additional);

        const response = await gigaChatApi.parseReceipt(additional);
        if (response?.error) await this.updateBill(id, { status: BillStatus.Error, error: response.error });
        else {
            const rawText = response?.text ?? response;
            const extracted = this.extractJsonBlock(rawText);

            if (!extracted) {
                await this.updateBill(id, {
                    status: BillStatus.Error,
                    error: { message: "Cannot parse response", response }
                });
                return;
            }

            let parsed: any;
            try {
                parsed = JSON.parse(extracted);
            } catch (err) {
                await this.updateBill(id, {
                    status: BillStatus.Error,
                    error: `Ошибка парсинга JSON: ${(err as Error).message}`
                });
                return;
            }

            await this.updateBill(id, { status, additional: parsed });
        }
    }
}

class Service extends AbstractBillService {}
export const BillServiceInstance = new Service();
