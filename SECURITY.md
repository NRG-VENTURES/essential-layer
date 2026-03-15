# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public issue.** Instead:

1. Email the project maintainers with a description of the vulnerability.
2. Include steps to reproduce the issue if possible.
3. Allow reasonable time for the issue to be addressed before any public disclosure.

## Scope

This is a static website. Security concerns most relevant to this project include:

- **Cross-site scripting (XSS)** in any JavaScript or user-facing content
- **Dependency vulnerabilities** in any build or deployment tools
- **Misconfigurations** in `vercel.json` or `firebase.json` that could expose sensitive data
- **Privacy concerns** related to third-party scripts or tracking

## Best Practices We Follow

- No sensitive data is stored in the repository
- Deployment configurations are reviewed before merging
- Third-party resources are loaded over HTTPS
