chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveBookmark') {
      chrome.storage.local.get({ bookmarks: [] }, (result) => {
        if (result.bookmarks.some(bookmark => bookmark.url === request.data.url || bookmark.name === request.data.name)) {
            sendResponse({ already_exist: true });
            return false;
        }
        const newBookmarks = [...result.bookmarks, request.data];
        chrome.storage.local.set({ bookmarks: newBookmarks }, () => {
          sendResponse({ success: true });
        });
      });
      return true;
    } else if (request.action === 'getBookmarks') {
      chrome.storage.local.get({ bookmarks: [] }, (result) => {
        sendResponse(result.bookmarks);
      });
      return true;
    } else if (request.action === 'deleteBookmark') {
      chrome.storage.local.get({ bookmarks: [] }, (result) => {
        const filtered = result.bookmarks.filter(
          bookmark => bookmark.url !== request.data.url
        );
        chrome.storage.local.set({ bookmarks: filtered }, () => {
          sendResponse({ success: true });
        });
      });
      return true;
    }
  });