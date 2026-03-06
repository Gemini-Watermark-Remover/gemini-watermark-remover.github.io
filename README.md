# ✨ GeminiClear | Lossless AI Watermark Remover

[![GitHub Pages](https://img.shields.io/badge/Live-Website-teal.svg)](https://gemini-watermark-remover.github.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Client--Side-green.svg)](#privacy)

**GeminiClear** is a mathematically precise, 100% client-side tool designed to remove [Google Gemini](https://gemini.google.com/) SynthID watermarks locally in your browser.

![GeminiClear Preview](https://gemini-watermark-remover.github.io/preview.png)

## 🚀 Key Features

- **Mathematically Precise:** Uses Reverse Alpha Blending to restore original pixel values instead of "guessing" them via AI.
- **100% Private:** No images are ever uploaded to a server. All processing happens locally on your device.
- **Ultra Fast:** Optimized JavaScript canvas operations provide instant results.
- **Highly Responsive:** Works perfectly on Desktop, iPhone, and Android camera rolls.
- **Open Source:** Entirely built with vanilla HTML, CSS, and JS. No complex frameworks or dependencies.

## 🛠️ How It Works

Google's Gemini AI embeds digital watermarks into generated images using **SynthID**. These watermarks act as a subtle transparency layer over the pixels. 

GeminiClear identifies the watermark's positional rules and applies a reverse blending formula:
`Original = (Watermarked - α × Logo) / (1 - α)`

By isolating the **α (alpha)** transparency map from pre-captured background assets, we can solve for the original pixel data with zero loss in quality.

## 💻 Local Development

Since this is a vanilla static web application, you don't need `npm` or any build tools to run it locally.

1. Clone the repository:
   ```bash
   git clone https://github.com/gemini-watermark-remover/gemini-watermark-remover.github.io.git
   ```
2. Open `index.html` in any modern web browser.
3. *Optional:* Use a simple local server to avoid CORS issues with some local file protocols:
   ```bash
   npx serve .
   ```

## 🔒 Privacy

Your privacy is paramount. GeminiClear:
- Does **not** use tracking or analytics.
- Does **not** store your images.
- Performs **zero** network requests during image processing.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Disclaimer: This project is not affiliated with Google or Alphabet Inc. It is intended for educational purposes and personal image restoration.*
