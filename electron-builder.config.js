/**
 * Electron Builder Configuration
 * Enhanced configuration for cross-platform builds
 */

const path = require('path');

module.exports = {
  appId: 'com.professional.pdfeditor',
  productName: 'Professional PDF Editor',
  copyright: 'Copyright © 2024 Professional PDF Editor Team',
  
  directories: {
    output: 'release',
    buildResources: 'build-resources'
  },

  files: [
    'dist/**/*',
    'public/**/*',
    '!public/index.html', // Exclude as it's for development
    'package.json',
    'node_modules/**/*' // Include necessary node modules
  ],

  extraFiles: [
    {
      from: 'public/tessdata',
      to: 'resources/tessdata',
      filter: ['**/*.traineddata']
    }
  ],

  // Windows configuration
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32']
      },
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    icon: 'public/icon.png', // Will be converted automatically
    requestedExecutionLevel: 'asInvoker',
    publisherName: 'Professional PDF Editor Team',
    verInfo: {
      CompanyName: 'Professional PDF Editor Team',
      ProductName: 'Professional PDF Editor',
      FileDescription: 'Professional PDF Editor Application'
    }
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Professional PDF Editor',
    menuCategory: 'Office',
    artifactName: '${productName}-Setup-${version}.${ext}',
    deleteAppDataOnUninstall: false,
    displayLanguageSelector: true
  },

  portable: {
    artifactName: '${productName}-Portable-${version}.${ext}'
  },

  // macOS configuration
  mac: {
    category: 'public.app-category.productivity',
    icon: 'public/icon.png', // Will be converted automatically
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ],
    darkModeSupport: true,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build-resources/entitlements.mac.plist',
    entitlementsInherit: 'build-resources/entitlements.mac.plist'
  },

  dmg: {
    title: '${productName} ${version}',
    artifactName: '${productName}-${version}.${ext}',
    background: null,
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ],
    window: {
      width: 540,
      height: 380
    }
  },

  // Linux configuration
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      },
      {
        target: 'rpm',
        arch: ['x64']
      },
      {
        target: 'tar.gz',
        arch: ['x64']
      }
    ],
    icon: 'public/icon.png',
    category: 'Office',
    desktop: {
      Name: 'Professional PDF Editor',
      Comment: 'A professional PDF editor with advanced features',
      Keywords: 'pdf;editor;document;office',
      StartupWMClass: 'professional-pdf-editor'
    }
  },

  deb: {
    packageCategory: 'office',
    priority: 'optional',
    afterInstall: 'build-resources/linux-after-install.sh'
  },

  rpm: {
    packageCategory: 'Office'
  },

  appImage: {
    artifactName: '${productName}-${version}.${ext}'
  },

  // Auto-updater configuration
  publish: {
    provider: 'github',
    owner: 'your-github-username',
    repo: 'professional-pdf-editor',
    private: false
  },

  // Build metadata
  buildVersion: process.env.BUILD_NUMBER || '1',
  
  // Compression
  compression: 'maximum',
  
  // Additional metadata
  metadata: {
    description: 'A professional PDF editor with comprehensive features for document processing'
  }
};