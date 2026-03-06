import { calculateAlphaMap } from './alphaMap.js';
import { removeWatermark } from './blendModes.js';
import { detectWatermarkConfig, calculateWatermarkPosition } from './watermarkConfig.js';
import { BG_48_B64, BG_96_B64 } from './bg_assets.js';

function createRuntimeCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function getCanvasContext2D(canvas) {
    return canvas.getContext('2d', { willReadFrequently: true });
}

async function loadBackgroundCapture(source) {
    const image = new Image();
    image.src = source;
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    });
    return image;
}

function cloneImageData(imageData) {
    return new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
    );
}

export class WatermarkEngine {
    constructor(bgCaptures) {
        this.bgCaptures = bgCaptures;
        this.alphaMaps = {};
    }

    static async create() {
        const [bg48, bg96] = await Promise.all([
            loadBackgroundCapture(BG_48_B64),
            loadBackgroundCapture(BG_96_B64)
        ]);
        return new WatermarkEngine({ bg48, bg96 });
    }

    async getAlphaMap(size) {
        if (size !== 48 && size !== 96) {
            // Placeholder: standalone app simplifies interpolated scaling to save code
            return this.getAlphaMap(96);
        }

        if (this.alphaMaps[size]) {
            return this.alphaMaps[size];
        }

        const bgImage = size === 48 ? this.bgCaptures.bg48 : this.bgCaptures.bg96;
        const canvas = createRuntimeCanvas(size, size);
        const ctx = getCanvasContext2D(canvas);
        ctx.drawImage(bgImage, 0, 0);

        const imageData = ctx.getImageData(0, 0, size, size);
        const alphaMap = calculateAlphaMap(imageData);
        this.alphaMaps[size] = alphaMap;

        return alphaMap;
    }

    async removeWatermarkFromImage(image, options = {}) {
        const canvas = createRuntimeCanvas(image.width, image.height);
        const ctx = getCanvasContext2D(canvas);
        ctx.drawImage(image, 0, 0);

        const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const config = detectWatermarkConfig(canvas.width, canvas.height);
        let position = calculateWatermarkPosition(canvas.width, canvas.height, config);
        let alphaMap = await this.getAlphaMap(config.logoSize);

        const fixedImageData = cloneImageData(originalImageData);
        removeWatermark(fixedImageData, alphaMap, position);

        ctx.putImageData(fixedImageData, 0, 0);

        canvas.__watermarkMeta = {
            size: position.width,
            position: { x: position.x, y: position.y, width: position.width, height: position.height },
            config: { logoSize: config.logoSize, marginRight: config.marginRight, marginBottom: config.marginBottom },
        };

        return canvas;
    }
}
