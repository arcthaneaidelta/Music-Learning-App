import { describe, it, expect } from 'vitest';
import { MasterClock } from '../MasterClock';
import { BeatMap } from '../BeatMap';

describe('MasterClock pure timing model', () => {
  it('derives position accurately while paused and playing', () => {
    const clock = new MasterClock(80.0);
    expect(clock.getPosition(0)).toBe(0);

    clock.seek(15.5, 10.0);
    expect(clock.getPosition(10.0)).toBe(15.5);
    expect(clock.getPosition(12.0)).toBe(15.5); // Still paused, position stays constant

    clock.play(20.0);
    expect(clock.getPosition(20.0)).toBe(15.5);
    expect(clock.getPosition(21.0)).toBe(16.5); // 1s elapsed at 1.0 rate
    expect(clock.getPosition(24.5)).toBe(20.0); // 4.5s elapsed
  });

  it('guarantees re-anchor continuity across speed changes (Δ < 1e-9)', () => {
    const clock = new MasterClock(80.0);
    clock.seek(10.0, 0);
    clock.play(0);

    // Run forward 5 seconds at rate 1.0 -> song position is 15.0
    const now1 = 5.0;
    const posBeforeChange = clock.getPosition(now1);
    expect(posBeforeChange).toBe(15.0);

    // Change rate to 0.70 at exact time now1
    clock.setRate(0.7, now1);
    const posImmediatelyAfter = clock.getPosition(now1);

    // Delta must be virtually zero (mathematical continuity)
    const delta = Math.abs(posImmediatelyAfter - posBeforeChange);
    expect(delta).toBeLessThan(1e-9);

    // Now advance 1 second of wall-clock time at 0.7 rate
    const now2 = 6.0;
    expect(clock.getPosition(now2)).toBeCloseTo(15.7, 5);
  });

  it('wraps accurately at loop boundaries and increments pass counter', () => {
    const clock = new MasterClock(80.0);
    // Loop between 30.0 and 50.0 (length 20s)
    clock.setLoop({ a: 30.0, b: 50.0 }, 0);
    clock.seek(30.0, 0);
    clock.play(0);

    expect(clock.getPosition(0)).toBe(30.0);
    expect(clock.getLoopPass(0)).toBe(1);

    // 10s into loop -> pos 40.0
    expect(clock.getPosition(10.0)).toBe(40.0);
    expect(clock.getLoopPass(10.0)).toBe(1);

    // Exactly at wrap boundary (20s) -> pos 30.0, pass 2
    expect(clock.getPosition(20.0)).toBe(30.0);
    expect(clock.getLoopPass(20.0)).toBe(2);

    // 25s elapsed (5s into second pass) -> pos 35.0, pass 2
    expect(clock.getPosition(25.0)).toBe(35.0);
    expect(clock.getLoopPass(25.0)).toBe(2);

    // 105s elapsed -> pass 6, pos 35.0
    expect(clock.getPosition(105.0)).toBe(35.0);
    expect(clock.getLoopPass(105.0)).toBe(6);
  });

  it('preserves loop continuity and clamps to duration', () => {
    const clock = new MasterClock(50.0);
    clock.seek(49.0, 0);
    clock.play(0);
    expect(clock.getPosition(2.0)).toBe(50.0); // Clamped to duration
  });
});

describe('BeatMap musical calculations', () => {
  it('correctly maps 96 BPM 4/4 bar and beat positions', () => {
    // 96 BPM = 60 / 96 = 0.625s per beat, 2.5s per bar (4 beats)
    const beatMap = new BeatMap(96, 0.0, [4, 4]);

    // Bar 1, Beat 1
    const p1 = beatMap.timeToBeat(0.0);
    expect(p1.bar).toBe(1);
    expect(p1.beat).toBe(1);
    expect(p1.inCountIn).toBe(false);

    // Bar 1, Beat 3 -> 2 beats * 0.625 = 1.25s
    const p2 = beatMap.timeToBeat(1.25);
    expect(p2.bar).toBe(1);
    expect(p2.beat).toBe(3);

    // Bar 13, Beat 1 (Chorus start in Harbour Light) -> 12 bars * 2.5s = 30.0s
    const p3 = beatMap.timeToBeat(30.0);
    expect(p3.bar).toBe(13);
    expect(p3.beat).toBe(1);
  });

  it('round-trips beatToTime and timeToBeat accurately', () => {
    const beatMap = new BeatMap(120, 0.5, [4, 4]); // 120 BPM, downbeat at 0.5s

    // Bar 5, beat 2
    const time = beatMap.beatToTime(5, 2);
    const pos = beatMap.timeToBeat(time);

    expect(pos.bar).toBe(5);
    expect(pos.beat).toBe(2);
    expect(pos.fraction).toBeCloseTo(0, 5);
  });

  it('snaps accurately to bar and beat boundaries', () => {
    const beatMap = new BeatMap(96, 0.0, [4, 4]); // bar = 2.5s, beat = 0.625s

    // Snap to bar: 10.12s is close to Bar 5 (10.0s)
    const barSnap = beatMap.snapTime(10.12, 'bar');
    expect(barSnap.time).toBe(10.0);
    expect(barSnap.deltaMs).toBe(-120);

    // Snap to beat: 1.30s is close to Beat 3 (1.25s)
    const beatSnap = beatMap.snapTime(1.30, 'beat');
    expect(beatSnap.time).toBeCloseTo(1.25, 4);
  });
});
