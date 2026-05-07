'use strict';

const axios = require('axios');

/**
 * ChatService — AI-powered chat for RealPrice.
 * Uses OpenAI GPT to answer questions about real estate,
 * suggest prices, and parse user intent for filtering.
 */
class ChatService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        this.apiBase = 'https://api.openai.com/v1';

        if (!this.apiKey) {
            console.warn('[ChatService] OPENAI_API_KEY not set — chat disabled');
        }
    }

    /**
     * Chat with user — answer questions about properties, prices, locations.
     * @param {string} message - User message
     * @param {object} context - { listings, district, priceRange, etc. }
     * @param {string} userId - User ID
     * @returns {Promise<{ response: string, action?: object }>}
     */
    async chat(message, context = {}, userId) {
        if (!this.apiKey) {
            return {
                response: 'Chatbot hiện chưa khả dụng. Vui lòng cập nhật OPENAI_API_KEY.',
                action: null,
            };
        }

        const systemPrompt = this._buildSystemPrompt(context);
        const userMessage = this._normalizeMessage(message);

        try {
            const response = await axios.post(
                `${this.apiBase}/chat/completions`,
                {
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage },
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            const aiMessage = response.data.choices?.[0]?.message?.content || 'Không thể xử lý yêu cầu.';

            // Parse response for actionable intents
            const action = this._parseAction(aiMessage, context);

            return {
                response: aiMessage,
                action,
            };
        } catch (error) {
            console.error('[ChatService] OpenAI API error:', error.message);
            return {
                response: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.',
                action: null,
            };
        }
    }

    /**
     * Parse user message to extract search filters.
     * Returns structured filters (district, priceRange, area, etc.)
     * @param {string} message
     * @returns {Promise<object>}
     */
    async parseFilters(message) {
        if (!this.apiKey) {
            return {};
        }

        const systemPrompt = `Bạn là một trợ lý phân tích ý định của người dùng trong lĩnh vực bất động sản.
Hãy trích xuất từ tin nhắn của user:
- district (quận/huyện)
- minPrice, maxPrice (khoảng giá)
- minArea, maxArea (khoảng diện tích)
- listingType (dat_nen, nha_pho, chung_cu, biet_thu)
- keyword (từ khóa tìm kiếm)

Trả về dưới dạng JSON hợp lệ, không có text thêm. Ví dụ:
{"district": "Bình Thạnh", "minPrice": 1000000000, "maxPrice": 5000000000, "listingType": "nha_pho"}`;

        try {
            const response = await axios.post(
                `${this.apiBase}/chat/completions`,
                {
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message },
                    ],
                    temperature: 0.5,
                    max_tokens: 200,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            const content = response.data.choices?.[0]?.message?.content || '{}';
            try {
                return JSON.parse(content);
            } catch {
                return {};
            }
        } catch (error) {
            console.error('[ChatService] Parse filters error:', error.message);
            return {};
        }
    }

    _buildSystemPrompt(context) {
        const listings = context.listings || [];
        const listingContext = listings.length > 0
            ? `\nCó sẵn ${listings.length} tin đăng hiện tại. Giá từ ${Math.min(...listings.map(l => l.price))} đến ${Math.max(...listings.map(l => l.price))} VND.`
            : '';

        return `Bạn là một trợ lý bán bất động sản RealPrice.
Bạn giúp người dùng:
1. Tìm kiếm bất động sản theo giá, vị trí, diện tích
2. Suggest những bất động sản phù hợp với nhu cầu
3. Cung cấp thông tin về giá trung bình tại từng khu vực
4. Trả lời các câu hỏi về quy trình mua bán

Luôn trả lời bằng tiếng Việt và tư duy hợp lý.${listingContext}`;
    }

    _normalizeMessage(message) {
        return String(message).trim();
    }

    /**
     * Parse AI response to extract actionable intent.
     * E.g., "move map to Bình Thạnh", "show prices in range", etc.
     * @param {string} aiResponse
     * @param {object} context
     * @returns {object|null}
     */
    _parseAction(aiResponse, context) {
        const lower = aiResponse.toLowerCase();

        // Detect location intent
        const locMatch = lower.match(/quận|huyện|thành phố|bình thạnh|tân bình|hoàn kiếm/i);
        if (locMatch) {
            return {
                type: 'moveMap',
                location: locMatch[0],
            };
        }

        // Detect price range intent
        if (lower.includes('giá') && (lower.includes('triệu') || lower.includes('tỷ'))) {
            return {
                type: 'filterPrice',
                // Further parsing could extract specific ranges
            };
        }

        return null;
    }
}

module.exports = ChatService;
