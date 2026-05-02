const Jimp = require('jimp');

async function cropAde() {
  try {
    const image = await Jimp.read('src/assets/ade/ade-raw.png');
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    console.log(`Original dimensions: ${w}x${h}`);
    
    // Crop calculation: Remove top bar (approx 12%) and bottom UI (approx 23%)
    const cropY = Math.floor(h * 0.12);
    const cropH = Math.floor(h * 0.65);
    const cropX = 0;
    const cropW = w;
    
    await image.crop(cropX, cropY, cropW, cropH)
               .write('src/assets/ade/ade-character.png');
               
    console.log('Ade cropped and saved successfully as src/assets/ade/ade-character.png');
  } catch (err) {
    console.error('Error cropping image:', err);
  }
}

cropAde();
