import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import { Case } from '@/lib/db/models';
import { CaseType, CaseStatus } from '@/lib/db/types/enums';

interface CreateCaseRequest {
  caseNumber: string;
  incidentDate: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  description: string;
  caseType?: CaseType;
  priority?: string;
  assignTo?: string;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body: CreateCaseRequest = await req.json();

    // Validate required fields
    if (!body.caseNumber || !body.clientFirstName || !body.clientLastName) {
      return NextResponse.json(
        { success: false, message: 'Case number and client name are required' },
        { status: 400 }
      );
    }

    // Check for duplicate case number
    const existing = await Case.findOne({ caseNumber: body.caseNumber });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Case number already exists' },
        { status: 409 }
      );
    }

    // Create the case
    const newCase = await Case.create({
      caseNumber: body.caseNumber,
      title: `${body.clientFirstName} ${body.clientLastName} - ${body.caseType || 'Personal Injury'}`,
      description: body.description || '',
      caseType: body.caseType || CaseType.AUTO_ACCIDENT,
      status: CaseStatus.INTAKE,
      
      client: {
        firstName: body.clientFirstName,
        lastName: body.clientLastName,
        name: `${body.clientFirstName} ${body.clientLastName}`,
        email: body.clientEmail || '',
        phone: body.clientPhone || '',
      },

      incident: {
        date: body.incidentDate ? new Date(body.incidentDate) : new Date(),
        description: body.description || '',
      },

      team: {
        leadAttorney: body.assignTo || 'Unassigned',
      },

      dates: {
        intakeDate: new Date(),
      },

      evidenceChecklist: {
        clientIntake: false,
        retainerSigned: false,
        policeReport: false,
        medicalRecords: false,
        medicalBills: false,
        incidentPhotos: false,
        witnessStatements: false,
        payStubs: false,
        employerLetter: false,
        insuranceDocs: false,
      },

      financials: {
        totalMedicalBills: 0,
        totalLiens: 0,
        lostWages: 0,
        propertyDamage: 0,
      },
    });

    return NextResponse.json({
      success: true,
      caseId: newCase._id.toString(),
      caseNumber: newCase.caseNumber,
      message: 'Case created successfully',
    });

  } catch (error: any) {
    console.error('Create case error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create case' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      cases: cases.map((c: any) => ({
        id: c._id.toString(),
        caseNumber: c.caseNumber,
        title: c.title,
        clientName: c.client?.name || `${c.client?.firstName} ${c.client?.lastName}`,
        status: c.status,
        caseType: c.caseType,
        createdAt: c.createdAt,
      })),
    });

  } catch (error: any) {
    console.error('Get cases error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}
