# Testing Guide

This document provides comprehensive testing strategies for the Chatting Agent project.

## Overview

The project uses:
- **Backend**: Jest + @nestjs/testing for NestJS service and controller testing
- **Frontend**: Jest + React Testing Library for component testing
- **Database**: Prisma mocking for database testing

## Backend Testing

### Running Tests

```bash
# Run all backend tests
npm run test -w @chat/backend

# Run tests in watch mode
npm run test:watch -w @chat/backend

# Run tests with coverage
npm run test:cov -w @chat/backend
```

### Service Tests

Test services by mocking their dependencies:

```typescript
describe('MessagesService', () => {
  let service: MessagesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: {
            message: {
              create: jest.fn(),
              findMany: jest.fn()
            }
          }
        }
      ]
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should create a message', async () => {
    const mockMessage = { id: 'msg_1', content: 'Hello' };
    (prismaService.message.create as jest.Mock).mockResolvedValue(mockMessage);

    const result = await service.ingest(mockInput);

    expect(result).toEqual(mockMessage);
  });
});
```

### Controller Tests

Test controllers by mocking services:

```typescript
describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: {
            ingest: jest.fn(),
            listConversations: jest.fn()
          }
        }
      ]
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
  });

  it('should call service.ingest with request body', async () => {
    const mockMessage = { id: 'msg_1' };
    (service.ingest as jest.Mock).mockResolvedValue(mockMessage);

    const result = await controller.ingest({ content: 'Hello' });

    expect(result).toEqual(mockMessage);
  });
});
```

### Key Testing Patterns

1. **Guard Testing**: Test JWT guards with mocked requests
2. **Exception Handling**: Verify BadRequestException thrown on validation failure
3. **Database Operations**: Mock Prisma client methods
4. **Edge Cases**: Empty arrays, null values, invalid inputs

## Frontend Testing

### Running Tests

```bash
# Run all frontend tests
npm run test -w @chat/admin

# Run tests in watch mode
npm run test:watch -w @chat/admin

# Run tests with coverage
npm run test:cov -w @chat/admin
```

### Component Tests

Test components using React Testing Library:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversationList } from './ConversationList';

describe('ConversationList', () => {
  it('should render conversations after loading', async () => {
    const mockConversations = [
      { id: 'conv_1', channel: 'whatsapp', status: 'open', ... }
    ];

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockConversations
    });

    render(<ConversationList onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/whatsapp/i)).toBeInTheDocument();
    });
  });

  it('should call onSelect when clicked', async () => {
    const mockOnSelect = jest.fn();
    // ... render and click
    fireEvent.click(conversationButton);
    expect(mockOnSelect).toHaveBeenCalledWith('conv_1');
  });
});
```

### Key Testing Patterns

1. **API Mocking**: Mock `global.fetch` for API calls
2. **User Interactions**: Use `fireEvent` or `userEvent` for clicks, typing
3. **Async Operations**: Use `waitFor` for component state updates
4. **Component Props**: Test with different props and states
5. **Error Handling**: Verify error messages display on failures

## Database Seeding & Testing

### Seeding Test Data

```bash
# Run seed script to populate test database
npm run seed -w @chat/db
```

The seed script creates:
- 5 sample clients
- 6 conversations across different channels
- 20 messages
- 4 tags
- 3 payment intents
- Audit log entries

This allows testing without n8n or external integrations.

### Isolation

Each test should:
1. Not depend on external services
2. Mock all external calls
3. Use test database or memory store
4. Clean up after execution

## Coverage Targets

| Component | Target |
|-----------|--------|
| Backend Services | 70%+ |
| Backend Controllers | 60%+ |
| Frontend Components | 60%+ |
| Frontend Hooks | 70%+ |
| Overall | 60%+ |

## CI/CD Integration

Tests run automatically on:
- Pull requests (all tests must pass)
- Commits to `main` branch

```yaml
# Example workflow
- name: Run Tests
  run: npm test
  
- name: Upload Coverage
  run: npm run test:cov
```

## Best Practices

### ✅ Do

- Write tests for business logic and user flows
- Mock external dependencies completely
- Use descriptive test names
- Keep tests focused and isolated
- Test error cases and edge cases
- Use `beforeEach` for common setup

### ❌ Don't

- Test implementation details, test behavior
- Have tests that depend on each other
- Make real network requests in tests
- Test third-party libraries directly
- Leave slow tests unoptimized
- Ignore test failures

## Debugging Tests

```bash
# Run single test file
npm test -- ConversationList.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render messages"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Resources

- [NestJS Testing Docs](https://docs.nestjs.com/fundamentals/testing)
- [React Testing Library](https://testing-library.com/react)
- [Jest Docs](https://jestjs.io/)
