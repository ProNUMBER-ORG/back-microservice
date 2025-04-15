import cors from "cors";
import express, { Router } from "express";
import fileUpload from "express-fileupload";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import SwaggerUI from "swagger-ui-express";
import logger from "./logger";
import swaggerDocument from "./swagger";

let io: Server;

export type IRouter = {
    instance: Router;
    prefix: string;
};

interface IMessage {
    to?: string | string[];
    event: string;
    payload: any;
}

export async function socketSend(msg: IMessage) {
    if (msg?.to) io.to(msg.to).emit(msg.event, msg.payload);
    else io.emit(msg.event, msg.payload);
}

const SIZE = 5 * 1024 * 1024; // 5MB

export async function runHttpServer(routes: IRouter[], socketInitter: (socket: Socket) => void): Promise<void> {
    const app = express();
    const port = +(process.env.APP_PORT || 5000);

    app.use(cors({ origin: true, credentials: true }));
    app.use(
        fileUpload({
            defCharset: "utf8",
            defParamCharset: "utf8",
            limits: { files: 10, fileSize: SIZE },
            abortOnLimit: true
        })
    );
    app.use(express.static("data"));

    routes.forEach(({ prefix, instance }) => app.use(prefix, instance));
    app.use("/docs", SwaggerUI.serve, SwaggerUI.setup(swaggerDocument));

    const httpServer = createServer(app);
    io = new Server(httpServer, {
        cors: { origin: "*" }
    });

    httpServer.listen(port, () => logger.info({ module: "SERVER", msg: `Starts on port: ${port}` }));
    io.on("connect", socketInitter);
    logger.info({ module: "server", msg: "is fully bootstrapped" });
}
