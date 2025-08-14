# Changelog

All notable changes to the Professional PDF Editor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-08-14

### Security Fixes
- Removed global certificate bypass in main process
- Patched ArrayBuffer detachment vulnerability in OCR/TextExtractor
- Added save-validation checks (EOF, header verification)
- Hardened CSP policy by removing unsafe-eval and unsafe-inline
- Added comprehensive input validation for all IPC channels
- Implemented path sanitization and validation utilities

### Test Improvements
- Added unit tests for core services (PDFService, AnnotationService, OCRService)
- Fixed ESLint-Jest integration in jest.config.js
- Configured test directories for better organization

### CI/CD
- Created GitHub Actions workflow for automated testing
- Added linting, testing, building, and security audit steps
- Configured coverage reporting

### Performance
- Added benchmarking script for performance monitoring
- Created performance logging infrastructure

### Documentation
- Updated architecture documentation with current implementation details
- Added API reference for core services

## [1.0.0] - 2024-06-15

### Added
- Initial release of Professional PDF Editor
- PDF viewing and basic editing capabilities
- Annotation tools (highlight, text, shapes)
- OCR functionality with multi-language support
- PDF manipulation features (merge, split, rotate)
- Security features (encryption, permissions)