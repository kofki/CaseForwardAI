import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import { Action, Case } from '@/lib/db/models';
import { ActionStatus } from '@/lib/db/types/enums';

interface ActionsQuery {
  caseId?: string;
  status?: ActionStatus | ActionStatus[];
  limit?: number;
  skip?: number;
}

interface ActionWithCase {
  _id: string;
  caseId: string;
  caseNumber?: string;
  clientName?: string;
  type: string;
  status: string;
  priority: number;
  title: string;
  description: string;
  content: any;
  aiContext: any;
  createdAt: Date;
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    const caseId = searchParams.get('caseId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    await connectDB();

    const query: any = {};

    if (caseId) {
      if (!mongoose.Types.ObjectId.isValid(caseId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid caseId' },
          { status: 400 }
        );
      }
      query.caseId = new mongoose.Types.ObjectId(caseId);
    }

    if (status) {
      const statuses = status.split(',');
      query.status = statuses.length === 1 ? status : { $in: statuses };
    } else {
      query.status = ActionStatus.AWAITING_REVIEW;
    }

    const actions = await Action.aggregate([
      { $match: query },
      { $sort: { priority: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'cases',
          localField: 'caseId',
          foreignField: '_id',
          as: 'case',
        },
      },
      { $unwind: '$case' },
      {
        $project: {
          _id: 1,
          caseId: 1,
          caseNumber: '$case.caseNumber',
          clientName: {
            $concat: ['$case.client.firstName', ' ', '$case.client.lastName'],
          },
          documentId: 1,
          type: 1,
          status: 1,
          priority: 1,
          title: 1,
          description: 1,
          content: 1,
          aiContext: 1,
          createdAt: 1,
          expiresAt: 1,
        },
      },
    ]);

    const total = await Action.countDocuments(query);

    return NextResponse.json({
      success: true,
      actions,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + actions.length < total,
      },
    });

  } catch (error: any) {
    console.error('Error fetching actions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch actions' },
      { status: 500 }
    );
  }
}
