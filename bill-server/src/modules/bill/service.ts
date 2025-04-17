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

    private cleanJsonString(text: string): string {
        const startIndex = text.indexOf("[");
        const endIndex = text.lastIndexOf("]");
        if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return "";

        return text
            .substring(startIndex, endIndex + 1)
            .replace(/[`\x27]/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'");
    }

    async parseData(id: string, payload: { status: BillStatus; additional: string }) {
        const { status, additional } = payload;

        console.log("RAW ADDITIONAL:", additional);

        const response = await gigaChatApi.parseReceipt(additional);
        if (typeof response != "string" && response?.error) await this.updateBill(id, { status: BillStatus.Error, error: response.error });
        else {
            const rawText = typeof response != "string" ? response?.text : response;
            const extracted = this.cleanJsonString(rawText);

            console.log("rawText:", rawText);
            console.log("extracted:", extracted);

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
