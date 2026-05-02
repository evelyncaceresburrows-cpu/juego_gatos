const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

async function cropAll() {
  try {
    const dir = 'src/assets/ade/characters';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
    
    for (const file of files) {
      const imgPath = path.join(dir, file);
      console.log(`Processing ${imgPath}...`);
      const image = await Jimp.read(imgPath);
      const w = image.bitmap.width;
      const h = image.bitmap.height;
      
      const cropY = Math.floor(h * 0.12);
      const cropH = Math.floor(h * 0.65);
      const cropX = 0;
      const cropW = w;
      
      image.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
      await image.write(imgPath);
      console.log(`Cropped and saved ${file}`);
    }
    console.log('All done!');
  } catch (err) {
    console.error('Error cropping image:', err);
  }
}

cropAll();
