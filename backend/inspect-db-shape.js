const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const summarize = (document) => {
  if (!document) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(document).map(([key, value]) => {
      if (Array.isArray(value)) {
        return [key, `Array(${value.length})`];
      }

      if (value instanceof Date) {
        return [key, 'Date'];
      }

      if (value && typeof value === 'object') {
        return [key, value.constructor?.name || 'Object'];
      }

      return [key, typeof value];
    })
  );
};

async function inspectDbShape() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Please add it to backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((collection) => collection.name).sort();

  console.log('Collections:', collectionNames.join(', '));

  for (const name of ['rooms', 'room', 'room_types', 'reservations', 'feedbacks']) {
    const exists = collectionNames.includes(name);
    console.log(`\n[${name}] exists=${exists}`);

    if (!exists) {
      continue;
    }

    const count = await db.collection(name).countDocuments();
    const sample = await db.collection(name).findOne();
    console.log(`count=${count}`);
    console.log('sampleShape=', JSON.stringify(summarize(sample), null, 2));
  }
}

inspectDbShape()
  .catch((error) => {
    console.error('DB shape inspect failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
