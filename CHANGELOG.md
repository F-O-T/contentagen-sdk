# Changelog

All notable changes to this package will be documented in this file.

## [0.9.1] - 2025-09-01
### Security
- Fixed XSS/script-breakout vulnerability in PostHog helper by properly escaping JSON before injection into script tags
- Added comprehensive input sanitization to prevent script injection attacks

## [0.9.0] - 2025-09-01
### Added
- New PostHog analytics helper for tracking blog post views in build-time frameworks like AstroJS
- `createPostHogHelper()` factory function for creating PostHog tracking instances
- `PostHogHelper.trackBlogPostView()` method for generating tracking scripts
- Comprehensive tests for the PostHog helper functionality
- `PostHogConfig` type for PostHog configuration options

### Changed
- Moved PostHog helper to separate `posthog.ts` file for better organization
- Simplified PostHog configuration to only require API key and optional host
- Reduced bundle size by removing unnecessary PostHog initialization code

### Security
- Fixed XSS/script-breakout vulnerability in PostHog helper by properly escaping JSON before injection into script tags

## [0.8.0] - 2025-08-27
### Added
- New `getAuthorByAgentId` procedure: fetches author name and profile photo by agent ID.
- Tests for `getAuthorByAgentId`.

### Breaking
- `getContentBySlug` no longer returns the `agent` field in its response (schema change).

### Changed
- Updated and added tests for all procedures to ensure correct behavior and type safety.

## [0.7.0] - 2025-08-27
### Added
- New `getRelatedSlugs` procedure: fetches related post slugs for a given content slug and agent ID.

### Changed
- `getContentBySlug` now returns the agent persona config in its response.
- Updated and added tests for both procedures to ensure correct behavior and type safety.

## [0.6.0] - 2025-08-20
### Breaking
- Removed deprecated `generating` status from all content-related types, schemas, and API validation. The SDK now only supports `draft` and `approved` statuses for content.

## [0.5.0] - 2025-08-17
### Changed
- Removed `userId` from the return types of content-related API responses for improved privacy and schema clarity.
- Updated `listContentByAgent` input schema to accept an array of agent IDs instead of a single agent ID
- Enhanced date transformation to properly convert ISO strings to Date objects in API responses
- Improved error handling with more descriptive error messages

## [0.4.6] - 2025-08-13
### Changed
- Improved `listContentByAgent`: now supports advanced pagination (`limit` and `page`), status filtering (`draft`, `approved`, `generating`), and stricter input validation via Zod schemas.
- Returns a full content list response including post metadata, image URL, status, and total count.
- See README for updated usage and schema details.

## [0.4.1] - 2025-08-12
### Added
- Added new function `getContentBySlug` to the SDK. This function allows fetching a content item by its slug.

