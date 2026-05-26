const fs = require('fs');
const path = require('path');

function reloadCommands(dir = path.join(process.cwd(), 'commands')) {
  const commandsMap = new Map();
  
  function readCommands(folder) {
    if (!fs.existsSync(folder)) return;
    const files = fs.readdirSync(folder, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(folder, file.name);
      if (file.isDirectory()) {
        readCommands(fullPath);
        continue;
      }
      if (!file.name.endsWith('.js')) continue;

      try {
        delete require.cache[require.resolve(fullPath)];
        const imported = require(fullPath);
        // IMPORTANTE: Esto detecta si es export default o module.exports
        const cmd = imported.default || imported;

        if (cmd && Array.isArray(cmd.command)) {
          for (const c of cmd.command) {
            commandsMap.set(String(c).toLowerCase(), cmd);
          }
        }
      } catch (err) {
        console.log(`[X] Error cargando ${file.name}: ${err.message}`);
      }
    }
  }

  readCommands(dir);
  global.comandos = commandsMap;
  return commandsMap;
}

module.exports = { reloadCommands };
