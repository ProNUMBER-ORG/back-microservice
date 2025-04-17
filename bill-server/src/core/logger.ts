import winston from "winston";
const { combine, timestamp, printf } = winston.format;

export interface IMessage {
    module: string;
    msg: string;
    additional?: any;
}

function isMessage(message: string | IMessage): message is IMessage {
    return typeof message !== "string" && "module" in message && "msg" in message;
}

type Log = {
    level: string;
    timestamp: string;
    message: IMessage | string;
};

const logFormat = printf((info) => {
    const { level, timestamp, message } = info as Log;
    let logMessage = "";

    if (message && isMessage(message)) {
        const { module, msg, additional } = message;
        logMessage = `${module.toUpperCase()} | ${msg}`;

        if (additional) logMessage += `| Additional: ${JSON.stringify(additional, null, 2)}`;
    } else logMessage = message as string;

    return `${timestamp} | ${level.toLowerCase()} | ${logMessage}`;
});

const logger = winston.createLogger({
    levels: { error: 0, warn: 1, info: 2 },
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat)),
    transports: [new winston.transports.Console()]
});

export default logger;
