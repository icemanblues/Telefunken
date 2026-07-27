# Telefunken

Telefunken is a popular card game in South America. It is a type of contract rummy game and more information on the rules can be found here:
http://www.pagat.com/rummy/telefunken.html

## Developer Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 24 or later (current stable)
- [pnpm](https://pnpm.io/) package manager

### Install dependencies

```bash
pnpm install
```

## Technology Stack

- **TypeScript** — Strongly typed language compiled to JavaScript
- **pnpm** — Fast, disk-space efficient package manager
- **Vite** — Frontend build tool and dev server
- **Vitest** — Unit testing framework
- **ESLint** — JavaScript/TypeScript linter

## File Structure

```
.
├── src/
│   ├── ui.ts                      # User interface layer
│   └── game/
│       ├── index.ts               # Game module entry point
│       ├── types.ts               # Type definitions and interfaces
│       ├── card.ts                # Card model
│       ├── deck.ts                # Deck management
│       ├── meld.ts                # Meld logic
│       ├── contracts.ts           # Contract definitions
│       ├── validators.ts          # Validation utilities
│       ├── utils.ts               # Shared helpers
│       ├── engine/
│       │   ├── game-core.ts       # Core game logic and state machine
│       │   ├── ai.ts              # AI player bot
│       │   └── scoreboard.ts      # Score tracking
│       ├── players/
│       │   └── player.ts          # Player model
│       └── activity-log/
│           ├── entry.ts           # Log entry model
│           └── log-manager.ts     # Activity logging system
├── tests/
│   └── game.test.ts               # Unit tests
├── index.html                     # Entry HTML file
├── vite.config.ts                 # Vite build configuration
├── vitest.config.ts               # Vitest test configuration
├── tsconfig.json                  # TypeScript configuration
├── eslint.config.js               # ESLint configuration
├── package.json                   # Project dependencies and scripts
└── pnpm-lock.yaml                # Lockfile
```

## Development Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start the Vite development server |
| `pnpm build` | Build the project to the `dist/` directory |
| `pnpm typecheck` | Run TypeScript compiler in no-emit mode (type checking only) |
| `pnpm lint` | Run ESLint on `.js` and `.ts` files |
| `pnpm test` | Run Vitest unit tests |
