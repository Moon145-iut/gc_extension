const fs = require('fs');
const path = require('path');

jest.setTimeout(10000); // Increase timeout to 10 seconds

describe('Popup.js Tests', () => {
  beforeEach(() => {
    // Reset mocks and modules
    jest.resetModules();
    jest.resetAllMocks();
    
    // Set up document body
    document.body.innerHTML = `
      <input id="new-folder" type="text" />
      <button id="create-folder">Create Folder</button>
      <input id="rename-folder-old" type="text" />
      <input id="rename-folder-new" type="text" />
      <button id="rename-folder">Rename Folder</button>
      <input id="delete-folder" type="text" />
      <button id="delete-folder-btn">Delete Folder</button>
    `;

    // Mock successful responses for chrome.runtime.sendMessage
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      switch (message.type) {
        case 'sign-in':
          callback({ user: { uid: 'test-user-id' } });
          break;
        case 'get-folders':
          callback({ folders: { 'Test Folder': [] } });
          break;
        case 'save-folders':
          callback({ success: true });
          break;
      }
    });

    // Clear rate limit and use fake timers
    jest.useFakeTimers();
    
    // Load popup.js
    require('../popup.js');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Create folder - success', async () => {
    const input = document.getElementById('new-folder');
    input.value = 'New Test Folder';
    
    const createBtn = document.getElementById('create-folder');
    await createBtn.onclick();

    await new Promise(resolve => setTimeout(resolve, 0)); // Let promises resolve

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'save-folders',
        folders: expect.any(Object)
      }),
      expect.any(Function)
    );
    expect(global.location.reload).toHaveBeenCalled();
  });

  test('Create folder - empty name validation', async () => {
    const input = document.getElementById('new-folder');
    input.value = '';
    
    const createBtn = document.getElementById('create-folder');
    await createBtn.onclick();

    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith('Folder name is required');
  });

  test('Rate limiting', async () => {
    const input = document.getElementById('new-folder');
    input.value = 'Test Folder';
    
    const createBtn = document.getElementById('create-folder');

    // First click should work
    await createBtn.onclick();
    await new Promise(resolve => setTimeout(resolve, 0)); // Let promises resolve
    
    // Second immediate click should fail
    await createBtn.onclick();
    
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
    expect(global.alert).toHaveBeenCalledWith('Please wait before performing another operation');
    
    // Advance time by rate limit duration
    jest.advanceTimersByTime(1000);
    
    // Now should work again
    await createBtn.onclick();
    await new Promise(resolve => setTimeout(resolve, 0)); // Let promises resolve

    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
  });

  test('Rename folder - success', async () => {
    const oldNameInput = document.getElementById('rename-folder-old');
    const newNameInput = document.getElementById('rename-folder-new');
    oldNameInput.value = 'Test Folder';
    newNameInput.value = 'Renamed Folder';
    
    const renameBtn = document.getElementById('rename-folder');
    await renameBtn.onclick();
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'save-folders',
        folders: expect.objectContaining({
          'Renamed Folder': expect.any(Array)
        })
      }),
      expect.any(Function)
    );
    expect(global.location.reload).toHaveBeenCalled();
  });

  test('Rename folder - non-existent folder', async () => {
    const oldNameInput = document.getElementById('rename-folder-old');
    const newNameInput = document.getElementById('rename-folder-new');
    oldNameInput.value = 'Non Existent Folder';
    newNameInput.value = 'New Name';
    
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.type === 'get-folders') {
        callback({ folders: {} });
      }
    });
    
    const renameBtn = document.getElementById('rename-folder');
    await renameBtn.onclick();
    
    expect(global.alert).toHaveBeenCalledWith('Folder not found');
  });

  test('Delete folder - success', async () => {
    const input = document.getElementById('delete-folder');
    input.value = 'Test Folder';
    
    const deleteBtn = document.getElementById('delete-folder-btn');
    await deleteBtn.onclick();
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'save-folders',
        folders: expect.objectContaining({})
      }),
      expect.any(Function)
    );
    expect(global.location.reload).toHaveBeenCalled();
  });

  test('Network failure - sign in', async () => {
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.type === 'sign-in') {
        callback({ error: 'Network error' });
      }
    });

    const input = document.getElementById('new-folder');
    input.value = 'Test Folder';
    
    const createBtn = document.getElementById('create-folder');
    await createBtn.onclick();
    
    expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    expect(global.location.reload).not.toHaveBeenCalled();
  });

  test('Buttons should be disabled during operations', async () => {
    const input = document.getElementById('new-folder');
    input.value = 'Test Folder';
    
    // Mock a delay in the chrome.runtime.sendMessage
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      setTimeout(() => {
        callback({ folders: {} });
      }, 100);
    });
    
    const createBtn = document.getElementById('create-folder');
    const renameBtn = document.getElementById('rename-folder');
    const deleteBtn = document.getElementById('delete-folder-btn');
    
    createBtn.onclick();
    
    expect(createBtn.disabled).toBe(true);
    expect(renameBtn.disabled).toBe(true);
    expect(deleteBtn.disabled).toBe(true);
    
    jest.advanceTimersByTime(100);
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(createBtn.disabled).toBe(false);
    expect(renameBtn.disabled).toBe(false);
    expect(deleteBtn.disabled).toBe(false);
  });

  test('Concurrent operations should be rate limited', async () => {
    const input = document.getElementById('new-folder');
    input.value = 'Test Folder';
    
    const createBtn = document.getElementById('create-folder');
    const renameBtn = document.getElementById('rename-folder');
    
    // Start first operation
    createBtn.onclick();
    
    // Try to start second operation immediately
    renameBtn.onclick();
    
    expect(global.alert).toHaveBeenCalledWith('Please wait before performing another operation');
  });
});
