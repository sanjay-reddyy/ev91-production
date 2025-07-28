# PowerShell script to initialize Git and push to Bitbucket
# Save this as setup-git.ps1 and run it from PowerShell

Write-Host "🚀 Setting up Git repository for EV91-Platform..." -ForegroundColor Green

# Check if git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is not installed. Please install Git first: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# Get user input for Git configuration
$userName = Read-Host "Enter your Git username"
$userEmail = Read-Host "Enter your Git email"
$repoUrl = Read-Host "Enter your Bitbucket repository URL (e.g., https://bitbucket.org/yourusername/ev91-platform.git)"

Write-Host "📝 Configuring Git..." -ForegroundColor Yellow

# Configure Git
git config user.name "$userName"
git config user.email "$userEmail"

Write-Host "🔧 Initializing Git repository..." -ForegroundColor Yellow

# Initialize Git repository if not already initialized
if (!(Test-Path ".git")) {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "📁 Git repository already exists" -ForegroundColor Blue
}

Write-Host "📦 Adding files to Git..." -ForegroundColor Yellow

# Add all files
git add .

Write-Host "💾 Creating initial commit..." -ForegroundColor Yellow

# Create initial commit
git commit -m "Initial commit: EV91 Platform - Vehicle Inventory Management System

Features included:
- Multi-service architecture (Auth, Vehicle, Team, Rider, Client Store)
- Vehicle inventory management with OEM and Model hierarchy
- RC and Insurance details integration in separate tables
- Admin portal with comprehensive forms
- API endpoints for CRUD operations
- Rate limiting and CORS configuration
- Prisma ORM with SQLite database
- TypeScript throughout the stack
- React frontend with Material-UI
- Form validation with Yup and React Hook Form"

Write-Host "🌐 Adding Bitbucket remote..." -ForegroundColor Yellow

# Add remote origin
git remote add origin $repoUrl

Write-Host "🚀 Pushing to Bitbucket..." -ForegroundColor Yellow

# Push to Bitbucket
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Successfully pushed to Bitbucket!" -ForegroundColor Green
    Write-Host "📁 Repository URL: $repoUrl" -ForegroundColor Blue
    Write-Host "🔗 You can view your repository at: $($repoUrl.Replace('.git', ''))" -ForegroundColor Blue
} else {
    Write-Host "❌ Failed to push to Bitbucket. Please check your repository URL and permissions." -ForegroundColor Red
    Write-Host "💡 Make sure you have created the repository on Bitbucket first." -ForegroundColor Yellow
}

Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "• Your code is now on Bitbucket" -ForegroundColor White
Write-Host "• Use 'git add .' and 'git commit -m \"message\"' for future changes" -ForegroundColor White
Write-Host "• Use 'git push' to upload changes to Bitbucket" -ForegroundColor White
