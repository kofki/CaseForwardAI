import clientPromise from '../connect';

export interface Feedback {
  _id?: string;
  caseId: string;
  type: 'rejection' | 'approval';
  comment: string;
  userId?: string;
  createdAt: Date;
}

export async function createFeedback(feedback: Omit<Feedback, '_id' | 'createdAt'>): Promise<Feedback> {
  const client = await clientPromise;
  const db = client.db('caseforward');
  const collection = db.collection<Feedback>('feedback');
  
  const newFeedback: Feedback = {
    ...feedback,
    createdAt: new Date(),
  };
  
  const result = await collection.insertOne(newFeedback as any);
  return {
    ...newFeedback,
    _id: result.insertedId.toString(),
  };
}

export async function getFeedbackByCaseId(caseId: string): Promise<Feedback[]> {
  const client = await clientPromise;
  const db = client.db('caseforward');
  const collection = db.collection<Feedback>('feedback');
  
  const feedback = await collection.find({ caseId }).sort({ createdAt: -1 }).toArray();
  return feedback.map(f => ({
    ...f,
    _id: f._id?.toString(),
  }));
}

