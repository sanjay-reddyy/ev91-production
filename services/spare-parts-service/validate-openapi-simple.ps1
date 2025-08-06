# Simple OpenAPI Validation Script for Windows PowerShell
param([string]$Command = "validate")

# Configuration
$ServiceUrl = "http://localhost:4006"
$GatewayUrl = "http://localhost:8000"
$OpenApiFile = "openapi.yaml"

function Write-Section($title) {
    Write-Host "`n===========================================" -ForegroundColor Cyan
    Write-Host $title -ForegroundColor Cyan
    Write-Host "===========================================" -ForegroundColor Cyan
}

function Test-OpenApiFile {
    Write-Host "[INFO] Validating OpenAPI specification file..." -ForegroundColor Blue
    
    if (-not (Test-Path $OpenApiFile)) {
        Write-Host "[ERROR] OpenAPI file not found: $OpenApiFile" -ForegroundColor Red
        return $false
    }
    
    $fileSize = (Get-Item $OpenApiFile).Length
    Write-Host "[SUCCESS] OpenAPI file found ($fileSize bytes)" -ForegroundColor Green
    
    $content = Get-Content $OpenApiFile -Raw
    if ($content.Contains("openapi:") -and $content.Contains("info:") -and $content.Contains("paths:")) {
        Write-Host "[SUCCESS] OpenAPI file contains required sections" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[ERROR] OpenAPI file missing required sections" -ForegroundColor Red
        return $false
    }
}

function Test-ServiceHealth {
    Write-Host "[INFO] Checking if spare parts service is running..." -ForegroundColor Blue
    
    try {
        $response = Invoke-WebRequest -Uri "$ServiceUrl/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "[SUCCESS] Spare parts service is running" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "[ERROR] Spare parts service is not running at $ServiceUrl" -ForegroundColor Red
        Write-Host "[INFO] Please start the service with: npm run dev" -ForegroundColor Blue
        return $false
    }
    return $false
}

function Test-DocumentationEndpoints {
    Write-Host "[INFO] Testing documentation endpoints..." -ForegroundColor Blue
    
    Write-Host "[INFO] Testing API Gateway endpoints (Primary - Port 8000)..." -ForegroundColor Blue
    
    # Test API Gateway YAML endpoint
    try {
        $response = Invoke-WebRequest -Uri "$GatewayUrl/api-docs/yaml" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "[SUCCESS] API Gateway - YAML endpoint is accessible" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] API Gateway - YAML endpoint is not accessible" -ForegroundColor Red
    }
    
    # Test API Gateway JSON endpoint
    try {
        $response = Invoke-WebRequest -Uri "$GatewayUrl/api-docs/json" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "[SUCCESS] API Gateway - JSON endpoint is accessible" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] API Gateway - JSON endpoint is not accessible" -ForegroundColor Red
    }
    
    # Test API Gateway documentation UI (CDN version)
    try {
        $response = Invoke-WebRequest -Uri "$GatewayUrl/docs" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "[SUCCESS] API Gateway - Documentation UI (CDN) is accessible" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] API Gateway - Documentation UI (CDN) is not accessible" -ForegroundColor Red
    }
    
    # Test API Gateway local documentation UI
    try {
        $response = Invoke-WebRequest -Uri "$GatewayUrl/docs-local" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "[SUCCESS] API Gateway - Documentation UI (Local) is accessible" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] API Gateway - Documentation UI (Local) is not accessible" -ForegroundColor Red
    }
    
    Write-Host "`n[INFO] Testing Direct Service endpoints (Internal - Port 4006)..." -ForegroundColor Blue
    
    # Test Direct Service YAML endpoint
    try {
        $response = Invoke-WebRequest -Uri "$ServiceUrl/api-docs/yaml" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "[SUCCESS] Direct Service - YAML endpoint is accessible" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] Direct Service - YAML endpoint is not accessible" -ForegroundColor Red
    }
    
    # Test Direct Service JSON endpoint
    try {
        $response = Invoke-WebRequest -Uri "$ServiceUrl/api-docs/json" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "[SUCCESS] Direct Service - JSON endpoint is accessible" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] Direct Service - JSON endpoint is not accessible" -ForegroundColor Red
    }
    
    # Test Direct Service documentation UI (CDN version)
    try {
        $response = Invoke-WebRequest -Uri "$ServiceUrl/docs" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "[SUCCESS] Direct Service - Documentation UI (CDN) is accessible" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] Direct Service - Documentation UI (CDN) is not accessible" -ForegroundColor Red
    }
    
    # Test Direct Service local documentation UI
    try {
        $response = Invoke-WebRequest -Uri "$ServiceUrl/docs-local" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "[SUCCESS] Direct Service - Documentation UI (Local) is accessible" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] Direct Service - Documentation UI (Local) is not accessible" -ForegroundColor Red
    }
}

function Get-ApiCoverage {
    Write-Host "[INFO] Analyzing API endpoint coverage..." -ForegroundColor Blue
    
    if (-not (Test-Path $OpenApiFile)) {
        Write-Host "[ERROR] Cannot analyze coverage: OpenAPI file not found" -ForegroundColor Red
        return
    }
    
    $content = Get-Content $OpenApiFile -Raw
    
    # Count different endpoint types
    $getCount = ([regex]::Matches($content, "get:", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
    $postCount = ([regex]::Matches($content, "post:", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
    $putCount = ([regex]::Matches($content, "put:", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
    $deleteCount = ([regex]::Matches($content, "delete:", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
    
    Write-Host "[INFO] API Endpoint Summary:" -ForegroundColor Blue
    Write-Host "  GET endpoints: $getCount" -ForegroundColor White
    Write-Host "  POST endpoints: $postCount" -ForegroundColor White
    Write-Host "  PUT endpoints: $putCount" -ForegroundColor White
    Write-Host "  DELETE endpoints: $deleteCount" -ForegroundColor White
    
    if ($getCount -gt 0 -and $postCount -gt 0 -and $putCount -gt 0 -and $deleteCount -gt 0) {
        Write-Host "[SUCCESS] API provides comprehensive CRUD operations" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] API may be missing some CRUD operations" -ForegroundColor Yellow
    }
}

function Show-Usage {
    Write-Host "OpenAPI Validation Script (Simple)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\validate-openapi-simple.ps1 [Command]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  validate    Validate OpenAPI specification (default)" -ForegroundColor Gray
    Write-Host "  test        Test documentation endpoints" -ForegroundColor Gray
    Write-Host "  analyze     Analyze API coverage" -ForegroundColor Gray
    Write-Host "  all         Run all validations" -ForegroundColor Gray
    Write-Host "  help        Show this help" -ForegroundColor Gray
}

# Main execution
switch ($Command.ToLower()) {
    "validate" {
        Write-Section "OpenAPI File Validation"
        Test-OpenApiFile
    }
    "test" {
        Write-Section "Documentation Endpoint Testing"
        if (Test-ServiceHealth) {
            Test-DocumentationEndpoints
        }
    }
    "analyze" {
        Write-Section "API Coverage Analysis"
        Get-ApiCoverage
    }
    "all" {
        Write-Section "Comprehensive OpenAPI Validation"
        Test-OpenApiFile
        Write-Host ""
        if (Test-ServiceHealth) {
            Test-DocumentationEndpoints
        }
        Write-Host ""
        Get-ApiCoverage
        Write-Host ""
        Write-Host "[INFO] View interactive documentation at: $GatewayUrl/docs (API Gateway - Primary)" -ForegroundColor Blue
        Write-Host "[INFO] Alternative access: $ServiceUrl/docs (Direct Service - Internal)" -ForegroundColor Blue
    }
    "help" {
        Show-Usage
    }
    default {
        Write-Host "[ERROR] Unknown command: $Command" -ForegroundColor Red
        Show-Usage
    }
}
