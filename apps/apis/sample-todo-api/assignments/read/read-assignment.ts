import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();
// Note: Install @types/node if not already installed: npm i --save-dev @types/node
const TABLE_NAME = (process.env.ASSIGNMENTS_TABLE as string) || 'AssignmentsAccess';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json',
  };

  try {
    // Get assignment ID from path parameters
    const assignmentId = event.pathParameters?.id;
    if (!assignmentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Assignment ID is required' }),
      };
    }

    // Get user ID from Cognito authorizer context
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: User ID not found in token' }),
      };
    }

    // Query DynamoDB for the assignment using a scan with filter
    const result = await dynamoDB
      .scan({
        TableName: TABLE_NAME,
        FilterExpression: 'userId = :userId AND id = :assignmentId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':assignmentId': assignmentId,
        },
      })
      .promise();

    if (!result.Items || result.Items.length === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Assignment not found' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(result.Items[0]) };
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
