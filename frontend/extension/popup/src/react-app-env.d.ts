/// <reference types="react-scripts" />

declare namespace chrome {
  namespace storage {
    namespace local {
      function get(keys: string | string[] | null, callback: (items: any) => void): void;
      function set(items: object, callback?: () => void): void;
      function clear(callback?: () => void): void;
    }
  }
  namespace runtime {
    function sendMessage(message: any, callback?: (response: any) => void): void;
    const onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: (response: any) => void) => boolean | void): void;
    };
  }
}
