# 🚀 Solo Developer Workflow: Feature Management

This guide outlines the most efficient way to manage features, track your progress, and maintain high-quality code while working alone.

---

## 🛠 Step 1: Initialize the Project Board
*The "Command Center" that visualizes your roadmap.*

1. **Create the Board**: Go to your GitHub Repository > **Projects** tab > **New project** > Select **Board**.
2. **Setup Automation**:
    * Click the **Workflows** icon (on the left).
    * **Auto-add to project**: Set filter to `is:pr` so every PR automatically appears on the board.
    * **Item added to project**: Set the default status to **Todo**.
    * **Pull request merged**: Set status to **Done**.

---

## 🌿 Step A: Branching
*Keep your 'main' branch stable by isolating your new work.*

1. **Sync Main**: Always start from the latest code.
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create Feature Branch**: Use a descriptive name for your task.
   ```bash
   git checkout -b feature/name-of-task
   ```

---

## 📝 Step B: The Draft Pull Request
*The "Work in Progress" signal that links your code to your Project Board.*

1. **Push to GitHub**: Send your branch to the cloud.
   ```bash
   git push -u origin feature/name-of-task
   ```
2. **Open Draft PR**:
   * Navigate to your repo on GitHub.
   * Click **Compare & pull request**.
   * **Crucial**: Click the arrow next to "Create pull request" and select **Create draft pull request**.
3. **Use a Checklist**: In the PR description, list your sub-tasks:
   ```markdown
   - [ ] Build core logic
   - [ ] Clean up styling
   - [ ] Self-review code
   ```
4. **Auto-Tracking**: Because of **Step 1**, this PR will automatically appear in your **In Progress** column on the Project Board.

---

## 🏁 Final Step: The Self-Review & Merge
*The quality control phase.*

1. **Review**: Go to the **Files Changed** tab in your PR. Look for console logs or messy code.
2. **Set to Ready**: Click **Ready for review** at the bottom of the PR page.
3. **Merge**: Click **Merge pull request**.
4. **Cleanup**: Delete the branch on GitHub and locally (`git branch -d feature/name-of-task`).
5. **Auto-Complete**: Your Project Board will automatically move the card to **Done**.


---

## 🆘 Emergency Rollback
*The "Undo" button for when a merge breaks your site.*

If you've merged a PR and realized something is broken, follow these steps to restore your `main` branch to its last stable state.

### Option 1: The GitHub UI (Recommended)
This is the safest way to undo a merge because it creates a clear audit trail.

1. **Open the Merged PR**: Go to your repository's **Pull Requests** tab and click on the **Closed** list.
2. **Find the Revert Button**: Open the PR you want to undo. Scroll to the bottom and click the **Revert** button.
3. **Merge the Revert**: GitHub will automatically create a *new* pull request that removes the broken changes. Click **Create pull request**, then **Merge** it.
4. **Result**: Your `main` branch is now back to its previous state.

### Option 2: The Terminal (Manual Reset)
*Use this ONLY if you are the only one working on the project and haven't pushed any more changes since the bad merge.*

1. **Identify the Good Commit**: Find the ID (hash) of the last stable commit before the merge.
   ```bash
   git log --oneline
   ```
2. **Force Reset**: Reset your local `main` branch to that stable commit.
   ```bash
   git checkout main
   git reset --hard [STABLE_COMMIT_HASH]
   ```
3. **Force Push**: Update GitHub to match your local "clean" version.
   ```bash
   git push -f origin main
   ```

---
**⚠️ Warning**: Option 2 rewrites history. In a team setting, always use **Option 1** to avoid breaking your teammates' local copies.
