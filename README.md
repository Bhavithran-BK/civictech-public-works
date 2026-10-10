# DigOnce - Public Works Coordination Portal

DigOnce is a civic technology platform built to synchronize municipal roadworks, pipeline laying, and infrastructure projects across different city departments. It detects spatial and temporal conflicts to prevent duplicate digging, saving taxpayer money and reducing citizen inconvenience.

## Tech Stack
- **Frontend**: Next.js (React), Tailwind CSS, Lucide Icons
- **Design System**: UX4G Minimalist Government Theme (Light Mode)

---

## Getting Started

Follow these instructions to clone the repository and run it locally.

### 1. Pulling the Code (Clone)

To get a local copy of the project, open your terminal and run:

```bash
git clone https://github.com/Bhavithran-BK/civictech-public-works.git
cd civictech-public-works
```

### 2. Running Locally

Navigate into the frontend directory, install the required dependencies, and start the development server:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application. The Authority Dashboard can be accessed by clicking the "Officer Login" button.

---

## Git Workflow for Contributors

To ensure a clean history and avoid merge conflicts on the `main` branch, please follow this standard Git workflow when adding new features or fixing bugs:

### 1. Ensure you have the latest code
Before starting any new work, always pull the latest changes from the `main` branch:
```bash
git checkout main
git pull origin main
```

### 2. Create a new branch
**Never work directly on the `main` branch.** Create a new branch for your feature or bug fix:
```bash
git checkout -b feature/your-feature-name
```
*(Tip: Use standard prefixes like `feature/`, `bugfix/`, or `role-a/` for clarity).*

### 3. Make your changes and commit
After modifying the code, stage and commit your changes with a descriptive message:
```bash
git add .
git commit -m "feat: added new UI for citizen reporting"
```

### 4. Push your branch
Push your new branch to the remote GitHub repository:
```bash
git push -u origin feature/your-feature-name
```

### 5. Create a Pull Request (PR)
Go to the [GitHub repository page](https://github.com/Bhavithran-BK/civictech-public-works). You will see a prompt to **"Compare & pull request"**. Click it to propose merging your branch into `main`. Once your code is reviewed, it can be merged!
