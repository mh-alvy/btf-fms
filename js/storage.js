// Data Storage Manager - Updated to use Firestore
import { FirestoreStorageManager } from './firestore-storage.js';

class StorageManager extends FirestoreStorageManager {
    constructor() {
        super();
        console.log('StorageManager initialized with Firestore backend');
    }
}

// Export for main.js initialization
window.StorageManager = StorageManager;
