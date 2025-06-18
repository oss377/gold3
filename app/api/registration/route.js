import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;

  // MongoDB connection string (replace with your actual MongoDB URI)
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('gold');
    const collection = database.collection('karateuser');

    // Convert FormData to a plain object, handling file uploads
    const formData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Buffer) {
        // Handle file uploads (e.g., photo) by storing as base64 or skipping
        formData[key] = value.toString('base64'); // Convert buffer to base64 for storage
      } else {
        // Handle boolean and other fields
        formData[key] = value === 'true' ? true : value === 'false' ? false : value;
      }
    }

    // Insert the data into MongoDB
    const result = await collection.insertOne({
      ...formData,
      createdAt: new Date(),
    });

    return res.status(200).json({ message: 'Registration submitted successfully!', id: result.insertedId });
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    return res.status(500).json({ error: 'Failed to submit registration.' });
  } finally {
    await client.close();
  }
}