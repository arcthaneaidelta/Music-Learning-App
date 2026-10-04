/**
 * Extracts and caches audio waveform min/max peaks at multiple resolutions.
 */

export interface WaveformPeaks {
  sampleRate: number;
  duration: number;
  length: number;
  // Resolution levels: 256, 1024, 4096 samples per bucket
  levels: {
    samplesPerPixel: number;
    min: Float32Array;
    max: Float32Array;
  }[];
}

export function extractPeaks(audioBuffer: AudioBuffer): WaveformPeaks {
  const channelCount = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // Extract mono-mix float data
  const channels: Float32Array[] = [];
  for (let c = 0; c < channelCount; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }

  const resolutions = [256, 1024, 4096];
  const levels = resolutions.map((samplesPerPixel) => {
    const bucketCount = Math.ceil(length / samplesPerPixel);
    const minArray = new Float32Array(bucketCount);
    const maxArray = new Float32Array(bucketCount);

    for (let b = 0; b < bucketCount; b++) {
      const start = b * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, length);

      let min = 1.0;
      let max = -1.0;

      for (let i = start; i < end; i++) {
        // Mono mix
        let sample = 0;
        for (let c = 0; c < channelCount; c++) {
          sample += channels[c][i];
        }
        sample /= channelCount;

        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }

      minArray[b] = min === 1.0 ? 0 : min;
      maxArray[b] = max === -1.0 ? 0 : max;
    }

    return {
      samplesPerPixel,
      min: minArray,
      max: maxArray,
    };
  });

  return {
    sampleRate,
    duration,
    length,
    levels,
  };
}
