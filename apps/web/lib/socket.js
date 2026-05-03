import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

// Create one single socket instance for the whole app
// "withCredentials: true" sends the JWT cookie with the connection
// so the server can authenticate the socket
const socket = io(SOCKET_URL, {
  withCredentials: true,

  // Don't connect automatically on import
  // We connect manually when the user is confirmed logged in
  autoConnect: false,
});

// Log connection status in development
socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

socket.on("connect_error", (err) => {
  console.log("Socket connection error:", err.message);
});

export default socket;
