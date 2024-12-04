# Installation and Setup

- Requirements
  Node.js (v14.x or higher)

- MongoDB (no authentication required)
  - No Authentication Required: MongoDB does not require authentication for this setup.
  - Database Creation: Upon the first connection, a database named tracker is created.
  - Collection: Events are stored in the tracks collection within the tracker database.

## Installation

- Clone the repository:

```bash
git https://github.com/fundraiseup.git
cd fundraiseup
```

- Install dependencies:

```bash
yarn install
```

- Create a .env file in the root directory

```
PORT_APP=50000
PORT_TRACKER=8888
DB_URI=mongodb://localhost:27017/tracker
```
## Running

- Run dev
- This will run the server on port 50000 for HTML pages and port 8888 for tracking events.
- If the browser does not open automatically, you will need to manually go to http://localhost:50000/1.html.
