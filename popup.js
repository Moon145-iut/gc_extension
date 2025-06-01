document.getElementById('create-folder').onclick = async () => {
  const name = document.getElementById('new-folder').value;
  if (!name) return;
  const user = await signIn();
  const folders = await getFolders(user.uid);
  folders[name] = folders[name] || [];
  await saveFolders(user.uid, folders);
  location.reload();
};

document.getElementById('rename-folder').onclick = async () => {
  const oldName = document.getElementById('rename-folder-old').value;
  const newName = document.getElementById('rename-folder-new').value;
  if (!oldName || !newName) return;
  const user = await signIn();
  const folders = await getFolders(user.uid);
  if (folders[oldName]) {
    folders[newName] = folders[oldName];
    delete folders[oldName];
    await saveFolders(user.uid, folders);
    location.reload();
  }
};

document.getElementById('delete-folder-btn').onclick = async () => {
  const name = document.getElementById('delete-folder').value;
  if (!name) return;
  const user = await signIn();
  const folders = await getFolders(user.uid);
  delete folders[name];
  await saveFolders(user.uid, folders);
  location.reload();
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