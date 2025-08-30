# Swagger UI CDN and Local Documentation Guide

## Overview

The Spare Parts Service now provides robust API documentation with both CDN and local fallback options to ensure documentation is always accessible.

## Documentation Endpoints

### 1. Primary Documentation (CDN-based)
- **URL**: `http://localhost:4006/docs`
- **Description**: Interactive Swagger UI using the latest CDN resources
- **CDN Resources Used**:
  - `https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css`
  - `https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js`
  - `https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js`
- **Features**:
  - Latest Swagger UI version (5.17.14)
  - Enhanced error handling and loading states
  - Automatic fallback suggestions if CDN fails
  - Custom styling with EV91 Platform branding

### 2. Local Documentation (Fallback)
- **URL**: `http://localhost:4006/docs-local`
- **Description**: Local Swagger UI using bundled assets
- **Dependencies**: `swagger-ui-express` package
- **Features**:
  - Works without internet connection
  - Guaranteed availability
  - Same functionality as CDN version
  - Custom EV91 Platform styling

### 3. API Specification Endpoints
- **YAML Format**: `http://localhost:4006/api-docs/yaml`
- **JSON Format**: `http://localhost:4006/api-docs/json`

## CDN Resource Information

### Current CDN Provider
- **Provider**: unpkg.com
- **Version**: 5.17.14 (Latest stable as of August 2025)
- **Reliability**: High uptime, global CDN
- **Fallback**: Automatic redirect to local version on failure

### CDN Benefits
1. **Latest Features**: Always uses the most recent Swagger UI
2. **Performance**: Fast loading from global CDN
3. **No Bundle Size**: Doesn't increase application size
4. **Automatic Updates**: Bug fixes and improvements

### CDN Considerations
1. **Internet Dependency**: Requires active internet connection
2. **External Dependency**: Relies on third-party service
3. **Potential Blocking**: Corporate firewalls may block CDN

## Error Handling and Fallbacks

### Automatic Fallback Scenarios
1. **CDN Unavailable**: Shows link to local documentation
2. **Script Loading Failure**: Displays error with fallback option
3. **Timeout**: 10-second timeout with fallback suggestion
4. **Network Issues**: Graceful degradation to local version

### Manual Fallback Options
- Users can always access `/docs-local` directly
- Error messages include direct links to local version
- Both endpoints provide identical functionality

## Implementation Details

### Enhanced Loading Experience
```javascript
// Features implemented:
- Loading indicators
- Error handling
- Timeout management
- Script failure detection
- Automatic fallback suggestions
```

### Custom Styling
```css
/* EV91 Platform branding */
.swagger-ui .topbar {
    background-color: #1976d2;
}
```

### Local Assets Integration
```javascript
// Uses swagger-ui-express for local serving
const swaggerDocument = yaml.load(yamlContent);
const html = swaggerUi.generateHTML(swaggerDocument, options);
```

## Testing and Validation

### Validation Script Updates
The `validate-openapi-simple.ps1` script now tests:
1. CDN-based documentation endpoint (`/docs`)
2. Local documentation endpoint (`/docs-local`)
3. YAML specification endpoint
4. JSON specification endpoint

### Testing Commands
```powershell
# Test all endpoints
.\validate-openapi-simple.ps1 all

# Test only documentation endpoints
.\validate-openapi-simple.ps1 test
```

## Usage Recommendations

### For Development
- **Primary**: Use `/docs` for daily development work
- **Fallback**: Use `/docs-local` if CDN is blocked or slow
- **Integration**: Use `/api-docs/yaml` for client generation

### For Production
- **Primary**: `/docs` provides the best user experience
- **Reliability**: `/docs-local` ensures documentation is always available
- **CI/CD**: Test both endpoints in deployment pipelines

### For Corporate Environments
- **Firewall Issues**: Use `/docs-local` if CDN is blocked
- **Security**: Local version doesn't make external requests
- **Compliance**: All documentation served from internal infrastructure

## Maintenance

### Updating CDN Version
1. Update version in the CDN URLs in `src/index.ts`
2. Test with validation script
3. Verify both endpoints work correctly

### Updating Local Assets
1. Update `swagger-ui-express` package version
2. Run `npm update swagger-ui-express`
3. Test local documentation endpoint

### Monitoring
- Monitor CDN availability and performance
- Track usage of fallback endpoints
- Set up alerts for documentation endpoint failures

## Troubleshooting

### Common Issues

#### CDN Loading Failures
- **Symptoms**: "Failed to load required resources" error
- **Solution**: Use `/docs-local` or check internet connectivity
- **Prevention**: Monitor CDN uptime

#### Local Documentation Not Working
- **Symptoms**: 500 error or blank page on `/docs-local`
- **Solution**: Check `swagger-ui-express` package installation
- **Prevention**: Include in dependency tests

#### OpenAPI Spec Not Found
- **Symptoms**: 404 error on spec endpoints
- **Solution**: Ensure `openapi.yaml` exists in service root
- **Prevention**: Include spec file in build process

### Support Contacts
- **Development Team**: For API specification issues
- **DevOps Team**: For CDN or infrastructure issues
- **Security Team**: For corporate firewall configurations

---

**Status**: ✅ Fully Implemented and Tested
**Primary Documentation**: http://localhost:4006/docs
**Fallback Documentation**: http://localhost:4006/docs-local
**Last Updated**: August 6, 2025
