class SpriteLoader {
    constructor() {
        this.cache = new Map();
    }

    async loadImage(path) {
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }

        const imagePromise = new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                resolve(img);
            };

            img.onerror = (error) => {
                reject(new Error(`Failed to load image at path: ${path}`));
                resolve(img); // Resolve with the image even if it fails to load
            };

            img.src = path;
        });

        this.cache.set(path, imagePromise);

        return imagePromise;
    }

}

export const spriteLoader = new SpriteLoader();
