// Chrome拡張機能テスト用のセットアップ

// Chrome APIのモック
global.chrome = {
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn()
  },
  runtime: {
    onMessage: {
      addListener: vi.fn()
    }
  }
};

// DOM環境のセットアップ
global.document = window.document;
global.window = window;

// Console mockを設定
global.console = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
};

// Fetch APIのモック
global.fetch = vi.fn();

// AbortControllerのモック
global.AbortController = vi.fn(() => ({
  abort: vi.fn(),
  signal: {}
}));

// setTimeoutのモック
global.setTimeout = vi.fn((fn) => fn());
global.clearTimeout = vi.fn();
