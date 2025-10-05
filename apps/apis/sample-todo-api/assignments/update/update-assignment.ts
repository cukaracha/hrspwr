import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDB, S3 } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();
const s3 = new S3();
const TABLE_NAME = process.env.ASSIGNMENTS_TABLE || 'AssignmentsAccess';

interface S3EventRecord {
  eventVersion: string;
  eventSource: string;
  eventTime: string;
  eventName: string;
  userIdentity: {
    principalId: string;
  };
  requestParameters: {
    sourceIPAddress: string;
  };
  responseElements: {
    'x-amz-request-id': string;
    'x-amz-id-2': string;
  };
  s3: {
    s3SchemaVersion: string;
    configurationId: string;
    bucket: {
      name: string;
      ownerIdentity: {
        principalId: string;
      };
      arn: string;
    };
    object: {
      key: string;
      size: number;
      eTag: string;
      sequencer: string;
    };
  };
}

interface S3EventNotification {
  Records: S3EventRecord[];
}

interface ConfigData {
  marking_guide?: string;
  [key: string]: any;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Received SQS event:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      await processRecord(record);
    }
  } catch (error) {
    console.error('Error processing SQS event:', error);
    throw error; // Re-throw to trigger DLQ if configured
  }
};

async function processRecord(record: SQSRecord): Promise<void> {
  try {
    // Parse the S3 event notification from SQS message body
    const s3Event: S3EventNotification = JSON.parse(record.body);
    console.log('Parsed S3 event:', JSON.stringify(s3Event, null, 2));

    for (const s3Record of s3Event.Records) {
      await processS3Record(s3Record);
    }
  } catch (error) {
    console.error('Error processing SQS record:', error);
    throw error;
  }
}

async function processS3Record(s3Record: S3EventRecord): Promise<void> {
  const bucket = s3Record.s3.bucket.name;
  const key = decodeURIComponent(s3Record.s3.object.key);

  console.log(`Processing S3 object: s3://${bucket}/${key}`);

  // Check if the file is config.json
  if (!key.endsWith('config.json')) {
    console.log('File is not config.json, skipping...');
    return;
  }

  // Extract assignmentId from the S3 prefix
  // Expected format: userId/assignmentId/assignment_config/config.json
  const pathParts = key.split('/');
  if (
    pathParts.length !== 4 ||
    pathParts[2] !== 'assignment_config' ||
    pathParts[3] !== 'config.json'
  ) {
    console.error(
      `Invalid S3 key format. Expected: userId/assignmentId/assignment_config/config.json, got: ${key}`
    );
    return;
  }

  const userId = pathParts[0];
  const assignmentId = pathParts[1];

  console.log(`Extracted userId: ${userId}, assignmentId: ${assignmentId}`);

  try {
    // Download and parse the config.json file
    const s3Object = await s3
      .getObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();

    if (!s3Object.Body) {
      console.error('S3 object body is empty');
      return;
    }

    const configData: ConfigData = JSON.parse(s3Object.Body.toString());
    console.log('Parsed config data:', JSON.stringify(configData, null, 2));

    // Update the DynamoDB record
    await updateAssignmentInDynamoDB(userId, assignmentId, configData);
  } catch (error) {
    console.error(`Error processing config.json for assignment ${assignmentId}:`, error);
    throw error;
  }
}

async function updateAssignmentInDynamoDB(
  userId: string,
  assignmentId: string,
  configData: ConfigData
): Promise<void> {
  try {
    // First, find the assignment record using scan with filter (since we don't have the timestamp)
    const scanResult = await dynamoDB
      .scan({
        TableName: TABLE_NAME,
        FilterExpression: 'userId = :userId AND id = :assignmentId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':assignmentId': assignmentId,
        },
      })
      .promise();

    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.error(`Assignment not found: userId=${userId}, assignmentId=${assignmentId}`);
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    const assignmentRecord = scanResult.Items[0];
    console.log('Found assignment record:', JSON.stringify(assignmentRecord, null, 2));

    // Prepare update expression
    const updateExpression: string[] = [];
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: { [key: string]: any } = {};

    // Always update the status to "Active"
    updateExpression.push('#status = :status');
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = 'Active';

    // Update the updatedAt timestamp
    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    // Add marking_guide if it exists in the config
    if (configData.marking_guide !== undefined) {
      updateExpression.push('marking_guide = :marking_guide');
      expressionAttributeValues[':marking_guide'] = configData.marking_guide;
    }

    // Update using the full key (userId + timestamp)
    const updateParams = {
      TableName: TABLE_NAME,
      Key: {
        userId: assignmentRecord.userId,
        timestamp: assignmentRecord.timestamp,
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'UPDATED_NEW',
    };

    console.log('DynamoDB update params:', JSON.stringify(updateParams, null, 2));

    const updateResult = await dynamoDB.update(updateParams).promise();
    console.log(
      'Successfully updated assignment in DynamoDB:',
      JSON.stringify(updateResult, null, 2)
    );
  } catch (error) {
    console.error('Error updating DynamoDB:', error);
    throw error;
  }
}
