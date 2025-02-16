const floatingButton = document.createElement('button');
floatingButton.id = 'bookmark-floating-btn';
floatingButton.textContent = '📌';
document.body.appendChild(floatingButton);

const overlay = document.createElement('div');
overlay.id = 'bookmark-overlay';
overlay.innerHTML = `
  <div class="overlay-content">
    <input type="text" id="bookmark-name" placeholder="Bookmark name">
    <button id="save-bookmark">Save</button>
    <ul id="bookmark-list"></ul>
  </div>
`;
document.body.appendChild(overlay);

// 浮动按钮点击事件
floatingButton.addEventListener('click', () => {
  overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
  chrome.runtime.sendMessage({ action: 'getBookmarks' }, (bookmarks) => {
    const list = document.getElementById('bookmark-list');
    list.innerHTML = bookmarks.map(bookmark => `
      <li>
        <a href="${bookmark.url}" target="_blank">${bookmark.name}</a>
        <button class="delete-btn" data-url="${bookmark.url}">×</button>
      </li>
    `).join('');
  });
});

// save-bookmark 按钮点击事件
document.getElementById('save-bookmark').addEventListener('click', () => {
  const name = document.getElementById('bookmark-name').value;
  const url = window.location.href;
  const title = document.title;
  if (name.trim() === '') {
    alert('Please enter a valid name');
    return;
  }
  chrome.runtime.sendMessage({
    action: 'saveBookmark',
    data: { name, url, title }
  }, (response) => {
    if (response?.already_exist) {
        alert('Bookmark with same url or name already exists');
        return;
    }
    if (response?.success) {
      document.getElementById('bookmark-name').value = '';
      chrome.runtime.sendMessage({ action: 'getBookmarks' }, (bookmarks) => {
        const list = document.getElementById('bookmark-list');
        list.innerHTML = bookmarks.map(bookmark => `
            <li>
                <a href="${bookmark.url}" target="_blank">${bookmark.name}</a>
                <button class="delete-btn" data-url="${bookmark.url}">×</button>
            </li>
          `).join('');
      });
    }
    else{
      alert('Failed to save bookmark');
    }
  });
});

// detele-btn 点击事件
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const urlToDelete = e.target.dataset.url;
    chrome.runtime.sendMessage({
      action: 'deleteBookmark',
      data: { url: urlToDelete }
    }, () => {
      chrome.runtime.sendMessage({ action: 'getBookmarks' }, (bookmarks) => {
        const list = document.getElementById('bookmark-list');
        list.innerHTML = bookmarks.map(bookmark => `
            <li>
                <a href="${bookmark.url}" target="_blank">${bookmark.name}</a>
                <button class="delete-btn" data-url="${bookmark.url}">×</button>
            </li>
          `).join('');
      });
    });
  }
});