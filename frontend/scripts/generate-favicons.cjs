const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { exec } = require('child_process');

// Rutas
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const SVG_PATH = path.join(ICONS_DIR, 'favicon.svg');
const SVG_DARK_PATH = path.join(ICONS_DIR, 'favicon-dark.svg');

// Asegurar que el directorio existe
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Tamaños para los favicon
const sizes = [16, 32, 48, 57, 60, 72, 76, 96, 114, 120, 144, 152, 180, 192, 512];

// Generar favicon.ico
function generateIco() {
  console.log('Generando favicon.ico...');
  exec(`npx svg-to-ico ${SVG_PATH} ${path.join(ICONS_DIR, 'favicon.ico')}`, (error) => {
    if (error) {
      console.error('Error generando favicon.ico:', error);
      return;
    }
    console.log('favicon.ico generado correctamente');
  });
}

// Generar versiones PNG
async function generatePng() {
  console.log('Generando versiones PNG del favicon...');
  
  try {
    // Leer archivo SVG
    const svgBuffer = fs.readFileSync(SVG_PATH);
    const svgDarkBuffer = fs.existsSync(SVG_DARK_PATH) ? fs.readFileSync(SVG_DARK_PATH) : null;
    
    // Generar versiones PNG para cada tamaño
    for (const size of sizes) {
      // Claro
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(ICONS_DIR, `favicon-${size}x${size}.png`));
      
      // Oscuro (si existe)
      if (svgDarkBuffer) {
        await sharp(svgDarkBuffer)
          .resize(size, size)
          .png()
          .toFile(path.join(ICONS_DIR, `favicon-dark-${size}x${size}.png`));
      }
      
      console.log(`Favicon PNG ${size}x${size} generado`);
    }
    
    // Generar archivos específicos
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
    
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(ICONS_DIR, 'android-chrome-192x192.png'));
    
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(ICONS_DIR, 'android-chrome-512x512.png'));
    
    await sharp(svgBuffer)
      .resize(150, 150)
      .png()
      .toFile(path.join(ICONS_DIR, 'mstile-150x150.png'));
    
    console.log('Todos los archivos PNG generados correctamente');
  } catch (error) {
    console.error('Error generando versiones PNG:', error);
  }
}

// Ejecutar generación
async function run() {
  console.log('Iniciando generación de favicons...');
  generateIco();
  await generatePng();
  console.log('Proceso de generación completado');
}

run(); 