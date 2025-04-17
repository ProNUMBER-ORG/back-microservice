import { Socket } from "socket.io";

export const onConnection = (socket: Socket) => {
    socket.on("join-bill-room", (billId) => {
        socket.join(billId);
    });
};
