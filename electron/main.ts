import { app, BrowserWindow, ipcMain, shell } from "electron";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: "default",
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.setMenu(null);

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const noteWindows = new Map<string, BrowserWindow>();

ipcMain.handle("create-note-window", (event, noteId: string) => {
  if (noteWindows.has(noteId)) {
    const win = noteWindows.get(noteId);
    if (win && !win.isDestroyed()) {
      win.focus();
      return;
    }
    noteWindows.delete(noteId);
  }

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    // alwaysOnTop: true,
    // webPreferences: {
    //   preload: path.join(__dirname, "preload.js"),
    //   contextIsolation: true,
    //   nodeIntegration: false,
    //   sandbox: false,
    // },
    // autoHideMenuBar: true,
    titleBarStyle: "default",
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    // show: false,
  });

  win.setMenu(null);

  const url = process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}#/note-window/${noteId}`
    : `file://${path.join(__dirname, "../dist/index.html")}#/note-window/${noteId}`;

  win.loadURL(url);

  win.on("closed", () => {
    noteWindows.delete(noteId);
  });

  noteWindows.set(noteId, win);
});

// App event listeners
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("get-platform", () => {
  return process.platform;
});

ipcMain.handle("minimize-window", () => {
  mainWindow?.minimize();
});

ipcMain.handle("maximize-window", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle("close-window", () => {
  mainWindow?.close();
});

/**
 * 获取浏览器收藏夹数据
 * 支持 Microsoft Edge、Google Chrome 和 Safari (macOS)
 */
ipcMain.handle("get-browser-bookmarks", async () => {
  const userInfo = os.userInfo();
  const bookmarks: any[] = [];
  const platform = process.platform;

  try {
    const browsers: Array<{ name: string; path: string }> = [];

    if (platform === "win32") {
      // Windows 平台
      browsers.push(
        { name: "Edge", path: path.join("Microsoft", "Edge") },
        { name: "Chrome", path: path.join("Google", "Chrome") },
      );
    } else if (platform === "darwin") {
      // macOS 平台
      browsers.push(
        { name: "Chrome", path: path.join("Google", "Chrome") },
        { name: "Edge", path: path.join("Microsoft Edge") },
        { name: "Safari", path: "Safari" },
      );
    } else {
      // Linux 平台
      browsers.push(
        { name: "Chrome", path: path.join("google-chrome") },
        { name: "Edge", path: path.join("microsoft-edge") },
      );
    }

    for (const browser of browsers) {
      try {
        let bookmarksPath: string;

        if (platform === "win32") {
          bookmarksPath = path.join(
            userInfo.homedir,
            "AppData",
            "Local",
            browser.path,
            "User Data",
            "Default",
            "Bookmarks",
          );
        } else if (platform === "darwin") {
          bookmarksPath = path.join(
            userInfo.homedir,
            "Library",
            "Application Support",
            browser.path,
            "Default",
            "Bookmarks",
          );
        } else {
          bookmarksPath = path.join(
            userInfo.homedir,
            ".config",
            browser.path,
            "Default",
            "Bookmarks",
          );
        }

        if (fs.existsSync(bookmarksPath)) {
          const data = fs.readFileSync(bookmarksPath, "utf-8");
          const parsedData = JSON.parse(data);

          if (parsedData.roots) {
            for (const key in parsedData.roots) {
              const root = parsedData.roots[key];
              if (root.children) {
                bookmarks.push({
                  name: browser.name,
                  children: root.children,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to read ${browser.name} bookmarks:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to get browser bookmarks:", error);
  }

  return bookmarks;
});

/**
 * 打开外部链接
 */
ipcMain.handle("open-external-url", async (event, url: string) => {
  try {
    await shell.openExternal(url);
  } catch (error) {
    console.error("Failed to open external URL:", error);
    throw error;
  }
});
