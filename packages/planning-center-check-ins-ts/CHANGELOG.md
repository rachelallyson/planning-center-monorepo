# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-20

### ⚠️ **Breaking Changes**

- **Module Consolidation**: Removed standalone `checkInTimes`, `eventPeriods`, and `personEvents` modules
  - Check-in times now accessible via `client.checkIns.getCheckInTimes(checkInId)`
  - Event periods now accessible via `client.events.getEventPeriods(eventId)`
  - Person events now accessible via `client.events.getPersonEvents(eventId)`
- **Reduced Module Count**: Client now has 16 modules instead of 19

### ✨ **New Features**

- **Enhanced Events Module**: Added `getAllEventPeriods()`, `getAllEvents()`, and `getEventTimesForPeriod()` methods
- **Improved Pagination**: Added `getAllPages()` support for comprehensive data retrieval
- **Better Type Safety**: Replaced `any` types with proper `Meta` and `TopLevelLinks` interfaces
- **Comprehensive Integration Tests**: Added type validation and endpoint coverage tests

### 🔧 **Technical Improvements**

- Consolidated related functionality into parent modules for better API design
- Enhanced error handling and type validation throughout
- Updated Jest configuration for local package resolution

## [1.0.0] - 2024-XX-XX

### Added

- Initial release of Check-Ins API client
- Full TypeScript type definitions for all 24 Check-Ins API resource types
- Module-based architecture with specialized modules for each resource domain
- Support for all Check-Ins API endpoints
- Batch operations support
- Event system for monitoring requests, errors, and rate limits
- Comprehensive error handling
- Rate limiting and retry logic
