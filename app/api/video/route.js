import mongoose from 'mongoose';
import Registration from '../../../models/Registration';

export async function POST(req) {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const data = await req.json();
    const registration = new Registration(data);
    await registration.save();

    return new Response(JSON.stringify({ message: 'Registration saved successfully' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error saving registration', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await mongoose.connection.close();
  }
}