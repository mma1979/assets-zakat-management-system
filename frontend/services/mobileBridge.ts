/**
 * Bridge for communicating with the native .NET MAUI host.
 */
export const mobileBridge = {
  isMobileShell(): boolean {
    return (window as any).HybridWebView !== undefined;
  },

  async sendRawMessage(message: string): Promise<void> {
    if (this.isMobileShell()) {
      (window as any).HybridWebView.SendRawMessage(message);
    } else {
      console.warn('Native shell not detected. Message not sent:', message);
    }
  },

  async invokeNativeMethod(methodName: string, args?: any): Promise<void> {
    const payload = JSON.stringify({ method: methodName, args });
    await this.sendRawMessage(payload);
  },

  /**
   * Request haptic feedback from the device.
   */
  async hapticFeedback(): Promise<void> {
    await this.invokeNativeMethod('haptic');
  },

  /**
   * Request biometric authentication.
   */
  async authenticateBiometric(): Promise<void> {
    await this.invokeNativeMethod('biometric');
  }
};
