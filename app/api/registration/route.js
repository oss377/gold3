import { NextResponse } from 'next/server';
     import { MongoClient } from 'mongodb';
     import fs from 'fs/promises';
     import path from 'path';

     export async function POST(req) {
       const uri = process.env.MONGODB_URI || '';
       let cachedDb = null;

       async function connectToDatabase() {
         if (cachedDb) {
           return cachedDb;
         }
         const client = new MongoClient(uri);
         await client.connect();
         cachedDb = client.db('gym_registrations');
         return cachedDb;
       }

       try {
         const db = await connectToDatabase();
         const formData = await req.formData();
         const fields = {};
         let photoPath = '';

         for (const [key, value] of formData.entries()) {
           if (key === 'photo' && value instanceof File) {
             const fileBuffer = Buffer.from(await value.arrayBuffer());
             const fileName = `${Date.now()}-${value.name}`;
             const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
             await fs.writeFile(filePath, fileBuffer);
             photoPath = `/uploads/${fileName}`;
           } else {
             fields[key] = value.toString();
           }
         }

         const registrationData = {
           firstName: fields.firstName || '',
           lastName: fields.lastName || '',
           phoneNumber: fields.phoneNumber || '',
           photo: photoPath,
           address: fields.address || '',
           city: fields.city || '',
           country: fields.country || '',
           jobType: fields.jobType || '',
           email: fields.email || '',
           gender: fields.gender || '',
           height: parseFloat(fields.height || '0'),
           weight: parseFloat(fields.weight || '0'),
           age: parseInt(fields.age || '0'),
           bmi: parseFloat(fields.bmi || '0'),
           bloodType: fields.bloodType || '',
           goalWeight: parseFloat(fields.goalWeight || '0'),
           emergencyName: fields.emergencyName || '',
           emergencyPhone: fields.emergencyPhone || '',
           relationship: fields.relationship || '',
           medicalConditions: fields.medicalConditions || '',
           hasMedicalConditions: fields.hasMedicalConditions === 'true',
           membershipType: fields.membershipType || '',
           startDate: fields.startDate || '',
           signature: fields.signature || '',
           createdAt: new Date(),
         };

         await db.collection('registrations').insertOne(registrationData);
         return NextResponse.json({ message: 'Registration successful' }, { status: 200 });
       } catch (error) {
         console.error(error);
         return NextResponse.json({ error: 'Failed to process registration' }, { status: 500 });
       }
     }