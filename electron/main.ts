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

ipcMain.handle("get-browser-bookmarks", async () => {
  const userInfo = os.userInfo();
  const bookmarks: any[] = [];
  const platform = process.platform;

  try {
    const browsers: Array<{ name: string; path: string }> = [];

    if (platform === "win32") {
      browsers.push(
        { name: "Edge", path: path.join("Microsoft", "Edge", "User Data") },
        { name: "Chrome", path: path.join("Google", "Chrome", "User Data") },
      );
    } else if (platform === "darwin") {
      browsers.push(
        { name: "Chrome", path: path.join("Google", "Chrome") },
        { name: "Edge", path: path.join("Microsoft Edge") },
      );
    } else {
      browsers.push(
        { name: "Chrome", path: path.join("google-chrome") },
        { name: "Edge", path: path.join("microsoft-edge") },
      );
    }

    for (const browser of browsers) {
      try {
        let appSupportPath: string;

        if (platform === "win32") {
          appSupportPath = path.join(
            userInfo.homedir,
            "AppData",
            "Local",
            browser.path
          );
        } else if (platform === "darwin") {
          appSupportPath = path.join(
            userInfo.homedir,
            "Library",
            "Application Support",
            browser.path
          );
        } else {
          appSupportPath = path.join(
            userInfo.homedir,
            ".config",
            browser.path
          );
        }

        console.log(`Checking path for ${browser.name}: ${appSupportPath}`);
        
        if (!fs.existsSync(appSupportPath)) {
          console.log(`${browser.name} path not found: ${appSupportPath}`);
          
          // 尝试备用路径
          if (browser.name === "Chrome") {
            const altPath = path.join(userInfo.homedir, "Library", "Application Support", "Google", "Chrome Canary");
            console.log(`Trying Chrome Canary path: ${altPath}`);
            if (fs.existsSync(altPath)) {
              console.log("Found Chrome Canary");
              appSupportPath = altPath;
            } else {
              continue;
            }
          } else if (browser.name === "Edge") {
            const altPath = path.join(userInfo.homedir, "Library", "Application Support", "Microsoft Edge Canary");
            console.log(`Trying Edge Canary path: ${altPath}`);
            if (fs.existsSync(altPath)) {
              console.log("Found Edge Canary");
              appSupportPath = altPath;
            } else {
              continue;
            }
          } else {
            continue;
          }
        }

        // 列出所有可用的目录
        const items = fs.readdirSync(appSupportPath);
        console.log(`Available items in ${appSupportPath}:`, items);
        
        // 查找 profile 目录（可能是 Default、Profile 1 或者直接是书签文件）
        let bookmarksPath = null;
        
        // 先尝试找 Default 目录
        if (items.includes('Default')) {
          const testPath = path.join(appSupportPath, 'Default', 'Bookmarks');
          if (fs.existsSync(testPath)) {
            bookmarksPath = testPath;
            console.log(`Found bookmarks at: ${testPath}`);
          }
        }
        
        // 如果没找到，尝试找 Profile 相关目录
        if (!bookmarksPath) {
          const profileDirs = items.filter(item => 
            item === 'Default' || 
            item.startsWith('Profile') || 
            item.toLowerCase().includes('default')
          );
          
          console.log(`Possible profile directories:`, profileDirs);
          
          for (const profileDir of profileDirs) {
            const testPath = path.join(appSupportPath, profileDir, 'Bookmarks');
            if (fs.existsSync(testPath)) {
              bookmarksPath = testPath;
              console.log(`Found bookmarks at: ${testPath}`);
              break;
            }
          }
        }
        
        // 如果还是没找到，检查当前目录是否有书签文件（某些浏览器直接放根目录）
        if (!bookmarksPath) {
          const testPath = path.join(appSupportPath, 'Bookmarks');
          if (fs.existsSync(testPath)) {
            bookmarksPath = testPath;
            console.log(`Found bookmarks at root: ${testPath}`);
          }
        }

        if (!bookmarksPath) {
          console.log(`${browser.name} bookmarks file not found`);
          continue;
        }

        // 读取并解析书签
        const data = fs.readFileSync(bookmarksPath, "utf-8");
        const parsedData = JSON.parse(data);

        if (parsedData.roots) {
          // 递归提取书签，保留文件夹结构
          const extractBookmarks = (node: any, results: any[] = []): any[] => {
            if (!node) return results;
            
            // 如果是书签（URL类型）
            if (node.type === 'url' && node.url) {
              results.push({
                name: node.name || '未命名',
                url: node.url,
              });
            }
            
            // 如果是文件夹（有 children）
            if (node.children && Array.isArray(node.children)) {
              // 如果节点有名称且是文件夹类型，说明这是一个文件夹
              if (node.name && node.type === 'folder') {
                const folderChildren: any[] = [];
                for (const child of node.children) {
                  extractBookmarks(child, folderChildren);
                }
                if (folderChildren.length > 0) {
                  results.push({
                    name: node.name,
                    children: folderChildren,
                  });
                }
              } else {
                // 根节点直接提取子项
                for (const child of node.children) {
                  extractBookmarks(child, results);
                }
              }
            }
            
            return results;
          };

          // 遍历所有根节点（书签栏、其他书签、移动书签等）
          const rootNames: { [key: string]: string } = {
            'bookmark_bar': '书签栏',
            'other': '其他书签',
            'synced': '移动书签'
          };
          
          for (const key in parsedData.roots) {
            const root = parsedData.roots[key];
            if (root && root.children) {
              const extractedBookmarks = extractBookmarks(root);
              if (extractedBookmarks.length > 0) {
                bookmarks.push({
                  name: browser.name,
                  folderName: rootNames[key] || key,
                  children: extractedBookmarks,
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
