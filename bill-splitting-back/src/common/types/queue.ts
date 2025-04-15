import { BillStatus } from "../enums/bill-status";

export interface UpdateBill {
    status: BillStatus;
    additional?: any;
    error?: any;
}
