# Release Guide

This guide explains how to release new versions of the Ghion Node.js SDK.

## Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes, backward compatible

Example: `v1.2.3` (Major 1, Minor 2, Patch 3)

## Pre-Release Checklist

Before releasing a new version:

1. **Update Tests**
   ```bash
   npm test
   npm run test:integration
   ```

2. **Check Coverage**
   ```bash
   npm run test:coverage
   ```

3. **Update Documentation**
   - Update `README.md` with new features
   - Update `CHANGELOG.md` with release notes
   - Update `DEVELOPER_GUIDE.md` if needed
   - Update examples if needed

4. **Run Linter**
   ```bash
   npm run lint
   npm run format
   ```

5. **Update Dependencies**
   ```bash
   npm audit
   npm audit fix
   npm update
   ```

6. **Build TypeScript**
   ```bash
   npm run build
   ```

## Creating a Release

### Step 1: Update Version in Files

Update version references in:
- `package.json` (version field)
- `README.md` (if version is mentioned)
- `CHANGELOG.md` (add new release notes)
- Any other documentation files

### Step 2: Commit Changes

```bash
git add .
git commit -m "Release v1.0.1: Add new feature"
```

### Step 3: Create Git Tag

```bash
# Annotated tag with release notes
git tag -a v1.0.1 -m "Release v1.0.1: Add new feature

- Added support for new payment channel
- Fixed bug in webhook signature verification
- Updated documentation"
```

### Step 4: Push to GitHub

```bash
# Push code
git push origin main

# Push tag
git push origin v1.0.1
```

### Step 5: Publish to npm

```bash
# Build the package
npm run build

# Publish to npm
npm publish
```

For a beta/alpha release:
```bash
npm publish --tag beta
```

### Step 6: Create GitHub Release (Optional)

1. Go to GitHub repository
2. Click "Releases" → "Create a new release"
3. Select the tag you just pushed
4. Add release title and description
5. Publish the release

## Post-Release Tasks

1. **Verify Installation**
   ```bash
   # Test that users can install the new version
   npm install @ghion-finances/node-sdk@v1.0.1
   ```

2. **Update npm Registry**
   - The npm registry will automatically update
   - No manual action needed

3. **Announce Release**
   - Update documentation if needed
   - Notify users of breaking changes (if any)

## Changelog Format

Maintain `CHANGELOG.md` with this format:

```markdown
## [1.0.1] - 2024-01-15

### Added
- Support for new payment channel
- New webhook event type

### Fixed
- Bug in webhook signature verification
- Memory leak in retry logic

### Changed
- Improved error messages for validation failures
- Updated dependencies

### Deprecated
- Old payment method (will be removed in v2.0.0)
```

## Version Bumping Examples

### Patch Release (Bug Fix)
```bash
# Update package.json version to 1.0.1
git add package.json CHANGELOG.md
git commit -m "Release v1.0.1: Fix webhook signature bug"
git tag -a v1.0.1 -m "Release v1.0.1: Fix webhook signature bug"
git push origin main
git push origin v1.0.1
npm publish
```

### Minor Release (New Feature)
```bash
# Update package.json version to 1.1.0
git add package.json CHANGELOG.md
git commit -m "Release v1.1.0: Add Telebirr support"
git tag -a v1.1.0 -m "Release v1.1.0: Add Telebirr support"
git push origin main
git push origin v1.1.0
npm publish
```

### Major Release (Breaking Change)
```bash
# Update package.json version to 2.0.0
git add package.json CHANGELOG.md
git commit -m "Release v2.0.0: Breaking API changes"
git tag -a v2.0.0 -m "Release v2.0.0: Breaking API changes"
git push origin main
git push origin v2.0.0
npm publish
```

## Pre-Release Versions

For beta or alpha releases:

```bash
# Update package.json version to 1.1.0-beta.1
git add package.json CHANGELOG.md
git commit -m "Release v1.1.0-beta.1: Beta release"
git tag -a v1.1.0-beta.1 -m "Beta release v1.1.0-beta.1"
git push origin main
git push origin v1.1.0-beta.1
npm publish --tag beta

# Users can install pre-release
npm install @ghion-finances/node-sdk@beta
```

## Rolling Back a Release

If you need to revert a release:

```bash
# Delete the tag locally
git tag -d v1.0.1

# Delete the tag from GitHub
git push origin :refs/tags/v1.0.1

# Unpublish from npm (within 72 hours)
npm unpublish @ghion-finances/node-sdk@1.0.1

# Create a new tag for the previous version
git tag -a v1.0.0 -m "Revert to v1.0.0"
git push origin v1.0.0
npm publish
```

## Common Issues

### Tag Already Exists
```bash
# Delete existing tag first
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1
# Then create new tag
```

### Package Already Published
```bash
# You cannot unpublish after 72 hours
# Instead, publish a new patch version
npm version patch
npm publish
```

### npm Authentication
```bash
# Login to npm
npm login

# Verify authentication
npm whoami
```

## CI/CD Integration

The SDK includes GitHub Actions for automated testing and publishing. Configure your `.github/workflows/ci-cd.yml` to:

1. Run tests on every push
2. Build TypeScript on every push
3. Publish to npm on tag push

Example workflow trigger:
```yaml
on:
  push:
    tags:
      - 'v*'
```

## Summary

1. Run tests and check coverage
2. Update documentation and changelog
3. Update version in package.json
4. Commit changes
5. Create annotated git tag
6. Push code and tags to GitHub
7. Build TypeScript
8. Publish to npm
9. Create GitHub release (optional)
10. Verify installation works
