const fs = require('fs');
const path = require('path');

function reloadCommands(dir = path.join(process.cwd(), 'commands')) {
  const commandsMap = new Map();
  console.log('--- Iniciando carga de comandos ---');

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
        const cmd = require(fullPath);
        
        // Verifica si el export tiene la estructura correcta
        if (!cmd || !cmd.command) {
          console.log(`[!] Saltando ${file.name}: no tiene propiedad 'command'`);
          continue;
        }

        for (const c of cmd.command) {
          commandsMap.set(String(c).toLowerCase(), cmd);
        }
        console.log(`[✓] Comando cargado: ${cmd.command.join(', ')} (Archivo: ${file.name})`);
      } catch (err) {
        console.log(`[X] Error al cargar ${file.name}:`, err.message);
      }
    }
  }

  readCommands(dir);
  global.comandos = commandsMap;
  console.log(`--- Se cargaron ${commandsMap.size} comandos en total ---`);
  return commandsMap;
}

module.exports = { reloadCommands };
