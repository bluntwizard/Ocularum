# Getting Started with Ocularum

This guide will help you set up and run Ocularum on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14.x or later)
- npm (v6.x or later)
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Ocularum.git
   ```

2. Navigate to the project directory:
   ```bash
   cd Ocularum
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

To start the development server:
```bash
npm run dev
```

The server will start on port 3000 by default. You can access the API at `http://localhost:3000`.

## Running Tests

To run tests:
```bash
npm test
```

## Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

3. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a pull request on GitHub.

## Project Structure

- `src/` - Contains the application source code
  - `index.js` - Main entry point
- `tests/` - Contains test files
- `docs/` - Contains documentation 