export function computeRegionSpatialCorrelation({ imageData, alphaMap, region }) {
    let sumXY = 0;
    let sumX = 0;
    let sumY = 0;
    let sumX2 = 0;
    let sumY2 = 0;
    let count = 0;

    const { x, y, size } = region;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const imgIdx = ((y + r) * imageData.width + (x + c)) * 4;
            const alphaIdx = r * size + c;

            const alpha = alphaMap[alphaIdx];
            if (alpha === 0) continue;

            const valX = Math.max(
                imageData.data[imgIdx],
                imageData.data[imgIdx + 1],
                imageData.data[imgIdx + 2]
            ) / 255;

            sumX += valX;
            sumY += alpha;
            sumXY += valX * alpha;
            sumX2 += valX * valX;
            sumY2 += alpha * alpha;
            count++;
        }
    }

    if (count === 0) return 0;

    const numerator = count * sumXY - sumX * sumY;
    const denominator = Math.sqrt((count * sumX2 - sumX * sumX) * (count * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
}

export function computeRegionGradientCorrelation({ imageData, alphaMap, region }) {
    let sumXY = 0;
    let sumX = 0;
    let sumY = 0;
    let sumX2 = 0;
    let sumY2 = 0;
    let count = 0;

    const { x, y, size } = region;

    for (let r = 1; r < size - 1; r++) {
        for (let c = 1; c < size - 1; c++) {
            const imgIdx = ((y + r) * imageData.width + (x + c)) * 4;
            const imgIdxR = ((y + r) * imageData.width + (x + c + 1)) * 4;
            const imgIdxD = ((y + r + 1) * imageData.width + (x + c)) * 4;

            const alphaIdx = r * size + c;
            const alphaIdxR = r * size + c + 1;
            const alphaIdxD = (r + 1) * size + c;

            const valX = Math.max(imageData.data[imgIdx], imageData.data[imgIdx + 1], imageData.data[imgIdx + 2]) / 255;
            const valXR = Math.max(imageData.data[imgIdxR], imageData.data[imgIdxR + 1], imageData.data[imgIdxR + 2]) / 255;
            const valXD = Math.max(imageData.data[imgIdxD], imageData.data[imgIdxD + 1], imageData.data[imgIdxD + 2]) / 255;

            const xGradX = valXR - valX;
            const xGradY = valXD - valX;
            const magX = Math.sqrt(xGradX * xGradX + xGradY * xGradY);

            const aGradX = alphaMap[alphaIdxR] - alphaMap[alphaIdx];
            const aGradY = alphaMap[alphaIdxD] - alphaMap[alphaIdx];
            const magA = Math.sqrt(aGradX * aGradX + aGradY * aGradY);

            if (magA > 0.01 || magX > 0.01) {
                sumXY += magX * magA;
                sumX += magX;
                sumY += magA;
                sumX2 += magX * magX;
                sumY2 += magA * magA;
                count++;
            }
        }
    }

    if (count === 0) return 0;
    const num = count * sumXY - sumX * sumY;
    const den = Math.sqrt((count * sumX2 - sumX * sumX) * (count * sumY2 - sumY * sumY));
    return den === 0 ? 0 : num / den;
}

export function detectAdaptiveWatermarkRegion({ imageData, alpha96, defaultConfig }) {
    const size = 96;
    let bestScore = -1;
    let bestRegion = null;
    let bestFound = false;

    // Very simplified adaptive detection for standalone version
    // Only checking a few variations around the default right bottom margin
    const margins = [
        { r: 32, b: 32 },
        { r: 48, b: 48 },
        { r: 64, b: 64 },
        { r: 16, b: 16 }
    ];

    for (const m of margins) {
        const x = imageData.width - size - m.r;
        const y = imageData.height - size - m.b;

        if (x < 0 || y < 0) continue;

        const region = { x, y, size, width: size, height: size };
        const score = computeRegionSpatialCorrelation({ imageData, alphaMap: alpha96, region });

        if (score > bestScore) {
            bestScore = score;
            bestRegion = region;
            bestFound = score > 0.25;
        }
    }

    return {
        found: bestFound,
        confidence: bestScore,
        region: bestRegion
    };
}

export function warpAlphaMap(alphaMap, size, { dx, dy, scale }) {
    const warped = new Float32Array(size * size);
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const srcR = (r - size / 2) / scale + size / 2 - dy;
            const srcC = (c - size / 2) / scale + size / 2 - dx;

            if (srcR >= 0 && srcR < size - 1 && srcC >= 0 && srcC < size - 1) {
                const r0 = Math.floor(srcR);
                const c0 = Math.floor(srcC);
                const r1 = r0 + 1;
                const c1 = c0 + 1;

                const fr = srcR - r0;
                const fc = srcC - c0;

                const v00 = alphaMap[r0 * size + c0];
                const v01 = alphaMap[r0 * size + c1];
                const v10 = alphaMap[r1 * size + c0];
                const v11 = alphaMap[r1 * size + c1];

                warped[r * size + c] =
                    v00 * (1 - fr) * (1 - fc) +
                    v01 * (1 - fr) * fc +
                    v10 * fr * (1 - fc) +
                    v11 * fr * fc;
            }
        }
    }
    return warped;
}

export function interpolateAlphaMap(srcAlphaMap, srcSize, dstSize) {
    const dstAlphaMap = new Float32Array(dstSize * dstSize);
    const scale = srcSize / dstSize;

    for (let r = 0; r < dstSize; r++) {
        for (let c = 0; c < dstSize; c++) {
            const srcR = Math.min(srcSize - 1, Math.max(0, r * scale));
            const srcC = Math.min(srcSize - 1, Math.max(0, c * scale));

            const r0 = Math.floor(srcR);
            const c0 = Math.floor(srcC);
            const r1 = Math.min(srcSize - 1, r0 + 1);
            const c1 = Math.min(srcSize - 1, c0 + 1);

            const fr = srcR - r0;
            const fc = srcC - c0;

            const v00 = srcAlphaMap[r0 * srcSize + c0];
            const v01 = srcAlphaMap[r0 * srcSize + c1];
            const v10 = srcAlphaMap[r1 * srcSize + c0];
            const v11 = srcAlphaMap[r1 * srcSize + c1];

            dstAlphaMap[r * dstSize + c] =
                v00 * (1 - fr) * (1 - fc) +
                v01 * (1 - fr) * fc +
                v10 * fr * (1 - fc) +
                v11 * fr * fc;
        }
    }
    return dstAlphaMap;
}

export function shouldAttemptAdaptiveFallback({ processedImageData, alphaMap, position, originalImageData }) {
    return true; // Simple version for pure JS app: always attempt fallback if adaptive mode isn't off
}
