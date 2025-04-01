# Contributing to Ocularum

Thank you for your interest in contributing to Ocularum! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to uphold our Code of Conduct, which ensures a welcoming and inclusive environment for all contributors.

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:

1. Check the [GitHub Issues](https://github.com/bluntwizard/Ocularum/issues) to see if the bug has already been reported
2. Ensure the bug is related to Ocularum and not one of its dependencies

When submitting a bug report:

1. Use a clear and descriptive title
2. Describe the exact steps to reproduce the problem
3. Provide specific examples if possible
4. Include the version of Ocularum you're using
5. Describe what you expected to happen and what actually happened
6. Include screenshots or GIFs if applicable
7. Include details about your configuration and environment

### Suggesting Enhancements

Enhancement suggestions are welcome! Before submitting:

1. Check if the enhancement has already been suggested in [GitHub Issues](https://github.com/bluntwizard/Ocularum/issues)
2. Determine which repository the enhancement should be suggested in

When submitting an enhancement suggestion:

1. Use a clear and descriptive title
2. Provide a detailed description of the suggested enhancement
3. Explain why this enhancement would be useful to most Ocularum users
4. Include mockups or examples if applicable

### Pull Requests

We welcome pull requests! To submit a PR:

1. Fork the repository
2. Create a new branch for your feature or bugfix (`git checkout -b feature/your-feature-name`)
3. Make your changes, following our coding standards
4. Write tests for your changes if applicable
5. Ensure all tests pass
6. Commit your changes with clear and descriptive commit messages
7. Push to your branch (`git push origin feature/your-feature-name`)
8. Open a pull request against the main branch

## Development Process

### Setting Up Your Development Environment

Follow the instructions in the [Developer Guide](./developer_guide.md) to set up your development environment.

### Coding Standards

Please adhere to the following standards:

#### JavaScript/TypeScript
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use ES6+ features where appropriate
- Use functional programming techniques when applicable
- Document code using JSDoc comments

#### Python
- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- Use type hints where appropriate
- Write docstrings for functions and classes

#### React
- Use functional components with hooks
- Follow React best practices
- Keep components small and focused on a single responsibility

### Testing

- Write tests for new features and bug fixes
- Ensure all tests pass before submitting a PR
- Follow test-driven development when possible

## Commit and PR Guidelines

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add autotune functionality for followed streamers

This implements the core autotune feature that allows automatic
stream launching when followed streamers go live.

Fixes #123
```

### Pull Request Titles

- Use a clear and descriptive title
- Prefix with the type of change: `[Feature]`, `[Fix]`, `[Docs]`, etc.

### Branch Naming

- `feature/feature-name` for new features
- `bugfix/issue-description` for bug fixes
- `docs/description` for documentation changes
- `refactor/description` for code refactoring

## Documentation

- Update documentation alongside code changes
- Document new features, configuration options, and changes to existing functionality
- Keep API documentation up-to-date

## Review Process

All submissions require review. We use GitHub pull requests for this purpose.

Reviewers will check for:
- Adherence to coding standards
- Test coverage
- Documentation
- Performance implications
- Security considerations
- Cross-platform compatibility

## Community

Join our community:
- [Discord](https://discord.gg/ocularum)
- [Discussions on GitHub](https://github.com/bluntwizard/Ocularum/discussions)

Thank you for contributing to Ocularum! 