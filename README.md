# Sample Web Application

A modern, scalable web application template built with enterprise-grade
architecture and comprehensive code quality enforcement.

## 🏗️ Architecture Overview

This project follows a **4-layer architecture** pattern designed for
scalability, maintainability, and domain separation:

### Apps Layer (Domain-Driven Design)

The `apps/` directory contains all application code organized by domain:

```
apps/
├── apis/           # Backend APIs and services
│   └── sample-todo-api/
│       └── assignments/    # Domain: Assignment management
│           ├── create/     # Create operations
│           ├── read/       # Read operations
│           ├── update/     # Update operations
│           ├── delete/     # Delete operations
│           └── README.md   # Domain documentation (required)
├── ui/             # User Interface applications
│   └── web/        # React web application
├── data/           # Data processing services (future)
└── ai-agents/      # AI/ML agents and workflows (future)
```

#### Domain-Driven API Design

Each API domain (like `assignments`) contains:

- **CRUD Operations**: Organized by operation type (create, read, update,
  delete)
- **README Documentation**: **Required** for each domain to enable MCP server
  generation
- **Self-contained Logic**: All business logic for the domain in one place
- **Clear Boundaries**: Each domain handles its own data and operations

### Infrastructure Layer (AWS CDK)

The `infra/` directory contains **only CDK infrastructure code**:

```
infra/
├── lib/
│   ├── constructs/     # Reusable CDK constructs
│   ├── infra-stack.ts  # Core infrastructure
│   └── ui-stack.ts     # UI deployment stack
├── lambda/
│   └── utils/          # Shared utilities (authorizers, etc.)
└── bin/                # CDK app entry points
```

**Important**: All Lambda functions, containers, and application code should be
in `apps/`, not `infra/`. Infrastructure code should only contain CDK constructs
and deployment logic.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- AWS CLI configured
- AWS CDK CLI installed

### Development Setup

1. **Clone and Install**:

   ```bash
   git clone <repository-url>
   cd Sample-Web
   npm install  # Sets up git hooks automatically
   ```

2. **Start Development**:

   ```bash
   npm run dev  # Starts UI development server
   ```

3. **Deploy Infrastructure**:
   ```bash
   ./deploy.sh  # Comprehensive deployment script
   ```

## 🛠️ Technology Stack

### Frontend

- **React 18** with TypeScript
- **Vite 5.1.x** for build tooling
- **Tailwind CSS** + **Radix UI** for styling
- **TanStack Query** for state management
- **React Router DOM 6.22.x**

### Backend & Infrastructure

- **AWS CDK** for infrastructure as code
- **AWS Lambda** (Node.js 18) for serverless functions
- **AWS Cognito** for authentication
- **AWS API Gateway** for REST APIs
- **AWS S3 + CloudFront** for web hosting

## 📋 Development Workflows

### API Development (Domain-Driven)

When building new APIs:

1. **Create Domain Directory**:

   ```bash
   mkdir -p apps/apis/your-domain-api
   cd apps/apis/your-domain-api
   ```

2. **Organize by Operations**:

   ```
   your-domain-api/
   ├── create/
   │   ├── create-item.ts      # POST /items
   │   └── batch-create.ts     # POST /items/batch
   ├── read/
   │   ├── list-items.ts       # GET /items
   │   └── get-item.ts         # GET /items/{id}
   ├── update/
   │   └── update-item.ts      # PUT /items/{id}
   ├── delete/
   │   └── delete-item.ts      # DELETE /items/{id}
   └── README.md               # Required: API documentation
   ```

3. **Create Domain README**:
   - Document all endpoints
   - Describe request/response schemas
   - Include example usage
   - **This enables future MCP server generation**

### UI Development

The UI follows modern React patterns:

- **Component-based architecture**
- **TypeScript for type safety**
- **Custom hooks for state logic**
- **Radix UI primitives + Tailwind styling**

## 🔒 Code Quality & Standards

This repository enforces **comprehensive code quality** through automated
tooling:

### Automated Quality Enforcement

✅ **Pre-commit Hooks**:

- **ESLint**: Fixes code quality issues
- **Prettier**: Enforces consistent formatting
- **lint-staged**: Only processes staged files (fast)

✅ **Commit Message Validation**:

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, etc.
- **commitlint**: Validates message format
- **Blocks non-standard commit messages**

✅ **TypeScript + React Standards**:

- **Strict type checking**
- **React hooks linting**
- **Import/export conventions**
- **Unused code detection**

### Available Scripts

```bash
# Code Quality
npm run lint          # Fix all auto-fixable issues
npm run lint:check    # Check without fixing
npm run format        # Format all files
npm run format:check  # Check formatting

# Development
npm run dev           # Start UI development
npm run build         # Build for production
npm run deploy        # Deploy infrastructure

# Deployment
./deploy.sh           # Full deployment with env setup
```

### IDE Integration

**VS Code** is pre-configured with:

- **Auto-format on save**
- **ESLint auto-fix**
- **Recommended extensions**
- **Monorepo workspace settings**

## 📁 Project Structure

```
Sample-Web/
├── apps/                    # 4-layer application architecture
│   ├── apis/               # Backend APIs (domain-driven)
│   │   └── sample-todo-api/
│   │       └── assignments/  # Assignment domain
│   ├── ui/                 # User interfaces
│   │   └── web/           # React web app
│   ├── data/              # Data services (future)
│   └── ai-agents/         # AI/ML agents (future)
│
├── infra/                  # AWS CDK infrastructure only
│   ├── lib/               # CDK stacks and constructs
│   ├── lambda/utils/      # Shared utilities (auth, etc.)
│   └── bin/               # CDK entry points
│
├── docs/                  # Documentation
├── .husky/               # Git hooks
├── .vscode/              # VS Code settings
│
├── deploy.sh             # Deployment script
├── CONTRIBUTING.md       # Development guidelines
└── DEPLOYMENT.md         # Infrastructure deployment guide
```

## 🚢 Deployment

### Local Development

```bash
npm run dev  # UI development server
```

### Staging/Production

```bash
# Deploy to staging
STACK_PREFIX=staging- ./deploy.sh

# Deploy to production
STACK_PREFIX=prod- ./deploy.sh
```

The deployment script:

1. **Builds infrastructure** (CDK)
2. **Extracts environment variables** from CloudFormation
3. **Updates UI configuration** automatically
4. **Deploys UI assets** to S3/CloudFront

## 🤝 Contributing

1. **Follow Conventional Commits**: `feat:`, `fix:`, `docs:`
2. **Code Quality**: Pre-commit hooks enforce standards
3. **Domain Documentation**: Add README.md for new API domains
4. **Architecture Principles**: Keep infrastructure and apps separate

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📚 Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Development guidelines and code
  standards
- **[DEPLOYMENT.md](infra/DEPLOYMENT.md)**: Infrastructure deployment guide
- **Domain READMEs**: Each API domain includes comprehensive documentation

---

**Built with enterprise-grade practices for modern web applications** 🚀
