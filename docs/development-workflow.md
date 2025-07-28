# Development Workflow Guide

This document outlines the standard development workflow for the EV91 platform.

## Branching Strategy

We follow a modified Git Flow branching strategy:

- `main` - Production code. Only merge from `dev` via pull requests
- `dev` - Development branch. All features merge here first
- `feature/*` - Feature branches, created from `dev`
- `bugfix/*` - Bug fix branches, created from `dev`
- `hotfix/*` - Critical fixes, created from `main`

## Development Process

1. **Create a Branch**
   ```bash
   git checkout dev
   git pull
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code that adheres to our standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
   *Note: We follow [Conventional Commits](https://www.conventionalcommits.org/) format*

4. **Run Local Tests**
   ```bash
   npm run lint
   npm run test
   ```

5. **Push Changes**
   ```bash
   git push -u origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Create a PR to the `dev` branch
   - Fill in the PR template with details
   - Request at least 2 reviewers

7. **Code Review**
   - Address reviewer comments
   - Update your branch as needed

8. **Merge**
   - Squash and merge to `dev` once approved
   - Delete the feature branch

## Code Standards

### General
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Add JSDoc comments for public functions

### Backend
- Follow RESTful API design principles
- Use async/await for asynchronous code
- Handle errors with appropriate status codes
- Log meaningful information

### Frontend
- Use functional components and hooks
- Follow component design patterns
- Use TypeScript interfaces for props
- Follow accessibility guidelines

## Testing Standards

- Unit tests for services and utilities
- Integration tests for API endpoints
- Component tests for UI
- End-to-end tests for critical flows

## CI/CD Pipeline

Our automated pipeline:
1. Runs linting and tests
2. Builds Docker images
3. Deploys to staging for PR merges to `dev`
4. Deploys to production for PR merges to `main`

## Release Process

1. Create a release branch from `dev`
   ```bash
   git checkout -b release/v1.2.3 dev
   ```

2. Perform final testing and bug fixes

3. Update version numbers and CHANGELOG.md

4. Create a PR to merge into `main`

5. After approval and merge, tag the release
   ```bash
   git checkout main
   git pull
   git tag -a v1.2.3 -m "Release v1.2.3"
   git push --tags
   ```

6. Merge `main` back to `dev`
