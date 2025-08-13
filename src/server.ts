import { Server } from "http";
// import { WebSocket, WebSocketServer } from "ws";
import app from "./app";
import config from "./config";
// import prisma from "./app/lib/prisma";

// import seedSuperAdmin from "./app/seedSuperAdmin";
import { chatServices } from "./app/modules/chat/chat.services";
import { notificationServices } from "./app/modules/notifications/notification.service";
import { getAllStockMarketData, scheduleAllStockMarketData, scheduleStockMarketTrackingTime } from "./app/utils/scheduleAllData";
import trackStockMarketTime from "./app/trackStockMarketTime";

// interface ExtendedWebSocket extends WebSocket {
//   roomId?: string;
//   userId?: string;
// }

const port = config.port || 8601;

async function main() {
  const server: Server = app.listen(port, () => {
    console.log("Server is running on port ", port);
  });


  // Track Stocked market time
  // trackStockMarketTime();

  // Get All Stock Market Data When server was running
  // getAllStockMarketData()


  // const activeUsers: Map<string, boolean> = new Map();

  // Initialize WebSocket server
  // const wss = new WebSocketServer({ server });

  // wss.on("connection", (ws: ExtendedWebSocket) => {
  //   console.log("New client connected");

  //   // Handle incoming messages
  //   ws.on("message", async (data: string) => {
  //     try {
  //       const parsedData = JSON.parse(data);

  //       switch (parsedData.type) {
  //         case "joinRoom": {
  //           const { user1Id, user2Id } = parsedData;

  //           const existingUser = await chatServices.existingUser(
  //             user1Id,
  //             user2Id
  //           );
  //           if (!existingUser) {
  //             ws.send(
  //               JSON.stringify({
  //                 type: "error",
  //                 message: "User not found",
  //               })
  //             );
  //             return;
  //           }

  //           ws.userId = user1Id;
  //           activeUsers.set(user1Id, true);

  //           console.log(`User ${user1Id} is now active`);

  //           // Create or get the conversation
  //           const conversation = await chatServices.createConversationIntoDB(
  //             user1Id,
  //             user2Id
  //           );
  //           ws.roomId = conversation.id;

  //           const unreadCount = await chatServices.countUnreadMessages(
  //             user1Id,
  //             ws.roomId
  //           );

  //           const conversationWithMessages =
  //             await chatServices.getMessagesByConversationIntoDB(
  //               user1Id,
  //               user2Id
  //             );
  //           ws.send(
  //             JSON.stringify({
  //               type: "loadMessages",
  //               conversation: conversationWithMessages,
  //               unreadCount,
  //             })
  //           );
  //           break;
  //         }

  //         case "sendMessage": {
  //           const { chatroomId, senderId, receiverId, content, file } =
  //             parsedData;

  //           const message = await chatServices.createMessageIntoDB(
  //             chatroomId,
  //             senderId,
  //             receiverId,
  //             content,
  //             file
  //           );

  //           ws.send(
  //             JSON.stringify({
  //               type: "messageSent",
  //               message,
  //             })
  //           );

  //           wss.clients.forEach((client: ExtendedWebSocket) => {
  //             if (client.roomId === chatroomId && client.readyState === 1) {
  //               client.send(
  //                 JSON.stringify({
  //                   type: "receiveMessage",
  //                   message,
  //                 })
  //               );
  //             }
  //           });

  //           const unreadCount = await chatServices.countUnreadMessages(
  //             receiverId,
  //             chatroomId
  //           );

  //           wss.clients.forEach((client: ExtendedWebSocket) => {
  //             if (client.userId === receiverId && client.readyState === 1) {
  //               client.send(
  //                 JSON.stringify({
  //                   type: "unreadCount",
  //                   unreadCount,
  //                 })
  //               );
  //             }
  //           });

  //           const isReceiverActive = Array.from(wss.clients).some(
  //             (client: ExtendedWebSocket) =>
  //               client.userId === receiverId && client.readyState === 1
  //           );

  //           // if (!isReceiverActive) {
  //           //   const senderProfile = await prisma.user.findUnique({
  //           //     where: { id: senderId },
  //           //     select: { name: true },
  //           //   });

  //           //   const notificationData = {
  //           //     title: "New Message Received!",
  //           //     body: `${
  //           //       senderProfile?.name || "Someone"
  //           //     } has sent you a new message.`,
  //           //   };

  //           //   try {
  //           //     await notificationServices.sendSingleNotification({
  //           //       params: { userId: receiverId },
  //           //       senderId:{id: senderId}
  //           //       body: notificationData,
  //           //     });
  //           //   } catch (error: any) {
  //           //     console.error("Failed to send notification:", error.message);
  //           //   }
  //           // }

  //           break;
  //         }

  //         case "viewMessages": {
  //           const { chatroomId, userId } = parsedData;

  //           // Mark messages as read when the user views the chat
  //           await chatServices.markMessagesAsRead(userId, chatroomId);

  //           // Optionally, send the updated unread count after marking as read
  //           const unreadCount = await chatServices.countUnreadMessages(
  //             userId,
  //             chatroomId
  //           );
  //           ws.send(
  //             JSON.stringify({
  //               type: "unreadCount",
  //               unreadCount,
  //             })
  //           );
  //           break;
  //         }
  //         default: {
  //           console.log("Unknown message type:", parsedData.type);
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error handling WebSocket message:", error);
  //     }
  //   });

  //   // Handle WebSocket disconnect
  //   ws.on("close", () => {
  //     if (ws.userId) {
  //       activeUsers.set(ws.userId, false); // Mark the user as inactive
  //       console.log(`User ${ws.userId} is now inactive`);
  //     }
  //   });
  // });
}


// scheduleAllStockMarketData();

// Schedule Stock Market Tracking Time
// scheduleStockMarketTrackingTime();

main();
