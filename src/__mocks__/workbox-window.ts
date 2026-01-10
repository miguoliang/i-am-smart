// Mock for workbox-window
export class Workbox {
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  public register: jest.Mock;
  public addEventListener: jest.Mock;
  public removeEventListener: jest.Mock;
  public messageSkipWaiting: jest.Mock;

  constructor(public scriptURL: string) {
    this.register = jest.fn().mockResolvedValue({
      active: { state: 'activated' },
      waiting: null,
      installing: null,
    });
    
    this.addEventListener = jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event)!.push(handler);
    });
    
    this.removeEventListener = jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(handler);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    });
    
    this.messageSkipWaiting = jest.fn().mockResolvedValue(undefined);
  }

  // Helper method for tests to trigger events
  trigger(event: string, ...args: unknown[]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(handler => handler(...args));
    }
  }
}