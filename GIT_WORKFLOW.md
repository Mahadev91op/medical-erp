# 🚀 Git & GitHub Team Collaboration Guide
> **Project:** Medical ERP  
> **Team Members:** Mahadev & Samrat  
> **Repository:** `https://github.com/Mahadev91op/medical-erp.git`

---

## 📌 Step 0: Initial Setup (One-time Setup)

### 👥 GitHub Collaborator Access (Mahadev's Task)
1. Open browser: [GitHub Repo](https://github.com/Mahadev91op/medical-erp)
2. Go to **Settings** $\rightarrow$ **Collaborators** $\rightarrow$ Click **Add people**.
3. Search Samrat's GitHub Username / Email and send the invitation.
4. **Samrat** needs to accept the invitation from GitHub or Email.

---

## 👨‍💻 Step 1: Mahadev's Workflow (Person 1)

### 1️⃣ Working Branch par Switch Karein:
```bash
git checkout develop
git pull origin develop
git checkout -b mahadev
```

### 2️⃣ Code Edit Karne Ke Baad Commit & Push Karein:
```bash
# 1. Check status
git status

# 2. Add changed files
git add .

# 3. Commit with a message
git commit -m "Added feature X by Mahadev"

# 4. Push to GitHub
git push -u origin mahadev
```

---

## 👨‍💻 Step 2: Samrat's Workflow (Person 2)

### 1️⃣ Code Clone Karein (First time only on Samrat's PC):
```bash
git clone https://github.com/Mahadev91op/medical-erp.git
cd medical-erp
```

### 2️⃣ Naya Working Branch Banayein:
```bash
git checkout develop
git pull origin develop
git checkout -b samrat
```

### 3️⃣ Code Edit Karne Ke Baad Commit & Push Karein:
```bash
# 1. Check status
git status

# 2. Add changed files
git add .

# 3. Commit with a message
git commit -m "Added feature Y by Samrat"

# 4. Push to GitHub
git push -u origin samrat
```

---

## 🔀 Step 3: Code Merge Process (Merging into `develop`)

> [!TIP]
> **GitHub Pull Request Method (Recommended & Safest):**
> 1. Open GitHub repository in browser.
> 2. Click **"Compare & pull request"**.
> 3. Base branch select karein: `develop` | Compare branch select karein: `mahadev` (or `samrat`).
> 4. Click **Create Pull Request** $\rightarrow$ **Merge Pull Request** $\rightarrow$ **Confirm Merge**.

### Terminal Command Method (Alternative):
```bash
# 1. Develop branch par jayein aur update karein
git checkout develop
git pull origin develop

# 2. Local branch merge karein
git merge mahadev   # (ya: git merge samrat)

# 3. Push to GitHub
git push origin develop
```

---

## 🔄 Step 4: Daily Work Routine (Har Roz Kaam Shuru Karne Se Pehle)

> [!IMPORTANT]
> Har roz naya kaam shuru karne se pehle dusre member ka latest code apne branch me Sync karna zaroori hai.

```bash
# 1. Develop branch me latest code layein
git checkout develop
git pull origin develop

# 2. Apne branch par wapas jayein
git checkout mahadev    # (Samrat: git checkout samrat)

# 3. Latest develop branch ko apne branch me merge karein
git merge develop
```

---

## 🚨 Step 5: Merge Conflict Resolution (Jab Dono Same File Edit Karein)

Agar merge karte waqt `CONFLICT` error aaye:
1. VS Code me file kholiye, wahan 3 options dikhenge:
   - `Accept Current Change`
   - `Accept Incoming Change`
   - `Accept Both Changes`
2. Sahi option select karke file save karein.
3. Phir terminal me ye run karein:
```bash
git add .
git commit -m "Resolved merge conflicts"
git push origin <your-branch-name>
```

---

## ⚡ Git Commands Quick Reference Cheat Sheet

| Task | Command | Description |
| :--- | :--- | :--- |
| **Status Check** | `git status` | Konsi files modify hui hain dekhein |
| **All Branches** | `git branch -a` | Local aur remote sabhi branches dekhein |
| **Switch Branch** | `git checkout <branch>` | Dusre branch par switch karein |
| **New Branch** | `git checkout -b <name>` | Naya branch banayein aur switch karein |
| **Add Changes** | `git add .` | Sabhi changes ko commit ke liye ready karein |
| **Commit Changes**| `git commit -m "msg"` | Save changes locally with message |
| **Push Branch** | `git push -u origin <name>` | GitHub par branch upload karein |
| **Pull Updates** | `git pull origin develop` | Latest develop code download karein |

---
> 💡 **Golden Rule:** Mahadev aur Samrat ek hi waqt par same file ki exact same line edit na karein. Features divide kar lein (e.g., Mahadev: API/Backend, Samrat: UI/Components).
