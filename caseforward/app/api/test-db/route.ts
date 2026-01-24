import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/connect';
import Case from '@/lib/db/models/Case';

export async function GET() {
  try {
    await connectToDatabase();
    const caseCount = await Case.countDocuments();
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to MongoDB!',
      data: { casesInDatabase: caseCount },
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to connect to MongoDB', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await connectToDatabase();
    const testCase = new Case({
      caseNumber: `TEST-${Date.now()}`,
      caseType: 'auto_accident',
      status: 'intake',
      client: { name: 'Test Client', email: 'test@example.com', phone: '555-1234' },
      incident: { date: new Date(), location: 'Test Location', description: 'Test accident description' },
      dates: {
        intakeDate: new Date(),
        statuteOfLimitations: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      team: { attorney: 'Test Attorney', paralegal: 'Test Paralegal' },
    });
    await testCase.save();
    return NextResponse.json({ success: true, message: 'Test case created!', data: testCase });
  } catch (error: any) {
    console.error('Error creating test case:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create test case', error: error.message },
      { status: 500 }
    );
  }
}
