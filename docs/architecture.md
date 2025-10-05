# System Architecture

This document describes the architecture and design of the Sample Web
application.

## 🏗️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   React UI      │────│   API Gateway   │────│   Lambda        │
│   (Frontend)    │    │   + Cognito     │    │   Functions     │
│                 │    │   Auth          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │                 │    │                 │
                       │   AWS Cognito   │    │   DynamoDB      │
                       │   (Auth)        │    │   + S3 Storage  │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

## 🔧 Core Components

### Frontend (React UI)

- **Location**: `/apps/ui/web/`
- **Technology**: React, TypeScript, Vite, Tailwind CSS, Radix UI
- **Purpose**: Modern web application with authentication and protected routes
- **Key Features**:
  - AWS Amplify authentication integration
  - Protected route system
  - Responsive UI with Tailwind CSS
  - Component-based architecture
  - React Router for navigation

### API Gateway

- **Technology**: AWS API Gateway with CORS
- **Authentication**: AWS Cognito Integration
- **Endpoints**:
  - `/assignments` - Assignment operations (CRUD)
  - Sample Todo API structure for extensibility

### Backend Lambda Functions

- **Technology**: Node.js 18.x, TypeScript and Python 3.11
- **Architecture**: Microservices pattern
- **Key Functions**:
  - **Assignment Management**: CRUD operations for assignments
  - **Assignment Analysis**: AI-powered assignment evaluation using
    OpenAI/Mistral
  - **File Processing**: S3 presigned URL generation for uploads
  - **Data Operations**: DynamoDB integration for persistence

### Database Layer

- **Primary Database**: DynamoDB
- **Tables**:
  - `Assignments` - Assignment metadata and configurations
  - `AssignmentSubmissions` - Student submission records
  - Additional tables as needed for application features
- **Storage**: S3 for file storage (assignments, submissions, resources)

### Authentication & Authorization

- **Identity Provider**: AWS Cognito User Pools
- **Authorization**: Built-in Cognito authentication with AWS Amplify
- **User Management**: Cognito-based user registration and authentication
- **Token Flow**: AWS Amplify handles JWT tokens and session management

## 🔄 Data Flow

### 1. User Authentication

```
User Login → Cognito → JWT Token → Amplify Session → Frontend Access
```

### 2. API Request Flow

```
Frontend Request → API Gateway → Lambda Function → DynamoDB/S3
                      ↓
              Cognito Authorization
```

### 3. Assignment Processing

```
User Upload → S3 Storage → Lambda Processing → AI Analysis → Results Storage → User Notification
```

## 🔐 Security Architecture

### Authentication Layer

- **AWS Cognito User Pools** for identity management
- **AWS Amplify** for client-side authentication
- **JWT tokens** managed automatically by Amplify

### Authorization Layer

- **Cognito-based access control**
- **User groups and attributes** for permissions
- **Protected routes** in React application
- **API Gateway integration** with Cognito

### Data Security

- **Encryption at rest** (DynamoDB, S3)
- **Encryption in transit** (HTTPS, TLS)
- **IAM least privilege** for Lambda functions
- **Secure S3 presigned URLs** for file operations

## 📊 Scalability Considerations

### Horizontal Scaling

- **Serverless Lambda functions** auto-scale based on demand
- **DynamoDB on-demand billing** handles traffic spikes
- **S3 unlimited storage** for file uploads
- **API Gateway automatic scaling**

### Performance Optimization

- **CloudFront CDN** for static asset delivery
- **Lambda layer sharing** for common dependencies
- **Vite bundling** for optimized frontend builds
- **React Query** for client-side caching

### Cost Optimization

- **Pay-per-use serverless model**
- **DynamoDB on-demand pricing**
- **S3 intelligent tiering** for long-term storage
- **Lambda provisioned concurrency** (only where needed)

## 🔌 Integration Points

### External Services

- **OpenAI/Mistral APIs** for assignment analysis
- **AWS Cognito** for authentication services
- **Third-party integrations** as needed

### Internal Communication

- **API Gateway** as the central entry point
- **Lambda-to-Lambda** communication via AWS SDK
- **DynamoDB** for data persistence
- **S3 event notifications** for file processing triggers

## 🚀 Deployment Architecture

### Infrastructure as Code

- **AWS CDK** (TypeScript) for infrastructure definition
- **Stack organization**: Separate InfraStack and UiStack
- **Environment separation**: Dev/staging/prod via stack prefixes

### CI/CD Pipeline

- **Source**: Git repository
- **Build**: CDK synthesis, Lambda bundling, and Vite build
- **Deploy**: CDK deploy with environment variables extraction
- **Testing**: Integration tests post-deployment

## 📈 Monitoring & Observability

### Logging

- **CloudWatch Logs** for all Lambda functions
- **Structured logging** with correlation IDs
- **Error tracking** and alerting

### Metrics

- **API Gateway metrics** (latency, errors, throughput)
- **Lambda metrics** (duration, errors, concurrent executions)
- **DynamoDB metrics** (read/write capacity, throttling)

### Tracing

- **AWS X-Ray** for distributed tracing (optional)
- **Lambda function correlation** across service calls

---

_For implementation details, see the individual component documentation in their
respective directories._
