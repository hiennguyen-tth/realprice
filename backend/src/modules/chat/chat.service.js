'use strict';

const axios = require('axios');

/**
 * ChatService — AI-powered chat for RealPrice.
 * Uses OpenAI GPT to answer questions about real estate,
 * or falls back to mock responses if API key is not configured.
 */
class ChatService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        this.apiBase = 'https://api.openai.com/v1';
        this.useMockMode = !this.apiKey;

        if (this.useMockMode) {
            console.warn('[ChatService] OPENAI_API_KEY not set — using mock mode for testing');
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

        // District/location lookup table
        const DISTRICT_INFO = {
            'bình thạnh|binh thanh': { name: 'Bình Thạnh', price: '20–50 triệu/m²', desc: 'quận sôi động ở TP.HCM, gần trung tâm, đa dạng chung cư và nhà phố.' },
            'quận 1|quan 1': { name: 'Quận 1', price: '45–120 triệu/m²', desc: 'trung tâm TP.HCM với giá cao nhất. Lý tưởng cho nhà đầu tư.' },
            'quận 2|quan 2': { name: 'Quận 2', price: '30–80 triệu/m²', desc: 'khu đô thị mới Thủ Thiêm, nhiều dự án cao cấp.' },
            'quận 3|quan 3': { name: 'Quận 3', price: '40–100 triệu/m²', desc: 'khu trung tâm sầm uất, giàu tiện ích, nhiều nhà phố và biệt thự.' },
            'quận 4|quan 4': { name: 'Quận 4', price: '25–60 triệu/m²', desc: 'vị trí gần trung tâm, giá phải chăng hơn, đang phát triển mạnh.' },
            'quận 5|quan 5': { name: 'Quận 5', price: '30–70 triệu/m²', desc: 'khu phố người Hoa, thương mại sầm uất, nhiều nhà phố kinh doanh.' },
            'quận 6|quan 6': { name: 'Quận 6', price: '20–45 triệu/m²', desc: 'khu vực đang phát triển, giá còn hợp lý, nhiều chung cư mới.' },
            'quận 7|quan 7': { name: 'Quận 7', price: '25–60 triệu/m²', desc: 'khu Phú Mỹ Hưng sang trọng, nhiều dự án cao cấp và biệt thự.' },
            'quận 8|quan 8': { name: 'Quận 8', price: '18–40 triệu/m²', desc: 'giá bình dân, nhiều chung cư giá tốt, đang có nhiều dự án hạ tầng.' },
            'quận 9|quan 9': { name: 'Quận 9', price: '15–35 triệu/m²', desc: 'khu vực mới phát triển, giá đất nền hợp lý, tiềm năng tăng trưởng tốt.' },
            'quận 10|quan 10': { name: 'Quận 10', price: '30–70 triệu/m²', desc: 'gần trung tâm, nhiều trường học và bệnh viện, khu dân cư ổn định.' },
            'quận 11|quan 11': { name: 'Quận 11', price: '25–55 triệu/m²', desc: 'khu vực yên tĩnh, nhiều gia đình sinh sống, giá ổn định.' },
            'quận 12|quan 12': { name: 'Quận 12', price: '15–35 triệu/m²', desc: 'vùng ven đang đô thị hoá nhanh, giá đất còn mềm, nhiều cơ hội đầu tư.' },
            'tân bình|tan binh': { name: 'Tân Bình', price: '20–45 triệu/m²', desc: 'khu vực chiến lược gần sân bay, đang phát triển nhanh.' },
            'tân phú|tan phu': { name: 'Tân Phú', price: '18–40 triệu/m²', desc: 'khu dân cư đông đúc, giá hợp lý, nhiều chung cư và nhà phố.' },
            'gò vấp|go vap': { name: 'Gò Vấp', price: '18–40 triệu/m²', desc: 'khu vực năng động, giá phải chăng, nhiều tiện ích.' },
            'phú nhuận|phu nhuan': { name: 'Phú Nhuận', price: '30–65 triệu/m²', desc: 'khu trung tâm yên tĩnh, nhiều biệt thự và nhà phố cao cấp.' },
            'thủ đức|thu duc': { name: 'Thủ Đức', price: '20–50 triệu/m²', desc: 'thành phố sáng tạo, khu công nghệ cao, nhiều dự án quy mô lớn.' },
            'hoàn kiếm|hoan kiem': { name: 'Hoàn Kiếm', price: '80–200 triệu/m²', desc: 'trung tâm lịch sử Hà Nội, giá cao nhất thủ đô, lý tưởng cho kinh doanh.' },
            'ba đình|ba dinh': { name: 'Ba Đình', price: '60–150 triệu/m²', desc: 'khu chính trị trung tâm Hà Nội, nhiều biệt thự và căn hộ cao cấp.' },
            'đống đa|dong da': { name: 'Đống Đa', price: '40–120 triệu/m²', desc: 'trung tâm văn hoá giáo dục Hà Nội, đông dân, nhiều tiện ích.' },
            'cầu giấy|cau giay': { name: 'Cầu Giấy', price: '30–80 triệu/m²', desc: 'khu đại học và công nghệ, nhiều chung cư cao cấp, hạ tầng tốt.' },
            'thanh xuân|thanh xuan': { name: 'Thanh Xuân', price: '35–80 triệu/m²', desc: 'khu dân cư sầm uất phía Nam Hà Nội, nhiều chung cư và nhà phố.' },
            'tây hồ|tay ho': { name: 'Tây Hồ', price: '50–130 triệu/m²', desc: 'khu biệt thự ven hồ, nhiều người nước ngoài sinh sống, rất sang trọng.' },
            'hải châu|hai chau': { name: 'Hải Châu', price: '15–40 triệu/m²', desc: 'trung tâm Đà Nẵng, vị trí đắc địa, nhiều nhà phố và chung cư.' },
            'sơn trà|son tra': { name: 'Sơn Trà', price: '20–55 triệu/m²', desc: 'khu du lịch ven biển Đà Nẵng, tiềm năng nghỉ dưỡng và đầu tư lớn.' },
            'ngũ hành sơn|ngu hanh son': { name: 'Ngũ Hành Sơn', price: '15–40 triệu/m²', desc: 'khu du lịch nổi tiếng Đà Nẵng, phát triển nhanh, nhiều dự án resort.' },
        };

        // Check if any district matches
        for (const [pattern, info] of Object.entries(DISTRICT_INFO)) {
            if (new RegExp(pattern).test(lower)) {
                response = `${info.name} là ${info.desc} Giá bất động sản dao động khoảng ${info.price}. Bạn muốn tìm loại hình nào?`;
                action = { type: 'moveMap', location: info.name };
                break;
            }
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

        // District patterns → canonical Vietnamese name
        const DISTRICT_PATTERNS = [
            [/bình thạnh|binh thanh/i, 'Bình Thạnh'],
            [/quận 1\b|quan 1\b/i, 'Quận 1'],
            [/quận 2\b|quan 2\b/i, 'Quận 2'],
            [/quận 3\b|quan 3\b/i, 'Quận 3'],
            [/quận 4\b|quan 4\b/i, 'Quận 4'],
            [/quận 5\b|quan 5\b/i, 'Quận 5'],
            [/quận 6\b|quan 6\b/i, 'Quận 6'],
            [/quận 7\b|quan 7\b/i, 'Quận 7'],
            [/quận 8\b|quan 8\b/i, 'Quận 8'],
            [/quận 9\b|quan 9\b/i, 'Quận 9'],
            [/quận 10\b|quan 10\b/i, 'Quận 10'],
            [/quận 11\b|quan 11\b/i, 'Quận 11'],
            [/quận 12\b|quan 12\b/i, 'Quận 12'],
            [/tân bình|tan binh/i, 'Tân Bình'],
            [/tân phú|tan phu/i, 'Tân Phú'],
            [/gò vấp|go vap/i, 'Gò Vấp'],
            [/phú nhuận|phu nhuan/i, 'Phú Nhuận'],
            [/thủ đức|thu duc/i, 'Thủ Đức'],
            [/hoàn kiếm|hoan kiem/i, 'Hoàn Kiếm'],
            [/ba đình|ba dinh/i, 'Ba Đình'],
            [/đống đa|dong da/i, 'Đống Đa'],
            [/cầu giấy|cau giay/i, 'Cầu Giấy'],
            [/thanh xuân|thanh xuan/i, 'Thanh Xuân'],
            [/tây hồ|tay ho/i, 'Tây Hồ'],
            [/hải châu|hai chau/i, 'Hải Châu'],
            [/sơn trà|son tra/i, 'Sơn Trà'],
            [/ngũ hành sơn|ngu hanh son/i, 'Ngũ Hành Sơn'],
        ];

        for (const [pattern, name] of DISTRICT_PATTERNS) {
            if (pattern.test(message)) {
                filters.district = name;
                break;
            }
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
