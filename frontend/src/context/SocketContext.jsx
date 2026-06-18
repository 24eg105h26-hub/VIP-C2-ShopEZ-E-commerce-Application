import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true
    });

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Set user room when user changes
  useEffect(() => {
    if (socket && user) {
      socket.emit('join', user.id);

      socket.on('notification', (data) => {
        setNotifications((prev) => [
          {
            id: Math.random().toString(),
            title: data.title,
            message: data.message,
            createdAt: new Date(),
            isRead: false
          },
          ...prev
        ]);
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
      }
    };
  }, [socket, user]);

  const clearNotifications = () => setNotifications([]);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
