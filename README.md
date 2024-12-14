# Installation and Setup

- Requirements
  Node.js (v16.x or higher)

- MongoDB (no authentication required)

## Installation

- Install dependencies:

```bash
yarn install
```

- Create a _.env_ file in the root directory based on the example in _.env.example_ and update the .env file with the appropriate configuration values for your environment.

## Running

```bach
yarn run dev
```

This script performs two tasks:

1. Compiles the tracker.ts file into the dist directory.
2. Starts the server using nodemon, which monitors source files for changes.

- This will run the server on port 50000 for HTML pages and port 8888 for tracking events.
- Go to http://localhost:50000/1.html.
