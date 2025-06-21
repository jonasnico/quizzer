# 🧠 Quizzer

An interactive trivia quiz application built with Astro and TypeScript that uses the Open Trivia Database API to provide engaging quiz experiences.

## ✨ Features

- **🎯 Customizable Quizzes**: Configure number of questions, categories, difficulty levels, and question types
- **📚 Multiple Categories**: Choose from 25+ categories including Science, Entertainment, Sports, History, and more
- **🎚️ Difficulty Levels**: Easy, Medium, and Hard difficulty options
- **❓ Question Types**: Multiple choice and True/False questions
- **⚡ Instant Feedback**: Get immediate feedback on your answers
- **📊 Progress Tracking**: See your score and progress throughout the quiz
- **🎉 Results Summary**: Detailed results with percentage scores and performance indicators
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Project Structure

```text
/
├── public/
├── src/
│   ├── components/
│   │   ├── QuizConfig.astro    # Quiz configuration form
│   │   └── QuizGame.astro      # Main quiz gameplay component
│   ├── layouts/
│   │   └── Layout.astro        # Base layout with Tailwind CSS
│   ├── pages/
│   │   ├── index.astro         # Home page with quiz configuration
│   │   └── quiz.astro          # Quiz gameplay page
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── utils/
│   │   └── api.ts              # API utilities and helper functions
│   └── styles/
│       └── global.css          # Global Tailwind CSS styles
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 🎮 How to Use

1. **Configure Your Quiz**:
   - Select the number of questions (1-50)
   - Choose a category or leave as "Any Category"
   - Pick a difficulty level or select "Any"
   - Choose question type (Multiple Choice, True/False, or Any)

2. **Take the Quiz**:
   - Read each question carefully
   - Select your answer from the available options
   - Get instant feedback on whether you're correct or incorrect
   - Navigate between questions using Previous/Next buttons
   - Review your answers anytime

3. **View Results**:
   - See your final score and percentage
   - Review all questions and your answers
   - Start a new quiz with different settings

## 🛠️ Technology Stack

- **Framework**: [Astro](https://astro.build/) - Modern web framework
- **Language**: TypeScript - Type-safe JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **API**: [Open Trivia Database](https://opentdb.com/) - Free trivia questions API

## 📋 Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 🎯 API Information

This application uses the [Open Trivia Database API](https://opentdb.com/), which provides:

- 4,600+ verified trivia questions
- 25+ categories
- Multiple difficulty levels
- Various question types
- Free to use (no API key required)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Open Trivia Database](https://opentdb.com/) for providing the trivia questions
- [Astro](https://astro.build/) for the amazing web framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first styling approach
