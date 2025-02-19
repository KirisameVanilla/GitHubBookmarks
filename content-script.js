const floatingButton = document.createElement('button');
floatingButton.id = 'bookmark-floating-btn';
floatingButton.textContent = '📌';
document.body.appendChild(floatingButton);

const overlay = document.createElement('div');
overlay.id = 'bookmark-overlay';
overlay.innerHTML = `
  <div class="overlay-content">
    <button class="close-btn">×</button>
    <input type="text" id="bookmark-name-user" placeholder="GitHub Username">
    <input type="text" id="bookmark-name-repo" placeholder="Repository Name">
    <button id="save-bookmark">Save</button>
    <ul id="bookmark-list"></ul>
  </div>
`;
document.body.appendChild(overlay);

// 从存储加载位置
function getButtonPosition(isFreshing=false){
  chrome.storage.local.get({ buttonPosition: { x: 20, y: 20 } }, (result) => {
    if (isFreshing) {
      floatingButton.style.left = `${result.buttonPosition.x}px`;
      floatingButton.style.top = `${result.buttonPosition.y}px`;
    }
  });
  return {
    x: parseFloat(floatingButton.style.left),
    y: parseFloat(floatingButton.style.top)
  };
}

function getDistance(position1, position2) {
  return Math.sqrt(
    Math.pow(position1.x - position2.x, 2) + Math.pow(position1.y - position2.y, 2)
  );
}

function openMenu(){
  const buttonRect = floatingButton.getBoundingClientRect();
  overlay.style.left = `${buttonRect.left - 260}px`;
  overlay.style.top = `${buttonRect.top}px`;

  overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
  chrome.runtime.sendMessage(
    { action: 'getBookmarks' }, 
    (bookmarks) => renderBookmarks(bookmarks)
  );
}

getButtonPosition(true)

// 拖动
let isDragging = false;
let startX, startY, initialX, initialY;
let oldButtonPosition;

document.querySelector('.close-btn').addEventListener('click', () => {
  overlay.style.display = 'none';
});

floatingButton.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialX = parseFloat(floatingButton.style.left) || 20;
  initialY = parseFloat(floatingButton.style.top) || 20;
  oldButtonPosition = getButtonPosition();
  
  floatingButton.style.cursor = 'grabbing';
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;
  
  floatingButton.style.left = `${initialX + deltaX}px`;
  floatingButton.style.top = `${initialY + deltaY}px`;
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  floatingButton.style.cursor = 'pointer';
  
  // 保存位置
  const newPosition = {
    x: parseFloat(floatingButton.style.left),
    y: parseFloat(floatingButton.style.top)
  };

  if (getDistance(oldButtonPosition, newPosition) < 1) {
    openMenu();
    return;
  }

  chrome.storage.local.set({ buttonPosition: newPosition });
});

function renderBookmarks(bookmarks) {
  const list = document.getElementById('bookmark-list');
  list.innerHTML = bookmarks.map(bookmark => `
    <li>
      <a href="${bookmark.url}" target="_blank">${bookmark.user}/${bookmark.repo}</a>
      <button class="delete-btn" data-url="${bookmark.url}">×</button>
    </li>
  `).join('');
}

// 保存书签
document.getElementById('save-bookmark').addEventListener('click', () => {
  let user = document.getElementById('bookmark-name-user').value.trim();
  let repo = document.getElementById('bookmark-name-repo').value.trim();

  if (!user && !repo) {
    const urlMatch = window.location.href.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (urlMatch && urlMatch.length >= 3) {
      user = urlMatch[1];
      repo = urlMatch[2];
    } else {
      alert('Cannot auto-detect GitHub user/repo, please enter manually');
      return;
    }
  }

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