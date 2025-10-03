import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export class FirebaseStorageService {
  static async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }

  static async deleteFile(url: string): Promise<void> {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  }

  static async uploadUserAvatar(userId: string, file: File): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const path = `users/${userId}/avatar.${fileExtension}`;
    return await this.uploadFile(file, path);
  }

  static async uploadPostImage(postId: string, file: File): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const path = `posts/${postId}/featured-image.${fileExtension}`;
    return await this.uploadFile(file, path);
  }
}
