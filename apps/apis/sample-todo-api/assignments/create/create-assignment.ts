import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamoDB = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.ASSIGNMENTS_TABLE || 'AssignmentsAccess';

interface SubmissionType {
  type: string;
  description: string;
}

interface AssignmentData {
  userId: string;
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  definitionFile?: string;
  rubricFile?: string;
  configFile?: string;
  instructions: string;
  manifest?: SubmissionType[];
  rules: string;
  createdAt: string;
  updatedAt: string;
  timestamp: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json',
  };

  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Using table name:', TABLE_NAME);

    // Get user ID from Cognito authorizer context
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized: User ID not found in token',
        }),
      };
    }

    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    console.log('Parsed body:', JSON.stringify(body, null, 2));

    // Validate required fields
    // if (!body.name || !body.description || !body.type) {
    if (!body.name || !body.description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: name, description, and type are required',
        }),
      };
    }

    const now = new Date().toISOString();

    // Use provided ID or generate a new one as fallback
    const assignmentId = body.id || uuidv4();

    // Create assignment data
    const assignmentData: AssignmentData = {
      userId,
      id: assignmentId,
      name: body.name,
      description: body.description,
      type: body.type,
      status: 'training',
      definitionFile: body.definitionFile,
      rubricFile: body.rubricFile,
      configFile: body.configFile,
      instructions: body.instructions || '',
      manifest: body.manifest,
      rules: body.rules || '',
      createdAt: now,
      updatedAt: now,
      timestamp: now,
    };

    console.log('Attempting to write to DynamoDB:', JSON.stringify(assignmentData, null, 2));

    // Store in DynamoDB
    await dynamoDB
      .put({
        TableName: TABLE_NAME,
        Item: assignmentData,
      })
      .promise();

    console.log('Successfully wrote to DynamoDB');

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Assignment created successfully',
        assignment: assignmentData,
      }),
    };
  } catch (error) {
    console.error('Error creating assignment:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
