// Mock Chrome API
const mockSendMessage = jest.fn((message, callback) => {
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

global.chrome = {
  runtime: {
    sendMessage: mockSendMessage
  }
};

// Mock window functions
global.alert = jest.fn();
global.location = { reload: jest.fn() };
