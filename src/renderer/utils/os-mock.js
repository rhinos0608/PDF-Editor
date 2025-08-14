/**
 * OS Module Mock for Renderer Process
 * 
 * Provides safe browser-compatible alternatives to Node.js os module functions.
 */

console.warn('⚠️ os module accessed in renderer process - using browser-compatible fallback');

const osMock = {
  // Platform detection using navigator
  platform: () => {
    if (navigator.platform) {
      const platform = navigator.platform.toLowerCase();
      if (platform.includes('win')) return 'win32';
      if (platform.includes('mac')) return 'darwin';
      if (platform.includes('linux')) return 'linux';
    }
    return 'unknown';
  },
  
  // Architecture detection
  arch: () => {
    return navigator.userAgent.includes('x64') || navigator.userAgent.includes('WOW64') ? 'x64' : 'x86';
  },
  
  // CPU information - return mock data
  cpus: () => {
    return [{
      model: 'Browser CPU',
      speed: 0,
      times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 }
    }];
  },
  
  // Memory information - use performance.memory if available
  totalmem: () => {
    if (performance && performance.memory && performance.memory.totalJSHeapSize) {
      return performance.memory.totalJSHeapSize * 10; // Rough estimate
    }
    return 8 * 1024 * 1024 * 1024; // Default 8GB
  },
  
  freemem: () => {
    if (performance && performance.memory) {
      return performance.memory.totalJSHeapSize - performance.memory.usedJSHeapSize;
    }
    return 4 * 1024 * 1024 * 1024; // Default 4GB
  },
  
  // Host information
  hostname: () => {
    return window.location.hostname || 'localhost';
  },
  
  // User information - limited in browser
  homedir: () => {
    console.warn('⚠️ os.homedir() not available in browser - returning fallback');
    return '/home/user'; // Fallback
  },
  
  tmpdir: () => {
    console.warn('⚠️ os.tmpdir() not available in browser - returning fallback');
    return '/tmp'; // Fallback
  },
  
  // System uptime - use performance.now() as approximation
  uptime: () => {
    return Math.floor(performance.now() / 1000);
  },
  
  // Load average - return zeros since not available in browser
  loadavg: () => {
    return [0, 0, 0];
  },
  
  // Network interfaces - not available in browser
  networkInterfaces: () => {
    console.warn('⚠️ os.networkInterfaces() not available in browser - returning empty object');
    return {};
  },
  
  // User info - not available in browser for security
  userInfo: (options) => {
    console.warn('⚠️ os.userInfo() not available in browser - returning default');
    return {
      uid: -1,
      gid: -1,
      username: 'user',
      homedir: '/home/user',
      shell: null
    };
  },
  
  // Constants
  constants: {
    signals: {
      SIGHUP: 1,
      SIGINT: 2,
      SIGTERM: 15
    },
    errno: {},
    priority: {
      PRIORITY_LOW: 19,
      PRIORITY_BELOW_NORMAL: 10,
      PRIORITY_NORMAL: 0,
      PRIORITY_ABOVE_NORMAL: -7,
      PRIORITY_HIGH: -14,
      PRIORITY_HIGHEST: -20
    }
  },
  
  // Line ending - detect from user agent
  EOL: navigator.platform && navigator.platform.toLowerCase().includes('win') ? '\r\n' : '\n',
  
  // Endianness - assume little endian for most systems
  endianness: () => 'LE',
  
  // Release - return browser info
  release: () => {
    const match = navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    return match ? match[1] : '1.0.0';
  },
  
  // Type - return OS type based on platform
  type: () => {
    const platform = osMock.platform();
    switch (platform) {
      case 'win32': return 'Windows_NT';
      case 'darwin': return 'Darwin';
      case 'linux': return 'Linux';
      default: return 'Unknown';
    }
  },
  
  // Version - return OS version info
  version: () => {
    return 'Browser Environment';
  }
};

// Usage instructions
console.info(`
🔧 OS Mock Active in Renderer Process

Limited OS information available in browser environment.
For system-specific operations, use electronAPI to communicate with main process.
`);

module.exports = osMock;