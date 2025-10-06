// Firestore Database Service
class FirestoreService {
    constructor() {
        if (typeof firebase === 'undefined') {
            console.warn('Firebase not available');
            return;
        }
        
        this.db = firebase.firestore();
    }

    // Generic CRUD operations
    async create(collection, data) {
        try {
            const docRef = await this.db.collection(collection).add({
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getById(collection, id) {
        try {
            const doc = await this.db.collection(collection).doc(id).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            } else {
                return { success: false, error: 'Document not found' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async update(collection, id, data) {
        try {
            await this.db.collection(collection).doc(id).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async delete(collection, id) {
        try {
            await this.db.collection(collection).doc(id).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Query operations
    async query(collection, conditions = [], orderBy = null, limit = null) {
        try {
            let query = this.db.collection(collection);

            // Apply conditions
            conditions.forEach(condition => {
                query = query.where(...condition);
            });

            // Apply ordering
            if (orderBy) {
                query = query.orderBy(...orderBy);
            }

            // Apply limit
            if (limit) {
                query = query.limit(limit);
            }

            const snapshot = await query.get();
            const results = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return { success: true, data: results };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Real-time listeners
    onCollectionUpdate(collection, conditions, callback) {
        let query = this.db.collection(collection);

        conditions.forEach(condition => {
            query = query.where(...condition);
        });

        return query.onSnapshot(snapshot => {
            const results = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(results);
        });
    }

    // Specific collections
    async getUserPosts(userId) {
        return await this.query('posts', [
            ['authorId', '==', userId]
        ], ['createdAt', 'desc']);
    }

    async getRecentPosts(limit = 10) {
        return await this.query('posts', [], ['createdAt', 'desc'], limit);
    }
}

// Create global instance (only if Firebase is available)
const firestoreService = typeof firebase !== 'undefined' ? new FirestoreService() : null;