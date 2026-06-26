// Mock compasApi for local development
// This provides the lNodeLibrary interface expected by the Bay Template Editor plugin

let lNodeLibraryCache = null;

export const compasApi = {
  lNodeLibrary: {
    async loadLNodeLibrary() {
      if (lNodeLibraryCache) {
        return lNodeLibraryCache;
      }

      try {
        const response = await fetch(
          new URL(
            './LNodeTypeDB.ssd',
            import.meta.url
          ).href
        );
        const text = await response.text();
        lNodeLibraryCache = new DOMParser().parseFromString(
          text,
          'application/xml'
        );
        return lNodeLibraryCache;
      } catch (error) {
        console.error('Failed to load LNodeTypeDB:', error);
        return null;
      }
    },
    lNodeLibrary() {
      return lNodeLibraryCache;
    },
  },
};
