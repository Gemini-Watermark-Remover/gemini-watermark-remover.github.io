import { WatermarkEngine } from './watermarkEngine.js';

let enginePromise = null;

async function getEngine() {
    if (!enginePromise) {
        enginePromise = WatermarkEngine.create().catch(err => {
            enginePromise = null;
            throw err;
        });
    }
    return enginePromise;
}

export async function processImage(file) {
    const img = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const engine = await getEngine();
    const processedCanvas = await engine.removeWatermarkFromImage(img);

    return new Promise(resolve => {
        processedCanvas.toBlob(blob => {
            resolve({
                blob,
                url: URL.createObjectURL(blob),
                dataUrl: processedCanvas.toDataURL('image/png')
            });
        }, 'image/png');
    });
}
