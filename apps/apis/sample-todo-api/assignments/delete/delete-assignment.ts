import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB, S3 } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();
const s3 = new S3();
const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE || 'AssignmentsAccess';
const ASSIGNMENT_SUBMISSIONS_TABLE =
  process.env.ASSIGNMENT_SUBMISSIONS_TABLE || 'AssignmentSubmissions';
const DATA_BUCKET = process.env.ASSIGNMENTS_BUCKET || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json',
  };

  try {
    console.log('Received event:', JSON.stringify(event, null, 2));

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
        body: JSON.stringify({
          error: 'Unauthorized: User ID not found in token',
        }),
      };
    }

    console.log(`Deleting assignment ${assignmentId} for user ${userId}`);

    // First, verify the assignment exists and belongs to the user
    const assignmentQuery = await dynamoDB
      .scan({
        TableName: ASSIGNMENTS_TABLE,
        FilterExpression: 'userId = :userId AND id = :assignmentId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':assignmentId': assignmentId,
        },
      })
      .promise();

    if (!assignmentQuery.Items || assignmentQuery.Items.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Assignment not found or unauthorized' }),
      };
    }

    const assignment = assignmentQuery.Items[0];

    // Delete from AssignmentsAccess table
    await dynamoDB
      .delete({
        TableName: ASSIGNMENTS_TABLE,
        Key: {
          userId,
          timestamp: assignment.timestamp,
        },
      })
      .promise();

    console.log(`Deleted assignment from ${ASSIGNMENTS_TABLE} table`);

    // Delete all submissions for this assignment from AssignmentSubmissions table
    const submissionsQuery = await dynamoDB
      .query({
        TableName: ASSIGNMENT_SUBMISSIONS_TABLE,
        KeyConditionExpression: 'assignmentId = :assignmentId',
        ExpressionAttributeValues: {
          ':assignmentId': assignmentId,
        },
      })
      .promise();

    if (submissionsQuery.Items && submissionsQuery.Items.length > 0) {
      // Delete each submission
      const deletePromises = submissionsQuery.Items.map(submission =>
        dynamoDB
          .delete({
            TableName: ASSIGNMENT_SUBMISSIONS_TABLE,
            Key: {
              assignmentId: submission.assignmentId,
              studentSubmissionId: submission.studentSubmissionId,
            },
          })
          .promise()
      );

      await Promise.all(deletePromises);
      console.log(
        `Deleted ${submissionsQuery.Items.length} submissions from ${ASSIGNMENT_SUBMISSIONS_TABLE} table`
      );
    }

    // Delete S3 objects related to this assignment
    if (DATA_BUCKET) {
      try {
        // List all objects with the assignment prefix: assignmentId/
        const assignmentPrefix = `${assignmentId}/`;
        const listObjects = await s3
          .listObjectsV2({
            Bucket: DATA_BUCKET,
            Prefix: assignmentPrefix,
          })
          .promise();

        console.log(
          `Found ${listObjects.Contents?.length || 0} objects with prefix ${assignmentPrefix}:`
        );
        if (listObjects.Contents) {
          listObjects.Contents.forEach((obj, index) => {
            console.log(`  ${index + 1}. ${obj.Key}`);
          });
        }

        if (listObjects.Contents && listObjects.Contents.length > 0) {
          // Delete all objects
          const deleteObjects = {
            Bucket: DATA_BUCKET,
            Delete: {
              Objects: listObjects.Contents.map(obj => ({ Key: obj.Key! })),
            },
          };

          await s3.deleteObjects(deleteObjects).promise();
          console.log(
            `Deleted ${listObjects.Contents.length} S3 objects with prefix ${assignmentPrefix}`
          );
        }

        // Also delete any files that might be referenced directly in the assignment
        const filesToDelete = [];
        if (assignment.definitionFile) filesToDelete.push(assignment.definitionFile);
        if (assignment.rubricFile) filesToDelete.push(assignment.rubricFile);
        if (assignment.configFile) filesToDelete.push(assignment.configFile);

        if (filesToDelete.length > 0) {
          const deleteSpecificFiles = {
            Bucket: DATA_BUCKET,
            Delete: {
              Objects: filesToDelete.map(file => ({ Key: file })),
              Quiet: true, // Don't return errors for files that don't exist
            },
          };

          await s3.deleteObjects(deleteSpecificFiles).promise();
          console.log(`Deleted ${filesToDelete.length} specific assignment files from S3`);
        }
      } catch (s3Error) {
        console.warn('Error deleting S3 objects:', s3Error);
        // Continue execution even if S3 deletion fails
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Assignment deleted successfully',
        assignmentId,
        deletedSubmissions: submissionsQuery.Items ? submissionsQuery.Items.length : 0,
      }),
    };
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to delete assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
