import { createContext, useContext } from "react";
import { io, Socket } from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL, {
    path: '/ws/socket.io',
    transports: ['websocket'],
    secure: true
})

export const socketContext = createContext<Socket>(socket);

export const useSocketContext = () => {
    const context = useContext(socketContext);
    if (!context) {
        throw new Error("usesSocketContext must be used within a socketProvider");
    }

    return context;
}