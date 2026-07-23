import { Player } from '@media-runtime/core';

export class PlayerUI {
  private container: HTMLElement;
  private controlsBar!: HTMLDivElement;
  private playBtn!: HTMLButtonElement;
  private timeSlider!: HTMLInputElement;
  private timeDisplay!: HTMLSpanElement;
  private volumeBtn!: HTMLButtonElement;
  private volumeSlider!: HTMLInputElement;
  private pipBtn!: HTMLButtonElement;
  private fullscreenBtn!: HTMLButtonElement;

  constructor(private player: Player, containerElement: HTMLElement) {
    this.container = containerElement;
    this.initDOM();
    this.bindEvents();
    this.bindKeyboardNav();
  }

  private initDOM(): void {
    this.container.classList.add('media-runtime-container');
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Media Player Controls');
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.backgroundColor = '#000';

    // Apply dark glassmorphic styling
    const style = document.createElement('style');
    style.textContent = `
      .media-runtime-controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 52px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 12px;
        color: #F8FAFC;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        box-sizing: border-box;
        z-index: 100;
      }
      .media-runtime-btn {
        background: transparent;
        border: none;
        color: #F8FAFC;
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .media-runtime-btn:focus-visible {
        outline: 2px solid #38BDF8;
        outline-offset: 2px;
      }
      .media-runtime-slider {
        accent-color: #38BDF8;
        cursor: pointer;
        flex: 1;
      }
    `;
    document.head.appendChild(style);

    this.controlsBar = document.createElement('div');
    this.controlsBar.className = 'media-runtime-controls';

    // Play/Pause Button
    this.playBtn = document.createElement('button');
    this.playBtn.className = 'media-runtime-btn';
    this.playBtn.setAttribute('aria-label', 'Play');
    this.playBtn.innerHTML = '▶';

    // Time Slider
    this.timeSlider = document.createElement('input');
    this.timeSlider.type = 'range';
    this.timeSlider.className = 'media-runtime-slider';
    this.timeSlider.min = '0';
    this.timeSlider.max = '100';
    this.timeSlider.value = '0';
    this.timeSlider.setAttribute('aria-label', 'Seek timeline');

    // Time Display
    this.timeDisplay = document.createElement('span');
    this.timeDisplay.textContent = '00:00 / 00:00';

    // Volume Button
    this.volumeBtn = document.createElement('button');
    this.volumeBtn.className = 'media-runtime-btn';
    this.volumeBtn.setAttribute('aria-label', 'Mute');
    this.volumeBtn.innerHTML = '🔊';

    // Volume Slider
    this.volumeSlider = document.createElement('input');
    this.volumeSlider.type = 'range';
    this.volumeSlider.className = 'media-runtime-slider';
    this.volumeSlider.style.width = '60px';
    this.volumeSlider.min = '0';
    this.volumeSlider.max = '1';
    this.volumeSlider.step = '0.05';
    this.volumeSlider.value = '1';
    this.volumeSlider.setAttribute('aria-label', 'Volume level');

    // PiP Button
    this.pipBtn = document.createElement('button');
    this.pipBtn.className = 'media-runtime-btn';
    this.pipBtn.setAttribute('aria-label', 'Picture in Picture');
    this.pipBtn.innerHTML = '⧉';

    // Fullscreen Button
    this.fullscreenBtn = document.createElement('button');
    this.fullscreenBtn.className = 'media-runtime-btn';
    this.fullscreenBtn.setAttribute('aria-label', 'Toggle Fullscreen');
    this.fullscreenBtn.innerHTML = '⛶';

    this.controlsBar.appendChild(this.playBtn);
    this.controlsBar.appendChild(this.timeSlider);
    this.controlsBar.appendChild(this.timeDisplay);
    this.controlsBar.appendChild(this.volumeBtn);
    this.controlsBar.appendChild(this.volumeSlider);
    this.controlsBar.appendChild(this.pipBtn);
    this.controlsBar.appendChild(this.fullscreenBtn);

    this.container.appendChild(this.controlsBar);
  }

  private bindEvents(): void {
    this.playBtn.onclick = () => {
      if (this.player.getState() === 'playing') {
        this.player.pause();
      } else {
        this.player.play();
      }
    };

    this.timeSlider.oninput = () => {
      const seekTarget = parseFloat(this.timeSlider.value);
      this.player.seek(seekTarget);
    };

    this.volumeSlider.oninput = () => {
      this.player.setVolume(parseFloat(this.volumeSlider.value));
    };

    this.player.on('statechange', (state) => {
      if (state === 'playing') {
        this.playBtn.innerHTML = '⏸';
        this.playBtn.setAttribute('aria-label', 'Pause');
      } else {
        this.playBtn.innerHTML = '▶';
        this.playBtn.setAttribute('aria-label', 'Play');
      }
    });

    this.player.on('timeupdate', (timeSeconds: any) => {
      const dur = this.player.getDuration() || 100;
      this.timeSlider.max = String(dur);
      this.timeSlider.value = String(timeSeconds || 0);
      this.timeDisplay.textContent = `${this.formatTime(timeSeconds || 0)} / ${this.formatTime(dur)}`;
    });
  }

  private bindKeyboardNav(): void {
    this.container.tabIndex = 0;
    this.container.onkeydown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        this.playBtn.click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.player.seek(Math.max(0, this.player.getCurrentTime() - 5));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.player.seek(this.player.getCurrentTime() + 5);
      } else if (e.key === 'm') {
        e.preventDefault();
        this.player.setMuted(true);
      }
    };
  }

  private formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
