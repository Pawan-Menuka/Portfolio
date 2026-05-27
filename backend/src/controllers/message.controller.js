import { asyncHandler } from '../utils/asyncHandler.js';
import * as messageService from '../services/message.service.js';

export const createMessage = asyncHandler(async (req, res) => {
  await messageService.create(req.body);
  res.status(201).json({ success: true, message: 'Message received. Thank you!' });
});

export const getMessages = asyncHandler(async (req, res) => {
  const result = await messageService.getAll(req.query);
  res.json({ success: true, ...result });
});

export const markRead = asyncHandler(async (req, res) => {
  const message = await messageService.markRead(req.params.id);
  res.json({ success: true, data: message });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  await messageService.remove(req.params.id);
  res.json({ success: true, message: 'Message deleted' });
});
