# Contributing to Essential Layer

Thank you for your interest in contributing! Here's how to get started.

## How to Contribute

1. **Fork** the repository.
2. **Create a branch** for your change:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and test them locally.
4. **Commit** with a clear message:
   ```bash
   git commit -m "Add: brief description of change"
   ```
5. **Push** your branch and open a Pull Request.

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/essential-layer.git
cd essential-layer

# Preview locally
python3 -m http.server 8000
```

Open `http://localhost:8000` to verify your changes.

## Guidelines

- Keep HTML semantic and accessible.
- Follow the existing CSS naming conventions in `styles.css`.
- Test on mobile and desktop before submitting.
- Keep commits focused — one logical change per commit.

## Reporting Bugs

Open an issue with:
- A clear title and description
- Steps to reproduce the problem
- Expected vs. actual behavior
- Browser and device info if relevant

## Suggesting Features

Open an issue tagged **enhancement** with:
- A description of the feature
- Why it would be useful
- Any mockups or references if available
