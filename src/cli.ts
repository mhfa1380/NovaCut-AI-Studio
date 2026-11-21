#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverEntry = join(packageRoot, 'dist', 'index.js');

function printHelp(): void {
  console.log(`
================================================================================
  🎬 NovaCut AI Studio — Universal MCP Bridge for Adobe Premiere Pro (v2.0)
  استودیو هوشمند نوواکات — بریج جامع هوش مصنوعی برای ادوبی پریمیر پرو
================================================================================

Description:
  Connects Adobe Premiere Pro directly to ALL AI models:
  ChatGPT (GPT-4o/o1/o3), Google Gemini, xAI Grok, Claude, Cursor, and Windsurf.
  Supports English & Persian (فارسی).

Usage:
  novacut                       Start the MCP stdio server
  novacut setup                 Install the CEP bridge & auto-configure AI clients
  novacut doctor                Run diagnostic health checks (Windows / macOS)
  novacut config [client]       Generate ready-to-use MCP configuration
  novacut --version             Show package version
  novacut --help                Show this help message

Supported AI Clients for 'novacut config <client>':
  chatgpt   - OpenAI / ChatGPT Desktop
  claude    - Anthropic Claude Desktop & Claude Code
  gemini    - Google Gemini / Antigravity
  grok      - xAI Grok (CLI / Open-WebUI)
  cursor    - Cursor IDE (.cursor/mcp.json)
  windsurf  - Windsurf IDE
  vscode    - VS Code GitHub Copilot
  all       - Display configurations for all clients

Environment Variables:
  NOVACUT_TOOLSET=standard|full|search|essential  (Default: standard)
  PREMIERE_TEMP_DIR=<path>                        (Bridge exchange directory)
  PREMIERE_MCP_TELEMETRY=0                        (Disable anonymous telemetry)
`);
}

function printClientConfigs(targetClient?: string): void {
  const nodeBin = process.execPath;
  const tempDir = process.platform === 'win32'
    ? join(process.env.TEMP || 'C:\\Temp', 'novacut-bridge')
    : '/tmp/novacut-bridge';

  const stdioServerObj = {
    command: nodeBin,
    args: [serverEntry],
    env: {
      PREMIERE_TEMP_DIR: tempDir,
      NOVACUT_TOOLSET: 'standard'
    }
  };

  const configs: Record<string, { title: string; json: unknown; pathDesc: string }> = {
    chatgpt: {
      title: 'ChatGPT Desktop / OpenAI MCP',
      pathDesc: 'Settings -> Developer -> MCP Servers (or %APPDATA%\\OpenAI\\ChatGPT\\mcp.json)',
      json: {
        mcpServers: {
          'novacut-premiere': stdioServerObj
        }
      }
    },
    claude: {
      title: 'Claude Desktop',
      pathDesc: process.platform === 'win32'
        ? '%APPDATA%\\Claude\\claude_desktop_config.json'
        : '~/Library/Application Support/Claude/claude_desktop_config.json',
      json: {
        mcpServers: {
          'novacut-premiere': stdioServerObj
        }
      }
    },
    gemini: {
      title: 'Google Gemini / Antigravity',
      pathDesc: 'Antigravity MCP config / Gemini CLI',
      json: {
        mcpServers: {
          'novacut-premiere': stdioServerObj
        }
      }
    },
    grok: {
      title: 'xAI Grok / Open-WebUI / LM Studio',
      pathDesc: 'Grok MCP connector or Open-WebUI Tools settings',
      json: {
        mcpServers: {
          'novacut-premiere': stdioServerObj
        }
      }
    },
    cursor: {
      title: 'Cursor IDE',
      pathDesc: '.cursor/mcp.json or Settings -> Features -> MCP',
      json: {
        mcpServers: {
          'novacut-premiere': stdioServerObj
        }
      }
    },
    windsurf: {
      title: 'Windsurf IDE',
      pathDesc: '~/.codeium/windsurf/mcp_config.json',
      json: {
        mcpServers: {
          'novacut-premiere': stdioServerObj
        }
      }
    },
    vscode: {
      title: 'VS Code GitHub Copilot',
      pathDesc: process.platform === 'win32'
        ? '%APPDATA%\\Code\\User\\mcp.json'
        : '~/Library/Application Support/Code/User/mcp.json',
      json: {
        servers: {
          'novacut-premiere': {
            type: 'stdio',
            ...stdioServerObj
          }
        }
      }
    }
  };

  const requested = (targetClient || 'all').toLowerCase();

  if (requested !== 'all' && configs[requested]) {
    const item = configs[requested];
    console.log(`\n--- Config for ${item.title} ---`);
    console.log(`Location: ${item.pathDesc}`);
    console.log(JSON.stringify(item.json, null, 2));
    return;
  }

  console.log(`\n======================================================`);
  console.log(`  NovaCut AI Studio — Configuration Snippets for AI Clients`);
  console.log(`======================================================`);

  for (const [key, item] of Object.entries(configs)) {
    console.log(`\n[+] ${item.title} (${key}):`);
    console.log(`    Location: ${item.pathDesc}`);
    console.log(JSON.stringify(item.json, null, 2));
  }
}

function run(command: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

async function runPlatformScript(macScript: string, windowsScript: string, windowsArgs: string[] = []): Promise<void> {
  let code: number;
  if (process.platform === 'darwin') {
    code = await run('bash', [join(packageRoot, 'scripts', macScript), '--skip-build']);
  } else if (process.platform === 'win32') {
    code = await run('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(packageRoot, 'scripts', windowsScript),
      ...windowsArgs,
    ]);
  } else {
    throw new Error('NovaCut setup is supported on macOS and Windows only.');
  }

  if (code !== 0) process.exitCode = code;
}

async function main(): Promise<void> {
  const [command, subCommand] = process.argv.slice(2);

  switch (command) {
    case undefined:
    case 'serve':
      process.exitCode = await run(process.execPath, [serverEntry]);
      return;
    case '--install-cep':
    case 'install-cep':
    case 'setup':
    case '--setup':
      await runPlatformScript('install-macos.sh', 'install-windows.ps1', ['-SkipBuild']);
      return;
    case '--doctor':
    case 'doctor':
      await runPlatformScript('doctor-macos.sh', 'doctor-windows.ps1');
      return;
    case 'config':
      printClientConfigs(subCommand);
      return;
    case '--version':
    case '-v': {
      const packageJson = await import('../package.json', { with: { type: 'json' } });
      console.log(`NovaCut AI Studio v${packageJson.default.version}`);
      return;
    }
    case '--help':
    case '-h':
    case 'help':
      printHelp();
      return;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
