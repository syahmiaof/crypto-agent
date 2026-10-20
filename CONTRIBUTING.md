# Contributing to Crypto AI — Mission Control

Thank you for your interest in contributing to **Crypto AI — Mission Control**! We welcome bug reports, feature suggestions, documentation enhancements, and code contributions.

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/crypto-agent.git
   cd crypto-agent
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a topic branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```

## Development Guidelines

- **TypeScript Strict Mode**: Ensure all types are explicitly defined and strict validation passes without warnings (`npm run typecheck`).
- **Styling**: Adhere to semantic design tokens defined in `app/globals.css`. Do not add decorative, ungrounded gradients or neon glowing borders.
- **State & Logic**: Keep deterministic financial calculations inside `lib/finance.ts` and risk validations inside `lib/risk.ts`. Ensure new state fields are validated in `store/demo-store.ts`.
- **Testing**:
  - Write unit tests for financial math, converters, and risk logic using Vitest (`npm test`).
  - Run Playwright tests for user flow and viewports (`npm run test:e2e`).

## Commit Convention

We follow conventional commits:
- `feat:` A new user-facing feature
- `fix:` A bug fix
- `docs:` Documentation improvements
- `style:` Formatting or UI styling changes that do not alter logic
- `refactor:` Code restructuring without changing functionality
- `test:` Adding or updating tests
- `chore:` Dependency updates, config tweaks

## Pull Request Process

1. Ensure all automated checks pass locally:
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```
2. Push your branch to GitHub.
3. Open a Pull Request against the `main` branch.
4. Describe the changes, motivations, and attach screenshots or test output.
