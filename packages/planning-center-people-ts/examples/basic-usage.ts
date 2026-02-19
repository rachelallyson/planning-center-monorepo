/**
 * Basic Usage Example for @planning-center-people-ts
 *
 * Uses PcoClient with auth from the core package. Rate limiting is handled by the client.
 */

import { PcoClient } from '../src';

async function basicExample() {
  const client = new PcoClient({
    auth: {
      type: 'basic',
      appId: 'your-app-id',
      appSecret: 'your-app-secret',
    },
  });

  try {
    const people = await client.people.getPage({ per_page: 5, include: ['emails'] });
    console.log(`Found ${people.data.length} people`);

    if (people.data.length > 0) {
      const person = await client.people.getById(people.data[0].id!);
      console.log(`First person: ${person.first_name} ${person.last_name}`);
    }

    const newPerson = await client.people.create({
      first_name: 'John',
      last_name: 'Doe',
      status: 'active',
    });
    console.log(`Created person with ID: ${newPerson.id}`);

    const updatedPerson = await client.people.update(newPerson.id!, { first_name: 'Jane' });
    console.log(`Updated person: ${updatedPerson.first_name}`);

    await client.people.delete(newPerson.id!);
    console.log('Person deleted');
  } catch (error) {
    console.error('Error:', error);
  }
}

basicExample().catch(console.error);
