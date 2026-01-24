---
name: create-feature-branch
description: Create a new git branch when the user says they are writing a new feature, following the project's branch naming conventions.
disable-model-invocation: true
---
# Create Feature Branch

When the user says they are writing a new feature, create a new git branch for development.

## Trigger Phrases

The skill should activate when the user says things like:
- "I am writing a new feature"
- "I'm writing a new feature"
- "I want to write a new feature"
- "I'm working on a new feature"
- "Let me write a new feature"
- "I need to create a branch for a new feature"

## Branch Naming Convention

Use the format: `feature/description` where description is a short, kebab-case description of the feature.

Examples:
- `feature/add-user-authentication`
- `feature/implement-dark-mode`
- `feature/add-error-boundaries`

## Workflow

1. When the user says they're writing a new feature, ask them what the feature is about
2. Extract or infer a short description from their response
3. Convert the description to kebab-case for the branch name
4. Ensure you're on the `main` branch and it's up to date with `origin/main`
5. Create and switch to the new feature branch using: `git checkout -b feature/description`
6. Verify the branch was created correctly

## Steps

When the user indicates they're writing a new feature:

1. Ask: "What feature are you working on?" or extract from their message if they provided details
2. Check current branch status with `git status`
3. If not on `main`, switch to `main` first: `git checkout main`
4. Pull latest changes: `git pull origin main`
5. Create the branch name in kebab-case format: `feature/description`
6. Create and switch to the branch: `git checkout -b feature/description`
7. Verify the branch was created: `git branch --show-current`
8. Confirm: "Created and switched to branch `feature/description`. Ready for development!"

## Example Usage

User: "I am writing a new feature for user authentication"
- Ask for clarification if needed, or use "user-authentication"
- Branch name: `feature/user-authentication`
- Command: `git checkout -b feature/user-authentication`

User: "I'm writing a new feature" (no details)
- Ask: "What feature are you working on?"
- Wait for their response, then create the branch

User: "I want to write a new feature for the dashboard"
- Branch name: `feature/dashboard`
- Command: `git checkout -b feature/dashboard`
