import { PrismaClient } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { fileUploader } from "../../middlewares/multerFileUpload";


const prisma = new PrismaClient();

const createConversationIntoDB = async (user1Id: string, user2Id: string) => {
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    },
  });

  if (existingConversation) {
    return existingConversation;
  }

  if (user1Id === user2Id) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You cannot create a conversation with yourself"
    );
  }

  ///only customer and admin can create a conversation

  const user1 = await prisma.user.findUnique({
    where: { id: user1Id },
    select: { role: true },
  });

  const user2 = await prisma.user.findUnique({
    where: { id: user2Id },
    select: { role: true },
  });



  const result = await prisma.conversation.create({
    data: {
      user1Id,
      user2Id,
    },
  });
  return result;
};

const getConversationsByUserIdIntoDB = async (userId: string) => {
  const result = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: true,
      user2: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  return result;
};

// Get messages for a specific conversation between two users
const getMessagesByConversationIntoDB = async (
  user1Id: string,
  user2Id: string
) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return conversation || [];
};

// Create a message in a specific conversation
const createMessageIntoDB = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
  file: any
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Create a message in the existing conversation
  const result = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      receiverId,
      content,
      file,
    },
  });

  return result;
};
const getChatUsersForUser = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: true,
      user2: true,
      messages: {
        orderBy: { createdAt: "desc" }, // Get the most recent message
        take: 1, // Only return the latest message
      },
    },
  });

  // Extract the unique list of users the user is chatting with and their last message
  const chatUsersData = conversations.map((conversation) => {
    const chatUser =
      conversation.user1Id === userId ? conversation.user2 : conversation.user1;
    const lastMessage = conversation.messages[0]; // The most recent message
    return {
      chatUser,
      lastMessage, // Include the latest message
    };
  });

  return chatUsersData;
};

const deleteConversation = async (id: string) => {
  // Start a transaction
  return await prisma.$transaction(async (prisma) => {
    // Check if the conversation exists
    const isConversationExist = await prisma.conversation.findUnique({
      where: { id },
      include: { messages: true }, // Include messages in the conversation
    });

    if (!isConversationExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
    }

    // First, delete all related messages
    await prisma.message.deleteMany({
      where: { conversationId: id },
    });

    // Then, delete the conversation
    const result = await prisma.conversation.delete({
      where: { id },
    });

    if (!result) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Could not delete conversation"
      );
    }

    return result;
  });
};




const countUnreadMessages = async (userId: string, chatroomId: string) => {
  const unreadCount = await prisma.message.count({
    where: {
      conversationId: chatroomId,
      receiverId: userId,
      isRead: false, // Only count unread messages
    },
  });

  return unreadCount;
};
const markMessagesAsRead = async (userId: string, chatroomId: string) => {
  await prisma.message.updateMany({
    where: {
      receiverId: userId,
      conversationId: chatroomId,
      isRead: false, // Only update unread messages
    },
    data: {
      isRead: true,
    },
  });
};

const getMyChat = async (userId: string) => {
  const result = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const chatList = await Promise.all(
    result.map(async (conversation) => {
      const lastMessage = conversation.messages[0];
      const targetUserId =
        conversation.user1Id === userId
          ? conversation.user2Id
          : conversation.user1Id;

      const targetUserProfile = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
        },
      });

      return {
        conversationId: conversation.id,
        user: targetUserProfile || null,
        lastMessage: lastMessage && lastMessage.content?.length
          ? lastMessage.content
          : lastMessage && lastMessage.file
            ? "See Attachment"
            : null,
        lastMessageDate: lastMessage ? lastMessage.createdAt : null,
      };
    })
  );

  return chatList;
};

const existingUser = async (user1Id: string, user2Id: string) => {
  const users = await prisma.user.findMany({
    where: {
      id: { in: [user1Id, user2Id] },
    },
  });

  return users.length === 2;
};



const sendFileMessage = async (userId: string, payload: any, file: any) => {

  const imageURL = file && file.originalname
    ? `${payload.protocol}://${payload.host}/uploads/${file.filename}`
    : ""

  return imageURL;
};



export const chatServices = {
  createConversationIntoDB,
  getConversationsByUserIdIntoDB,
  getMessagesByConversationIntoDB,
  createMessageIntoDB,
  getChatUsersForUser,
  deleteConversation,
  countUnreadMessages,
  markMessagesAsRead,
  getMyChat,
  existingUser,
  sendFileMessage
};
