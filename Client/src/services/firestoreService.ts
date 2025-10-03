import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  DocumentData,
  QuerySnapshot 
} from 'firebase/firestore';
import { firestore } from './firebase';

export class FirestoreService {
  // Generic CRUD operations
  static async create(collectionName: string, data: any): Promise<string> {
    const docRef = await addDoc(collection(firestore, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  }

  static async update(collectionName: string, id: string, data: any): Promise<void> {
    const docRef = doc(firestore, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  static async delete(collectionName: string, id: string): Promise<void> {
    const docRef = doc(firestore, collectionName, id);
    await deleteDoc(docRef);
  }

  static async getById(collectionName: string, id: string): Promise<DocumentData | null> {
    const docRef = doc(firestore, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  static async getAll(collectionName: string): Promise<DocumentData[]> {
    const querySnapshot = await getDocs(collection(firestore, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Real-time listeners
  static onCollectionUpdate(
    collectionName: string, 
    callback: (snapshot: QuerySnapshot<DocumentData>) => void,
    constraints: any[] = []
  ): () => void {
    let q = query(collection(firestore, collectionName));
    
    // Apply constraints (where, orderBy, limit, etc.)
    constraints.forEach(constraint => {
      q = query(q, constraint);
    });

    return onSnapshot(q, callback);
  }

  // Specific collections
  static async getPostsByUser(userId: string): Promise<DocumentData[]> {
    const q = query(
      collection(firestore, 'posts'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getRecentPosts(count: number = 10): Promise<DocumentData[]> {
    const q = query(
      collection(firestore, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
