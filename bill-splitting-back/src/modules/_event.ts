import { Socket } from "socket.io";

export const onConnection = (socket: Socket) => {
    socket.emit("connection", { message: "Ping" });
};
