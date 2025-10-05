# Utils API

## Operations Overview

### AUTHORIZE
**Description**: Custom Lambda authorizer for API Gateway that validates JWT tokens and enforces role-based access control.

---

## Implementation Details

### Custom Authorizer
**Purpose**: Validates JWT tokens from AWS Cognito and extracts user information for API authorization.

**Location**: `utils/authorize/custom-authorizer.ts`

**Sequence**:
1. Extract token from Authorization header
2. Verify JWT signature using Cognito public keys
3. Validate token claims (expiration, issuer, etc.)
4. Extract user ID and role from token
5. Generate IAM policy for API access

**Expected Input**: 
- Authorization header with Bearer token format: `Bearer <jwt-token>`

**Expected Output**: 
IAM policy with user context:
```json
{
  "principalId": "user-id",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "execute-api:Invoke",
        "Effect": "Allow",
        "Resource": "arn:aws:execute-api:*:*:*"
      }
    ]
  },
  "context": {
    "userId": "user-id",
    "email": "user@example.com",
    "role": "Teacher|Student|Admin"
  }
}
```

---

## Environment Variables

- `USER_POOL_ID`: Cognito User Pool ID for token validation

---

## Error Responses

**401 Unauthorized**:
- Invalid or expired token
- Token signature verification failed
- Missing Authorization header

**403 Forbidden**:
- User lacks required permissions for the requested resource

---

## Notes

- Token TTL is cached for 5 minutes to improve performance
- Supports multiple user roles: Admin, Teacher, Student
- Role information is passed to downstream services via Lambda context