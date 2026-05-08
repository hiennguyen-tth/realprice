# SEO & Ads Configuration Guide

## Overview
This document describes the SEO and advertising setup for RealPrice website.

## Files Created

### 1. `/public/ads.txt`
- **Purpose**: Google Ad Manager inventory declaration
- **Location**: Root public directory (automatically served at https://realprice.vn/ads.txt)
- **Content**: Google Publisher ID and verification code
- **Format**: Plain text file with publisher entries

### 2. `/public/robots.txt`
- **Purpose**: Search engine crawler instructions
- **Location**: Root public directory (automatically served at https://realprice.vn/robots.txt)
- **Rules**:
  - Allows crawling of public content
  - Disallows private routes (/api/, /tai-khoan/, /admin/)
  - Points to sitemap.xml
  - Specific rules for Googlebot and Bingbot

### 3. `/public/humans.txt`
- **Purpose**: Human-readable information about site creators
- **Format**: Convention for website attribution

## Environment Variables

Update your `.env.local` with:

```bash
# Google AdSense Publisher ID
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-2330743593269954

# Google Site Verification code (from Google Search Console)
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code-here
```

## Configuration Files Updated

### next.config.js
- Added environment variables for ads and verification
- Added security headers:
  - X-UA-Compatible
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Referrer-Policy
  - Permissions-Policy

### src/app/layout.tsx
- Added mobile optimization meta tags
- Added Apple mobile web app support
- Added organization schema (JSON-LD)
- Added verification and AdSense meta tags
- Improved viewport configuration

### .env.local.example
- Added AdSense configuration
- Added Google Site Verification placeholder

## Existing SEO Features

### Metadata
- Base metadata configuration with proper titles, descriptions, keywords
- Dynamic metadata generation for district and land detail pages
- OpenGraph and Twitter card configurations

### Structured Data (JSON-LD)
- Organization schema
- Website schema
- BreadcrumbList schema
- RealEstateListing schema
- Place schema for districts

### Sitemap
- Dynamic sitemap generation (src/app/sitemap.ts)
- Includes homepage, major routes, and district pages
- Proper lastModified and priority values

## SEO Best Practices Implemented

1. **Mobile Optimization**
   - Responsive viewport configuration
   - Mobile-friendly meta tags
   - Touch icon support

2. **Structured Data**
   - JSON-LD schemas for search engines
   - Proper semantic markup
   - Organization and business information

3. **Security Headers**
   - Content security policies
   - Clickjacking prevention
   - XSS protection

4. **Search Engine Visibility**
   - Robots.txt with proper rules
   - Sitemap with dynamic content
   - Canonical URLs
   - Proper noindex/nofollow where needed

5. **Social Sharing**
   - OpenGraph meta tags
   - Twitter cards
   - Proper image sizing (1200x630)

6. **Performance SEO**
   - Proper cache control headers
   - Image optimization
   - Fast page load times

## Ads Configuration

### AdSense Setup
1. Add your publisher ID to `NEXT_PUBLIC_ADSENSE_CLIENT` in .env.local
2. The AdSense script is loaded via the Analytics component
3. Ads.txt file verifies your publisher account

### Ad Placements
- Configured in `src/components/common/Analytics.tsx`
- AdSense component loads the ad script
- Can be customized with specific ad units

## Verification

### Google Search Console
1. Go to Google Search Console
2. Add property for realprice.vn
3. Verify using the meta tag method
4. Add the verification code to NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

### Google AdSense
1. Connect AdSense to your publisher account
2. Verify ads.txt at https://realprice.vn/ads.txt
3. Monitor ad performance in AdSense dashboard

## Monitoring & Maintenance

1. **Monitor in Google Search Console**
   - Check indexing status
   - Monitor crawl errors
   - Track search analytics
   - Fix any structured data issues

2. **Monitor in Google Analytics**
   - Check traffic sources
   - Track user behavior
   - Monitor conversion funnels

3. **Monitor in AdSense**
   - Check ad revenue
   - Monitor ad impressions
   - Verify ads.txt status

## Future Improvements

1. AMP pages for faster mobile loading
2. Rich snippets for product reviews
3. Video schema for video content
4. FAQ schema for common questions
5. Event schema for future listings
6. Progressive Web App (PWA) features

## Common Issues & Solutions

### ads.txt not found
- **Solution**: Ensure /public/ads.txt exists and is readable
- **Verify**: Visit https://realprice.vn/ads.txt in browser

### Robots.txt issues
- **Solution**: Check rules don't block important content
- **Verify**: Use Google Search Console robots.txt tester

### Structured data errors
- **Solution**: Use Google's Structured Data Testing Tool
- **Verify**: Check for JSON-LD validation errors

## References

- [Google Search Central](https://developers.google.com/search)
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)
- [Schema.org Markup](https://schema.org/)
- [Google AdSense Help](https://support.google.com/adsense/)
- [Google AdManager ads.txt](https://support.google.com/admanager/answer/7441288)
