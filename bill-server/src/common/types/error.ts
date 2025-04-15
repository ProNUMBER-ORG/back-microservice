import { HandlingErrorType } from "../enums/errors";

export interface IHandlingResponseError {
    property: string;
    type: HandlingErrorType;
    message?: string;
}
