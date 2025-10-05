# Assignments API

## Operations Overview

### CREATE Assignment
**Description**: Creates a new assignment with AI-analyzed content from uploaded PDFs.

**Sequence**:
1. Get presigned URL for file uploads
2. Upload files to S3
3. Analyze PDFs with AI to extract marking guide and instructions
4. Create assignment record in DynamoDB

### READ Assignment(s)
**Description**: Retrieve assignment information - either a list of all assignments or details of a specific assignment.

### UPDATE Assignment
**Description**: Automatically updates assignment status to "Active" when config.json is uploaded to S3.

### DELETE Assignment
**Description**: Removes assignment and cascades deletion to all associated submissions and S3 files.

---

## API Endpoints

### 1. POST /assignments/presigned-url
**Description**: Generate presigned URL for S3 file upload.

**Request**:
```json
{
  "assignmentName": "unique-assignment-id",
  "fileName": "document.pdf"
}
```

**Response**:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/...",
  "key": "userId/assignmentId/document.pdf"
}
```

---

### 2. POST /assignments/analyze
**Description**: Analyze assignment and rubric PDFs using AI to extract marking criteria and instructions.

**Request**:
```json
{
  "assignment_pdf": "base64_encoded_pdf_content",
  "rubric_pdf": "base64_encoded_rubric_pdf_content"
}
```

**Response**:
```json
{
  "marking_guide": "Extracted marking criteria and grading guidelines...",
  "instructions": "Extracted assignment instructions and requirements...",
  "error": null
}
```

---

### 3. POST /assignments
**Description**: Create a new assignment record in the database.

**Request**:
```json
{
  "name": "Assignment 1: Essay Writing",
  "description": "Write a 1000-word essay on climate change",
  "instructions": "Students must submit a well-researched essay...",
  "manifest": [
    {
      "type": "written",
      "description": "Essay document"
    },
    {
      "type": "image",
      "description": "Supporting diagrams"
    }
  ],
  "rules": "Late submissions will receive a 10% penalty per day"
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Assignment 1: Essay Writing",
  "status": "Pending",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### 4. GET /assignments
**Description**: List all assignments for the authenticated user.

**Query Parameters**:
- `lastEvaluatedKey` (optional): Pagination token

**Response**:
```json
{
  "assignments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Assignment 1: Essay Writing",
      "description": "Write a 1000-word essay on climate change",
      "type": "Essay",
      "status": "Active",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T14:20:00Z"
    },
    {
      "id": "660f9500-f39c-52e5-b827-557766550111",
      "name": "Assignment 2: Lab Report",
      "description": "Complete lab report on chemical reactions",
      "type": "Report",
      "status": "Active",
      "createdAt": "2024-01-16T09:00:00Z",
      "updatedAt": "2024-01-16T09:00:00Z"
    }
  ],
  "lastEvaluatedKey": "eyJpZCI6IjY2MGY5NTAwLWYzOWMtNTJlNS1iODI3LTU1Nzc2NjU1MDExMSJ9",
  "hasMore": true
}
```

---

### 5. GET /assignments/{id}
**Description**: Get detailed information about a specific assignment.

**Path Parameters**:
- `id`: Assignment UUID

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Assignment 1: Essay Writing",
  "description": "Write a 1000-word essay on climate change",
  "type": "Essay",
  "status": "Active",
  "instructions": "Students must submit a well-researched essay...",
  "manifest": [
    {
      "type": "written",
      "description": "Essay document"
    }
  ],
  "rules": "Late submissions will receive a 10% penalty per day",
  "marking_guide": "Criterion 1: Research Quality (25%)...",
  "definitionFile": "userId/assignmentId/assignment.pdf",
  "rubricFile": "userId/assignmentId/rubric.pdf",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T14:20:00Z"
}
```

---

### 6. DELETE /assignments/{id}
**Description**: Delete an assignment and all associated submissions.

**Path Parameters**:
- `id`: Assignment UUID

**Response**:
```json
{
  "message": "Assignment deleted successfully",
  "assignmentId": "550e8400-e29b-41d4-a716-446655440000",
  "deletedSubmissions": 12
}
```

---

## S3-Triggered Update

### Event: S3 PUT on */assignment_config/config.json
**Description**: When a config.json file is uploaded to the assignment_config folder, the assignment status is automatically updated to "Active".

**S3 Object Path Pattern**: `{userId}/{assignmentId}/assignment_config/config.json`

**Effect**: 
- Assignment status changes from "Pending" to "Active"
- Updates the `updatedAt` timestamp
- Adds `marking_guide` if present in config.json

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request**:
```json
{
  "error": "Missing required fields",
  "details": "The 'name' field is required"
}
```

**401 Unauthorized**:
```json
{
  "error": "Unauthorized: User ID not found in token"
}
```

**404 Not Found**:
```json
{
  "error": "Assignment not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to create assignment",
  "details": "Database connection timeout"
}
```