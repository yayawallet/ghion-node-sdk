# CI/CD Setup Guide

This document explains how to set up the CI/CD pipeline for the Ghion Finances SDK using GitHub Actions.

## Overview

The CI/CD pipeline automatically:
- Runs unit tests on every push and pull request
- Runs integration tests on every push and pull request
- Publishes the package to npm when a new release is created

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### 1. NPM_TOKEN (Required for Publishing)

**Purpose:** Authentication token for publishing to npm registry

**How to get it:**
1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Go to your account settings → Access Tokens
3. Click "Generate New Token"
4. Select "Automation" or "Publish" scope
5. Copy the generated token

**How to add to GitHub:**
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click "Add secret"

### 2. GHION_API_KEY (Required for Integration Tests)

**Purpose:** API key for testing payment initialization and other API calls

**How to get it:**
1. Go to [https://ghion.financial](https://ghion.financial)
2. Log in to your dashboard
3. Navigate to API Keys section
4. Copy your API key

**How to add to GitHub:**
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `GHION_API_KEY`
5. Value: Paste your API key
6. Click "Add secret"

### 3. GHION_API_SECRET (Required for Integration Tests)

**Purpose:** API secret for HMAC signature generation

**How to get it:**
1. Go to [https://ghion.financial](https://ghion.financial)
2. Log in to your dashboard
3. Navigate to API Keys section
4. Copy your API secret

**How to add to GitHub:**
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `GHION_API_SECRET`
5. Value: Paste your API secret
6. Click "Add secret"

### 4. GHION_API_PASSPHRASE (Required for Integration Tests)

**Purpose:** API passphrase for additional authentication

**How to get it:**
1. Go to [https://ghion.financial](https://ghion.financial)
2. Log in to your dashboard
3. Navigate to API Keys section
4. Copy your API passphrase

**How to add to GitHub:**
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `GHION_API_PASSPHRASE`
5. Value: Paste your API passphrase
6. Click "Add secret"

## Workflow Triggers

The CI/CD pipeline runs on:

### On Push to Main
- **Branch:** `main`
- **Actions:** Publishes to npm automatically
- **Note:** Test jobs are currently commented out for initial testing. Uncomment them to run tests before publishing.

### On Pull Request
- **Branch:** `main`
- **Actions:** Currently disabled (test jobs commented out)

**Note:** The workflow automatically publishes to npm on every push to the main branch. No manual release creation needed.

## Workflow Jobs

### 1. Test Job
- Runs on every push and pull request
- Steps:
  - Checkout code
  - Setup Node.js (v20)
  - Install dependencies
  - Run linter
  - Run unit tests
  - Build project

### 2. Integration Test Job
- Runs after test job passes
- Steps:
  - Checkout code
  - Setup Node.js (v20)
  - Install dependencies
  - Run integration tests (uses GitHub secrets)

### 3. Publish Job
- Runs only when a release is created
- Requires test and integration-test jobs to pass
- Steps:
  - Checkout code
  - Setup Node.js (v20)
  - Install dependencies
  - Build project
  - Publish to npm (uses NPM_TOKEN)

## Creating a Release

To publish a new version to npm:

1. Update the version in `package.json`:
   ```bash
   npm version patch  # 1.0.0 → 1.0.1
   npm version minor  # 1.0.0 → 1.1.0
   npm version major  # 1.0.0 → 2.0.0
   ```

2. Commit and push the changes:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.0.1"
   git push origin main
   ```

3. Create a GitHub release:
   - Go to your GitHub repository
   - Click "Releases" → "Create a new release"
   - Choose the tag that was created by `npm version`
   - Add release notes
   - Click "Publish release"

4. The CI/CD pipeline will automatically:
   - Run all tests
   - Build the project
   - Publish to npm

## Troubleshooting

### Integration Tests Failing

**Problem:** Integration tests fail with authentication errors

**Solution:**
- Verify all three Ghion API secrets are set correctly
- Check that the credentials are valid and not expired
- Ensure the secrets are set in the correct repository

### Publishing Fails

**Problem:** Publishing to npm fails with authentication error

**Solution:**
- Verify `NPM_TOKEN` is set correctly
- Ensure the token has "Publish" or "Automation" scope
- Check that the token hasn't expired

### Tests Pass Locally but Fail in CI

**Problem:** Tests work on your machine but fail in GitHub Actions

**Solution:**
- Check that Node.js version matches (v20)
- Ensure all dependencies are in `package.json`
- Verify environment variables are set as secrets
- Check the workflow logs for specific error messages

## Security Best Practices

1. **Never commit secrets to the repository**
   - Always use GitHub Secrets for sensitive data
   - Never add `.env` files to git

2. **Rotate tokens regularly**
   - Update npm tokens periodically
   - Regenerate API keys if compromised

3. **Limit token scopes**
   - Use minimal required scopes for npm tokens
   - Don't use tokens with full account access

4. **Monitor workflow runs**
   - Check workflow logs for suspicious activity
   - Review who has access to the repository

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [npm Publishing Documentation](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [Creating Releases in GitHub](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
