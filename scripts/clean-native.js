const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const { electronPlatformName, appOutDir } = context;
  console.log(`[AfterPack] Cleaning up unused files for ${electronPlatformName}...`);

  let deletedCount = 0;
  let savedSize = 0;

  if (electronPlatformName === 'darwin') {
    const files = fs.readdirSync(appOutDir);
    const appBundle = files.find(f => f.endsWith('.app'));

    if (appBundle) {
      const appPath = path.join(appOutDir, appBundle);

      const frameworkPath = path.join(
        appPath,
        'Contents',
        'Frameworks',
        'Electron Framework.framework',
        'Resources'
      );

      if (fs.existsSync(frameworkPath)) {
        const cleaned = cleanLocales(frameworkPath);
        deletedCount += cleaned.count;
        savedSize += cleaned.size;
      }

      const localesPath = path.join(appPath, 'Contents', 'Resources', 'locales');
      if (fs.existsSync(localesPath)) {
        const cleaned = cleanLocales(localesPath);
        deletedCount += cleaned.count;
        savedSize += cleaned.size;
      }
    }
  } else {
    const localesPath = path.join(appOutDir, 'locales');
    if (fs.existsSync(localesPath)) {
      const cleaned = cleanLocales(localesPath);
      deletedCount += cleaned.count;
      savedSize += cleaned.size;
    }

    const resourcesPath = path.join(appOutDir, 'resources');
    if (fs.existsSync(resourcesPath)) {
      const cleaned = cleanUnusedResources(resourcesPath);
      deletedCount += cleaned.count;
      savedSize += cleaned.size;
    }
  }

  if (deletedCount > 0) {
    console.log(`[AfterPack] Removed ${deletedCount} unused files. Saved ${(savedSize / 1024 / 1024).toFixed(2)} MB.`);
  } else {
    console.log('[AfterPack] No files removed.');
  }
};

function cleanLocales(dir) {
  const allowedLocales = ['zh-CN', 'en-US', 'en', 'zh-TW', 'zh-Hans', 'zh-Hant'];
  let deletedCount = 0;
  let savedSize = 0;

  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.endsWith('.pak')) continue;

      const localeName = path.basename(file, '.pak').toLowerCase();
      const isAllowed = allowedLocales.some(allowed =>
        localeName.includes(allowed.toLowerCase())
      );

      if (!isAllowed) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        savedSize += stats.size;
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
  } catch (err) {
    console.warn(`[AfterPack] Warning: Failed to clean locales in ${dir}`, err.message);
  }

  return { count: deletedCount, size: savedSize };
}

function cleanUnusedResources(dir) {
  let deletedCount = 0;
  let savedSize = 0;

  try {
    const files = fs.readdirSync(dir);

    const unusedPatterns = [
      'node_modules/.cache',
      '.locales',
      '*.map',
      'debug.log'
    ];

    for (const file of files) {
      const filePath = path.join(dir, file);

      if (file.endsWith('.pak')) continue;

      const isUnused = unusedPatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
          return regex.test(file);
        }
        return file.includes(pattern);
      });

      if (isUnused && fs.statSync(filePath).isFile()) {
        const stats = fs.statSync(filePath);
        savedSize += stats.size;
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
  } catch (err) {
    console.warn(`[AfterPack] Warning: Failed to clean resources in ${dir}`, err.message);
  }

  return { count: deletedCount, size: savedSize };
}