const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

async function cropAll() {
  try {
    const sourceDir = 'stitch_ade/stitch_ade';
    const destDir = 'public/assets/cats';
    
    // Ensure destDir exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const folders = fs.readdirSync(sourceDir).filter(f => f.startsWith('chatgpt_image_'));
    
    let i = 1;
    for (const folder of folders) {
      const imgPath = path.join(sourceDir, folder, 'screen.png');
      if (fs.existsSync(imgPath)) {
        console.log(`Processing ${imgPath}...`);
        const image = await Jimp.read(imgPath);
        const w = image.bitmap.width;
        const h = image.bitmap.height;
        
        const cropY = Math.floor(h * 0.12);
        const cropH = Math.floor(h * 0.65);
        const cropX = 0;
        const cropW = w;
        
        image.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
        await image.write(path.join(destDir, `cat_${i}.png`));
                   
        console.log(`Cropped and saved cat_${i}.png`);
        i++;
      }
    }
    console.log('All done!');
  } catch (err) {
    console.error('Error cropping image:', err);
  }
}

cropAll();
