# Git Workflow Guide for Team Development

## Branch Strategy

### Main Branches
- **`main`** - Production-ready code (protected)
- **`develop`** - Integration branch for features (optional)

### Feature Branches
- **`feature/feature-name`** - New features
- **`fix/bug-description`** - Bug fixes
- **`hotfix/urgent-fix`** - Critical production fixes

---

## Common Workflows

### 1. Starting a New Feature

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/nft-minting-form

# Work on feature, commit regularly
git add .
git commit -m "feat: add NFT minting form component"
git push origin feature/nft-minting-form
```

### 2. Creating Pull Request (PR)

**On GitHub/GitLab**:
1. Push your feature branch
2. Create Pull Request: `feature/nft-minting-form` → `main`
3. Add description, reviewers, labels
4. Wait for code review

**PR Title Format**:
```
feat: add NFT minting form
fix: resolve wallet connection error
docs: update deployment guide
refactor: simplify contract utilities
```

---

## Code Review Process

### As a Reviewer

**Check**:
- ✅ Code follows project patterns
- ✅ No console.logs in production code
- ✅ Error handling is present
- ✅ TypeScript types are correct
- ✅ No hardcoded values
- ✅ Tests pass (if applicable)

**Review Comments**:
```bash
# Request changes
"Please add error handling for failed transactions"

# Approve with suggestions
"Looks good! Consider extracting this logic to a utility function"

# Approve
"Approved! Ready to merge."
```

### As a Developer

**Before Requesting Review**:
```bash
# Make sure your branch is up to date
git checkout main
git pull origin main
git checkout feature/your-feature
git rebase main  # or merge main into your branch

# Run tests/linter
npm run lint
npm test

# Push latest changes
git push origin feature/your-feature
```

---

## Merging Strategies

### Option 1: Merge Commit (Default)

**When to Use**: Feature branches, team collaboration

```bash
# On GitHub: Click "Merge pull request"
# Or via command line:
git checkout main
git merge feature/nft-minting-form
git push origin main
```

**Pros**:
- Preserves branch history
- Shows when feature was merged
- Easy to revert entire feature

**Cons**:
- Creates merge commit
- Can clutter history

---

### Option 2: Squash and Merge

**When to Use**: Feature branches with many small commits

```bash
# On GitHub: Click "Squash and merge"
# Combines all commits into one
```

**Pros**:
- Clean history
- One commit per feature
- Easy to understand

**Cons**:
- Loses individual commit history
- Harder to revert specific commits

---

### Option 3: Rebase and Merge

**When to Use**: Linear history preference

```bash
# On GitHub: Click "Rebase and merge"
# Replays commits on top of main
```

**Pros**:
- Linear history
- No merge commits
- Clean timeline

**Cons**:
- Rewrites commit history
- Can cause conflicts

---

## Rebasing

### Interactive Rebase (Clean Up Commits)

```bash
# Rebase last 3 commits
git rebase -i HEAD~3

# Options in editor:
# pick - keep commit as is
# squash - combine with previous commit
# reword - change commit message
# drop - remove commit
```

**Example**:
```bash
# Before: 5 messy commits
git rebase -i HEAD~5

# After: 1 clean commit
feat: add complete NFT minting feature
```

### Rebase Feature Branch onto Main

```bash
# Update main
git checkout main
git pull origin main

# Rebase your feature
git checkout feature/your-feature
git rebase main

# If conflicts occur:
git add .
git rebase --continue

# Force push (only on feature branches!)
git push origin feature/your-feature --force-with-lease
```

**⚠️ Warning**: Never force push to `main` or shared branches!

---

## Cherry Picking

### When to Use
- Apply a specific commit to another branch
- Backport bug fixes to production
- Move commits between branches

### How to Cherry Pick

```bash
# Find commit hash
git log --oneline
# Example: abc1234 fix: wallet connection error

# Switch to target branch
git checkout main

# Cherry pick the commit
git cherry-pick abc1234

# If conflicts:
git add .
git cherry-pick --continue

# Push
git push origin main
```

### Cherry Pick Multiple Commits

```bash
# Pick range of commits
git cherry-pick abc1234..def5678

# Or specific commits
git cherry-pick abc1234 def5678 xyz9012
```

**Example Scenario**:
```bash
# Bug fix in develop branch
git checkout develop
git log  # Find: "fix: contract address bug" (abc1234)

# Apply to main (hotfix)
git checkout main
git cherry-pick abc1234
git push origin main
```

---

## Resolving Conflicts

### During Merge

```bash
git checkout main
git merge feature/your-feature

# If conflicts:
# 1. Open conflicted files
# 2. Look for <<<<<<< markers
# 3. Resolve conflicts manually
# 4. Stage resolved files
git add .
git commit  # Completes merge
```

### During Rebase

```bash
git rebase main

# If conflicts:
# 1. Resolve conflicts in files
# 2. Stage resolved files
git add .
git rebase --continue

# To abort rebase:
git rebase --abort
```

### Conflict Markers

```typescript
<<<<<<< HEAD
// Code from current branch (main)
const address = "0x123";
=======
// Code from incoming branch (feature)
const address = CONTRACT_ADDRESSES.MyToken;
>>>>>>> feature/your-feature
```

**Resolved**:
```typescript
// Keep the better solution
const address = CONTRACT_ADDRESSES.MyToken;
```

---

## Team Best Practices

### Commit Messages

**Format**: `type: description`

**Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

**Examples**:
```bash
git commit -m "feat: add ERC1155 minting form"
git commit -m "fix: resolve wallet connection timeout"
git commit -m "docs: update deployment guide"
```

### Branch Naming

```bash
feature/nft-minting-form
feature/wallet-connection
fix/contract-address-bug
hotfix/critical-security-patch
refactor/contract-utilities
```

### Daily Workflow

```bash
# Morning: Update your branches
git checkout main
git pull origin main

# Start new feature
git checkout -b feature/new-feature

# During day: Commit regularly
git add .
git commit -m "feat: add component"

# End of day: Push progress
git push origin feature/new-feature
```

### Before Creating PR

```bash
# 1. Update with latest main
git checkout main
git pull origin main
git checkout feature/your-feature
git rebase main  # or: git merge main

# 2. Run checks
npm run lint
npm test

# 3. Push
git push origin feature/your-feature

# 4. Create PR on GitHub
```

---

## Emergency Scenarios

### Revert a Merge

```bash
# Find merge commit
git log --oneline --merges

# Revert the merge
git revert -m 1 <merge-commit-hash>
git push origin main
```

### Undo Last Commit (Not Pushed)

```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes completely
git reset --hard HEAD~1
```

### Undo Last Commit (Already Pushed)

```bash
# Create revert commit (safe)
git revert HEAD
git push origin main
```

---

## Quick Reference

### Common Commands

```bash
# Status
git status
git log --oneline

# Branching
git branch -a
git checkout -b feature/new
git branch -d feature/old

# Updates
git pull origin main
git fetch origin

# Staging
git add .
git add specific-file.ts
git commit -m "message"

# Remote
git push origin feature/branch
git push origin feature/branch --force-with-lease
```

### Useful Aliases

```bash
# Add to ~/.gitconfig
[alias]
  st = status
  co = checkout
  br = branch
  ci = commit
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = !gitk
```

---

## Summary

**Feature Workflow**:
1. Create branch from `main`
2. Develop and commit
3. Rebase/update before PR
4. Create PR and request review
5. Address review comments
6. Merge when approved

**Merging**: Use "Merge commit" for features, "Squash" for cleanup  
**Rebasing**: Use to update feature branch, clean up commits  
**Cherry Picking**: Use to backport fixes, move specific commits  
**Reviews**: Always required before merging to `main`

