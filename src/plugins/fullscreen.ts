import { registerPlugin } from '@capacitor/core';

export interface FullscreenPlugin {
  disableImmersiveMode(): Promise<void>;
  enableImmersiveMode(): Promise<void>;
}

const Fullscreen = registerPlugin<FullscreenPlugin>('Fullscreen');

export default Fullscreen;
