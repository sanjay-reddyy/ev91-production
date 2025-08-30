#!/bin/bash

# EV91 Platform - OpenAPI Validation and Testing Script
# This script validates the OpenAPI specification and tests the documentation endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_URL="http://localhost:4006"
OPENAPI_FILE="$SCRIPT_DIR/openapi.yaml"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_section() {
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

# Function to check if service is running
check_service_health() {
    log_info "Checking if spare parts service is running..."
    
    if curl -s -f "$SERVICE_URL/health" > /dev/null 2>&1; then
        log_success "Spare parts service is running"
        return 0
    else
        log_error "Spare parts service is not running at $SERVICE_URL"
        log_info "Please start the service with: npm run dev"
        return 1
    fi
}

# Function to validate OpenAPI file
validate_openapi_file() {
    log_info "Validating OpenAPI specification file..."
    
    if [[ ! -f "$OPENAPI_FILE" ]]; then
        log_error "OpenAPI file not found: $OPENAPI_FILE"
        return 1
    fi
    
    # Check if file is valid YAML
    if command -v python3 > /dev/null 2>&1; then
        if python3 -c "import yaml; yaml.safe_load(open('$OPENAPI_FILE'))" 2>/dev/null; then
            log_success "OpenAPI file is valid YAML"
        else
            log_error "OpenAPI file contains invalid YAML syntax"
            return 1
        fi
    else
        log_warning "Python3 not available, skipping YAML validation"
    fi
    
    # Check file size and basic structure
    local file_size=$(wc -c < "$OPENAPI_FILE")
    if [[ $file_size -gt 1000 ]]; then
        log_success "OpenAPI file size looks good ($file_size bytes)"
    else
        log_warning "OpenAPI file seems small ($file_size bytes)"
    fi
    
    # Check for required sections
    if grep -q "openapi:" "$OPENAPI_FILE" && \
       grep -q "info:" "$OPENAPI_FILE" && \
       grep -q "paths:" "$OPENAPI_FILE" && \
       grep -q "components:" "$OPENAPI_FILE"; then
        log_success "OpenAPI file contains required sections"
    else
        log_error "OpenAPI file missing required sections"
        return 1
    fi
    
    return 0
}

# Function to test documentation endpoints
test_documentation_endpoints() {
    log_info "Testing documentation endpoints..."
    
    # Test YAML endpoint
    log_info "Testing /api-docs/yaml endpoint..."
    if curl -s -f "$SERVICE_URL/api-docs/yaml" > /dev/null 2>&1; then
        log_success "YAML endpoint is accessible"
        
        # Check if response is YAML
        local response=$(curl -s "$SERVICE_URL/api-docs/yaml")
        if echo "$response" | head -1 | grep -q "openapi:"; then
            log_success "YAML endpoint returns valid OpenAPI content"
        else
            log_warning "YAML endpoint response doesn't look like OpenAPI spec"
        fi
    else
        log_error "YAML endpoint is not accessible"
    fi
    
    # Test JSON endpoint
    log_info "Testing /api-docs/json endpoint..."
    if curl -s -f "$SERVICE_URL/api-docs/json" > /dev/null 2>&1; then
        log_success "JSON endpoint is accessible"
        
        # Check if response is valid JSON
        local response=$(curl -s "$SERVICE_URL/api-docs/json")
        if echo "$response" | jq . > /dev/null 2>&1; then
            log_success "JSON endpoint returns valid JSON"
        else
            log_warning "JSON endpoint doesn't return valid JSON"
        fi
    else
        log_error "JSON endpoint is not accessible"
    fi
    
    # Test documentation UI
    log_info "Testing /docs endpoint..."
    if curl -s -f "$SERVICE_URL/docs" > /dev/null 2>&1; then
        log_success "Documentation UI endpoint is accessible"
        
        # Check if response contains HTML
        local response=$(curl -s "$SERVICE_URL/docs")
        if echo "$response" | grep -q "<html>" && echo "$response" | grep -q "swagger"; then
            log_success "Documentation UI returns Swagger interface"
        else
            log_warning "Documentation UI doesn't appear to be Swagger interface"
        fi
    else
        log_error "Documentation UI endpoint is not accessible"
    fi
}

# Function to analyze API coverage
analyze_api_coverage() {
    log_info "Analyzing API endpoint coverage..."
    
    if [[ ! -f "$OPENAPI_FILE" ]]; then
        log_error "Cannot analyze coverage: OpenAPI file not found"
        return 1
    fi
    
    # Count endpoints in OpenAPI spec
    local total_paths=$(grep -c "^  /" "$OPENAPI_FILE" || echo "0")
    local get_endpoints=$(grep -c "get:" "$OPENAPI_FILE" || echo "0")
    local post_endpoints=$(grep -c "post:" "$OPENAPI_FILE" || echo "0")
    local put_endpoints=$(grep -c "put:" "$OPENAPI_FILE" || echo "0")
    local patch_endpoints=$(grep -c "patch:" "$OPENAPI_FILE" || echo "0")
    local delete_endpoints=$(grep -c "delete:" "$OPENAPI_FILE" || echo "0")
    
    log_info "API Endpoint Summary:"
    log_info "  Total Paths: $total_paths"
    log_info "  GET endpoints: $get_endpoints"
    log_info "  POST endpoints: $post_endpoints"
    log_info "  PUT endpoints: $put_endpoints"
    log_info "  PATCH endpoints: $patch_endpoints"
    log_info "  DELETE endpoints: $delete_endpoints"
    
    # Check for comprehensive CRUD coverage
    if [[ $get_endpoints -gt 0 && $post_endpoints -gt 0 && $put_endpoints -gt 0 && $delete_endpoints -gt 0 ]]; then
        log_success "API provides comprehensive CRUD operations"
    else
        log_warning "API may be missing some CRUD operations"
    fi
    
    # Check for documented schemas
    local schema_count=$(grep -c "^    [A-Z].*:" "$OPENAPI_FILE" | head -1 || echo "0")
    log_info "  Documented Schemas: $schema_count"
    
    if [[ $schema_count -gt 10 ]]; then
        log_success "Good schema documentation coverage"
    else
        log_warning "Consider adding more schema documentation"
    fi
}

# Function to check API examples
check_api_examples() {
    log_info "Checking API examples and documentation quality..."
    
    # Check for examples in the spec
    if grep -q "example:" "$OPENAPI_FILE"; then
        log_success "OpenAPI spec contains examples"
    else
        log_warning "Consider adding examples to improve documentation"
    fi
    
    # Check for descriptions
    local description_count=$(grep -c "description:" "$OPENAPI_FILE" || echo "0")
    log_info "  Description fields: $description_count"
    
    if [[ $description_count -gt 20 ]]; then
        log_success "Good description coverage"
    else
        log_warning "Consider adding more descriptions for better documentation"
    fi
    
    # Check for security documentation
    if grep -q "security:" "$OPENAPI_FILE" && grep -q "bearerAuth:" "$OPENAPI_FILE"; then
        log_success "Security scheme is documented"
    else
        log_warning "Security scheme documentation could be improved"
    fi
}

# Function to generate documentation report
generate_documentation_report() {
    local report_file="$SCRIPT_DIR/openapi-validation-report.md"
    
    log_info "Generating documentation report..."
    
    cat > "$report_file" << EOF
# OpenAPI Documentation Validation Report

**Generated**: $(date)
**Service URL**: $SERVICE_URL
**OpenAPI File**: $OPENAPI_FILE

## Validation Results

### File Validation
- OpenAPI file exists: $(test -f "$OPENAPI_FILE" && echo "✅" || echo "❌")
- File size: $(wc -c < "$OPENAPI_FILE" 2>/dev/null || echo "0") bytes
- Contains required sections: $(grep -q "openapi:\|info:\|paths:\|components:" "$OPENAPI_FILE" && echo "✅" || echo "❌")

### Endpoint Coverage
- Total paths: $(grep -c "^  /" "$OPENAPI_FILE" 2>/dev/null || echo "0")
- GET endpoints: $(grep -c "get:" "$OPENAPI_FILE" 2>/dev/null || echo "0")
- POST endpoints: $(grep -c "post:" "$OPENAPI_FILE" 2>/dev/null || echo "0")
- PUT endpoints: $(grep -c "put:" "$OPENAPI_FILE" 2>/dev/null || echo "0")
- PATCH endpoints: $(grep -c "patch:" "$OPENAPI_FILE" 2>/dev/null || echo "0")
- DELETE endpoints: $(grep -c "delete:" "$OPENAPI_FILE" 2>/dev/null || echo "0")

### Documentation Quality
- Description fields: $(grep -c "description:" "$OPENAPI_FILE" 2>/dev/null || echo "0")
- Example fields: $(grep -c "example:" "$OPENAPI_FILE" 2>/dev/null || echo "0")
- Schema definitions: $(grep -c "^    [A-Z].*:" "$OPENAPI_FILE" 2>/dev/null | head -1 || echo "0")

### Service Endpoints Status
EOF

    # Test endpoints and add to report
    if curl -s -f "$SERVICE_URL/health" > /dev/null 2>&1; then
        echo "- Health endpoint: ✅" >> "$report_file"
    else
        echo "- Health endpoint: ❌" >> "$report_file"
    fi
    
    if curl -s -f "$SERVICE_URL/docs" > /dev/null 2>&1; then
        echo "- Documentation UI: ✅" >> "$report_file"
    else
        echo "- Documentation UI: ❌" >> "$report_file"
    fi
    
    if curl -s -f "$SERVICE_URL/api-docs/yaml" > /dev/null 2>&1; then
        echo "- YAML endpoint: ✅" >> "$report_file"
    else
        echo "- YAML endpoint: ❌" >> "$report_file"
    fi
    
    if curl -s -f "$SERVICE_URL/api-docs/json" > /dev/null 2>&1; then
        echo "- JSON endpoint: ✅" >> "$report_file"
    else
        echo "- JSON endpoint: ❌" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

## Recommendations

1. **Keep Documentation Updated**: Ensure OpenAPI spec is updated when adding new endpoints
2. **Add Examples**: Include request/response examples for better developer experience
3. **Comprehensive Testing**: Test all documented endpoints regularly
4. **Security Documentation**: Ensure all security requirements are clearly documented
5. **Error Handling**: Document all possible error responses and status codes

## Next Steps

- Review any failed validations above
- Test endpoints using the interactive documentation at $SERVICE_URL/docs
- Consider implementing API versioning for future changes
- Set up automated validation in CI/CD pipeline

---
*Report generated by OpenAPI validation script*
EOF

    log_success "Documentation report generated: $report_file"
}

# Function to show usage
show_usage() {
    echo "OpenAPI Validation and Testing Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  validate    Validate OpenAPI specification (default)"
    echo "  test        Test documentation endpoints"
    echo "  analyze     Analyze API coverage and quality"
    echo "  report      Generate comprehensive report"
    echo "  all         Run all validations and tests"
    echo "  help        Show this help message"
    echo
    echo "Examples:"
    echo "  $0              # Run basic validation"
    echo "  $0 test         # Test documentation endpoints"
    echo "  $0 all          # Run comprehensive validation"
}

# Main validation function
run_validation() {
    log_section "OpenAPI Specification Validation"
    
    if ! validate_openapi_file; then
        log_error "OpenAPI file validation failed"
        return 1
    fi
    
    log_success "OpenAPI specification validation completed"
}

# Main testing function
run_testing() {
    log_section "Documentation Endpoint Testing"
    
    if ! check_service_health; then
        log_error "Cannot test endpoints: service not running"
        return 1
    fi
    
    test_documentation_endpoints
    log_success "Documentation endpoint testing completed"
}

# Main analysis function
run_analysis() {
    log_section "API Coverage Analysis"
    
    analyze_api_coverage
    check_api_examples
    log_success "API analysis completed"
}

# Main report function
run_report() {
    log_section "Generating Documentation Report"
    
    generate_documentation_report
    log_success "Report generation completed"
}

# Main function to run all checks
run_all() {
    log_section "Comprehensive OpenAPI Validation"
    
    run_validation
    echo
    
    if check_service_health; then
        run_testing
        echo
    fi
    
    run_analysis
    echo
    
    run_report
    
    log_section "Validation Complete"
    log_success "All OpenAPI validations completed successfully!"
    log_info "View the interactive documentation at: $SERVICE_URL/docs"
    log_info "Access the OpenAPI spec at: $SERVICE_URL/api-docs/yaml"
    log_info "Check the validation report: openapi-validation-report.md"
}

# Main script logic
main() {
    case "${1:-validate}" in
        "validate")
            run_validation
            ;;
        "test")
            run_testing
            ;;
        "analyze")
            run_analysis
            ;;
        "report")
            run_report
            ;;
        "all")
            run_all
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            log_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Check prerequisites
if ! command -v curl > /dev/null 2>&1; then
    log_error "curl is required but not installed"
    exit 1
fi

# Run main function
main "$@"
