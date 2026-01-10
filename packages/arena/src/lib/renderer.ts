import { Application, Graphics, Container } from 'pixi.js';
import type { PuckConfig } from '@puck-arena/shared';

export interface PuckSprite {
  id: string;
  container: Container;
  body: Graphics;
  glow: Graphics;
  trail: Graphics[];
  config: PuckConfig;
  prevX: number;
  prevY: number;
}

const MAX_TRAIL_LENGTH = 4; // Reduced for performance
const TRAIL_FADE_RATE = 0.15;
const MIN_TRAIL_SPEED = 5; // Higher threshold for trail creation

export class ArenaRenderer {
  private app: Application;
  private backgroundContainer: Container;
  private trailContainer: Container;
  private puckContainer: Container;
  private effectsContainer: Container;
  private uiContainer: Container;
  private puckSprites: Map<string, PuckSprite> = new Map();
  private ripplePool: Graphics[] = [];
  private activeRipples: Set<Graphics> = new Set();
  private initialized = false;
  private destroyed = false;

  constructor() {
    this.app = new Application();
    this.backgroundContainer = new Container();
    this.trailContainer = new Container();
    this.puckContainer = new Container();
    this.effectsContainer = new Container();
    this.uiContainer = new Container();
  }

  async init(container: HTMLElement): Promise<void> {
    // Don't initialize if already destroyed
    if (this.destroyed) return;

    await this.app.init({
      resizeTo: container,
      backgroundColor: 0x0a0f1a,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      powerPreference: 'high-performance',
    });

    // Check again after async init in case destroy was called
    if (this.destroyed) {
      this.app.destroy(true);
      return;
    }

    container.appendChild(this.app.canvas);

    // Add containers in order (background -> trails -> pucks -> effects -> ui)
    this.app.stage.addChild(this.backgroundContainer);
    this.app.stage.addChild(this.trailContainer);
    this.app.stage.addChild(this.puckContainer);
    this.app.stage.addChild(this.effectsContainer);
    this.app.stage.addChild(this.uiContainer);

    // Create background gradient
    this.createBackground();


    // Pre-allocate ripple pool
    this.initRipplePool(20);

    // Handle resize
    window.addEventListener('resize', () => this.handleResize());

    this.initialized = true;
  }

  private createBackground(): void {
    const bg = new Graphics();
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Dark gradient background
    bg.rect(0, 0, width, height);
    bg.fill({ color: 0x0a0f1a });

    // Subtle grid pattern
    bg.setStrokeStyle({ width: 1, color: 0x1e293b, alpha: 0.3 });
    const gridSize = 50;
    for (let x = 0; x <= width; x += gridSize) {
      bg.moveTo(x, 0);
      bg.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      bg.moveTo(0, y);
      bg.lineTo(width, y);
    }
    bg.stroke();

    // Border glow
    bg.setStrokeStyle({ width: 3, color: 0x3b82f6, alpha: 0.5 });
    bg.rect(2, 2, width - 4, height - 4);
    bg.stroke();

    this.backgroundContainer.addChild(bg);
  }


  private initRipplePool(size: number): void {
    for (let i = 0; i < size; i++) {
      const ripple = new Graphics();
      ripple.visible = false;
      this.effectsContainer.addChild(ripple);
      this.ripplePool.push(ripple);
    }
  }

  private getRipple(): Graphics | null {
    for (const ripple of this.ripplePool) {
      if (!this.activeRipples.has(ripple)) {
        return ripple;
      }
    }
    return null;
  }


  createPuck(config: PuckConfig): void {
    if (this.puckSprites.has(config.id)) return;

    const container = new Container();
    const color = parseInt(config.color.replace('#', ''), 16);
    const radius = config.size / 2;

    // Simple glow effect (no blur filter for performance)
    const glow = new Graphics();
    glow.circle(0, 0, radius + 6);
    glow.fill({ color, alpha: 0.25 });
    // No blur filter - too expensive with 400 pucks

    // Main puck body
    const body = new Graphics();
    this.drawPuckBody(body, config);

    container.addChild(glow);
    container.addChild(body);

    this.puckContainer.addChild(container);
    this.puckSprites.set(config.id, {
      id: config.id,
      container,
      body,
      glow,
      trail: [],
      config,
      prevX: 0,
      prevY: 0,
    });
  }

  private drawPuckBody(graphics: Graphics, config: PuckConfig): void {
    const radius = config.size / 2;
    const color = parseInt(config.color.replace('#', ''), 16);

    graphics.clear();

    // Main circle with gradient-like effect
    graphics.circle(0, 0, radius);
    graphics.fill({ color });

    // Inner highlight (3D effect)
    graphics.circle(-radius * 0.25, -radius * 0.25, radius * 0.4);
    graphics.fill({ color: 0xffffff, alpha: 0.35 });

    // Edge darkening
    graphics.circle(0, 0, radius);
    graphics.stroke({ width: 2, color: 0x000000, alpha: 0.3 });

    // Outer ring
    graphics.circle(0, 0, radius - 1);
    graphics.stroke({ width: 1, color: 0xffffff, alpha: 0.2 });
  }

  updatePuck(id: string, x: number, y: number, angle: number, vx: number = 0, vy: number = 0): void {
    if (!this.initialized) return;
    const sprite = this.puckSprites.get(id);
    if (!sprite) return;

    // Update trail if moving fast enough (higher threshold for performance)
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > MIN_TRAIL_SPEED) {
      this.updateTrail(sprite, x, y, speed);
    }

    // Update position
    sprite.container.position.set(x, y);
    sprite.container.rotation = angle;

    // Pulse glow based on speed
    const glowScale = 1 + Math.min(speed * 0.02, 0.5);
    sprite.glow.scale.set(glowScale);
    sprite.glow.alpha = 0.3 + Math.min(speed * 0.05, 0.5);

    sprite.prevX = x;
    sprite.prevY = y;
  }

  private updateTrail(sprite: PuckSprite, _x: number, _y: number, speed: number): void {
    // Create trail segment at previous position
    const trail = new Graphics();
    const radius = sprite.config.size / 4;
    const color = parseInt(sprite.config.color.replace('#', ''), 16);
    const alpha = Math.min(speed * 0.05, 0.6);

    trail.circle(0, 0, radius);
    trail.fill({ color, alpha });
    trail.position.set(sprite.prevX, sprite.prevY);

    this.trailContainer.addChild(trail);
    sprite.trail.push(trail);

    // Fade out and remove old trail segments
    while (sprite.trail.length > MAX_TRAIL_LENGTH) {
      const oldTrail = sprite.trail.shift();
      if (oldTrail) {
        this.trailContainer.removeChild(oldTrail);
        oldTrail.destroy();
      }
    }

    // Fade existing trail
    sprite.trail.forEach((t, i) => {
      t.alpha = (i / sprite.trail.length) * alpha * TRAIL_FADE_RATE;
      t.scale.set((i / sprite.trail.length) * 0.8);
    });
  }

  updatePuckConfig(config: PuckConfig): void {
    const sprite = this.puckSprites.get(config.id);
    if (sprite) {
      sprite.config = config;
      this.drawPuckBody(sprite.body, config);

      // Update glow color
      const color = parseInt(config.color.replace('#', ''), 16);
      sprite.glow.clear();
      sprite.glow.circle(0, 0, config.size / 2 + 8);
      sprite.glow.fill({ color, alpha: 0.4 });
    }
  }

  removePuck(id: string): void {
    const sprite = this.puckSprites.get(id);
    if (sprite) {
      // Remove trails
      sprite.trail.forEach((t) => {
        this.trailContainer.removeChild(t);
        t.destroy();
      });

      this.puckContainer.removeChild(sprite.container);
      sprite.container.destroy({ children: true });
      this.puckSprites.delete(id);
    }
  }

  syncPucks(configs: PuckConfig[]): void {
    if (!this.initialized) return;
    const configIds = new Set(configs.map((c) => c.id));

    // Remove pucks not in configs
    this.puckSprites.forEach((_sprite, id) => {
      if (!configIds.has(id)) {
        this.removePuck(id);
      }
    });

    // Add/update pucks from configs
    configs.forEach((config) => {
      if (!this.puckSprites.has(config.id)) {
        this.createPuck(config);
      } else {
        this.updatePuckConfig(config);
      }
    });
  }

  showTapEffect(x: number, y: number): void {
    if (!this.initialized) return;
    const ripple = this.getRipple();
    if (!ripple) return;

    ripple.clear();
    ripple.circle(0, 0, 40);
    ripple.stroke({ width: 3, color: 0x3b82f6, alpha: 1 });
    ripple.position.set(x, y);
    ripple.scale.set(0.2);
    ripple.alpha = 1;
    ripple.visible = true;

    this.activeRipples.add(ripple);

    // Animate ripple
    let progress = 0;
    const animate = () => {
      progress += 0.08;

      if (progress >= 1) {
        ripple.visible = false;
        this.activeRipples.delete(ripple);
        return;
      }

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      ripple.scale.set(0.2 + ease * 2);
      ripple.alpha = 1 - ease;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    // Also show a flash effect
    this.showFlash(x, y);
  }

  private showFlash(x: number, y: number): void {
    const flash = new Graphics();
    // Multiple circles for a softer glow effect (no blur filter for performance)
    flash.circle(0, 0, 60);
    flash.fill({ color: 0x3b82f6, alpha: 0.15 });
    flash.circle(0, 0, 45);
    flash.fill({ color: 0x3b82f6, alpha: 0.2 });
    flash.circle(0, 0, 30);
    flash.fill({ color: 0x60a5fa, alpha: 0.3 });
    flash.position.set(x, y);

    this.effectsContainer.addChild(flash);

    // Fade out
    let alpha = 0.3;
    const fadeOut = () => {
      alpha -= 0.03;
      if (alpha <= 0) {
        this.effectsContainer.removeChild(flash);
        flash.destroy();
        return;
      }
      flash.alpha = alpha;
      requestAnimationFrame(fadeOut);
    };
    requestAnimationFrame(fadeOut);
  }

  private handleResize(): void {
    // Recreate background on resize
    this.backgroundContainer.removeChildren();
    this.createBackground();
  }

  getWidth(): number {
    if (!this.initialized) return 1920;
    return this.app.screen.width;
  }

  getHeight(): number {
    if (!this.initialized) return 1080;
    return this.app.screen.height;
  }

  destroy(): void {
    this.destroyed = true;

    // Only clean up if we were initialized
    if (!this.initialized) return;

    window.removeEventListener('resize', () => this.handleResize());
    this.puckSprites.forEach((sprite) => {
      sprite.trail.forEach((t) => t.destroy());
      sprite.container.destroy({ children: true });
    });
    this.puckSprites.clear();

    // Safely destroy the app
    if (this.app.stage) {
      this.app.destroy(true, { children: true });
    }
  }
}
