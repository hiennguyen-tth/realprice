// SEO Configuration and utilities

export const SEO_CONFIG = {
    // Site information
    siteName: "RealPrice",
    siteUrl: process.env.NEXTAUTH_URL || "https://realprice.vn",
    description: "So sánh giá bất động sản theo vị trí tại Việt Nam. Heatmap giá, định giá ngân hàng, lịch sử giá theo từng đường phố.",

    // Image dimensions for Open Graph
    ogImageWidth: 1200,
    ogImageHeight: 630,

    // AdSense configuration
    adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,

    // Google configuration
    googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,

    // Social media
    social: {
        facebook: "https://www.facebook.com/realprice.vn",
        twitter: "https://twitter.com/realprice",
        instagram: "https://www.instagram.com/realprice.vn",
    },

    // Contact
    email: "support@realprice.vn",
    phone: "+84 28 xxxx xxxx",

    // Location
    address: {
        country: "Vietnam",
        city: "Ho Chi Minh City",
    },
};

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string = ""): string {
    return `${SEO_CONFIG.siteUrl}${path}`;
}

/**
 * Generate OG image URL
 */
export function getOgImageUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${SEO_CONFIG.siteUrl}/api/og/${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
    }
    return url.toString();
}

/**
 * Website structured data (JSON-LD)
 */
export function getWebsiteSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SEO_CONFIG.siteName,
        url: SEO_CONFIG.siteUrl,
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${SEO_CONFIG.siteUrl}/tim-kiem?q={search_term_string}`,
            },
            query_input: "required name=search_term_string",
        },
    };
}

/**
 * Organization structured data (JSON-LD)
 */
export function getOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        name: SEO_CONFIG.siteName,
        url: SEO_CONFIG.siteUrl,
        logo: `${SEO_CONFIG.siteUrl}/logo.png`,
        description: SEO_CONFIG.description,
        email: SEO_CONFIG.email,
        phone: SEO_CONFIG.phone,
        address: {
            "@type": "PostalAddress",
            addressCountry: SEO_CONFIG.address.country,
            addressLocality: SEO_CONFIG.address.city,
        },
        sameAs: Object.values(SEO_CONFIG.social),
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Support",
            email: SEO_CONFIG.email,
        },
    };
}

/**
 * Breadcrumb structured data helper
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}
