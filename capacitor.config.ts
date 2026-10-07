import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'Coach.Vision.app',
  appName: 'CoachVision',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Native,
      autoBackdropColor: 'dom'
    }
  }
};

export default config;
