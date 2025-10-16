# Contributing to CineHub Pro

Thank you for considering contributing to CineHub Pro! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn package manager
- PostgreSQL database (local or Neon)
- Git for version control
- Basic knowledge of TypeScript, React, and Express.js

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cinehub-pro.git
   cd cinehub-pro
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/cinehub-pro.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Set up the database**:
   ```bash
   npm run db:push
   ```

7. **Start development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
# Update your local develop branch
git checkout develop
git pull upstream develop

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in the feature branch
2. Write or update tests as needed
3. Ensure all tests pass
4. Update documentation if needed
5. Commit your changes with meaningful messages

### Syncing with Upstream

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream develop into your branch
git checkout develop
git merge upstream/develop

# Rebase your feature branch
git checkout feature/your-feature-name
git rebase develop
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define proper types for all functions and variables
- Avoid using `any` type unless absolutely necessary
- Use interfaces for object shapes
- Use type aliases for unions and complex types

### React Components

- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Extract reusable logic into custom hooks
- Use proper prop types with TypeScript interfaces
- Add `data-testid` attributes for testable elements

### File Naming

- React components: `PascalCase.tsx` (e.g., `MovieCard.tsx`)
- Utilities/helpers: `camelCase.ts` (e.g., `authUtils.ts`)
- Types: `camelCase.ts` or `PascalCase.ts` (e.g., `types.ts`, `Movie.ts`)
- Tests: `*.test.ts` or `*.test.tsx`

### Code Style

```typescript
// Good: Explicit types, clear naming
interface MovieCardProps {
  movie: Movie;
  onFavoriteToggle?: (id: number) => void;
}

export function MovieCard({ movie, onFavoriteToggle }: MovieCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite);
    onFavoriteToggle?.(movie.id);
  };
  
  return (
    <div data-testid={`card-movie-${movie.id}`}>
      {/* Component content */}
    </div>
  );
}

// Bad: Implicit types, unclear naming
export function Card({ m, onToggle }: any) {
  const [f, setF] = useState(false);
  // ...
}
```

### Backend Code

- Keep route handlers thin - move logic to services
- Use dependency injection where appropriate
- Validate all inputs with Zod schemas
- Handle errors properly with try-catch
- Log important events and errors

```typescript
// Good: Validated input, error handling, service layer
app.post('/api/movies', async (req, res) => {
  try {
    const validatedData = insertMovieSchema.parse(req.body);
    const movie = await movieService.create(validatedData);
    res.status(201).json(movie);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error creating movie:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Bad: No validation, poor error handling
app.post('/api/movies', async (req, res) => {
  const movie = await db.insert(movies).values(req.body);
  res.json(movie);
});
```

## Testing Guidelines

### Writing Tests

- Write tests for all new features
- Maintain or improve code coverage
- Follow the AAA pattern (Arrange, Act, Assert)
- Use descriptive test names
- Mock external dependencies

### Test Structure

```typescript
describe('MovieCard Component', () => {
  it('should render movie title', () => {
    // Arrange
    const movie = { id: 1, title: 'Test Movie' };
    
    // Act
    render(<MovieCard movie={movie} />);
    
    // Assert
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });

  it('should call onFavoriteToggle when favorite button is clicked', () => {
    // Arrange
    const onFavoriteToggle = vi.fn();
    const movie = { id: 1, title: 'Test Movie' };
    render(<MovieCard movie={movie} onFavoriteToggle={onFavoriteToggle} />);
    
    // Act
    const favoriteButton = screen.getByTestId('button-favorite-1');
    fireEvent.click(favoriteButton);
    
    // Assert
    expect(onFavoriteToggle).toHaveBeenCalledWith(1);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:components

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

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
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(auth): add social login with Google OAuth"

# Bug fix
git commit -m "fix(search): resolve infinite scroll pagination issue"

# Documentation
git commit -m "docs(api): update authentication endpoint documentation"

# Refactoring
git commit -m "refactor(storage): extract database logic into service layer"

# Test
git commit -m "test(movies): add integration tests for movie API endpoints"
```

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer:

```
feat(api): redesign movie response structure

BREAKING CHANGE: Movie API now returns nested genre objects instead of genre IDs
```

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**:
   ```bash
   npm test
   ```

2. **Run type checking**:
   ```bash
   npm run check
   ```

3. **Update documentation** if needed

4. **Rebase on latest develop**:
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

### Creating a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to the repository on GitHub

3. Click "New Pull Request"

4. Fill out the PR template:
   - **Title**: Clear, concise description
   - **Description**: What changes were made and why
   - **Related Issues**: Link any related issues
   - **Screenshots**: Add screenshots for UI changes
   - **Testing**: Describe how you tested the changes

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Changes Made
- Added user authentication
- Implemented JWT tokens
- Created login/signup pages

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
```

### Review Process

1. Wait for automated checks to pass
2. Address reviewer feedback
3. Make requested changes in new commits
4. Request re-review after changes
5. Once approved, a maintainer will merge your PR

### After Merge

1. Delete your feature branch:
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. Update your local develop:
   ```bash
   git checkout develop
   git pull upstream develop
   ```

## Project Structure

### Directory Organization

```
cinehub-pro/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and helpers
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript type definitions
│   └── index.html
│
├── server/                 # Backend Express application
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   ├── auth.ts             # Authentication logic
│   ├── db.ts               # Database connection
│   ├── routes.ts           # API routes
│   └── storage.ts          # Data access layer
│
├── shared/                 # Shared code (types, schemas)
│   └── schema.ts           # Drizzle database schema
│
├── tests/                  # All test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── components/         # Component tests
│   └── e2e/                # End-to-end tests
│
├── docs/                   # Documentation
│   ├── API.md              # API documentation
│   ├── DEPLOYMENT.md       # Deployment guide
│   └── ARCHITECTURE.md     # Architecture docs
│
└── .github/                # GitHub configuration
    └── workflows/          # CI/CD workflows
```

### Adding New Features

#### Frontend Component

1. Create component file in `client/src/components/`
2. Define TypeScript interfaces for props
3. Add data-testid attributes for testing
4. Create corresponding test file
5. Export from appropriate index file

#### Backend Endpoint

1. Add route handler in `server/routes.ts`
2. Create/update service in `server/services/`
3. Update storage interface if needed
4. Add Zod validation schema
5. Create integration tests
6. Document in `docs/API.md`

#### Database Schema

1. Update `shared/schema.ts` with new table/columns
2. Create insert/select schemas with Drizzle Zod
3. Update storage interface
4. Run `npm run db:push` to apply changes
5. Test database operations

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

## Getting Help

- **Documentation**: Check the `/docs` folder
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our Discord community (link in README)

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors graph

Thank you for contributing to CineHub Pro! 🎬
