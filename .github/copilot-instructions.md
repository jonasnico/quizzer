# Copilot Instructions for Quizzer

This is an Astro trivia quiz application with React components that uses the Open Trivia Database API (https://opentdb.com/api_config.php) to fetch trivia questions.

## Project Structure and Guidelines

- **Framework**: Astro with React integration
- **Frontend**: React with TypeScript for interactive components
- **Styling**: Tailwind CSS
- **API**: Open Trivia Database (https://opentdb.com/)
- **State Management**: React hooks for component state

## Key Features

1. **Quiz Configuration**: Allow users to select:

   - Number of questions (1-50)
   - Category (General Knowledge, Entertainment, Science, etc.)
   - Difficulty (Easy, Medium, Hard)
   - Type (Multiple Choice, True/False, or Any)

2. **Quiz Gameplay**:

   - Display questions one at a time
   - Show instant feedback after each answer
   - Track score and progress
   - Allow navigation between questions

3. **API Integration**:
   - Base URL: `https://opentdb.com/api.php`
   - Parameters: amount, category, difficulty, type
   - Handle HTML entities in questions/answers
   - Implement error handling for API failures

## Code Style Guidelines

- Use React components for all interactive features
- Use TypeScript for all logic
- Prefer React hooks for state management
- Use Astro components only for static layout
- Follow semantic HTML structure
- Use Tailwind classes for styling
- Implement responsive design
- Add proper error handling and loading states
- **NO COMMENTS**: Do not add any comments (// or /\* \*/ or <!-- -->) to the code. Keep code clean and self-documenting through clear variable and function names

## API Response Format

The API returns questions in this format:

```typescript
interface TriviaQuestion {
  category: string;
  type: "multiple" | "boolean";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}
```

## Component Structure

- Use `.astro` files for pages and layout components
- Use React `.tsx` components for interactive features
- Use TypeScript for utility functions and types
- Keep API calls in separate utility functions
- Implement proper error boundaries
