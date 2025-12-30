import http from './http';

const VAPID_PUBLIC_KEY_URL = '/api/push-subscriptions/vapid-public-key';
const REGISTER_URL = '/api/push-subscriptions/register';
const UNREGISTER_URL = '/api/push-subscriptions/unregister';

export const pushService = {
  async isSupported(): Promise<boolean> {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  async getSubscription(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  },

  async subscribeUser(): Promise<boolean> {
    try {
      if (!(await this.isSupported())) return false;

      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from backend
      const { data } = await http.get<{ publicKey: string }>(VAPID_PUBLIC_KEY_URL);
      const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // Send subscription to backend
      const subJSON = subscription.toJSON();
      await http.post(REGISTER_URL, {
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth
      });

      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  },

  async unsubscribeUser(): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await http.post(UNREGISTER_URL, subscription.endpoint, {
            headers: { 'Content-Type': 'application/json' }
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
