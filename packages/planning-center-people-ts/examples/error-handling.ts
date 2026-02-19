import { PcoClient, PcoApiError } from '../src';

function logGetPageResult(): void {
  console.log('getPage succeeded');
}

async function runGetPage(client: PcoClient): Promise<void> {
  const result = await client.people.getPage({ per_page: 10 });
  console.log(`Found ${result.data.length} people`);
  logGetPageResult();
}

async function runGetByIdNotFound(client: PcoClient): Promise<void> {
  try {
    await client.people.getById('non-existent-id');
  } catch (error) {
    if (error instanceof PcoApiError) {
      if (error.status === 404) console.log('Person not found');
      else console.error('PCO error:', error.message);
    }
  }
}

function logPcoError(error: PcoApiError): void {
  console.error('PCO Error:', {
    message: error.message,
    status: error.status,
    statusText: error.statusText,
    errors: error.errors,
  });
  if (error.status === 401) console.error('Authentication failed - check your token');
  else if (error.status === 429) console.error('Rate limited - retry after delay');
  else if (error.status === 400 || error.status === 422) console.error('Validation error - check request data');
}

type ResultItem = { personId: string; success: boolean; data?: object; error?: string };

async function fetchPersonResults(client: PcoClient, personIds: string[]): Promise<ResultItem[]> {
  const results: ResultItem[] = [];
  for (const personId of personIds) {
    try {
      const person = await client.people.getById(personId);
      results.push({ personId, success: true, data: person });
    } catch (error) {
      results.push({
        personId,
        success: false,
        error: error instanceof PcoApiError ? error.message : String(error),
      });
    }
  }
  return results;
}

async function errorHandlingExample() {
  const client = new PcoClient({
    auth: {
      type: 'oauth',
      accessToken: 'your-token-here',
      refreshToken: 'your-refresh-token',
      onRefresh: async () => {},
      onRefreshFailure: async () => {},
    },
    timeout: 30000,
  });

  try {
    await runGetPage(client);
  } catch (error) {
    if (error instanceof PcoApiError) logPcoError(error);
    else console.error('Unexpected error:', error);
  }

  await runGetByIdNotFound(client);

  const personIds = ['id1', 'id2', 'id3'];
  const results = await fetchPersonResults(client, personIds);
  console.log('Results:', results);
}

errorHandlingExample().catch(console.error);
