let lastOperation = 0;
const RATE_LIMIT_MS = 1000; // 1 second between operations

const setLoading = (isLoading) => {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => btn.disabled = isLoading);
};

const checkRateLimit = () => {
  const now = Date.now();
  if (now - lastOperation < RATE_LIMIT_MS) {
    throw new Error('Please wait before performing another operation');
  }
  lastOperation = now;
};

document.getElementById('create-folder').onclick = async () => {
  try {
    checkRateLimit();
    setLoading(true);
    const name = document.getElementById('new-folder').value;
    if (!name || name.trim().length === 0) {
      throw new Error('Folder name is required');
    }
    const user = await signIn();
    const folders = await getFolders(user.uid);
    folders[name] = folders[name] || [];
    await saveFolders(user.uid, folders);
    location.reload();
  } catch (error) {
    alert(error.message);
  } finally {
    setLoading(false);
  }
};

document.getElementById('rename-folder').onclick = async () => {
  try {
    checkRateLimit();
    setLoading(true);
    const oldName = document.getElementById('rename-folder-old').value;
    const newName = document.getElementById('rename-folder-new').value;
    if (!oldName || !newName) {
      throw new Error('Both old and new folder names are required');
    }
    const user = await signIn();
    const folders = await getFolders(user.uid);
    if (folders[oldName]) {
      folders[newName] = folders[oldName];
      delete folders[oldName];
      await saveFolders(user.uid, folders);
      location.reload();
    } else {
      throw new Error('Folder not found');
    }
  } catch (error) {
    alert(error.message);
  } finally {
    setLoading(false);
  }
};

document.getElementById('delete-folder-btn').onclick = async () => {
  try {
    checkRateLimit();
    setLoading(true);
    const name = document.getElementById('delete-folder').value;
    if (!name) {
      throw new Error('Folder name is required');
    }
    const user = await signIn();
    const folders = await getFolders(user.uid);
    delete folders[name];
    await saveFolders(user.uid, folders);
    location.reload();
  } catch (error) {
    alert(error.message);
  } finally {
    setLoading(false);
  }
};

async function signIn() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'sign-in' }, response => resolve(response.user));
  });
}

async function getFolders(uid) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'get-folders', uid }, response => resolve(response.folders));
  });
}

async function saveFolders(uid, folders) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'save-folders', uid, folders }, response => resolve(response));
  });
}