'use strict';

const axios = require('axios');

/**
 * ChatService — AI-powered chat for RealPrice.
 * Uses OpenAI GPT to answer questions about real estate,
 * or falls back to mock responses if API key is not configured.
 */
class ChatService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        this.apiBase = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.useMockMode = !this.apiKey;

        console.log('[ChatService] Using model:', this.model);

        if (this.useMockMode) {
            console.warn('[ChatService] GEMINI_API_KEY not set — using mock mode for testing');
        }
    }

    // Hàm helper dùng chung cho cả chat() và parseFilters()
    async _callGemini(systemPrompt, userMessage, maxTokens = 500, temperature = 0.7) {

        const url = `${this.apiBase}/${this.model}:generateContent?key=${this.apiKey}`;

        try {
            const response = await axios.post(url,
                {
                    contents: [
                        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }
                    ],
                    generationConfig: {
                        temperature,
                        maxOutputTokens: maxTokens,
                    },
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    // Không có Authorization Bearer — key nằm trong URL
                    timeout: 30000,
                }
            );

            return response.data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        } catch (err) {
            console.error('[ChatService] Raw error:', err.response?.data);
            throw err;
        }


    }

    /**
     * Chat with user — answer questions about properties, prices, locations.
     * Uses OpenAI if key is set, otherwise returns mock responses.
     * @param {string} message - User message
     * @param {object} context - { listings, district, priceRange, etc. }
     * @param {string} userId - User ID
     * @returns {Promise<{ response: string, action?: object }>}
     */
    async chat(message, context = {}, userId) {
        if (this.useMockMode) {
            return this._getMockResponse(message, context);
        }

        const systemPrompt = this._buildSystemPrompt(context);
        const userMessage = this._normalizeMessage(message);

        try {

            const aiMessage = await this._callGemini(systemPrompt, userMessage, 500, 0.7)
                || 'Không thể xử lý yêu cầu.';

            return { response: aiMessage, action: this._parseAction(aiMessage, context) };
        } catch (error) {
            console.error('[ChatService] Gemini API error:', error.message);
            return {
                response: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.',
                action: null,
            };
        }
    }

    /**
     * Parse user message to extract search filters.
     * Returns structured filters (district, priceRange, area, etc.)
     * Uses OpenAI if key is set, otherwise uses simple pattern matching.
     * @param {string} message
     * @returns {Promise<object>}
     */
    async parseFilters(message) {
        if (this.useMockMode) {
            return this._parseMockFilters(message);
        }

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
            const content = await this._callGemini(systemPrompt, message, 200, 0.3) || '{}';
            // Gemini đôi khi wrap trong ```json ... ``` — strip ra
            const clean = content.replace(/```json|```/g, '').trim();
            return JSON.parse(clean);
        } catch (error) {
            console.error('[ChatService] Parse filters error:', error.message);
            return {};
        }
    }

    /**
     * Get mock response based on user message — for testing without API key.
     * @param {string} message
     * @param {object} context
     * @returns {object}
     */
    _getMockResponse(message, context) {
        const lower = message.toLowerCase();

        let response = '';
        let action = null;

        // Detect location queries
        if (/bình thạnh|binh thanh/.test(lower)) {
            response = 'Bình Thạnh là một quận sôi động ở TP.HCM. Giá bất động sản hiện tại dao động từ 20-50 triệu/m². Có rất nhiều căn hộ chung cư và nhà phố được rao bán. Bạn muốn tìm loại hình nào?';
            action = { type: 'moveMap', location: 'bình thạnh' };
        } else if (/quận 1|quan 1/.test(lower)) {
            response = 'Quận 1 là trung tâm TP.HCM với giá bất động sản cao nhất, dao động từ 45-120 triệu/m². Đây là khu vực hàng đầu cho các nhà đầu tư. Bạn quan tâm đến những vị trí nào cụ thể?';
            action = { type: 'moveMap', location: 'quận 1' };
        } else if (/tân bình|tan binh/.test(lower)) {
            response = 'Tân Bình là khu vực đang phát triển với giá từ 20-40 triệu/m². Là điểm đến tốt cho những ai tìm kiếm giá hợp lý với vị trí chiến lược.';
            action = { type: 'moveMap', location: 'tân bình' };
        } else if (/hoàn kiếm|hoan kiem/.test(lower)) {
            response = 'Hoàn Kiếm, Hà Nội là khu vực truyền thống với giá cao từ 80-200 triệu/m². Đây là nơi lý tưởng cho những ai tìm kiếm sự ổn định và vị thế.';
            action = { type: 'moveMap', location: 'hoàn kiếm' };
        }

        // Detect price queries
        if (/giá|bao nhiêu|khoảng|từ|đến|triệu|tỷ/.test(lower)) {
            if (!response) {
                response = 'Giá bất động sản phụ thuộc vào vị trí và loại hình. TP.HCM dao động từ 15-120 triệu/m², Hà Nội từ 30-200 triệu/m². Bạn quan tâm khu vực nào?';
            }
            action = { type: 'filterPrice' };
        }

        // Detect property type queries
        if (/nhà phố|nha pho/.test(lower)) {
            if (!response) {
                response = 'Nhà phố là lựa chọn phổ biến với giá trung bình từ 30-80 triệu/m². Chúng tôi có rất nhiều danh sách nhà phố hiện tại. Bạn muốn xem ở đâu?';
            }
            action = { type: 'filterType', listingType: 'nha_pho' };
        } else if (/đất nền|dat nen/.test(lower)) {
            if (!response) {
                response = 'Đất nền thường có giá thấp hơn, từ 10-40 triệu/m² tùy vị trí. Tốt cho những ai muốn đầu tư dài hạn hoặc xây dựng.';
            }
            action = { type: 'filterType', listingType: 'dat_nen' };
        } else if (/chung cư|chung cu/.test(lower)) {
            if (!response) {
                response = 'Chung cư là lựa chọn tiện nghi với giá từ 25-150 triệu/m² tùy vị trí. Bạn tìm căn hộ ở khu vực nào?';
            }
            action = { type: 'filterType', listingType: 'chung_cu' };
        }

        // Detect area/diện tích queries
        if (/diện tích|m2|m²|m\b|sàn|nằm/.test(lower)) {
            if (!response) {
                response = 'Để giúp bạn tốt nhất, tôi cần biết khoảng diện tích bạn tìm kiếm? Ví dụ: 50-100m², 100-200m²?';
            }
        }

        // Default response
        if (!response) {
            response = 'Tôi có thể giúp bạn tìm kiếm bất động sản theo vị trí, giá, loại hình (nhà phố, đất nền, chung cư) hoặc diện tích. Hãy cho tôi biết bạn đang tìm gì?';
        }

        return { response, action };
    }

    /**
     * Parse filters from message using simple pattern matching — for testing.
     * @param {string} message
     * @returns {object}
     */
    _parseMockFilters(message) {
        const lower = message.toLowerCase();
        const filters = {};

        // Extract district
        const districtMatch = message.match(/(bình thạnh|binh thanh|quận 1|quan 1|tân bình|tan binh|hoàn kiếm|hoan kiem)/i);
        if (districtMatch) {
            const districtName = districtMatch[1].replace(/[ạỀàáảãâ]/g, (c) => {
                const map = { 'ạ': 'a', 'ề': 'e', 'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a' };
                return map[c] || c;
            });
            filters.district = districtName;
        }

        // Extract property type
        if (/nhà phố|nha pho/.test(lower)) {
            filters.listingType = 'nha_pho';
        } else if (/đất nền|dat nen/.test(lower)) {
            filters.listingType = 'dat_nen';
        } else if (/chung cư|chung cu/.test(lower)) {
            filters.listingType = 'chung_cu';
        }

        // Extract price range (simple pattern)
        const priceMatch = message.match(/(\d+)\s*(triệu|tỷ)?.*-(\d+)\s*(triệu|tỷ)?/i);
        if (priceMatch) {
            let min = parseInt(priceMatch[1], 10);
            let max = parseInt(priceMatch[3], 10);
            if (priceMatch[2]?.toLowerCase() === 'tỷ') min *= 1000000000;
            else min *= 1000000;
            if (priceMatch[4]?.toLowerCase() === 'tỷ') max *= 1000000000;
            else max *= 1000000;
            filters.minPrice = min;
            filters.maxPrice = max;
        }

        return filters;
    }

    _buildSystemPrompt(context) {
        const listings = context.listings || [];
        const listingContext = listings.length > 0
            ? `\nCó sẵn ${listings.length} tin đăng hiện tại. Giá từ ${Math.min(...listings.map(l => l.price))} đến ${Math.max(...listings.map(l => l.price))} VND.`
            : '';

        // 👇 Thêm persona vào đây
        const persona = `
Bạn là Mai — trợ lý tư vấn bất động sản của RealPrice.
Tính cách: thân thiện, nói chuyện tự nhiên như chat thật, thỉnh thoảng dùng emoji nhẹ.
Phong cách: ngắn gọn, đúng trọng tâm, không dài dòng.
`;


        const domain = `
Bạn giúp người dùng:
1. Tìm bất động sản theo giá, vị trí, diện tích
2. Gợi ý những BĐS phù hợp nhu cầu
3. Cung cấp thông tin giá trung bình từng khu vực
4. Trả lời câu hỏi về quy trình mua bán

Luôn trả lời bằng tiếng Việt.${listingContext}
`;

        return persona + domain;
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
