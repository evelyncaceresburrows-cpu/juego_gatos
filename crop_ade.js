import { Jimp } from 'jimp';

async function cropAde() {
  try {
    const image = await Jimp.read('src/assets/ade/ade-raw.png');
    
    // Original dimensions: 1080x1920 (based on standard mobile screenshot from Stitch)
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    console.log(`Original dimensions: ${w}x${h}`);
    
    // We want to crop Ade. 
    // From the original artifact, Ade is roughly in the middle-upper part.
    // Let's try to capture the central area where he resides.
    // Based on the screenshot, he is between y=15% and y=75%
    const cropY = Math.floor(h * 0.15);
    const cropH = Math.floor(h * 0.60);
    const cropX = 0;
    const cropW = w;
    
    image.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
    await image.write('src/assets/ade/ade-character.png');
               
    console.log('Ade cropped and saved successfully as src/assets/ade/ade-character.png');
  } catch (err) {
    console.error('Error cropping image:', err);
  }
}

cropAde();
