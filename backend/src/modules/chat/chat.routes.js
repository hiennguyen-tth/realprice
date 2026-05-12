'use strict';

const { Router } = require('express');
const ChatService = require('./chat.service');
const { optionalAuthenticate } = require('../../middleware/auth');

const chatService = new ChatService();
const router = Router();

/**
 * POST /api/chat
 * Send a user message and get AI response
 */
router.post('/', optionalAuthenticate, async (req, res, next) => {
    try {
        const { message, context } = req.body;
        const userId = req.user?.id;

        if (!message || String(message).trim().length === 0) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Message cannot be empty',
            });
        }

        const response = await chatService.chat(message, context, userId);
        res.json({ success: true, data: response });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/chat/search
 * Parse user intent to extract search filters
 */
router.post('/search', optionalAuthenticate, async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message || String(message).trim().length === 0) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Message cannot be empty',
            });
        }

        const filters = await chatService.parseFilters(message);
        res.json({ success: true, data: filters });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
