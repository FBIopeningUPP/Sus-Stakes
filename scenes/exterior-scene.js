import { spriteLoader } from '../shared/sprite-loader.js';

export class ExteriorScene {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.bgImage = null;
        this.imageLoaded = false;

        this.doorHotspot = { x: 0, y:0, width: 0, height: 0};
        this.isHoveringDoor = false;
    }

    async init() {
        try {
            const img = await spriteLoader.loadImage('assets/sprites/exterior.png');
            
            if (img.width > 0) {
                this.bgImage = img;
                this.imageLoaded = true;
            }
        } catch (e) {
            console.warn("Asset 'assets/sprites/exterior.png' missing, falling back to palaceholder.");
        }
        
        this.calculateHotspot();
    }

    calculateHotspot() {
        const canvas = this.sceneManager.canvas;

        const width = canvas.width * 0.15;
        const height = canvas.height * 0.20;
        const x = (canvas.width / 2) - (width / 2);
        const y = canvas.height - height;

        this.doorHotspot = {x, y, width, height};
    }

    update(dt) {
        this.calculateHotspot();
    }
    
    render(ctx) {
        const canvas = this.sceneManager.canvas;

        if (this.imageLoaded && this.bgImage) {
            ctx.drawImage(this.bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '';
            const bWidth = canvas.width * 0.6;
            const bHeight = canvas.height * 0.6;
            ctx.fillRect((canvas.width - bWidth) / 2, canvas.height - bHeight, bWidth, bHeight);
        }

        const { x, y, width, height } = this.doorHotspot;

        ctx.fillStyle = '';
        ctx.fillRect(x, y, width, height);

        if (this.isHoveringDoor) {
            ctx.fillStyle = '';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = '';
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, width, height);
        }
    }

    handleHover(mouseX, mouseY) {
        const { x, y, width, height} = this.doorHotspot;

        this.isHoveringDoor = (
            mouseX >= x &&
            mouseX <= x + width &&
            mouseY >= y &&
            mouseY <= y + height
        );
    }

    handleClick(mouseX, mouseY) {
        if (this.sceneManager.isTransitioning) return;

        const { x, y, width, height} = this.doorHotspot;

        if ( 
            mouseX >= x &&
            mouseX <= x + width &&
            mouseY >= y &&
            mouseY <= y + height
        ) {
            console.log("entering lobby");
        }
    }

    cleanup() {
        this.isHoveringDoor = false;
    }
}
