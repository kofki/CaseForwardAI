import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  } catch {
    // .env.local might not exist, that's okay
  }
}

loadEnv();

async function fixIndexes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('No database connection');
    process.exit(1);
  }

  // Fix cases collection
  const casesCollection = db.collection('cases');
  try {
    await casesCollection.dropIndex('fileNumber_1');
    console.log('✅ Dropped old fileNumber_1 index from cases');
  } catch (error: any) {
    if (error.codeName === 'IndexNotFound') {
      console.log('ℹ️  fileNumber_1 index already removed from cases');
    } else {
      console.error('Error dropping fileNumber_1:', error.message);
    }
  }

  // Fix audit_logs collection
  const auditLogsCollection = db.collection('audit_logs');
  try {
    await auditLogsCollection.dropIndex('spanId_1');
    console.log('✅ Dropped old spanId_1 index from audit_logs');
  } catch (error: any) {
    if (error.codeName === 'IndexNotFound') {
      console.log('ℹ️  spanId_1 index already removed from audit_logs');
    } else {
      console.error('Error dropping spanId_1:', error.message);
    }
  }

  // Fix documents collection - drop problematic hash index if needed
  const documentsCollection = db.collection('documents');
  try {
    // List all indexes first
    const docIndexes = await documentsCollection.indexes();
    console.log('\nCurrent indexes on documents collection:');
    docIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
  } catch (error: any) {
    console.error('Error listing document indexes:', error.message);
  }

  // List remaining indexes
  console.log('\nCurrent indexes on cases collection:');
  const casesIndexes = await casesCollection.indexes();
  casesIndexes.forEach((idx) => {
    console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
  });

  console.log('\nCurrent indexes on audit_logs collection:');
  const auditIndexes = await auditLogsCollection.indexes();
  auditIndexes.forEach((idx) => {
    console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

fixIndexes().catch(console.error);
