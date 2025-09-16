# VS Code Performance Monitor Script
# Run this script to check VS Code memory usage and performance

Write-Host "=== VS Code Performance Monitor ===" -ForegroundColor Green
Write-Host ""

# Check VS Code processes
Write-Host "VS Code Processes:" -ForegroundColor Yellow
Get-Process -Name "Code" -ErrorAction SilentlyContinue | Select-Object Name, Id, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}}, @{Name="CPU(%)";Expression={$_.CPU}} | Format-Table

# Check Node.js processes (VS Code extensions)
Write-Host "Node.js Processes (Extensions):" -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Select-Object Name, Id, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}}, @{Name="CPU(%)";Expression={$_.CPU}} | Format-Table

# Check TypeScript Language Server
Write-Host "TypeScript Language Server:" -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*tsserver*" -or $_.CommandLine -like "*tsserver*"} | Select-Object Name, Id, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}} | Format-Table

# Total memory usage by VS Code related processes
$vscodeProcesses = Get-Process -Name "Code" -ErrorAction SilentlyContinue
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
$totalMemory = ($vscodeProcesses | Measure-Object WorkingSet -Sum).Sum + ($nodeProcesses | Measure-Object WorkingSet -Sum).Sum
$totalMemoryMB = [math]::Round($totalMemory/1MB,2)

Write-Host "Total VS Code Memory Usage: $totalMemoryMB MB" -ForegroundColor Cyan

# Check for large files in workspace
Write-Host ""
Write-Host "Checking for large files (>10MB) in workspace..." -ForegroundColor Yellow
$currentPath = Get-Location
Get-ChildItem -Recurse -File | Where-Object {$_.Length -gt 10MB} | Select-Object FullName, @{Name="SizeMB";Expression={[math]::Round($_.Length/1MB,2)}} | Sort-Object SizeMB -Descending | Format-Table

# Check node_modules directories
Write-Host "Node modules directories:" -ForegroundColor Yellow
Get-ChildItem -Name "node_modules" -Recurse -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $size = (Get-ChildItem $_ -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if ($size -gt 0) {
        $sizeMB = [math]::Round($size/1MB,2)
        Write-Host "$_ : $sizeMB MB"
    }
}

Write-Host ""
Write-Host "=== Performance Recommendations ===" -ForegroundColor Green
Write-Host "1. Close unused tabs and split editors" -ForegroundColor White
Write-Host "2. Disable unused extensions" -ForegroundColor White
Write-Host "3. Use 'Developer: Restart Extension Host' if memory is high" -ForegroundColor White
Write-Host "4. Consider using 'Developer: Set Log Level' to 'Error' only" -ForegroundColor White
Write-Host "5. Close other resource-intensive applications" -ForegroundColor White
