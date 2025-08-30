# VS Code Performance Optimization Instructions
# Follow these steps to reduce VS Code memory consumption

## Immediate Actions (Do these now):

### 1. Restart VS Code Extension Host
1. Press `Ctrl+Shift+P` (Command Palette)
2. Type "Developer: Restart Extension Host"
3. Press Enter

### 2. Close Unused Features
1. Close all unnecessary tabs
2. Close split editors you're not using
3. Close terminal instances you don't need
4. Close the integrated terminal if not needed

### 3. Disable Resource-Heavy Extensions
1. Press `Ctrl+Shift+X` to open Extensions
2. Temporarily disable these extensions if you have them:
   - Prettier (if you have multiple formatters)
   - GitLens (if enabled)
   - IntelliCode
   - Bracket Pair Colorizer (if installed)
   - Any theme extensions you're not using

### 4. Clear VS Code Cache
1. Close VS Code completely
2. Navigate to: `%APPDATA%\Code\User\workspaceStorage`
3. Delete the folders for old workspaces you no longer use
4. Navigate to: `%APPDATA%\Code\CachedExtensions`
5. Delete this folder if it exists

### 5. Optimize TypeScript Service
1. Press `Ctrl+Shift+P`
2. Type "TypeScript: Restart TS Server"
3. Press Enter

## Settings Applied:
- Limited TypeScript memory to 4GB
- Disabled automatic type acquisition
- Excluded large directories from file watching
- Disabled minimap, code lens, and other visual features
- Optimized search and file exclusions

## Current Memory Usage:
Your VS Code is currently using approximately 2-3GB of RAM across multiple processes.
This is excessive and the optimizations should help reduce it significantly.

## To Monitor Performance:
Run this command in PowerShell:
```powershell
Get-Process -Name "Code" | Measure-Object WorkingSet -Sum | ForEach-Object {[math]::Round($_.Sum/1GB,2)}
```

## Emergency Actions if VS Code Becomes Unresponsive:
1. Press `Ctrl+Alt+Delete` and end VS Code processes
2. Restart VS Code
3. When it reopens, immediately press `Ctrl+Shift+P` and run "Developer: Restart Extension Host"
