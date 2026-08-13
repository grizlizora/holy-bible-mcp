export type HardwareProfile = 'high' | 'medium' | 'eco';
export type OperatingSystem = 'macOS' | 'Windows' | 'Linux' | 'iOS' | 'Android' | 'unknown';

export interface HardwareSpecs {
  os: OperatingSystem;
  cpuCores: number;
  ramGB: number;
  gpuVendor: string;
  gpuRenderer: string;
  isMobile: boolean;
  isDiscreteGPU: boolean;
  isIntegratedGPU: boolean;
  isAppleSilicon: boolean;
  isSnapdragonX: boolean;
  cpuScoreMs: number;
  gpuScoreMs: number;
  profile: HardwareProfile;
}

/**
 * Runs a micro-benchmark (<3ms) to measure real CPU math throughput and GPU canvas draw latency.
 */
export function runMicroBenchmark(): { cpuScoreMs: number; gpuScoreMs: number } {
  if (typeof window === 'undefined') return { cpuScoreMs: 0.5, gpuScoreMs: 0.5 };

  // 1. CPU Micro-benchmark (50k math operations)
  const t0 = performance.now();
  let x = 0;
  for (let i = 0; i < 50000; i++) {
    x += Math.sin(i) * Math.cos(i);
  }
  const cpuScoreMs = Math.max(0.1, performance.now() - t0);

  // 2. GPU Micro-benchmark (offscreen canvas 2d fill)
  let gpuScoreMs = 0.5;
  try {
    const tGpu0 = performance.now();
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.fillRect(0, 0, 64, 64);
    }
    gpuScoreMs = Math.max(0.1, performance.now() - tGpu0);
  } catch (e) {
    gpuScoreMs = 2.0;
  }

  return { cpuScoreMs, gpuScoreMs };
}

export function detectHardwareSpecs(): HardwareSpecs {
  if (typeof window === 'undefined') {
    let cpuCores = 8;
    let ramGB = 16;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const osModule = require('os');
      cpuCores = osModule.cpus()?.length || 8;
      ramGB = Math.round((osModule.totalmem() || 16 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024));
    } catch {
      // fallback
    }

    return {
      os: 'unknown',
      cpuCores,
      ramGB,
      gpuVendor: 'unknown',
      gpuRenderer: 'unknown',
      isMobile: false,
      isDiscreteGPU: false,
      isIntegratedGPU: false,
      isAppleSilicon: false,
      isSnapdragonX: false,
      cpuScoreMs: 0.5,
      gpuScoreMs: 0.5,
      profile: cpuCores >= 8 && ramGB >= 16 ? 'high' : cpuCores >= 4 ? 'medium' : 'eco',
    };
  }

  const ua = navigator.userAgent;

  // 1. Operating System Detection
  let os: OperatingSystem = 'unknown';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Windows|Win32/i.test(ua)) os = 'Windows';
  else if (/Linux|X11/i.test(ua)) os = 'Linux';

  const isMobile = os === 'iOS' || os === 'Android';
  const cpuCores = navigator.hardwareConcurrency || 4;
  const ramGB = (navigator as any).deviceMemory || 4;

  // 2. Run <3ms Boot Micro-benchmark
  const { cpuScoreMs, gpuScoreMs } = runMicroBenchmark();

  // 3. GPU Detection via WebGL Debug Renderer Info
  let gpuVendor = 'unknown';
  let gpuRenderer = 'unknown';

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
      }
      // 🧠 Clean up WebGL context to prevent VRAM memory leaks and "Too many active WebGL contexts" warnings
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) loseContext.loseContext();
    }
  } catch (e) {}

  // 4. GPU Architecture Profiling
  const isNvidia = /NVIDIA|GeForce|Quadro|RTX|GTX/i.test(gpuRenderer) || /NVIDIA/i.test(gpuVendor);
  const isAmdDiscrete = /Radeon RX|Radeon Pro|Navi|Vega 56|Vega 64/i.test(gpuRenderer);
  const isAmdAPU = /Radeon Graphics|Radeon Vega|Radeon 660M|Radeon 780M|Radeon 890M/i.test(gpuRenderer);
  const isIntelArc = /Intel.*Arc/i.test(gpuRenderer);
  const isIntelIntegrated = /Intel.*(Iris|UHD|HD Graphics)/i.test(gpuRenderer);
  const isAppleSilicon = os === 'macOS' && (/Apple M|Apple GPU/i.test(gpuRenderer) || /Apple/i.test(gpuVendor));
  const isAppleMobile = os === 'iOS';
  const isQualcommAdreno = /Adreno/i.test(gpuRenderer);
  const isSnapdragonX = /Snapdragon.*X/i.test(gpuRenderer) || (os === 'Windows' && /aarch64|arm64/i.test(ua));
  const isMali = /Mali/i.test(gpuRenderer);

  const isDiscreteGPU = isNvidia || isAmdDiscrete || isIntelArc;
  const isIntegratedGPU = isIntelIntegrated || isAmdAPU;

  // 5. Dynamic Hardware Profile Calculation
  let profile: HardwareProfile = 'high';

  if (isMobile) {
    if (cpuScoreMs > 4.0 || gpuScoreMs > 4.0) {
      profile = 'eco';
    } else if (cpuCores >= 4 || ramGB >= 3 || isQualcommAdreno || isAppleMobile) {
      profile = 'high';
    } else {
      profile = 'medium';
    }
  } else {
    // Desktop & Laptop Hardware Logic
    if (isDiscreteGPU || isAppleSilicon || isSnapdragonX) {
      profile = 'high';
    } else if (isIntegratedGPU) {
      profile = ramGB >= 8 && cpuCores >= 6 ? 'high' : 'medium';
    } else {
      profile = cpuCores >= 4 ? 'high' : 'medium';
    }
  }

  return {
    os,
    cpuCores,
    ramGB,
    gpuVendor,
    gpuRenderer,
    isMobile,
    isDiscreteGPU,
    isIntegratedGPU,
    isAppleSilicon,
    isSnapdragonX,
    cpuScoreMs,
    gpuScoreMs,
    profile,
  };
}

export function applyHardwareProfile(specs: HardwareSpecs | HardwareProfile) {
  if (typeof document === 'undefined') return;

  const profileName = typeof specs === 'string' ? specs : specs.profile;

  const root = document.body;
  root.classList.remove('hw-high', 'hw-medium', 'hw-eco');
  root.classList.add(`hw-${profileName}`);

  if (typeof specs !== 'string') {
    root.setAttribute('data-os', specs.os);
    document.documentElement.style.setProperty('--hw-cpu-cores', specs.cpuCores.toString());
    document.documentElement.style.setProperty('--hw-profile', profileName);
  }
}
