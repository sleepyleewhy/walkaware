import React, {  ReactNode, useEffect } from "react";
import { socket, socketContext } from "./socketContext";



type SocketProviderProps = {
    children: ReactNode;
};

const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {

    useEffect(() => {
        socket.on("connect_error", (err) => {
            console.error("Connection error: ", err.message);
    
        });
        socket.on('connect', () => {
            console.log('Connected to server');
        });
        socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
    }, [])
   
    return (
        <>
        
        <socketContext.Provider value={socket}>
            {children}
        </socketContext.Provider>
        </>
    );
};

export default SocketProvider;
