# GremlinGx

#### CS 7280 Spring 2022 Project

Interprets query operations to generate an example graph that completely and minimally demonstrates
query behavior.

## Code author

Jackson Neal

## Installation

External Components:

- Download ANTLR tool [antlr-4.9.3-complete.jar](https://www.antlr.org/download.html), place in `./resources` directory at project root.

Dependencies:

```bash
# Install dependencies
npm install
```

## Execution

1. Use ANTLR to generate parser for grammar [./src/grammar/GremlinGx.g4](./src/grammar/GremlinGx.g4).

```bash
npm run generate
```

2. Build with Webpack

```bash
npm run build
```

## Development

Run Webpack serve in dev mode with hot reload

```bash
npm run dev
```

## Testing

```bash
# Run Jest test suite
npm test
```
```bash
# With coverage
npm run test-coverage
```

## Lint & Format

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

```bash
# ESLint check
npm run lint-check
```
```bash
# ESLint fix
npm run lint
````
```bash
# Prettier check
npm run format-check
```
```bash
# Prettier format
npm run format
```
