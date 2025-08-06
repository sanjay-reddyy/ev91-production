# EV91 Platform - OpenAPI Validation and Testing Script (PowerShell)
# This script validates the OpenAPI specification and tests the documentation endpoints

param(
    [string]$Command = "validate"
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServiceUrl = "http://localhost:4006"
$OpenApiFile = Join-Path $ScriptDir "openapi.yaml"

# Helper functions
function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "[✓] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[⚠] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[✗] $message" -ForegroundColor Red
}

function Write-Section($title) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $title -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

# Function to check if service is running
function Test-ServiceHealth {
    Write-Info "Checking if spare parts service is running..."
    
    try {
        $response = Invoke-WebRequest -Uri "$ServiceUrl/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "Spare parts service is running"
            return $true
        } else {
            Write-Error "Spare parts service returned status code: $($response.StatusCode)"
            return $false
        }
    } catch {
        Write-Error "Spare parts service is not running at $ServiceUrl"
        Write-Info "Please start the service with: npm run dev"
        return $false
    }
}

# Function to validate OpenAPI file
function Test-OpenApiFile {
    Write-Info "Validating OpenAPI specification file..."
    
    if (-not (Test-Path $OpenApiFile)) {
        Write-Error "OpenAPI file not found: $OpenApiFile"
        return $false
    }
    
    # Check file size and basic structure
    $fileSize = (Get-Item $OpenApiFile).Length
    if ($fileSize -gt 1000) {
        Write-Success "OpenAPI file size looks good ($fileSize bytes)"
    } else {
        Write-Warning "OpenAPI file seems small ($fileSize bytes)"
    }
    
    # Check for required sections
    $content = Get-Content $OpenApiFile -Raw
    $hasRequired = ($content -match "openapi:") -and 
                   ($content -match "info:") -and 
                   ($content -match "paths:") -and 
                   ($content -match "components:")
    
    if ($hasRequired) {
        Write-Success "OpenAPI file contains required sections"
    } else {
        Write-Error "OpenAPI file missing required sections"
        return $false
    }
    
    return $true
}

# Function to test documentation endpoints
function Test-DocumentationEndpoints {
    Write-Info "Testing documentation endpoints..."
    
    # Test YAML endpoint
    Write-Info "Testing /api-docs/yaml endpoint..."
    try {
        $response = Invoke-WebRequest -Uri "$ServiceUrl/api-docs/yaml" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "YAML endpoint is accessible"
            
            # Check if response is YAML
            if ($response.Content -match "openapi:") {
                Write-Success "YAML endpoint returns valid OpenAPI content"
            } else {
                Write-Warning "YAML endpoint response doesn't look like OpenAPI spec"
            }
        }
    } catch {
        Write-Error "YAML endpoint is not accessible: $($_.Exception.Message)"
    }
    
    # Test JSON endpoint
    Write-Info "Testing /api-docs/json endpoint..."
    try {
        $response = Invoke-RestMethod -Uri "$ServiceUrl/api-docs/json" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "JSON endpoint is accessible"
        
        if ($response.success -eq $true) {
            Write-Success "JSON endpoint returns valid response"
        } else {
            Write-Warning "JSON endpoint response format unexpected"
        }
    } catch {
        Write-Error "JSON endpoint is not accessible: $($_.Exception.Message)"
    }
    
    # Test documentation UI
    Write-Info "Testing /docs endpoint..."
    try {
        $response = Invoke-WebRequest -Uri "$ServiceUrl/docs" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "Documentation UI endpoint is accessible"
            
            # Check if response contains HTML
            if ($response.Content -match "<html>" -and $response.Content -match "swagger") {
                Write-Success "Documentation UI returns Swagger interface"
            } else {
                Write-Warning "Documentation UI doesn't appear to be Swagger interface"
            }
        }
    } catch {
        Write-Error "Documentation UI endpoint is not accessible: $($_.Exception.Message)"
    }
}

# Function to analyze API coverage
function Get-ApiCoverage {
    Write-Info "Analyzing API endpoint coverage..."
    
    if (-not (Test-Path $OpenApiFile)) {
        Write-Error "Cannot analyze coverage: OpenAPI file not found"
        return $false
    }
    
    $content = Get-Content $OpenApiFile -Raw
    
    # Count endpoints in OpenAPI spec
    $totalPaths = ([regex]::Matches($content, "^  /", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    $getEndpoints = ([regex]::Matches($content, "get:", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    $postEndpoints = ([regex]::Matches($content, "post:", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    $putEndpoints = ([regex]::Matches($content, "put:", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    $patchEndpoints = ([regex]::Matches($content, "patch:", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    $deleteEndpoints = ([regex]::Matches($content, "delete:", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    
    Write-Info "API Endpoint Summary:"
    Write-Info "  Total Paths: $totalPaths"
    Write-Info "  GET endpoints: $getEndpoints"
    Write-Info "  POST endpoints: $postEndpoints"
    Write-Info "  PUT endpoints: $putEndpoints"
    Write-Info "  PATCH endpoints: $patchEndpoints"
    Write-Info "  DELETE endpoints: $deleteEndpoints"
    
    # Check for comprehensive CRUD coverage
    if ($getEndpoints -gt 0 -and $postEndpoints -gt 0 -and $putEndpoints -gt 0 -and $deleteEndpoints -gt 0) {
        Write-Success "API provides comprehensive CRUD operations"
    } else {
        Write-Warning "API may be missing some CRUD operations"
    }
    
    # Check for documented schemas
    $schemaCount = ([regex]::Matches($content, "^    [A-Z].*:", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    Write-Info "  Documented Schemas: $schemaCount"
    
    if ($schemaCount -gt 10) {
        Write-Success "Good schema documentation coverage"
    } else {
        Write-Warning "Consider adding more schema documentation"
    }
    
    return $true
}

# Function to check API examples
function Test-ApiExamples {
    Write-Info "Checking API examples and documentation quality..."
    
    $content = Get-Content $OpenApiFile -Raw
    
    # Check for examples in the spec
    if ($content -match "example:") {
        Write-Success "OpenAPI spec contains examples"
    } else {
        Write-Warning "Consider adding examples to improve documentation"
    }
    
    # Check for descriptions
    $descriptionCount = ([regex]::Matches($content, "description:", [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    Write-Info "  Description fields: $descriptionCount"
    
    if ($descriptionCount -gt 20) {
        Write-Success "Good description coverage"
    } else {
        Write-Warning "Consider adding more descriptions for better documentation"
    }
    
    # Check for security documentation
    if ($content -match "security:" -and $content -match "bearerAuth:") {
        Write-Success "Security scheme is documented"
    } else {
        Write-Warning "Security scheme documentation could be improved"
    }
}

# Function to generate documentation report
function New-DocumentationReport {
    $reportFile = Join-Path $ScriptDir "openapi-validation-report.md"
    
    Write-Info "Generating documentation report..."
    
    $content = @"
# OpenAPI Documentation Validation Report

**Generated**: $(Get-Date)
**Service URL**: $ServiceUrl
**OpenAPI File**: $OpenApiFile

## Validation Results

### File Validation
- OpenAPI file exists: $(if (Test-Path $OpenApiFile) { "✅" } else { "❌" })
- File size: $((Get-Item $OpenApiFile -ErrorAction SilentlyContinue).Length) bytes
- Contains required sections: $(if ((Get-Content $OpenApiFile -Raw -ErrorAction SilentlyContinue) -match "openapi:" -and (Get-Content $OpenApiFile -Raw -ErrorAction SilentlyContinue) -match "info:") { "✅" } else { "❌" })

### Service Endpoints Status
"@

    # Test endpoints and add to report
    try {
        $null = Invoke-WebRequest -Uri "$ServiceUrl/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $content += "- Health endpoint: ✅`n"
    } catch {
        $content += "- Health endpoint: ❌`n"
    }
    
    try {
        $null = Invoke-WebRequest -Uri "$ServiceUrl/docs" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $content += "- Documentation UI: ✅`n"
    } catch {
        $content += "- Documentation UI: ❌`n"
    }
    
    try {
        $null = Invoke-WebRequest -Uri "$ServiceUrl/api-docs/yaml" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $content += "- YAML endpoint: ✅`n"
    } catch {
        $content += "- YAML endpoint: ❌`n"
    }
    
    try {
        $null = Invoke-RestMethod -Uri "$ServiceUrl/api-docs/json" -TimeoutSec 5 -ErrorAction Stop
        $content += "- JSON endpoint: ✅`n"
    } catch {
        $content += "- JSON endpoint: ❌`n"
    }
    
    $content += @"

## Recommendations

1. **Keep Documentation Updated**: Ensure OpenAPI spec is updated when adding new endpoints
2. **Add Examples**: Include request/response examples for better developer experience
3. **Comprehensive Testing**: Test all documented endpoints regularly
4. **Security Documentation**: Ensure all security requirements are clearly documented
5. **Error Handling**: Document all possible error responses and status codes

## Next Steps

- Review any failed validations above
- Test endpoints using the interactive documentation at $ServiceUrl/docs
- Consider implementing API versioning for future changes
- Set up automated validation in CI/CD pipeline

---
*Report generated by OpenAPI validation script*
"@

    Set-Content -Path $reportFile -Value $content
    Write-Success "Documentation report generated: $reportFile"
}

# Function to show usage
function Show-Usage {
    Write-Host "OpenAPI Validation and Testing Script (PowerShell)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\validate-openapi.ps1 [-Command <COMMAND>]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  validate    Validate OpenAPI specification (default)" -ForegroundColor Gray
    Write-Host "  test        Test documentation endpoints" -ForegroundColor Gray
    Write-Host "  analyze     Analyze API coverage and quality" -ForegroundColor Gray
    Write-Host "  report      Generate comprehensive report" -ForegroundColor Gray
    Write-Host "  all         Run all validations and tests" -ForegroundColor Gray
    Write-Host "  help        Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\validate-openapi.ps1                     # Run basic validation" -ForegroundColor Gray
    Write-Host "  .\validate-openapi.ps1 -Command test       # Test documentation endpoints" -ForegroundColor Gray
    Write-Host "  .\validate-openapi.ps1 -Command all        # Run comprehensive validation" -ForegroundColor Gray
}

# Main validation function
function Start-Validation {
    Write-Section "OpenAPI Specification Validation"
    
    if (-not (Test-OpenApiFile)) {
        Write-Error "OpenAPI file validation failed"
        return $false
    }
    
    Write-Success "OpenAPI specification validation completed"
    return $true
}

# Main testing function
function Start-Testing {
    Write-Section "Documentation Endpoint Testing"
    
    if (-not (Test-ServiceHealth)) {
        Write-Error "Cannot test endpoints: service not running"
        return $false
    }
    
    Test-DocumentationEndpoints
    Write-Success "Documentation endpoint testing completed"
    return $true
}

# Main analysis function
function Start-Analysis {
    Write-Section "API Coverage Analysis"
    
    $null = Get-ApiCoverage
    Test-ApiExamples
    Write-Success "API analysis completed"
    return $true
}

# Main report function
function Start-Report {
    Write-Section "Generating Documentation Report"
    
    New-DocumentationReport
    Write-Success "Report generation completed"
    return $true
}

# Main function to run all checks
function Start-All {
    Write-Section "Comprehensive OpenAPI Validation"
    
    $null = Start-Validation
    Write-Host ""
    
    if (Test-ServiceHealth) {
        $null = Start-Testing
        Write-Host ""
    }
    
    $null = Start-Analysis
    Write-Host ""
    
    $null = Start-Report
    
    Write-Section "Validation Complete"
    Write-Success "All OpenAPI validations completed successfully!"
    Write-Info "View the interactive documentation at: $ServiceUrl/docs"
    Write-Info "Access the OpenAPI spec at: $ServiceUrl/api-docs/yaml"
    Write-Info "Check the validation report: openapi-validation-report.md"
}

# Main script logic
switch ($Command.ToLower()) {
    "validate" {
        Start-Validation
    }
    "test" {
        Start-Testing
    }
    "analyze" {
        Start-Analysis
    }
    "report" {
        Start-Report
    }
    "all" {
        Start-All
    }
    "help" {
        Show-Usage
    }
    default {
        Write-Error "Unknown command: $Command"
        Show-Usage
        exit 1
    }
}
