import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.ASSIGNMENTS_BUCKET!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Missing request body' }),
      };
    }

    const { assignmentName, fileName } = JSON.parse(event.body);
    const key = `${assignmentName}/${fileName}`;

    // Get content type from file extension
    const getContentType = (filename: string) => {
      const ext = filename.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'pdf':
          return 'application/pdf';
        case 'doc':
          return 'application/msword';
        case 'docx':
          return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls':
          return 'application/vnd.ms-excel';
        case 'xlsx':
          return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'ppt':
          return 'application/vnd.ms-powerpoint';
        case 'pptx':
          return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case 'txt':
          return 'text/plain';
        case 'rtf':
          return 'application/rtf';
        case 'json':
          return 'application/json';
        case 'xml':
          return 'application/xml';
        case 'csv':
          return 'text/csv';
        // Images
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'bmp':
          return 'image/bmp';
        case 'svg':
          return 'image/svg+xml';
        case 'webp':
          return 'image/webp';
        // Videos
        case 'mp4':
          return 'video/mp4';
        case 'avi':
          return 'video/x-msvideo';
        case 'mov':
          return 'video/quicktime';
        case 'wmv':
          return 'video/x-ms-wmv';
        case 'flv':
          return 'video/x-flv';
        case 'webm':
          return 'video/webm';
        // Audio
        case 'mp3':
          return 'audio/mpeg';
        case 'wav':
          return 'audio/wav';
        case 'flac':
          return 'audio/flac';
        case 'aac':
          return 'audio/aac';
        case 'ogg':
          return 'audio/ogg';
        // Code files
        case 'js':
          return 'application/javascript';
        case 'ts':
          return 'application/typescript';
        case 'py':
          return 'text/x-python';
        case 'java':
          return 'text/x-java-source';
        case 'cpp':
        case 'cc':
        case 'cxx':
          return 'text/x-c++src';
        case 'c':
          return 'text/x-csrc';
        case 'h':
          return 'text/x-chdr';
        case 'css':
          return 'text/css';
        case 'html':
          return 'text/html';
        case 'php':
          return 'application/x-httpd-php';
        case 'rb':
          return 'application/x-ruby';
        case 'go':
          return 'text/x-go';
        case 'rs':
          return 'text/x-rust';
        case 'sql':
          return 'application/sql';
        // Archives
        case 'zip':
          return 'application/zip';
        case 'rar':
          return 'application/vnd.rar';
        case 'tar':
          return 'application/x-tar';
        case 'gz':
          return 'application/gzip';
        case '7z':
          return 'application/x-7z-compressed';
        default:
          return 'application/octet-stream';
      }
    };

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: getContentType(fileName),
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        presignedUrl,
        key,
      }),
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Error generating presigned URL' }),
    };
  }
};
