# Local Verification Script for Explain My Game (PowerShell version)
# Checks core services and endpoints
#
# Usage: .\scripts\verify_local.ps1
# Exit codes: 0 = all checks passed, 1 = one or more checks failed

$ErrorActionPreference = "Stop"

$API_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:8000" }
$WEB_URL = if ($env:WEB_URL) { $env:WEB_URL } else { "http://localhost:3000" }
$DEV_TOKEN = "dev_user_seed_001"

$Passed = 0
$Failed = 0

function Check-Pass($message) {
    Write-Host "[PASS] $message" -ForegroundColor Green
    $script:Passed++
}

function Check-Fail($message) {
    Write-Host "[FAIL] $message" -ForegroundColor Red
    $script:Failed++
}

function Check-Warn($message) {
    Write-Host "[WARN] $message" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Explain My Game - Local Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. API Health Check
Write-Host "Checking API health..."
try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get -ErrorAction Stop
    if ($response.status -eq "healthy") {
        Check-Pass "API is healthy"
    } else {
        Check-Fail "API returned unhealthy status"
    }
} catch {
    Check-Fail "API health check failed (is the API running?)"
}

# 2. Frontend Reachable
Write-Host "Checking frontend..."
try {
    $null = Invoke-WebRequest -Uri $WEB_URL -Method Get -ErrorAction Stop -UseBasicParsing
    Check-Pass "Frontend is reachable"
} catch {
    Check-Fail "Frontend not reachable (is the web server running?)"
}

# 3. Database Check (via API)
Write-Host "Checking database connection..."
try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get -ErrorAction Stop
    if ($response.status -eq "healthy") {
        Check-Pass "Database connection OK"
    } else {
        Check-Fail "Database connection failed"
    }
} catch {
    Check-Fail "Database connection check failed"
}

# 4. API Documentation
Write-Host "Checking API documentation..."
try {
    $null = Invoke-WebRequest -Uri "$API_URL/docs" -Method Get -ErrorAction Stop -UseBasicParsing
    Check-Pass "API docs accessible"
} catch {
    Check-Warn "API docs not accessible (may be disabled in production)"
}

# 5. CSV Template Download
Write-Host "Checking CSV template endpoint..."
try {
    $response = Invoke-RestMethod -Uri "$API_URL/stats/csv-template" -Method Get -ErrorAction Stop
    if ($response -match "points_for") {
        Check-Pass "CSV template download works"
    } else {
        Check-Fail "CSV template response invalid"
    }
} catch {
    Check-Fail "CSV template download failed"
}

# 6. Auth Endpoint (with dev token)
Write-Host "Checking authentication..."
try {
    $headers = @{ "Authorization" = "Bearer $DEV_TOKEN" }
    $response = Invoke-RestMethod -Uri "$API_URL/users/me" -Method Get -Headers $headers -ErrorAction Stop
    if ($response.email) {
        Check-Pass "Dev token authentication works"
    } else {
        Check-Warn "Dev token valid but response unexpected"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 401) {
        # Check if it's a "user not found" error (expected if not seeded)
        Check-Warn "Dev token authentication requires seeded user (expected in fresh install)"
    } else {
        Check-Fail "Authentication check failed (HTTP $statusCode)"
    }
}

# 7. Teams Endpoint
Write-Host "Checking teams endpoint..."
try {
    $headers = @{ "Authorization" = "Bearer $DEV_TOKEN" }
    $response = Invoke-RestMethod -Uri "$API_URL/teams" -Method Get -Headers $headers -ErrorAction Stop
    Check-Pass "Teams endpoint works"
} catch {
    Check-Fail "Teams endpoint failed"
}

# 8. Invalid Token Rejection
Write-Host "Checking token validation..."
try {
    $headers = @{ "Authorization" = "Bearer invalid_token" }
    $null = Invoke-RestMethod -Uri "$API_URL/users/me" -Method Get -Headers $headers -ErrorAction Stop
    Check-Fail "Invalid token not rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Check-Pass "Invalid tokens properly rejected"
    } else {
        Check-Fail "Unexpected error when testing invalid token"
    }
}

# Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Passed: $Passed" -ForegroundColor Green
Write-Host "Failed: $Failed" -ForegroundColor Red
Write-Host ""

if ($Failed -gt 0) {
    Write-Host "Some checks failed!" -ForegroundColor Red
    Write-Host "Run 'docker compose logs' to see service logs."
    exit 1
} else {
    Write-Host "All checks passed!" -ForegroundColor Green
    exit 0
}

