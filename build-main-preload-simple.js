const path = require('path');
const { spawn } = require('child_process');

// Function to run a command and capture its output
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { ...options, stdio: 'inherit' });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// Build only the main and preload files
async function buildMainAndPreload() {
  console.log('Building main and preload files...');
  
  try {
    // Build main process
    console.log('Building main process...');
    await runCommand('npx', [
      'tsc',
      '--noEmit',
      '--skipLibCheck',
      'src/main/main.ts'
    ]);
    
    // Build preload script
    console.log('Building preload script...');
    await runCommand('npx', [
      'tsc',
      '--noEmit',
      '--skipLibCheck',
      'src/main/preload.ts'
    ]);
    
    console.log('Successfully built main and preload files.');
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

// Run the build
buildMainAndPreload();