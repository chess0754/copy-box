const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const { electronPlatformName, appOutDir } = context;
  console.log(`[AfterPack] Cleaning up unused locales for ${electronPlatformName}...`);

  // Define allowed locales
  const allowedLocales = ['zh-CN', 'en-US', 'en'];

  // Find locales directory based on platform
  let localesDirs = [];
  
  if (electronPlatformName === 'darwin') {
    // macOS structure: App.app/Contents/Frameworks/Electron Framework.framework/Resources/locales
    // Note: The app name in appOutDir might differ, usually it's productFilename.app
    // We can try to find the .app directory
    const files = fs.readdirSync(appOutDir);
    const appBundle = files.find(f => f.endsWith('.app'));
    
    if (appBundle) {
      const frameworkPath = path.join(
        appOutDir, 
        appBundle, 
        'Contents', 
        'Frameworks', 
        'Electron Framework.framework', 
        'Resources', 
        'locales'
      );
      if (fs.existsSync(frameworkPath)) {
        localesDirs.push(frameworkPath);
      }
    }
  } else {
    // Windows/Linux: locales/
    const localesPath = path.join(appOutDir, 'locales');
    if (fs.existsSync(localesPath)) {
      localesDirs.push(localesPath);
    }
  }

  let deletedCount = 0;
  let savedSize = 0;

  for (const dir of localesDirs) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith('.pak')) continue;
        
        const localeName = path.basename(file, '.pak');
        if (!allowedLocales.includes(localeName)) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          savedSize += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    } catch (err) {
      console.warn(`[AfterPack] Warning: Failed to clean locales in ${dir}`, err);
    }
  }

  if (deletedCount > 0) {
    console.log(`[AfterPack] Removed ${deletedCount} unused locale files. Saved ${(savedSize / 1024 / 1024).toFixed(2)} MB.`);
  } else {
    console.log('[AfterPack] No locale files removed.');
  }
};
