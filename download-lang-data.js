const fs = require('fs');
const path = require('path');
const https = require('https');

// Create tessdata directory if it doesn't exist
const tessdataDir = path.join(__dirname, 'public', 'tessdata');
if (!fs.existsSync(tessdataDir)) {
  fs.mkdirSync(tessdataDir, { recursive: true });
}

// Download English language data
const languages = [
  { code: 'eng', name: 'English' }
  // Add more languages as needed
];

console.log('Downloading Tesseract language data files...');

languages.forEach(lang => {
  const url = `https://tessdata.projectnaptha.com/${lang.code}.traineddata`;
  const filePath = path.join(tessdataDir, `${lang.code}.traineddata`);
  
  console.log(`Downloading ${lang.name} (${lang.code}) language data...`);
  
  const file = fs.createWriteStream(filePath);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${lang.code}.traineddata`);
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {}); // Delete the file async
    console.error(`Failed to download ${lang.code}.traineddata:`, err.message);
  });
});

console.log('Language data download script completed.');