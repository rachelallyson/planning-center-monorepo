import { PcoClient } from '../src';

async function example() {
  const client = new PcoClient({
    auth: {
      type: 'basic',
      appId: 'your-app-id',
      appSecret: 'your-app-secret',
    },
  });

  try {
    const people = await client.people.getPage({
      per_page: 10,
      include: ['emails', 'phone_numbers'],
    });
    console.log(`Found ${people.data.length} people`);

    if (people.data.length > 0) {
      const person = await client.people.getById(people.data[0].id!, { include: ['emails'] });
      console.log(`Person: ${person.first_name} ${person.last_name}`);
    }

    const newPerson = await client.people.create({
      first_name: 'John',
      last_name: 'Doe',
      status: 'active',
    });
    console.log(`Created person with ID: ${newPerson.id}`);

    const updatedPerson = await client.people.update(newPerson.id!, { first_name: 'Jane' });
    console.log(`Updated person: ${updatedPerson.first_name}`);

    const emails = await client.people.getEmails(newPerson.id!);
    console.log(`Person has ${emails.data.length} email(s)`);

    await client.contacts.createEmail(newPerson.id!, {
      address: 'jane.doe@gmail.com',
      location: 'work',
      primary: false,
    });

    const rateLimitInfo = client.getRateLimitInfo();
    console.log('Rate limit info:', rateLimitInfo);

    await client.people.delete(newPerson.id!);
    console.log('Person deleted');
  } catch (error) {
    console.error('Error:', error);
  }
}

example().catch(console.error);
