/**
 * Crypto Module Mock for Renderer Process
 * 
 * Redirects to Web Crypto API for browser-compatible cryptographic operations.
 * This ensures security by using browser-native crypto instead of Node.js crypto.
 */

console.warn('⚠️ crypto module accessed in renderer process - redirecting to Web Crypto API');

// Check if Web Crypto API is available
if (!window.crypto || !window.crypto.subtle) {
  console.error('❌ Web Crypto API not available - cryptographic operations may fail');
}

const cryptoMock = {
  // Random bytes generation using Web Crypto API
  randomBytes: (size, callback) => {
    try {
      const array = new Uint8Array(size);
      window.crypto.getRandomValues(array);
      
      if (callback) {
        // Async callback style
        setTimeout(() => callback(null, Buffer.from(array)), 0);
        return;
      } else {
        // Sync style
        return Buffer.from(array);
      }
    } catch (error) {
      const err = new Error('randomBytes failed: ' + error.message);
      if (callback) {
        setTimeout(() => callback(err), 0);
        return;
      } else {
        throw err;
      }
    }
  },
  
  // Synchronous random bytes
  randomBytesSync: (size) => {
    try {
      const array = new Uint8Array(size);
      window.crypto.getRandomValues(array);
      return Buffer.from(array);
    } catch (error) {
      throw new Error('randomBytesSync failed: ' + error.message);
    }
  },
  
  // Random UUID generation
  randomUUID: () => {
    if (window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    } else {
      // Fallback UUID v4 generation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  },
  
  // Hash creation - redirect to Web Crypto API
  createHash: (algorithm) => {
    console.warn(`⚠️ crypto.createHash(${algorithm}) - use Web Crypto API window.crypto.subtle.digest() instead`);
    
    // Return mock hash object with Web Crypto API implementation
    return {
      update: function(data) {
        this._data = this._data ? Buffer.concat([this._data, Buffer.from(data)]) : Buffer.from(data);
        return this;
      },
      
      digest: function(encoding) {
        if (!this._data) {
          throw new Error('Hash not updated with data');
        }
        
        // Map Node.js algorithm names to Web Crypto API
        let webCryptoAlgorithm;
        switch (algorithm.toLowerCase()) {
          case 'sha1':
            webCryptoAlgorithm = 'SHA-1';
            break;
          case 'sha256':
            webCryptoAlgorithm = 'SHA-256';
            break;
          case 'sha384':
            webCryptoAlgorithm = 'SHA-384';
            break;
          case 'sha512':
            webCryptoAlgorithm = 'SHA-512';
            break;
          default:
            throw new Error(`Unsupported hash algorithm: ${algorithm}`);
        }
        
        // This is sync but Web Crypto is async - warn user
        console.warn('⚠️ Synchronous hash digest - consider using async Web Crypto API');
        throw new Error('Synchronous hash not supported - use window.crypto.subtle.digest() with async/await');
      },
      
      // Async digest method
      digestAsync: async function(encoding) {
        if (!this._data) {
          throw new Error('Hash not updated with data');
        }
        
        let webCryptoAlgorithm;
        switch (algorithm.toLowerCase()) {
          case 'sha1':
            webCryptoAlgorithm = 'SHA-1';
            break;
          case 'sha256':
            webCryptoAlgorithm = 'SHA-256';
            break;
          case 'sha384':
            webCryptoAlgorithm = 'SHA-384';
            break;
          case 'sha512':
            webCryptoAlgorithm = 'SHA-512';
            break;
          default:
            throw new Error(`Unsupported hash algorithm: ${algorithm}`);
        }
        
        const hashBuffer = await window.crypto.subtle.digest(webCryptoAlgorithm, this._data);
        const hashArray = new Uint8Array(hashBuffer);
        
        if (encoding === 'hex') {
          return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
        } else if (encoding === 'base64') {
          return btoa(String.fromCharCode(...hashArray));
        } else {
          return Buffer.from(hashArray);
        }
      },
      
      _data: null
    };
  },
  
  // HMAC creation - redirect to Web Crypto API
  createHmac: (algorithm, key) => {
    console.warn(`⚠️ crypto.createHmac(${algorithm}) - use Web Crypto API window.crypto.subtle.sign() with HMAC instead`);
    throw new Error('createHmac not supported - use window.crypto.subtle.sign() with HMAC algorithm');
  },
  
  // Cipher creation - redirect to Web Crypto API
  createCipher: (algorithm, password) => {
    console.warn(`⚠️ crypto.createCipher(${algorithm}) - use Web Crypto API window.crypto.subtle.encrypt() instead`);
    throw new Error('createCipher not supported - use window.crypto.subtle.encrypt() with AES-GCM');
  },
  
  createCipheriv: (algorithm, key, iv) => {
    console.warn(`⚠️ crypto.createCipheriv(${algorithm}) - use Web Crypto API window.crypto.subtle.encrypt() instead`);
    throw new Error('createCipheriv not supported - use window.crypto.subtle.encrypt() with AES-GCM');
  },
  
  // Decipher creation - redirect to Web Crypto API
  createDecipher: (algorithm, password) => {
    console.warn(`⚠️ crypto.createDecipher(${algorithm}) - use Web Crypto API window.crypto.subtle.decrypt() instead`);
    throw new Error('createDecipher not supported - use window.crypto.subtle.decrypt() with AES-GCM');
  },
  
  createDecipheriv: (algorithm, key, iv) => {
    console.warn(`⚠️ crypto.createDecipheriv(${algorithm}) - use Web Crypto API window.crypto.subtle.decrypt() instead`);
    throw new Error('createDecipheriv not supported - use window.crypto.subtle.decrypt() with AES-GCM');
  },
  
  // Key generation - redirect to Web Crypto API
  generateKeyPair: (type, options, callback) => {
    console.warn(`⚠️ crypto.generateKeyPair(${type}) - use Web Crypto API window.crypto.subtle.generateKey() instead`);
    const error = new Error('generateKeyPair not supported - use window.crypto.subtle.generateKey()');
    if (callback) {
      setTimeout(() => callback(error), 0);
    } else {
      throw error;
    }
  },
  
  generateKeyPairSync: (type, options) => {
    console.warn(`⚠️ crypto.generateKeyPairSync(${type}) - use Web Crypto API window.crypto.subtle.generateKey() instead`);
    throw new Error('generateKeyPairSync not supported - use window.crypto.subtle.generateKey()');
  },
  
  // PBKDF2 - redirect to Web Crypto API
  pbkdf2: (password, salt, iterations, keylen, digest, callback) => {
    console.warn(`⚠️ crypto.pbkdf2() - use Web Crypto API window.crypto.subtle.deriveBits() with PBKDF2 instead`);
    const error = new Error('pbkdf2 not supported - use window.crypto.subtle.deriveBits() with PBKDF2');
    if (callback) {
      setTimeout(() => callback(error), 0);
    } else {
      throw error;
    }
  },
  
  pbkdf2Sync: (password, salt, iterations, keylen, digest) => {
    console.warn(`⚠️ crypto.pbkdf2Sync() - use Web Crypto API window.crypto.subtle.deriveBits() with PBKDF2 instead`);
    throw new Error('pbkdf2Sync not supported - use window.crypto.subtle.deriveBits() with PBKDF2');
  },
  
  // Constants - provide common crypto constants
  constants: {
    OPENSSL_VERSION_NUMBER: 0,
    SSL_OP_ALL: 0,
    SSL_OP_NO_SSLv2: 0,
    SSL_OP_NO_SSLv3: 0,
    SSL_OP_NO_TLSv1: 0,
    SSL_OP_NO_TLSv1_1: 0,
    SSL_OP_NO_TLSv1_2: 0
  },
  
  // Timing safe comparison
  timingSafeEqual: (a, b) => {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  },
  
  // Web Crypto API helper functions
  webcrypto: window.crypto,
  subtle: window.crypto.subtle
};

// Usage instructions
console.info(`
🔧 Crypto Mock Active in Renderer Process

Use Web Crypto API directly instead of Node.js crypto:
- window.crypto.getRandomValues() for random bytes
- window.crypto.subtle.digest() for hashing
- window.crypto.subtle.encrypt/decrypt() for encryption
- window.crypto.subtle.sign/verify() for signatures
- window.crypto.subtle.generateKey() for key generation

Web Crypto API is more secure and browser-native.
`);

module.exports = cryptoMock;