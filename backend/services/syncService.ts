import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncItem {
  id: string;
  type: 'pet' | 'appointment' | 'medication';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

interface SyncStatus {
  isSyncing: boolean;
  lastSync: number | null;
  pendingCount: number;
  failedCount: number;
}

const SYNC_QUEUE_KEY = '@sync_queue';
const SYNC_STATUS_KEY = '@sync_status';
const MAX_RETRIES = 3;

class SyncService {
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSync: null,
    pendingCount: 0,
    failedCount: 0,
  };

  async addToQueue(type: SyncItem['type'], action: SyncItem['action'], data: any): Promise<void> {
    const queue = await this.getQueue();
    const item: SyncItem = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
    };
    queue.push(item);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    await this.updateStatus({ pendingCount: queue.length });
  }

  async sync(apiClient: any): Promise<void> {
    if (this.syncStatus.isSyncing) return;

    await this.updateStatus({ isSyncing: true });
    const queue = await this.getQueue();
    const failed: SyncItem[] = [];

    for (const item of queue) {
      try {
        await this.syncItem(item, apiClient);
      } catch (error) {
        item.retries++;
        if (item.retries < MAX_RETRIES) {
          failed.push(item);
        }
      }
    }

    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failed));
    await this.updateStatus({
      isSyncing: false,
      lastSync: Date.now(),
      pendingCount: failed.length,
      failedCount: failed.filter(i => i.retries >= MAX_RETRIES).length,
    });
  }

  private async syncItem(item: SyncItem, apiClient: any): Promise<void> {
    const endpoint = `/${item.type}s`;
    
    switch (item.action) {
      case 'create':
        await apiClient.post(endpoint, item.data);
        break;
      case 'update':
        await apiClient.put(`${endpoint}/${item.data.id}`, item.data);
        break;
      case 'delete':
        await apiClient.delete(`${endpoint}/${item.data.id}`);
        break;
    }
  }

  async handleConflict(localData: any, serverData: any): Promise<any> {
    const localTime = localData.updatedAt || localData.timestamp || 0;
    const serverTime = serverData.updatedAt || serverData.timestamp || 0;
    return serverTime >= localTime ? serverData : localData;
  }

  async getStatus(): Promise<SyncStatus> {
    const stored = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return stored ? JSON.parse(stored) : this.syncStatus;
  }

  private async updateStatus(updates: Partial<SyncStatus>): Promise<void> {
    this.syncStatus = { ...this.syncStatus, ...updates };
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(this.syncStatus));
  }

  private async getQueue(): Promise<SyncItem[]> {
    const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async clearQueue(): Promise<void> {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
    await this.updateStatus({ pendingCount: 0, failedCount: 0 });
  }
}

export default new SyncService();
