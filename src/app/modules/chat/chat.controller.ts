import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { chatServices } from './chat.services';

import sendResponse from '../../helpers/sendResponse';
import catchAsync from '../../helpers/catchAsync';


const createConversation = catchAsync(async (req: Request, res: Response) => {
  const { user1Id, user2Id } = req.body;
  const result = await chatServices.createConversationIntoDB(user1Id, user2Id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Conversation created successfully",
    data: result,
  });
});

const getConversationByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const { user1Id, user2Id } = req.query;
    const result = await chatServices.getMessagesByConversationIntoDB(
      user1Id as string,
      user2Id as string
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Chatroom messages retrieved successfully",
      data: result,
    });
  }
);

// Get a single chatroom (conversation) by conversation ID
const getSingleMassageConversation = catchAsync(
  async (req: Request, res: Response) => {
    const id1 = req.params.id1;
    const id2 = req.params.id2;
    const result = await chatServices.getMessagesByConversationIntoDB(id1, id2);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Chatroom retrieved successfully",
      data: result,
    });
  }
);

// Send a message in a specific conversation (chatroom)
const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, senderId, senderName, content, file } = req.body;
  const result = await chatServices.createMessageIntoDB(
    conversationId,
    senderId,
    senderName,
    content,
    file
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message sent successfully",
    data: result,
  });
});

// Get all messages in a specific chatroom (conversation)
const getMessages = catchAsync(async (req: Request, res: Response) => {
  const { user1Id, user2Id } = req.query;
  const result = await chatServices.getMessagesByConversationIntoDB(
    user1Id as string,
    user2Id as string
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Messages retrieved successfully",
    data: result,
  });
});
const getUserChat = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await chatServices.getChatUsersForUser(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "chat users retrieved successfully",
    data: result,
  });
});

// Delete a specific message in a specific chatroom (conversation)
const deleteConversion = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await chatServices.deleteConversation(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "conversation deleted successfully",
    data: result,
  });
});

const getMyChat = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user.id;
    const result = await chatServices.getMyChat(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Chat Retrieve successfully",
      data: result,
    });
  }
);

// const searchUser = catchAsync(async (req: Request, res: Response) => {
//   const options = req.query;
//   const result = await chatServices.searchUser(req, options);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Users Retrieve successfully",
//     data: result,
//   });
// });


const sendFileMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const file = req.file;
  const result = await chatServices.sendFileMessage(userId, { host: req.header('host'), protocol: req.protocol }, file);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product post created successfully",
    data: result,
  });
});

export const ChatControllers = {
  createConversation,
  sendMessage,
  getMessages,
  getConversationByUserId,
  getSingleMassageConversation,
  getUserChat,
  deleteConversion,
  getMyChat,
  sendFileMessage
  // searchUser,
};
