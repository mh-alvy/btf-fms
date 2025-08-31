// Data Storage Manager - Updated to use Firestore
import { FirestoreStorageManager } from './firestore-storage.js';

class StorageManager extends FirestoreStorageManager {
    constructor() {
        super();
        console.log('StorageManager initialized with Firestore backend');
    }
}

// Global storage manager instance
window.storageManager = new StorageManager();
