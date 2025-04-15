import { IRouter } from "../core/http";
import billRouter from "./bill/router";

export const HttpRouting: IRouter[] = [{ instance: billRouter, prefix: "/bill" }];
