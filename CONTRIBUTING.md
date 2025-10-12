# Contributing to PhotoPicks

First off, thank you for considering contributing to PhotoPicks! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. We expect all contributors to:

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Xcode (for iOS development, macOS only)
- Android Studio (for Android development)

### Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/PhotoPicks.git
   cd PhotoPicks
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/jason-delaplain/PhotoPicks.git
   ```

4. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   Or manually:
   ```bash
   npm install
   npx expo prebuild --clean
   ```

5. **Start development**
   ```bash
   npm start
   ```

## Development Process

### Creating a Branch

Always create a new branch for your work:

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes
- `chore/` - Build process or tooling changes

Examples:
- `feature/add-cloud-sync`
- `fix/blurry-detection-crash`
- `docs/update-readme`

### Making Changes

1. **Write clean, readable code**
2. **Follow the existing code style**
3. **Add tests for new features**
4. **Update documentation as needed**
5. **Keep commits focused and atomic**

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**
   ```bash
   npm test
   npm run typecheck
   npm run lint
   ```

2. **Update documentation** if needed

3. **Add/update tests** for your changes

4. **Rebase on latest main**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Submitting a PR

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill out the PR template** completely

4. **Link related issues**

5. **Request review** from maintainers

### PR Requirements

- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Documentation updated
- ✅ PR template filled out
- ✅ Commits follow convention
- ✅ Branch is up to date with main

## Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Define proper types** - avoid `any`
- **Use interfaces** for object shapes
- **Export types** when they're reusable

```typescript
// ✅ Good
interface Photo {
  id: string;
  uri: string;
  filename: string | null;
}

const getPhoto = (id: string): Photo | null => {
  // ...
};

// ❌ Bad
const getPhoto = (id: any): any => {
  // ...
};
```

### React Components

- **Use functional components** with hooks
- **Use TypeScript** for prop types
- **Keep components focused** and single-purpose
- **Extract reusable logic** into hooks

```typescript
// ✅ Good
interface PhotoCardProps {
  photo: Photo;
  onPress: (id: string) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onPress }) => {
  // ...
};

// ❌ Bad
const PhotoCard = (props: any) => {
  // ...
};
```

### File Organization

```
src/
├── components/     # React components
├── services/       # API and service layer
├── utils/          # Utility functions
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
└── constants/      # App constants
```

### Naming Conventions

- **Components**: PascalCase (`PhotoCard.tsx`)
- **Utilities**: camelCase (`photoUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PHOTOS`)
- **Interfaces**: PascalCase with `I` prefix optional (`IPhoto` or `Photo`)

### Code Style

We use Prettier for formatting. Key points:

- **2 spaces** for indentation
- **Single quotes** for strings
- **Semicolons** required
- **100 character** line length
- **Trailing commas** in ES5 style

Run Prettier:
```bash
npx prettier --write .
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or tooling changes
- `perf`: Performance improvements

### Examples

```bash
feat(swipe): add haptic feedback on photo deletion

Add haptic feedback using expo-haptics when user swipes to delete a photo.
This improves the user experience by providing tactile confirmation.

Closes #123
```

```bash
fix(blurry): prevent crash on null image data

Added null check before processing image data in blur detection algorithm.

Fixes #456
```

## Testing

### Test Structure

```typescript
describe('PhotoUtils', () => {
  describe('getPhotoById', () => {
    it('should return photo when id exists', () => {
      // Arrange
      const photos = [{ id: '1', uri: 'test.jpg' }];
      
      // Act
      const result = getPhotoById(photos, '1');
      
      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
    });

    it('should return null when id does not exist', () => {
      // ...
    });
  });
});
```

### Test Coverage

- **Aim for 80%+** code coverage
- **Test edge cases** and error conditions
- **Mock external dependencies** (Expo modules, etc.)
- **Test user interactions** in components

## Documentation

### Code Documentation

- **Use JSDoc** for complex functions
- **Add inline comments** for tricky logic
- **Keep comments up to date** with code changes

```typescript
/**
 * Calculates the blur score for an image
 * @param imageData - Raw image pixel data
 * @param threshold - Blur detection threshold (0-1)
 * @returns Blur score between 0 (sharp) and 1 (blurry)
 */
const calculateBlurScore = (
  imageData: ImageData,
  threshold: number = 0.5
): number => {
  // ...
};
```

### README Updates

Update the README when:
- Adding new features
- Changing setup process
- Adding new dependencies
- Changing configuration

### CHANGELOG Updates

Add entries to CHANGELOG.md for:
- New features
- Bug fixes
- Breaking changes
- Dependency updates

## Questions?

- **GitHub Issues**: For bug reports and feature requests
- **Email**: deladroid@gmail.com
- **Discussions**: Use GitHub Discussions for questions

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to PhotoPicks! 🎉📸

---

*This guide is inspired by successful open-source projects and follows industry best practices.*
