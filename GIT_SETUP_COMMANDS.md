# Git Configuration and Bitbucket Push Commands

## Step 1: Configure Git (run these commands in your project directory)

# Set your git username and email (replace with your Bitbucket credentials)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# OR set locally for this repo only
git config user.name "Your Name"
git config user.email "your.email@example.com"

## Step 2: Initialize Git repository
cd c:\voice_project\EV91-Platform
git init

## Step 3: Add all files and make initial commit
git add .
git commit -m "Initial commit: EV91 Platform - Vehicle Inventory Management System with RC and Insurance Integration"

## Step 4: Create a new repository on Bitbucket
# Go to https://bitbucket.org and:
# 1. Click "Create repository"
# 2. Name it "EV91-Platform" or your preferred name
# 3. Choose Private or Public
# 4. DON'T initialize with README (since you already have files)
# 5. Copy the repository URL (it will look like: https://bitbucket.org/yourusername/ev91-platform.git)

## Step 5: Add Bitbucket remote and push
# Replace 'yourusername' and 'your-repo-name' with actual values
git remote add origin https://bitbucket.org/yourusername/your-repo-name.git

# Push to Bitbucket
git branch -M main
git push -u origin main

## Alternative: If you prefer SSH (more secure)
# First set up SSH key in Bitbucket:
# 1. Generate SSH key: ssh-keygen -t rsa -b 4096 -C "your.email@example.com"
# 2. Add to Bitbucket: Settings > Personal Bitbucket settings > SSH keys
# 3. Use SSH URL instead:
# git remote add origin git@bitbucket.org:yourusername/your-repo-name.git

## Future commits (after initial setup)
git add .
git commit -m "Your commit message"
git push

## Useful Git commands for ongoing development
# Check status
git status

# View commit history
git log --oneline

# Create and switch to new branch
git checkout -b feature-branch-name

# Switch branches
git checkout main
git checkout feature-branch-name

# Merge branch
git checkout main
git merge feature-branch-name

# Pull latest changes
git pull origin main
