import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db/connect';
import Case, { createCase } from '@/lib/db/models/Case';

export async function GET() {
  try {
    await clientPromise;
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
    await clientPromise;
    const testCase = await createCase({
      caseNumber: `TEST-${Date.now()}`,
      caseType: 'auto_accident',
      title: 'Test Case',
      description: 'Test case for database connectivity',
      status: 'pending',
    });
    return NextResponse.json({ success: true, message: 'Test case created!', data: testCase });
  } catch (error: any) {
    console.error('Error creating test case:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create test case', error: error.message },
      { status: 500 }
    );
  }
}
