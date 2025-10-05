# Documentation

This directory contains comprehensive documentation for the Sample Web
application.

## 📚 Documentation Structure

| File                                 | Description                                              |
| ------------------------------------ | -------------------------------------------------------- |
| [`README.md`](README.md)             | This overview document                                   |
| [`architecture.md`](architecture.md) | System design, architecture diagrams, and key components |
| [`ERD.md`](ERD.md)                   | Entity Relationship Diagram and database schema design   |
| [`RBAC.md`](RBAC.md)                 | Role-Based Access Control (RBAC) system documentation    |

## 🚀 Quick Start

1. **New to the project?** Start with the [main README](../README.md) and
   [deployment guide](../infra/DEPLOYMENT.md) to get your development
   environment ready
2. **Understanding the system?** Check out [`architecture.md`](architecture.md)
   for system overview
3. **Database design?** See [`ERD.md`](ERD.md) for database schema information
4. **Working with permissions?** See [`RBAC.md`](RBAC.md) for authentication and
   authorization details

## 🎯 System Overview

Sample Web is a modern serverless web application built on AWS that provides:

- **Authentication System**: Secure user authentication with AWS Cognito and
  Amplify
- **Assignment Management**: CRUD operations for assignments with AI-powered
  analysis
- **File Processing**: S3 integration for secure file uploads and management
- **Scalable Backend**: Serverless Lambda functions with DynamoDB persistence
- **Modern Frontend**: React application with TypeScript, Tailwind CSS, and Vite

## 🏗️ Technology Stack

- **Frontend**: React with TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: AWS Lambda (Node.js/TypeScript, Python)
- **Infrastructure**: AWS CDK (TypeScript)
- **Database**: DynamoDB
- **Storage**: S3
- **Authentication**: AWS Cognito with AWS Amplify
- **API**: API Gateway with CORS support
- **Deployment**: CloudFront CDN with S3 hosting

## 📖 Additional Resources

- [Main Project README](../README.md) - Project overview and basic setup
- [Deployment Guide](../infra/DEPLOYMENT.md) - Comprehensive deployment
  instructions
- [Infrastructure Code](../infra/) - CDK infrastructure implementation
- [Frontend Application](../apps/ui/web/) - React web application code

---

_Last updated: $(date)_
