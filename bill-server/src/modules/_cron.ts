import { Cron } from "../core/cron";
import GigaChatApi from "../external/sber-api";

export const CronSchedule: Cron[] = [{ time: "* * * * *", job: GigaChatApi.auth }];
