import clientPromise from '../connect';

export interface Case {
  _id?: string;
  caseNumber: string;
  title: string;
  description: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  metadata?: Record<string, any>;
  caseType?: string;
  client?: { name: string; email: string; phone: string };
  incident?: { date: Date; location: string; description: string };
  dates?: {
    intakeDate: Date;
    statuteOfLimitations: Date;
  };
  team?: { attorney: string; paralegal: string };
}

export async function getCases(userId?: string): Promise<Case[]> {
  const client = await clientPromise;
  const db = client.db('caseforward');
  const collection = db.collection<Case>('cases');
  
  const query = userId ? { userId } : {};
  const cases = await collection.find(query).sort({ createdAt: -1 }).toArray();
  return cases.map(case_ => ({
    ...case_,
    _id: case_._id?.toString(),
  }));
}

export async function getCaseById(id: string): Promise<Case | null> {
  const client = await clientPromise;
  const db = client.db('caseforward');
  const collection = db.collection<Case>('cases');
  
  const case_ = await collection.findOne({ _id: id as any });
  if (!case_) return null;
  
  return {
    ...case_,
    _id: case_._id?.toString(),
  };
}

export async function createCase(caseData: Omit<Case, '_id' | 'createdAt' | 'updatedAt'>): Promise<Case> {
  const client = await clientPromise;
  const db = client.db('caseforward');
  const collection = db.collection<Case>('cases');
  
  const now = new Date();
  const newCase: Case = {
    ...caseData,
    createdAt: now,
    updatedAt: now,
  };
  
  const result = await collection.insertOne(newCase as any);
  return {
    ...newCase,
    _id: result.insertedId.toString(),
  };
}

// Default export with helper methods for test-db route compatibility
const CaseModel = {
  countDocuments: async () => {
    const client = await clientPromise;
    const db = client.db('caseforward');
    const collection = db.collection<Case>('cases');
    return await collection.countDocuments();
  },
};

export default CaseModel;


