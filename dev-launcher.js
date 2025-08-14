/**
 * Enhanced Development Launcher
 * Handles HMR issues and provides better development experience
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

class DevLauncher {
  constructor() {
    this.processes = {
      main: null,
      renderer: null,
      electron: null
    };
    this.isShuttingDown = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  // Check if port is available
  async checkPort(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      server.on('error', () => resolve(false));
    });
  }

  // Kill process by port
  async killPort(port) {
    return new Promise((resolve) => {
      const isWindows = process.platform === 'win32';
      const command = isWindows 
        ? `netstat -ano | findstr :${port}` 
        : `lsof -ti:${port}`;
      
      exec(command, (error, stdout) => {
        if (error || !stdout) {
          resolve();
          return;
        }

        const lines = stdout.split('\n').filter(line => line.trim());
        const pids = isWindows 
          ? lines.map(line => line.split(/\s+/).pop()).filter(Boolean)
          : lines;

        if (pids.length === 0) {
          resolve();
          return;
        }

        const killCommands = pids.map(pid => 
          isWindows ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`
        );

        Promise.all(killCommands.map(cmd => 
          new Promise(res => exec(cmd, () => res()))
        )).then(() => resolve());
      });
    });
  }

  // Clean up old processes
  async cleanup() {
    console.log('🧹 Cleaning up old processes...');
    
    // Kill processes on common ports
    await this.killPort(8082);
    await this.killPort(9223);
    await this.killPort(3000);

    // Clean webpack cache
    const cacheDir = path.join(__dirname, 'node_modules', '.cache');
    if (fs.existsSync(cacheDir)) {
      try {
        fs.rmSync(cacheDir, { recursive: true, force: true });
        console.log('✅ Cleared webpack cache');
      } catch (error) {
        console.warn('⚠️ Could not clear cache:', error.message);
      }
    }

    // Clean dist directory
    const distDir = path.join(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      try {
        fs.rmSync(distDir, { recursive: true, force: true });
        console.log('✅ Cleared dist directory');
      } catch (error) {
        console.warn('⚠️ Could not clear dist:', error.message);
      }
    }
  }

  // Start main process build
  async startMainProcess() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Building main process...');
      
      this.processes.main = spawn('npm', ['run', 'dev:main'], {
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, NODE_ENV: 'development' }
      });

      let hasBuilt = false;
      
      this.processes.main.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[MAIN] ${output.trim()}`);
        
        if (output.includes('compiled successfully') || output.includes('webpack compiled')) {
          if (!hasBuilt) {
            hasBuilt = true;
            resolve();
          }
        }
      });

      this.processes.main.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning')) {
          console.error(`[MAIN ERROR] ${error.trim()}`);
        }
      });

      this.processes.main.on('error', reject);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (!hasBuilt) {
          resolve(); // Continue anyway
        }
      }, 30000);
    });
  }

  // Start renderer process dev server
  async startRendererProcess() {
    return new Promise((resolve, reject) => {
      console.log('🎨 Starting renderer dev server...');
      
      // Ensure port is free
      this.killPort(8082).then(() => {
        this.processes.renderer = spawn('npm', ['run', 'dev:renderer'], {
          stdio: 'pipe',
          shell: true,
          env: { 
            ...process.env, 
            NODE_ENV: 'development',
            FORCE_COLOR: '1'
          }
        });

        let serverReady = false;
        
        this.processes.renderer.stdout.on('data', (data) => {
          const output = data.toString();
          console.log(`[RENDERER] ${output.trim()}`);
          
          if (output.includes('webpack compiled') || 
              output.includes('Local:') || 
              output.includes('localhost:8082')) {
            if (!serverReady) {
              serverReady = true;
              setTimeout(resolve, 2000); // Wait 2s for server to stabilize
            }
          }
        });

        this.processes.renderer.stderr.on('data', (data) => {
          const error = data.toString();
          console.log(`[RENDERER] ${error.trim()}`);
        });

        this.processes.renderer.on('error', reject);
        
        // Timeout after 45 seconds
        setTimeout(() => {
          if (!serverReady) {
            console.log('⚠️ Renderer server timeout, continuing...');
            resolve();
          }
        }, 45000);
      });
    });
  }

  // Start Electron app
  async startElectron() {
    return new Promise((resolve) => {
      console.log('⚡ Starting Electron app...');
      
      // Wait a moment for servers to be ready
      setTimeout(() => {
        this.processes.electron = spawn('npm', ['run', 'start:dev'], {
          stdio: 'inherit',
          shell: true,
          env: { 
            ...process.env, 
            NODE_ENV: 'development',
            ELECTRON_IS_DEV: '1',
            ELECTRON_DISABLE_GPU: '0'
          }
        });

        this.processes.electron.on('close', (code) => {
          console.log(`\n⚡ Electron exited with code ${code}`);
          if (!this.isShuttingDown && code !== 0 && this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`🔄 Restarting Electron (attempt ${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => this.startElectron(), 2000);
          } else {
            this.shutdown();
          }
        });

        this.processes.electron.on('error', (error) => {
          console.error('❌ Electron error:', error.message);
          if (!this.isShuttingDown) {
            setTimeout(() => this.startElectron(), 3000);
          }
        });

        resolve();
      }, 3000);
    });
  }

  // Graceful shutdown
  async shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    
    console.log('\n🛑 Shutting down development environment...');
    
    // Kill all processes
    Object.values(this.processes).forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
        setTimeout(() => {
          if (proc && !proc.killed) {
            proc.kill('SIGKILL');
          }
        }, 5000);
      }
    });

    // Clean up ports
    await this.killPort(8082);
    await this.killPort(9223);
    
    console.log('✅ Development environment stopped');
    process.exit(0);
  }

  // Main launch sequence
  async launch() {
    console.log('🚀 Starting Professional PDF Editor Development Environment\n');
    
    try {
      // Setup signal handlers
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
      process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught exception:', error);
        this.shutdown();
      });

      // Launch sequence
      await this.cleanup();
      await this.startMainProcess();
      await this.startRendererProcess();
      await this.startElectron();

      console.log('\n✅ Development environment started successfully!');
      console.log('📝 Edit mode: Click on PDF text to edit');
      console.log('🔧 HMR: Changes will auto-reload');
      console.log('🛑 Press Ctrl+C to stop\n');

    } catch (error) {
      console.error('❌ Failed to start development environment:', error);
      this.shutdown();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const launcher = new DevLauncher();
  launcher.launch();
}

module.exports = DevLauncher;