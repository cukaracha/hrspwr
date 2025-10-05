import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.ASSIGNMENTS_TABLE || 'AssignmentsAccess';
const PAGE_SIZE = 10;

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

    // Get user ID from custom Lambda authorizer context
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized: User ID not found in authorizer context',
        }),
      };
    }

    // Get pagination parameters from query string
    const lastEvaluatedKey = event.queryStringParameters?.lastEvaluatedKey
      ? JSON.parse(decodeURIComponent(event.queryStringParameters.lastEvaluatedKey))
      : undefined;

    // Query DynamoDB for assignments by userId
    const result = await dynamoDB
      .query({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false, // Sort in descending order (newest first)
        Limit: PAGE_SIZE,
        ExclusiveStartKey: lastEvaluatedKey,
      })
      .promise();

    console.log('Found assignments:', JSON.stringify(result.Items, null, 2));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        assignments: result.Items || [],
        lastEvaluatedKey: result.LastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
          : null,
        hasMore: !!result.LastEvaluatedKey,
      }),
    };
  } catch (error) {
    console.error('Error listing assignments:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to list assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
