const floatingButton = document.createElement('button');
floatingButton.id = 'bookmark-floating-btn';
floatingButton.textContent = '📌';
document.body.appendChild(floatingButton);

const overlay = document.createElement('div');
overlay.id = 'bookmark-overlay';
overlay.innerHTML = `
  <div class="overlay-content">
    <input type="text" id="bookmark-name-user" placeholder="GitHub Username">
    <input type="text" id="bookmark-name-repo" placeholder="Repository Name">
    <button id="save-bookmark">Save</button>
    <ul id="bookmark-list"></ul>
  </div>
`;
document.body.appendChild(overlay);

function renderBookmarks(bookmarks) {
  const list = document.getElementById('bookmark-list');
  list.innerHTML = bookmarks.map(bookmark => `
    <li>
      <a href="${bookmark.url}" target="_blank">${bookmark.user}/${bookmark.repo}</a>
      <button class="delete-btn" data-url="${bookmark.url}">×</button>
    </li>
  `).join('');
}

// 浮动按钮点击事件
floatingButton.addEventListener('click', () => {
  overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
  chrome.runtime.sendMessage(
    { action: 'getBookmarks' }, 
    (bookmarks) => renderBookmarks(bookmarks)
  );
});

// 保存书签
document.getElementById('save-bookmark').addEventListener('click', () => {
  const user = document.getElementById('bookmark-name-user').value.trim();
  const repo = document.getElementById('bookmark-name-repo').value.trim();

  if (!user || !repo) {
    alert('Please enter a valid GitHub username and repository name');
    return;
  }

  const url = `https://github.com/${user}/${repo}`;
  const title = document.title;

  chrome.runtime.sendMessage({
    action: 'saveBookmark',
    data: { user, repo, url, title }
  }, (response) => {
    if (response?.already_exist) {
      alert('Bookmark with same user/repo already exists');
      return;
    }
    if (response?.success) {
      document.getElementById('bookmark-name-user').value = '';
      document.getElementById('bookmark-name-repo').value = '';
      chrome.runtime.sendMessage(
        { action: 'getBookmarks' },
        (bookmarks) => renderBookmarks(bookmarks)
      );
    } else {
      alert('Failed to save bookmark');
    }
  });
});

// 删除书签
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const urlToDelete = e.target.dataset.url;
    chrome.runtime.sendMessage({
      action: 'deleteBookmark',
      data: { url: urlToDelete }
    }, () => {
      chrome.runtime.sendMessage(
        { action: 'getBookmarks' },
        (bookmarks) => renderBookmarks(bookmarks)
      );
    });
  }
});
