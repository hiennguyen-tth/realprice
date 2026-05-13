'use strict';

const { Router } = require('express');
const ChatService = require('./chat.service');
const { optionalAuthenticate } = require('../../middleware/auth');

const chatService = new ChatService();
const router = Router();

/**
 * In-memory session store.
 *
 * Production note:
 * - Nếu backend chỉ chạy 1 instance/container: dùng Map OK.
 * - Nếu chạy nhiều instance/container: nên thay bằng Redis để session không bị mất.
 */
const chatSessions = new Map();

const MAX_MESSAGES_PER_SESSION = 20;
const MAX_SUMMARY_MESSAGES = 8;
const SESSION_TTL_MS = 1000 * 60 * 60 * 6; // 6 giờ
const CLEANUP_INTERVAL_MS = 1000 * 60 * 30; // 30 phút

function normalizeText(value) {
    return String(value || '').trim();
}

function getClientSessionId(req) {
    return (
        req.body?.sessionId ||
        req.headers['x-session-id'] ||
        req.headers['x-chat-session-id'] ||
        null
    );
}

function getSessionKey(req) {
    const userId = req.user?.id;
    const clientSessionId = getClientSessionId(req);

    if (userId) {
        return clientSessionId ? `user:${userId}:${clientSessionId}` : `user:${userId}`;
    }

    if (clientSessionId) {
        return `guest:${clientSessionId}`;
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown-ip';
    const userAgent = req.headers['user-agent'] || 'unknown-agent';

    return `guest:${ip}:${userAgent}`;
}

function getOrCreateSession(sessionKey) {
    if (!chatSessions.has(sessionKey)) {
        chatSessions.set(sessionKey, {
            filters: {},
            conversationSummary: '',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }

    return chatSessions.get(sessionKey);
}

function compactMessages(messages, maxMessages = MAX_MESSAGES_PER_SESSION) {
    if (!Array.isArray(messages)) {
        return [];
    }

    return messages.slice(-maxMessages);
}

function formatMoney(value) {
    const number = Number(value);

    if (!Number.isFinite(number) || number <= 0) {
        return null;
    }

    if (number >= 1000000000) {
        const ty = number / 1000000000;
        return `${Number.isInteger(ty) ? ty : ty.toFixed(1)} tỷ`;
    }

    if (number >= 1000000) {
        const trieu = number / 1000000;
        return `${Number.isInteger(trieu) ? trieu : trieu.toFixed(1)} triệu`;
    }

    return number.toLocaleString('vi-VN');
}

function buildBudgetText(filters = {}) {
    const min = formatMoney(filters.minPrice);
    const max = formatMoney(filters.maxPrice);

    if (min && max && min !== max) {
        return `${min} - ${max}`;
    }

    if (max && !min) {
        return `tối đa ${max}`;
    }

    if (min && !max) {
        return `từ ${min}`;
    }

    if (min && max && min === max) {
        return `khoảng ${min}`;
    }

    return null;
}

function buildAreaText(filters = {}) {
    const min = filters.minArea;
    const max = filters.maxArea;

    if (min && max && min !== max) {
        return `${min} - ${max} m²`;
    }

    if (max && !min) {
        return `tối đa ${max} m²`;
    }

    if (min && !max) {
        return `từ ${min} m²`;
    }

    if (min && max && min === max) {
        return `khoảng ${min} m²`;
    }

    return filters.areaText || null;
}

function buildKnownInfo(filters = {}) {
    const knownInfo = [];

    if (filters.province) knownInfo.push(`Tỉnh/thành: ${filters.province}`);
    if (filters.district) knownInfo.push(`Quận/huyện: ${filters.district}`);
    if (filters.ward) knownInfo.push(`Phường/xã: ${filters.ward}`);
    if (filters.street) knownInfo.push(`Đường/khu vực: ${filters.street}`);
    if (filters.project) knownInfo.push(`Dự án: ${filters.project}`);
    if (filters.locationText) knownInfo.push(`Vị trí mô tả: ${filters.locationText}`);

    if (Array.isArray(filters.locationIntents) && filters.locationIntents.length > 0) {
        knownInfo.push(`Tiêu chí vị trí: ${filters.locationIntents.join(', ')}`);
    }

    if (Array.isArray(filters.listingTypes) && filters.listingTypes.length > 0) {
        knownInfo.push(`Loại BĐS: ${filters.listingTypes.join(', ')}`);
    }

    if (filters.primaryListingType) {
        knownInfo.push(`Loại ưu tiên: ${filters.primaryListingType}`);
    }

    const budgetText = buildBudgetText(filters);
    if (budgetText) knownInfo.push(`Ngân sách: ${budgetText}`);

    const areaText = buildAreaText(filters);
    if (areaText) knownInfo.push(`Diện tích: ${areaText}`);

    if (filters.bedrooms) knownInfo.push(`Số phòng ngủ: ${filters.bedrooms}`);
    if (filters.bathrooms) knownInfo.push(`Số WC: ${filters.bathrooms}`);
    if (filters.floors) knownInfo.push(`Số tầng: ${filters.floors}`);

    if (filters.legalStatus) knownInfo.push(`Pháp lý: ${filters.legalStatus}`);
    if (filters.direction) knownInfo.push(`Hướng: ${filters.direction}`);
    if (filters.roadWidth) knownInfo.push(`Đường rộng: ${filters.roadWidth}`);
    if (filters.frontage) knownInfo.push(`Mặt tiền: ${filters.frontage}`);

    if (filters.purpose) knownInfo.push(`Mục đích: ${filters.purpose}`);
    if (filters.urgency) knownInfo.push(`Mức độ cần gấp: ${filters.urgency}`);

    if (filters.userEmotion) knownInfo.push(`Cảm xúc user: ${filters.userEmotion}`);
    if (filters.dontAskMore) knownInfo.push('User không muốn bị hỏi thêm');

    return knownInfo;
}

function buildConversationSummary(session) {
    const filters = session.filters || {};
    const knownInfo = buildKnownInfo(filters);
    const messages = compactMessages(session.messages || [], MAX_SUMMARY_MESSAGES);

    const recentChat = messages
        .map((item) => {
            const role = item.role === 'assistant' ? 'Mai' : 'User';
            return `${role}: ${item.content}`;
        })
        .join('\n');

    return `
Thông tin đã biết:
${knownInfo.length > 0 ? knownInfo.map((x) => `- ${x}`).join('\n') : '- Chưa có thông tin rõ ràng'}

Hội thoại gần đây:
${recentChat || 'Chưa có'}
`.trim();
}

function buildSearchResultSummary(context = {}) {
    if (context.searchResultSummary) {
        return String(context.searchResultSummary);
    }

    const listings = Array.isArray(context.listings) ? context.listings : [];

    if (listings.length === 0) {
        return 'Chưa có kết quả tin đăng cụ thể từ database.';
    }

    const prices = listings
        .map((item) => Number(item.price))
        .filter((price) => Number.isFinite(price) && price > 0);

    const areas = listings
        .map((item) => Number(item.area))
        .filter((area) => Number.isFinite(area) && area > 0);

    const districts = Array.from(
        new Set(
            listings
                .map((item) => item.district || item.districtName)
                .filter(Boolean)
        )
    ).slice(0, 5);

    const wards = Array.from(
        new Set(
            listings
                .map((item) => item.ward || item.wardName)
                .filter(Boolean)
        )
    ).slice(0, 5);

    return [
        `Tìm thấy ${listings.length} tin đăng.`,
        prices.length > 0
            ? `Giá từ ${Math.min(...prices).toLocaleString('vi-VN')} đến ${Math.max(...prices).toLocaleString('vi-VN')} VND.`
            : 'Chưa rõ khoảng giá.',
        areas.length > 0
            ? `Diện tích từ ${Math.min(...areas)} đến ${Math.max(...areas)} m².`
            : 'Chưa rõ khoảng diện tích.',
        districts.length > 0 ? `Quận/huyện liên quan: ${districts.join(', ')}.` : '',
        wards.length > 0 ? `Phường/xã liên quan: ${wards.join(', ')}.` : '',
    ]
        .filter(Boolean)
        .join(' ');
}

function mergeContextFilters(context = {}, sessionFilters = {}) {
    return {
        ...(context.extractedFilters || {}),
        ...(context.filters || {}),
        ...(sessionFilters || {}),
    };
}

function addMessageToSession(session, role, content) {
    const text = normalizeText(content);

    if (!text) {
        return;
    }

    session.messages.push({
        role,
        content: text,
        createdAt: new Date().toISOString(),
    });

    session.messages = compactMessages(session.messages, MAX_MESSAGES_PER_SESSION);
    session.updatedAt = Date.now();
}

function cleanupExpiredSessions() {
    const now = Date.now();

    for (const [key, session] of chatSessions.entries()) {
        if (!session?.updatedAt || now - session.updatedAt > SESSION_TTL_MS) {
            chatSessions.delete(key);
        }
    }
}

setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL_MS).unref();

/**
 * POST /api/chat
 * Send a user message and get AI response.
 */
router.post('/', optionalAuthenticate, async (req, res, next) => {
    try {
        const { message, context = {}, sessionId } = req.body;
        const userId = req.user?.id;
        const normalizedMessage = normalizeText(message);

        if (!normalizedMessage) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Message cannot be empty',
            });
        }

        const sessionKey = getSessionKey(req);
        const session = getOrCreateSession(sessionKey);

        /**
         * 1. Merge filter từ:
         * - session cũ
         * - context frontend gửi lên
         * - message hiện tại sau khi parse
         */
        const baseFilters = mergeContextFilters(context, session.filters);

        const mergedFilters = await chatService.parseFilters(
            normalizedMessage,
            baseFilters,
            session.conversationSummary || ''
        );

        session.filters = mergedFilters;

        /**
         * 2. Lưu user message.
         */
        addMessageToSession(session, 'user', normalizedMessage);

        /**
         * 3. Build conversation summary sau khi có message mới.
         */
        session.conversationSummary = buildConversationSummary(session);

        /**
         * 4. Build context đầy đủ cho ChatService.
         */
        const finalContext = {
            ...context,
            extractedFilters: session.filters,
            conversationSummary: session.conversationSummary,
            searchResultSummary: buildSearchResultSummary(context),
            listings: Array.isArray(context.listings) ? context.listings : [],
        };

        /**
         * 5. Gọi AI trả lời.
         */
        const response = await chatService.chat(normalizedMessage, finalContext, userId);

        /**
         * 6. Lưu assistant message.
         */
        addMessageToSession(session, 'assistant', response.response);

        /**
         * 7. Update summary lần cuối.
         */
        session.conversationSummary = buildConversationSummary(session);
        session.updatedAt = Date.now();

        return res.json({
            success: true,
            data: {
                ...response,
                sessionId: sessionId || sessionKey,
                filters: session.filters,
                conversationSummary: session.conversationSummary,
            },
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/chat/search
 * Parse user intent to extract search filters.
 */
router.post('/search', optionalAuthenticate, async (req, res, next) => {
    try {
        const {
            message,
            previousFilters = {},
            context = {},
            sessionId,
        } = req.body;

        const normalizedMessage = normalizeText(message);

        if (!normalizedMessage) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Message cannot be empty',
            });
        }

        const sessionKey = getSessionKey(req);
        const session = getOrCreateSession(sessionKey);

        const baseFilters = {
            ...mergeContextFilters(context, session.filters),
            ...(previousFilters || {}),
        };

        const filters = await chatService.parseFilters(
            normalizedMessage,
            baseFilters,
            session.conversationSummary || ''
        );

        session.filters = filters;

        addMessageToSession(session, 'user', normalizedMessage);

        session.conversationSummary = buildConversationSummary(session);
        session.updatedAt = Date.now();

        return res.json({
            success: true,
            data: {
                filters,
                sessionId: sessionId || sessionKey,
                conversationSummary: session.conversationSummary,
            },
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/chat/session
 * Debug current chat session.
 * Có thể bỏ route này nếu không muốn expose session ra frontend.
 */
router.get('/session', optionalAuthenticate, async (req, res, next) => {
    try {
        const sessionKey = getSessionKey(req);
        const session = getOrCreateSession(sessionKey);

        return res.json({
            success: true,
            data: {
                sessionId: sessionKey,
                filters: session.filters || {},
                conversationSummary: session.conversationSummary || '',
                messages: session.messages || [],
                updatedAt: session.updatedAt,
            },
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/chat/reset
 * Reset current chat session.
 */
router.post('/reset', optionalAuthenticate, async (req, res, next) => {
    try {
        const sessionKey = getSessionKey(req);
        chatSessions.delete(sessionKey);

        return res.json({
            success: true,
            data: {
                sessionId: sessionKey,
                message: 'Chat session reset successfully',
            },
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;