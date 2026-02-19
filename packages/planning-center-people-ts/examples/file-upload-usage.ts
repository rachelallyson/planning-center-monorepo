import { PcoClient, extractFileUrl, isFileUpload, processFileValue } from '../src';

async function exampleFileUploadHandling() {
  const client = new PcoClient({
    auth: {
      type: 'basic',
      appId: 'your-app-id',
      appSecret: 'your-app-secret',
    },
  });

  const personId = '12345';
  const fieldId = '67890';

  const htmlFileValue =
    '<a href="https://onark.s3.us-east-1.amazonaws.com/document.pdf" download>View File: https://onark.s3.us-east-1.amazonaws.com/document.pdf</a>';
  const cleanFileUrl = 'https://onark.s3.us-east-1.amazonaws.com/image.jpg';
  const textValue = 'This is just regular text';

  console.log('HTML value is file upload:', isFileUpload(htmlFileValue));
  console.log('Clean URL is file upload:', isFileUpload(cleanFileUrl));
  console.log('Text value is file upload:', isFileUpload(textValue));

  console.log('Extracted from HTML:', extractFileUrl(htmlFileValue));
  console.log('Extracted from clean URL:', extractFileUrl(cleanFileUrl));

  const textFieldResult = processFileValue(htmlFileValue, 'text');
  const fileFieldResult = processFileValue(htmlFileValue, 'file');
  console.log('Text field result:', textFieldResult);
  console.log('File field result:', fileFieldResult);

  try {
    const result = await client.fields.createPersonFieldData(personId, fieldId, htmlFileValue);
    console.log('Smart field data creation result:', result);
  } catch (error) {
    console.error('Error creating field data:', error);
  }
}

function demonstrateFileProcessing() {
  const fileUrls = [
    'https://example.com/document.pdf',
    'https://example.com/image.jpg',
    'https://example.com/spreadsheet.xlsx',
    'https://example.com/text-file.txt',
  ];

  fileUrls.forEach((url) => {
    const processed = processFileValue(url, 'file');
    console.log(`File: ${url}`);
    console.log('Processed:', processed);
    console.log('---');
  });
}

if (require.main === module) {
  exampleFileUploadHandling().catch(console.error);
  demonstrateFileProcessing();
}

export { exampleFileUploadHandling, demonstrateFileProcessing };
