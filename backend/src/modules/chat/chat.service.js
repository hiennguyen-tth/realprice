'use strict';

const axios = require('axios');

/**
 * ChatService — AI-powered chat for RealPrice.
 * Gemini-powered real estate assistant for Vietnam market.
 */
class ChatService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        this.apiBase = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.useMockMode = !this.apiKey;

        if (this.useMockMode) {
            console.warn('[ChatService] GEMINI_API_KEY not set — using mock mode for testing');
        }
    }

    async _callGemini(systemPrompt, userMessage, maxTokens = 700, temperature = 0.5) {
        if (!this.apiKey) {
            return null;
        }

        const url = `${this.apiBase}/${this.model}:generateContent?key=${this.apiKey}`;

        try {
            const response = await axios.post(
                url,
                {
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {
                                    text: `${systemPrompt}\n\n${userMessage}`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature,
                        maxOutputTokens: maxTokens,
                    },
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000,
                }
            );

            return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        } catch (err) {
            console.error('[ChatService] Gemini raw error:', err.response?.data || err.message);
            throw err;
        }
    }

    async chat(message, context = {}, userId = null) {
        const normalizedMessage = this._normalizeMessage(message);

        if (this.useMockMode) {
            return this._getMockResponse(normalizedMessage, context);
        }

        const systemPrompt = this._buildSystemPrompt(context);

        const userMessage = `
Tin nhắn hiện tại của user:
"${normalizedMessage}"

Context kỹ thuật:
- userId: ${userId || 'unknown'}
- extractedFilters: ${JSON.stringify(context.extractedFilters || {}, null, 2)}
- conversationSummary: ${context.conversationSummary || 'Chưa có'}
- searchResultSummary: ${context.searchResultSummary || 'Chưa có'}
- listingsCount: ${Array.isArray(context.listings) ? context.listings.length : 0}

Yêu cầu trả lời:
- Dựa trên context đã có, không hỏi lại thông tin đã có.
- Nếu user đã cung cấp vị trí + loại BĐS + ngân sách, hãy tư vấn / khoanh vùng / gợi ý ngay.
- Nếu user đang khó chịu hoặc nói "đừng hỏi nữa", trả lời thẳng, không hỏi thêm.
- Nếu không có listings cụ thể, không bịa tin đăng. Hãy nói rõ và khoanh vùng theo nhu cầu.
`;

        try {
            const aiMessage =
                (await this._callGemini(systemPrompt, userMessage, 900, 0.45)) ||
                'Xin lỗi, Mai chưa xử lý được yêu cầu này. Bạn thử lại giúp Mai nhé.';

            return {
                response: aiMessage.trim(),
                action: this._parseAction(aiMessage, context),
            };
        } catch (error) {
            console.error('[ChatService] Gemini API error:', error.message);
            return {
                response: 'Xin lỗi bạn, hệ thống đang gặp lỗi khi xử lý yêu cầu. Bạn thử lại giúp Mai nhé.',
                action: null,
            };
        }
    }

    async parseFilters(message, previousFilters = {}, conversationSummary = '') {
        const normalizedMessage = this._normalizeMessage(message);

        if (this.useMockMode || !this.apiKey) {
            const newFilters = this._parseMockFilters(normalizedMessage);
            return this._mergeFilters(previousFilters, newFilters);
        }

        const systemPrompt = `
Bạn là bộ phân tích nhu cầu tìm kiếm bất động sản tại Việt Nam.

Nhiệm vụ:
- Trích xuất toàn bộ tiêu chí tìm kiếm BĐS từ tin nhắn user.
- Merge với previousFilters nếu thông tin cũ vẫn còn liên quan.
- Hiểu tiếng Việt có dấu, không dấu, viết tắt, sai chính tả nhẹ.
- Chỉ trả về JSON hợp lệ. Không thêm giải thích. Không bọc markdown.

Schema JSON bắt buộc:
{
  "province": null,
  "district": null,
  "ward": null,
  "street": null,
  "project": null,
  "locationText": null,

  "listingTypes": [],
  "primaryListingType": null,

  "minPrice": null,
  "maxPrice": null,
  "priceText": null,

  "minArea": null,
  "maxArea": null,
  "areaText": null,

  "bedrooms": null,
  "bathrooms": null,
  "floors": null,

  "locationIntents": [],
  "amenities": [],

  "legalStatus": null,
  "direction": null,
  "roadWidth": null,
  "frontage": null,

  "purpose": null,
  "urgency": null,

  "userEmotion": null,
  "dontAskMore": false,
  "wantsPriceCheck": false,
  "wantsListingSearch": false,
  "wantsLocationSuggestion": false,

  "missingRequiredFields": [],
  "confidence": 0.0
}

Quy đổi loại BĐS:
- "đất", "đất nền", "lô đất" => "dat_nen"
- "nhà", "nhà phố", "nhà riêng" => "nha_pho"
- "căn hộ", "chung cư", "apartment" => "chung_cu"
- "biệt thự", "villa" => "biet_thu"
- "shophouse", "nhà phố thương mại" => "shophouse"
- "mặt bằng", "mbkd" => "mat_bang"
- "phòng trọ", "nhà trọ" => "phong_tro"

Quy đổi giá:
- "3 tỷ", "3tỷ", "3ty", "3 tỉ" => 3000000000
- "3-5 tỷ" => minPrice 3000000000, maxPrice 5000000000
- "khoảng 3 tỷ", "tầm 3 tỷ" => minPrice 2700000000, maxPrice 3300000000
- "dưới 3 tỷ" => maxPrice 3000000000
- "trên 3 tỷ" => minPrice 3000000000
- "500 triệu" => 500000000

Quy đổi diện tích:
- "100m2", "100 m²", "100 mét" => minArea 100, maxArea 100
- "khoảng 100m2" => minArea 90, maxArea 110
- "50-70m2" => minArea 50, maxArea 70
- "diện tích nào cũng được" => minArea null, maxArea null, areaText "linh hoạt"

Quy tắc địa lý Việt Nam:
- Nhận diện tỉnh/thành: Đà Nẵng, Hà Nội, TP.HCM, Hải Phòng, Cần Thơ, Bình Dương, Đồng Nai, Khánh Hòa...
- Nhận diện quận/huyện/thành phố thuộc tỉnh: Thanh Khê, Hải Châu, Sơn Trà, Bình Thạnh, Quận 1...
- Nhận diện phường/xã/thị trấn nếu có.
- Nhận diện đường, khu vực, dự án nếu có.

Quy tắc tiêu chí vị trí:
- "gần biển" => locationIntents có "gan_bien"
- "gần trung tâm" => "gan_trung_tam"
- "gần sân bay" => "gan_san_bay"
- "gần trường" => "gan_truong"
- "gần chợ" => "gan_cho"
- "mặt tiền" => "mat_tien"
- "hẻm xe hơi" => "hem_xe_hoi"

Quy tắc cảm xúc:
Nếu user nói "đừng hỏi nữa", "hỏi lòng vòng", "đã nói rồi", "check nhanh", "check đi", "nói ở trên rồi":
- dontAskMore = true
- userEmotion = "annoyed"

Quy tắc missingRequiredFields:
- Nếu đã có province/district/locationText và có listingTypes hoặc wantsPriceCheck thì không thiếu vị trí.
- Nếu user chỉ hỏi giá khu vực, không cần listingType.
- Nếu user muốn tìm tin cụ thể, nên cần location và listingType.
- Không đưa field vào missingRequiredFields nếu field đó đã có trong previousFilters.
`;

        const userInput = `
previousFilters:
${JSON.stringify(previousFilters || {}, null, 2)}

conversationSummary:
${conversationSummary || 'Chưa có'}

currentUserMessage:
"${normalizedMessage}"

Hãy trả về JSON đã merge giữa previousFilters và currentUserMessage.
Thông tin trong currentUserMessage được ưu tiên nếu mâu thuẫn.
`;

        try {
            const content = await this._callGemini(systemPrompt, userInput, 700, 0.2);
            const parsed = this._safeJsonParse(content, {});
            const normalized = this._normalizeFilters(parsed);
            return this._mergeFilters(previousFilters, normalized);
        } catch (error) {
            console.error('[ChatService] Parse filters error:', error.message);
            return this._mergeFilters(previousFilters, this._parseMockFilters(normalizedMessage));
        }
    }

    _mergeFilters(oldFilters = {}, newFilters = {}) {
        const merged = { ...(oldFilters || {}) };

        for (const [key, value] of Object.entries(newFilters || {})) {
            if (value === null || value === undefined || value === '') {
                continue;
            }

            if (Array.isArray(value)) {
                if (value.length === 0) {
                    continue;
                }

                const oldArray = Array.isArray(merged[key]) ? merged[key] : [];
                merged[key] = Array.from(new Set([...oldArray, ...value]));
                continue;
            }

            merged[key] = value;
        }

        return this._normalizeFilters(merged);
    }

    _normalizeFilters(filters = {}) {
        const normalized = { ...(filters || {}) };

        if (normalized.listingType && !normalized.primaryListingType) {
            normalized.primaryListingType = normalized.listingType;
        }

        if (normalized.primaryListingType && !Array.isArray(normalized.listingTypes)) {
            normalized.listingTypes = [normalized.primaryListingType];
        }

        if (normalized.primaryListingType && Array.isArray(normalized.listingTypes)) {
            if (!normalized.listingTypes.includes(normalized.primaryListingType)) {
                normalized.listingTypes.unshift(normalized.primaryListingType);
            }
        }

        if (!Array.isArray(normalized.listingTypes)) {
            normalized.listingTypes = [];
        }

        if (!Array.isArray(normalized.locationIntents)) {
            normalized.locationIntents = [];
        }

        if (!Array.isArray(normalized.amenities)) {
            normalized.amenities = [];
        }

        if (!Array.isArray(normalized.missingRequiredFields)) {
            normalized.missingRequiredFields = [];
        }

        return normalized;
    }

    _buildSystemPrompt(context = {}) {
        const listings = Array.isArray(context.listings) ? context.listings : [];
        const validPrices = listings
            .map((item) => Number(item.price))
            .filter((price) => Number.isFinite(price) && price > 0);

        const listingContext =
            listings.length > 0
                ? `
Dữ liệu tin đăng hiện có:
- Số lượng: ${listings.length}
- Giá thấp nhất: ${validPrices.length ? Math.min(...validPrices).toLocaleString('vi-VN') : 'không rõ'} VND
- Giá cao nhất: ${validPrices.length ? Math.max(...validPrices).toLocaleString('vi-VN') : 'không rõ'} VND
`
                : `
Hiện chưa có danh sách tin đăng cụ thể được truyền vào context.
Không được bịa tin đăng, địa chỉ, mã tin, giá cụ thể.
`;

        const extracted = context.extractedFilters || {};
        const conversationSummary = context.conversationSummary || '';
        const searchResultSummary = context.searchResultSummary || '';

        return `
Bạn là Mai — trợ lý tư vấn bất động sản của RealPrice.

VAI TRÒ:
- Tư vấn bất động sản toàn quốc Việt Nam.
- Hỗ trợ tìm nhà đất, đất nền, nhà phố, căn hộ, biệt thự, shophouse, mặt bằng, BĐS đầu tư.
- Trả lời bằng tiếng Việt.
- Thân thiện, chuyên nghiệp, ngắn gọn, đúng trọng tâm.
- Không mở đầu lặp lại "Mình là Mai..." nhiều lần.
- Dùng emoji rất nhẹ, chỉ khi phù hợp.

NGUYÊN TẮC BẮT BUỘC:
1. Luôn sử dụng thông tin trong extractedFilters, conversationSummary và searchResultSummary.
2. Tuyệt đối không hỏi lại thông tin người dùng đã cung cấp.
3. Nếu đã có vị trí + loại BĐS + ngân sách, phải tư vấn ngay.
4. Nếu user chỉ hỏi giá khu vực, vẫn trả lời được dù thiếu loại BĐS.
5. Chỉ hỏi thêm khi thiếu thông tin bắt buộc thật sự.
6. Mỗi lần chỉ hỏi tối đa 1 câu.
7. Nếu user nói "check đi", "đừng hỏi nữa", "hỏi lòng vòng", "đã nói rồi", "nói ở trên rồi", hãy xin lỗi ngắn gọn rồi trả lời trực tiếp.
8. Nếu không có listings cụ thể, không bịa căn/lô/tin đăng cụ thể.

QUY TẮC KHI USER MUỐN CHECK GIÁ / TÌM VỊ TRÍ:
Trả lời theo cấu trúc:
- Xác nhận ngắn gọn nhu cầu đã hiểu.
- Nêu khu vực phù hợp nhất.
- Nêu nhận định giá / khả năng tìm được theo dữ liệu có sẵn.
- Gợi ý 3-5 vị trí/phường/đường nên ưu tiên.
- Nếu không có dữ liệu tin đăng cụ thể, nói rõ "Mai chưa có dữ liệu tin đăng cụ thể trong hệ thống đang mở".
- Không hỏi thêm nếu user đã yêu cầu đừng hỏi.

QUY TẮC KHI USER ĐANG KHÓ CHỊU:
- Bắt đầu bằng: "Xin lỗi bạn, Mai đã nắm rõ nhu cầu rồi..."
- Không giới thiệu lại bản thân.
- Không hỏi thêm cuối câu.
- Trả lời thẳng vào nhu cầu.

DỮ LIỆU ĐÃ TRÍCH XUẤT:
${JSON.stringify(extracted, null, 2)}

TÓM TẮT LỊCH SỬ:
${conversationSummary || 'Chưa có tóm tắt lịch sử.'}

TÓM TẮT KẾT QUẢ TÌM KIẾM / TIN ĐĂNG:
${searchResultSummary || 'Chưa có kết quả tìm kiếm cụ thể.'}

${listingContext}

YÊU CẦU CHỐNG BỊA:
- Không tạo địa chỉ giả.
- Không tạo mã tin giả.
- Không nói "có căn/lô này" nếu listings không có.
- Có thể khoanh vùng, phân tích thị trường, đề xuất phường/đường/khu vực.
`;
    }

    _getMockResponse(message, context = {}) {
        const filters = context.extractedFilters || this._parseMockFilters(message);
        const lower = this._removeVietnameseTones(String(message).toLowerCase());

        if (
            lower.includes('thanh khe') ||
            lower.includes('da nang') ||
            filters.district === 'Thanh Khê' ||
            filters.province === 'Đà Nẵng'
        ) {
            return {
                response:
                    'Xin lỗi bạn, Mai đã nắm rõ nhu cầu rồi: bạn đang tìm đất nền hoặc nhà phố gần biển ở Thanh Khê, Đà Nẵng, ngân sách khoảng 3 tỷ. Với tiêu chí này, nên ưu tiên Thanh Khê Tây, Thanh Khê Đông, Xuân Hà và Tam Thuận vì thuận trục biển Nguyễn Tất Thành. Thực tế khoảng 3 tỷ để lấy 100m² gần biển Thanh Khê sẽ khá khó, nên nên mở thêm phương án đất nhỏ 50-70m², nhà trong hẻm hoặc vị trí xa biển hơn một chút.',
                action: this._buildSearchAction(filters),
            };
        }

        return {
            response:
                'Mai có thể hỗ trợ bạn check giá, khoanh vùng và tìm BĐS theo vị trí, ngân sách, diện tích và loại hình. Bạn cho Mai khu vực bạn quan tâm nhé.',
            action: null,
        };
    }

    _parseMockFilters(message) {
        const original = String(message || '');
        const lower = this._removeVietnameseTones(original.toLowerCase());

        const filters = {
            listingTypes: [],
            locationIntents: [],
            amenities: [],
            missingRequiredFields: [],
        };

        if (lower.includes('da nang')) {
            filters.province = 'Đà Nẵng';
        }

        if (lower.includes('thanh khe')) {
            filters.district = 'Thanh Khê';
            filters.locationText = filters.province ? 'Thanh Khê, Đà Nẵng' : 'Thanh Khê';
        }

        if (lower.includes('hai chau')) filters.district = 'Hải Châu';
        if (lower.includes('son tra')) filters.district = 'Sơn Trà';
        if (lower.includes('binh thanh')) filters.district = 'Bình Thạnh';
        if (lower.includes('quan 1')) filters.district = 'Quận 1';

        if (lower.includes('gan bien')) {
            filters.locationIntents.push('gan_bien');
        }

        if (lower.includes('mat tien')) {
            filters.locationIntents.push('mat_tien');
        }

        if (lower.includes('hem xe hoi') || lower.includes('hxh')) {
            filters.locationIntents.push('hem_xe_hoi');
        }

        if (lower.includes('dat nen') || /\bdat\b/.test(lower)) {
            filters.listingTypes.push('dat_nen');
        }

        if (lower.includes('nha pho') || lower.includes('nha rieng') || /\bnha\b/.test(lower)) {
            filters.listingTypes.push('nha_pho');
        }

        if (lower.includes('chung cu') || lower.includes('can ho')) {
            filters.listingTypes.push('chung_cu');
        }

        if (lower.includes('biet thu') || lower.includes('villa')) {
            filters.listingTypes.push('biet_thu');
        }

        if (filters.listingTypes.length > 0) {
            filters.primaryListingType = filters.listingTypes[0];
        }

        const rangePriceMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu)?\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu)/);
        if (rangePriceMatch) {
            filters.minPrice = this._priceToNumber(rangePriceMatch[1], rangePriceMatch[2] || rangePriceMatch[4]);
            filters.maxPrice = this._priceToNumber(rangePriceMatch[3], rangePriceMatch[4]);
            filters.priceText = rangePriceMatch[0];
        } else {
            const singlePriceMatch = lower.match(/(?:khoang|tam|duoi|tren|toi da|ngan sach|gia)?\s*(\d+(?:[.,]\d+)?)\s*(ty|ti|trieu)/);
            if (singlePriceMatch) {
                const price = this._priceToNumber(singlePriceMatch[1], singlePriceMatch[2]);
                filters.priceText = singlePriceMatch[0].trim();

                if (lower.includes('duoi') || lower.includes('toi da')) {
                    filters.maxPrice = price;
                } else if (lower.includes('tren')) {
                    filters.minPrice = price;
                } else if (lower.includes('khoang') || lower.includes('tam')) {
                    filters.minPrice = Math.round(price * 0.9);
                    filters.maxPrice = Math.round(price * 1.1);
                } else {
                    filters.minPrice = price;
                    filters.maxPrice = price;
                }
            }
        }

        const areaRangeMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*m(?:2|²)?/);
        if (areaRangeMatch) {
            filters.minArea = Number(areaRangeMatch[1].replace(',', '.'));
            filters.maxArea = Number(areaRangeMatch[2].replace(',', '.'));
            filters.areaText = areaRangeMatch[0];
        } else {
            const areaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*m(?:2|²)?/);
            if (areaMatch) {
                const area = Number(areaMatch[1].replace(',', '.'));

                if (lower.includes('khoang') || lower.includes('tam')) {
                    filters.minArea = Math.round(area * 0.9);
                    filters.maxArea = Math.round(area * 1.1);
                } else {
                    filters.minArea = area;
                    filters.maxArea = area;
                }

                filters.areaText = areaMatch[0];
            }
        }

        if (
            lower.includes('dung hoi') ||
            lower.includes('hoi long vong') ||
            lower.includes('da noi') ||
            lower.includes('check nhanh') ||
            lower.includes('check di')
        ) {
            filters.dontAskMore = true;
            filters.userEmotion = 'annoyed';
        }

        if (lower.includes('gia') || lower.includes('check')) {
            filters.wantsPriceCheck = true;
        }

        if (lower.includes('vi tri') || lower.includes('khu nao') || lower.includes('o dau')) {
            filters.wantsLocationSuggestion = true;
        }

        if (lower.includes('tim') || lower.includes('loc') || lower.includes('mua')) {
            filters.wantsListingSearch = true;
        }

        filters.confidence = 0.65;

        return this._normalizeFilters(filters);
    }

    _parseAction(aiResponse, context = {}) {
        const filters = context.extractedFilters || {};

        const hasLocation = Boolean(
            filters.province ||
            filters.district ||
            filters.ward ||
            filters.locationText
        );

        const hasSearchIntent = Boolean(
            filters.wantsListingSearch ||
            filters.wantsPriceCheck ||
            filters.wantsLocationSuggestion ||
            (Array.isArray(filters.listingTypes) && filters.listingTypes.length > 0)
        );

        if (hasLocation || hasSearchIntent) {
            return this._buildSearchAction(filters);
        }

        const lower = this._removeVietnameseTones(String(aiResponse || '').toLowerCase());

        if (lower.includes('gia') && (lower.includes('trieu') || lower.includes('ty'))) {
            return { type: 'filterPrice' };
        }

        return null;
    }

    _buildSearchAction(filters = {}) {
        return {
            type: 'searchProperties',
            filters: {
                province: filters.province || null,
                district: filters.district || null,
                ward: filters.ward || null,
                street: filters.street || null,
                project: filters.project || null,
                locationText: filters.locationText || null,
                listingTypes: filters.listingTypes || [],
                primaryListingType: filters.primaryListingType || null,
                minPrice: filters.minPrice || null,
                maxPrice: filters.maxPrice || null,
                minArea: filters.minArea || null,
                maxArea: filters.maxArea || null,
                locationIntents: filters.locationIntents || [],
                amenities: filters.amenities || [],
                purpose: filters.purpose || null,
            },
        };
    }

    _safeJsonParse(content, fallback = {}) {
        if (!content || typeof content !== 'string') {
            return fallback;
        }

        try {
            const clean = content
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();

            return JSON.parse(clean);
        } catch (error) {
            const match = content.match(/\{[\s\S]*\}/);

            if (!match) {
                return fallback;
            }

            try {
                return JSON.parse(match[0]);
            } catch (innerError) {
                return fallback;
            }
        }
    }

    _normalizeMessage(message) {
        return String(message || '').trim();
    }

    _priceToNumber(value, unit) {
        const numeric = Number(String(value).replace(',', '.'));
        const normalizedUnit = this._removeVietnameseTones(String(unit || '').toLowerCase());

        if (!Number.isFinite(numeric)) {
            return null;
        }

        if (normalizedUnit === 'ty' || normalizedUnit === 'ti') {
            return Math.round(numeric * 1000000000);
        }

        if (normalizedUnit === 'trieu') {
            return Math.round(numeric * 1000000);
        }

        return numeric;
    }

    _removeVietnameseTones(str) {
        return String(str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    }
}

module.exports = ChatService;