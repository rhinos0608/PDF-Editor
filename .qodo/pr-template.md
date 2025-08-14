# Pull Request Template for Professional PDF Editor

## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
<!-- Mark the relevant option with an "x" -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Security enhancement
- [ ] Refactoring (no functional changes)
- [ ] Test improvements

## Areas Affected
<!-- Mark all areas that are affected by this change -->
- [ ] Main Process (Electron)
- [ ] Renderer Process (React UI)
- [ ] Preload Scripts
- [ ] PDF Processing
- [ ] File I/O Operations
- [ ] Security Features
- [ ] User Interface
- [ ] Testing
- [ ] Documentation
- [ ] Build/Deploy Process

## PDF Editor Specific Checklist
<!-- Ensure these items are addressed for PDF Editor functionality -->
- [ ] PDF rendering performance is maintained or improved
- [ ] Memory usage is optimized for large PDF files
- [ ] File security and validation is properly implemented
- [ ] User data privacy is maintained
- [ ] Cross-platform compatibility is ensured (Windows, macOS, Linux)
- [ ] Accessibility features are preserved or enhanced
- [ ] Error handling for corrupted PDF files is robust

## Security Checklist
<!-- Critical for Electron applications -->
- [ ] Context isolation is maintained
- [ ] Node integration is properly restricted
- [ ] IPC communication is secure and validated
- [ ] User input is sanitized (especially for PDF content)
- [ ] File system access is properly controlled
- [ ] No sensitive data is logged or exposed
- [ ] External dependencies are from trusted sources

## Testing
<!-- Describe the testing performed -->
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed
- [ ] Performance testing completed (for PDF operations)
- [ ] Security testing completed
- [ ] Cross-platform testing completed

### Test Cases Covered
<!-- List specific test cases or scenarios tested -->
- [ ] PDF loading and rendering
- [ ] PDF editing operations (if applicable)
- [ ] File save/export functionality
- [ ] Error scenarios (corrupted files, network issues, etc.)
- [ ] Large file handling
- [ ] Memory usage under load

## Performance Impact
<!-- Describe any performance implications -->
- [ ] No performance impact
- [ ] Performance improved
- [ ] Performance impact assessed and acceptable
- [ ] Performance benchmarks included

### Performance Metrics
<!-- Include relevant metrics if applicable -->
- Memory usage: 
- Startup time: 
- PDF loading time: 
- Bundle size impact: 

## Breaking Changes
<!-- List any breaking changes and migration steps -->
- [ ] No breaking changes
- [ ] Breaking changes documented below

### Migration Guide
<!-- If there are breaking changes, provide migration instructions -->

## Dependencies
<!-- List any new dependencies or dependency updates -->
- [ ] No new dependencies
- [ ] New dependencies listed and justified below
- [ ] Dependency security scan completed

### New Dependencies
<!-- List new dependencies with justification -->

## Documentation
<!-- Ensure documentation is updated -->
- [ ] Code comments updated
- [ ] README updated (if needed)
- [ ] API documentation updated (if needed)
- [ ] User guide updated (if needed)
- [ ] Architecture documentation updated (if needed)

## Deployment Notes
<!-- Any special deployment considerations -->
- [ ] No special deployment requirements
- [ ] Deployment notes provided below

### Special Deployment Requirements
<!-- Describe any special deployment steps -->

## Screenshots/Videos
<!-- Include screenshots or videos for UI changes -->

## Related Issues
<!-- Link to related issues -->
Fixes #
Closes #
Related to #

## Additional Notes
<!-- Any additional information for reviewers -->

---

## For Reviewers
Please pay special attention to:
- [ ] Electron security best practices
- [ ] PDF processing efficiency
- [ ] Memory management
- [ ] Error handling robustness
- [ ] Cross-platform compatibility
- [ ] User experience impact

## Qodo AI Review
<!-- This section will be populated by Qodo AI -->
- [ ] Qodo AI review completed
- [ ] Security scan passed
- [ ] Performance analysis completed
- [ ] Code quality metrics acceptable