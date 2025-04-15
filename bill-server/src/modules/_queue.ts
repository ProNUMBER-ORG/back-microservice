import { IQueueRouting } from "../core/queue/driver";
import BillQueue from "./bill/queue";

export const QueueRouting: IQueueRouting[] = [{ instance: BillQueue, queue: "bill-server" }];
