export {};

declare global {
  interface Document {
    /**
     * Experimental View Transitions API.
     */
    startViewTransition?: (callback: () => void | Promise<void>) => {
      ready: Promise<void>;
    };
  }
}

