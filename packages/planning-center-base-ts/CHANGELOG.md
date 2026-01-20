# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-01-20

### ✨ **New Features**

- **Direct Personal Access Token Configuration**: Added support for passing `personalAccessTokenSecret` directly in config (alternative to environment variables)
- **Flexible Authentication**: Choose between environment variables or direct config based on your needs

## [1.0.1] - 2026-01-20

### ✨ **New Features**

- **Personal Access Token Support**: Added support for PCO personal access tokens using `client_id:secret` format with HTTP Basic Auth
- **HTTPS Fallback**: Automatic fallback to Node.js HTTPS when fetch is unavailable (fixes Jest compatibility)
- **Enhanced Error Handling**: Better handling of authentication and network errors

## [1.0.0] - 2026-01-XX

### ✨ **New Features**

- Initial release of Planning Center Base TypeScript library
- HTTP client with authentication, rate limiting, and error handling
- JSON:API 1.0 type definitions and utilities
- Event system for monitoring requests and errors
- Batch operations support
- Pagination helpers
- Comprehensive error handling with typed errors
