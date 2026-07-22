import { useState, useCallback, useEffect } from 'react';
import { ID, AppwriteException, Permission, Role } from 'appwrite';
import { account, databases, storage, APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, APPWRITE_BUCKET_ID } from '../lib/appwrite';
import { toast } from 'sonner';
import { FileSystemItem } from '../Types';

export function useAppwriteSync(
  items: FileSystemItem[],
  importJSON: (jsonStr: string, replace: boolean) => Promise<void>,
  exportJSON: () => string
) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    account.get().then((res) => {
      setUser(res);
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });
  }, []);

  
  
  
  
  
    const login = async (email: string, pass: string) => {
    try {
      await account.createEmailPasswordSession(email, pass);
      const acc = await account.get();
      setUser(acc);
      toast.success('Berhasil masuk', { duration: 2000 });
      return true;
    } catch (e: any) {
      toast.error('Gagal masuk: ' + e.message, { duration: 2000 });
      return false;
    }
  };

  const register = async (email: string, pass: string) => {
    try {
      await account.create(ID.unique(), email, pass);
      await account.createEmailPasswordSession(email, pass);
      const acc = await account.get();
      setUser(acc);
      toast.success('Berhasil mendaftar', { duration: 2000 });
      return true;
    } catch (e: any) {
      toast.error('Gagal daftar: ' + e.message, { duration: 2000 });
      return false;
    }
  };

    const resetPassword = async (email: string) => {
    const LAST_OTP_KEY = 'aksaralumina:lastOtpTime';
    const lastOtp = localStorage.getItem(LAST_OTP_KEY);
    const now = Date.now();
    
    if (lastOtp && now - parseInt(lastOtp, 10) < 60 * 60 * 1000) {
      toast.error('Harap tunggu 1 jam sebelum meminta kode OTP / reset sandi lagi.', { duration: 3000 });
      return false;
    }

    try {
      await account.createRecovery(email, window.location.origin);
      localStorage.setItem(LAST_OTP_KEY, now.toString());
      toast.success('Tautan reset sandi telah dikirim ke email Anda.', { duration: 3000 });
      return true;
    } catch (e: any) {
      toast.error('Gagal mengirim tautan: ' + e.message, { duration: 3000 });
      return false;
    }
  };

  const updatePasswordRecovery = async (userId: string, secret: string, newPass: string) => {
    try {
      await account.updateRecovery(userId, secret, newPass);
      toast.success('Sandi berhasil diubah. Silakan masuk dengan sandi baru.', { duration: 3000 });
      return true;
    } catch (e: any) {
      toast.error('Gagal mengubah sandi: ' + e.message, { duration: 3000 });
      return false;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      toast.info('Keluar', { duration: 2000 });
    } catch (e: any) {
      toast.error('Gagal keluar', { duration: 2000 });
    }
  };

  const syncData = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    const toastId = toast.loading('Menyinkronkan data...');
    try {
      let cloudItems: FileSystemItem[] = [];
      let docId = user.$id;
      let cloudApiKey = '';
      let cloudModel = '';
      let exists = false;
      try {
        const doc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId);
        exists = true;
        const parsed = JSON.parse(doc.data);
        cloudApiKey = parsed.apiKey || '';
        cloudModel = parsed.model || '';
        const rawItems: FileSystemItem[] = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.items) ? parsed.items : []);
        cloudItems = rawItems.map(it => {
          if (it.type === 'folder' && !it.name?.trim()) {
            return { ...it, name: 'Folder' };
          }
          return it;
        });
      } catch (err: any) {
        if (err.code !== 404 && err.code !== 403) throw err;
      }
      
      const localItems = Array.isArray(items) ? items : [];
      const cloudMap = new Map(cloudItems.map(i => [i.id, i]));
      const localMap = new Map(localItems.map(i => [i.id, i]));
      
      const mergedMap = new Map<string, FileSystemItem>();
      let naik = 0;
      let turun = 0;
      
      const localApiKey = localStorage.getItem('aksaralumina:openrouter-key') || '';
      const localModel = localStorage.getItem('aksaralumina:openrouter-model') || '';

      let finalApiKey = localApiKey;
      let finalModel = localModel;
      
      let settingsPulled = false;
      if (cloudApiKey && !localApiKey) {
          finalApiKey = cloudApiKey;
          settingsPulled = true;
      }
      if (cloudModel && !localModel) {
          finalModel = cloudModel;
          settingsPulled = true;
      }
      
      if (localApiKey && !cloudApiKey) {
          naik++;
      }
      if (localModel && !cloudModel) {
          naik++;
      }
      if (settingsPulled) {
          turun++;
      }

      // 1. Masukkan semua data lokal ke hasil gabungan
      for (const l of localItems) {
        mergedMap.set(l.id, l);
        // Jika tidak ada di awan, berarti naik
        if (!cloudMap.has(l.id)) {
          naik++;
        }
      }
      
      // 2. Cek data awan yang tidak ada di perangkat
      for (const c of cloudItems) {
        if (!localMap.has(c.id)) {
          mergedMap.set(c.id, c);
          turun++;
        }
      }
      
      const mergedList = Array.from(mergedMap.values());
      
      const finalDataStr = JSON.stringify({ 
        app: 'plaintxtai', 
        version: 1, 
        items: mergedList,
        apiKey: finalApiKey,
        model: finalModel,
        deletedIds: []
      });
      
      if (exists) {
        if (naik > 0 || turun > 0) {
          await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId, {
            data: finalDataStr
          });
        }
      } else {
        await databases.createDocument(
          APPWRITE_DATABASE_ID, 
          APPWRITE_COLLECTION_ID, 
          docId, 
          { data: finalDataStr },
          [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id))
          ]
        );
      }
      
      if (turun > 0) {
        await importJSON(JSON.stringify({ items: mergedList, apiKey: finalApiKey, model: finalModel }), true);
      }
      
      toast.success(`Sinkronisasi berhasil (${naik} file naik, ${turun} file turun).`, { id: toastId, duration: 2500 });
    } catch (e: any) {
      toast.error('Sinkronisasi gagal: ' + e.message, { id: toastId, duration: 2500 });
    } finally {
      setSyncing(false);
    }
  }, [user, items, importJSON]);

  const overwriteCloudData = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    const toastId = toast.loading('Menimpa data di awan...');
    try {
      let docId = user.$id;
      let exists = false;
      try {
        await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId);
        exists = true;
      } catch (err: any) {
        if (err.code !== 404 && err.code !== 403) throw err;
      }
      
      const localApiKey = localStorage.getItem('aksaralumina:openrouter-key') || '';
      const localModel = localStorage.getItem('aksaralumina:openrouter-model') || '';

      const finalDataStr = JSON.stringify({ 
        app: 'plaintxtai', 
        version: 1, 
        items: items,
        apiKey: localApiKey,
        model: localModel,
        deletedIds: []
      });
      
      if (exists) {
        await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId, {
          data: finalDataStr
        });
      } else {
        await databases.createDocument(
          APPWRITE_DATABASE_ID, 
          APPWRITE_COLLECTION_ID, 
          docId, 
          { data: finalDataStr },
          [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id))
          ]
        );
      }
      toast.success(`Data di awan berhasil ditimpa dengan data perangkat ini.`, { id: toastId, duration: 2500 });
    } catch (e: any) {
      toast.error('Gagal menimpa data awan: ' + e.message, { id: toastId, duration: 2500 });
    } finally {
      setSyncing(false);
    }
  }, [user, items]);

  const autoBackup = useCallback(async () => {
    if (!user) return;
    const LAST_BACKUP_KEY = 'aksaralumina:lastBackupTime';
    const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
    const now = Date.now();
    
    // Check if 24 hours have passed
    if (lastBackup && now - parseInt(lastBackup, 10) < 24 * 60 * 60 * 1000) {
      return; // Not yet 24 hours
    }

    try {
      const dataStr = exportJSON();
      // Generate YYYYMMDD
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const fileName = `auto_backup_${year}${month}${day}.json`;

      const file = new File([dataStr], fileName, { type: 'application/json' });

      await storage.createFile(
        APPWRITE_BUCKET_ID,
        ID.unique(),
        file,
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id))
        ]
      );

      localStorage.setItem(LAST_BACKUP_KEY, now.toString());
      console.log('Auto backup berhasil');
    } catch (e: any) {
      console.error('Auto backup error', e);
      if (e.message && e.message.includes("permissions provided for action 'create'")) {
        toast.error('Gagal pencadangan otomatis: Administrator perlu memberikan izin create pada Role users di Storage Bucket Appwrite.', { duration: 2000 });
      }
    }
  }, [user, exportJSON]);

  useEffect(() => {
    if (user && !loading) {
      autoBackup();
    }
  }, [user, loading, autoBackup]);

  return {
    user,
    loading,
    syncing,
    login,
    register,
    resetPassword,
    updatePasswordRecovery,
    logout,
    syncData,
    overwriteCloudData
  };
}
