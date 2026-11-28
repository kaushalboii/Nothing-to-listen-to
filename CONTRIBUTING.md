# Contributing to Nothing to Listen to

Welcome! We are excited to collaborate with designers, audio enthusiasts, and WebGL engineers to improve **Nothing to Listen to**.

---

## 🛠️ Development Setup

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or compatible package manager
- Modern browser with WebGL 2.0 support

### 2. Getting Started
```bash
# Clone the repository
git clone https://github.com/kaushalboii/Nothing-to-listen-to.git
cd Nothing-to-listen-to

# Install project dependencies
npm install

# Start the local development server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## 🧪 Testing & Code Quality

Before opening a pull request, ensure all linting checks and test suites pass:

```bash
# Run unit and integration tests (Vitest)
npm test

# Run TypeScript type verification
npx tsc -b

# Check formatting and style rules (Biome)
npm run check
```

---

## 📐 Contribution Guidelines

1. **Branch Naming**:
   - `feat/feature-name` for new user-facing functionality
   - `fix/bug-description` for bug fixes
   - `perf/optimization` for WebGL or audio performance improvements
   - `docs/doc-update` for documentation enhancements

2. **Commit Conventions**:
   - We adhere to conventional commit messages:
     - `feat: add lock-screen scrubber support`
     - `fix: resolve mobile orientation shader reset`
     - `perf: optimize voronoi lattice force convergence`
     - `docs: update system architecture guide`

3. **Song Additions & Catalog Requests**:
   - To request new song additions to the daily catalog, open an issue using the [Music Request template](https://github.com/kaushalboii/Nothing-to-listen-to/issues/new).

---

## 💬 Community & Inquiries

Questions and discussions can be posted on our GitHub Discussions or submitted via issues.
