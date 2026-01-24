import clientPromise from '../connect';

export interface Action {
  _id?: string;
  caseId: string;
  type: 'approve' | 'reject' | 'review';
  actionCard: {
    recommendation: 'approve' | 'reject' | 'review';
    reasoning: string;
    confidence: number;
  };
  consensus: {
    clientGuruOpinion: string;
    evidenceAnalyzerOpinion: string;
    finalDecision: string;
  };
  createdAt: Date;
  userId?: string;
}

export async function createAction(action: Omit<Action, '_id' | 'createdAt'>): Promise<Action> {
  const client = await clientPromise;
  const db = client.db('caseforward');
  const collection = db.collection<Action>('actions');
  
  const newAction: Action = {
    ...action,
    createdAt: new Date(),
  };
  
  const result = await collection.insertOne(newAction as any);
  return {
    ...newAction,
    _id: result.insertedId.toString(),
  };
}

export async function getActionsByCaseId(caseId: string): Promise<Action[]> {
  const client = await clientPromise;
  const db = client.db('caseforward');
  const collection = db.collection<Action>('actions');
  
  const actions = await collection.find({ caseId }).sort({ createdAt: -1 }).toArray();
  return actions.map(action => ({
    ...action,
    _id: action._id?.toString(),
  }));
}

