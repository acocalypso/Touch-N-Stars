import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aggregateAndroidMeminfo,
  parseAndroidMeminfo,
  parsePackageWebViewProcessPids,
  summarizeAndroidMemorySamples,
} from '../../../../scripts/android-atlas-memory-profile-lib.mjs';

const fixture = `Applications Memory Usage (in Kilobytes):
** MEMINFO in pid 9980 [com.TouchNStars.dev] **
                   Pss  Private  Private  SwapPss      Rss
                 Total    Dirty    Clean    Dirty    Total
        TOTAL   126221    55056    31180      367   283304

 App Summary
           Java Heap:    15044                          30996
         Native Heap:    22140                          23084
                Code:    30524                         198044
               Stack:     1804                           1812
            Graphics:     4096                           8192
       Private Other:    16724
              System:    39985
           TOTAL PSS:   126221            TOTAL RSS:   283304       TOTAL SWAP PSS:      367
 Objects
               Views:       11         ViewRootImpl:        1
         AppContexts:        6           Activities:        1
              Assets:       24        AssetManagers:        0
    Death Recipients:        4             WebViews:        1`;

test('parses stable Android meminfo summary fields', () => {
  assert.deepEqual(parseAndroidMeminfo(fixture), {
    pid: 9980,
    totalPssKb: 126221,
    totalRssKb: 283304,
    totalSwapPssKb: 367,
    totalPrivateDirtyKb: 55056,
    totalPrivateCleanKb: 31180,
    javaHeapKb: 15044,
    nativeHeapKb: 22140,
    codeKb: 30524,
    stackKb: 1804,
    graphicsKb: 4096,
    privateOtherKb: 16724,
    systemKb: 39985,
    views: 11,
    activities: 1,
    webViews: 1,
  });
});

test('discovers only the WebView renderer associated with the Touch-N-Stars package', () => {
  const processes = `
  *APP* UID 99005 ProcessRecord{abc 9663:com.google.android.webview:sandboxed_process0:service/u0a145i5}
    packageList={com.google.android.googlequicksearchbox}
  *APP* UID 10217 ProcessRecord{def 9980:com.TouchNStars.dev/u0a217}
    packageList={com.TouchNStars.dev}
  *APP* UID 99007 ProcessRecord{ghi 10008:com.google.android.webview:sandboxed_process0:service/u0a217i7}
    packageList={com.TouchNStars.dev}
  `;
  assert.deepEqual(parsePackageWebViewProcessPids(processes, 'com.TouchNStars.dev'), [10008]);
});

test('aggregates main and isolated WebView process memory', () => {
  assert.deepEqual(
    aggregateAndroidMeminfo([
      { pid: 1, totalPssKb: 100, totalRssKb: 200, nativeHeapKb: 30 },
      { pid: 2, totalPssKb: 400, totalRssKb: 600, nativeHeapKb: 70 },
    ]),
    {
      totalPssKb: 500,
      totalRssKb: 800,
      totalSwapPssKb: null,
      totalPrivateDirtyKb: null,
      totalPrivateCleanKb: null,
      javaHeapKb: null,
      nativeHeapKb: 100,
      codeKb: null,
      stackKb: null,
      graphicsKb: null,
      privateOtherKb: null,
      systemKb: null,
    }
  );
});

test('summarizes settled growth, peaks, slopes and process restarts', () => {
  const samples = [100, 110, 120, 125, 130, 135].map((totalPssKb, index) => ({
    elapsedSeconds: index * 30,
    pid: index < 4 ? 10 : 11,
    processPids: index < 4 ? [10, 20] : [11, 21],
    totalPssKb,
    totalRssKb: totalPssKb * 2,
    totalPrivateDirtyKb: totalPssKb / 2,
    nativeHeapKb: 20 + index,
    javaHeapKb: 10,
    graphicsKb: 5,
    privateOtherKb: 40,
    systemKb: 30,
    codeKb: 20,
  }));
  const summary = summarizeAndroidMemorySamples(samples, { warmupSamples: 2 });
  assert.equal(summary.processRestarts, 1);
  assert.equal(summary.samplesWithoutWebViewProcess, 6);
  assert.equal(summary.validSamples, 6);
  assert.equal(summary.totalPss.firstMedianKb, 122.5);
  assert.equal(summary.totalPss.lastMedianKb, 132.5);
  assert.equal(summary.totalPss.settledGrowthKb, 10);
  assert.equal(summary.totalPss.maxKb, 135);
  assert.ok(summary.totalPss.slopeKbPerMinute > 9);
  assert.equal(summary.privateOther.settledGrowthKb, 0);
  assert.equal(summary.system.settledGrowthKb, 0);
  assert.equal(summary.code.settledGrowthKb, 0);
});
