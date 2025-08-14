import { LogParser } from './LogParser.js';
import {
  buildCollapseMap,
  buildFinalSections,
  flagSectionsAndParents,
  buildFailuresIndex,
  buildSubEntriesByTcIdx   
} from './LogParser.js';

const parser = new LogParser();
const encoder = new TextEncoder();
const allEntries = [];         

const INITIAL_BUFFER_SIZE = 2 * 1024 * 1024;
const MAX_BUFFER_SIZE     = 16 * 1024 * 1024;
const GROWTH_FACTOR       = 1.5;

class BufferPool {
  constructor() {
    this.buffers = [
      new Uint8Array(INITIAL_BUFFER_SIZE),
      new Uint8Array(INITIAL_BUFFER_SIZE)
    ];
    this.currentIndex = 0;
  }

  getCurrentBuffer() {
    return this.buffers[this.currentIndex];
  }

  swapBuffers() {
    this.currentIndex = 1 - this.currentIndex;
  }

  ensureCapacity(requiredSize) {
    const buffer = this.getCurrentBuffer();
    if (buffer.byteLength < requiredSize) {
      const newSize = Math.min(
        Math.max(requiredSize, buffer.byteLength * GROWTH_FACTOR),
        MAX_BUFFER_SIZE
      );
      this.buffers[this.currentIndex] = new Uint8Array(newSize);
    }
    return this.getCurrentBuffer();
  }
}
const bufferPool = new BufferPool();

const parseCache = new Map();
const MAX_CACHE_SIZE = 1000;

function getCachedParse(key, data) {
  if (parseCache.has(key)) return parseCache.get(key);

  const result = parser.parse(data);
  if (parseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = parseCache.keys().next().value;
    parseCache.delete(firstKey);
  }
  parseCache.set(key, result);
  return result;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function calculateOptimalChunkSize(totalLines, estimatedLineSize) {
  const targetChunkMemory = 512 * 1024;
  return Math.max(
    100,
    Math.min(
      5000,
      Math.floor(targetChunkMemory / estimatedLineSize)
    )
  );
}

self.onmessage = async (e) => {
  const { type, data } = e.data;

  if (type !== 'process') return;

  const startTime = performance.now();
  const lines = data.split(/\r?\n/);

  const sampleLines = lines.slice(0, Math.min(100, lines.length));
  const avgLineSize = sampleLines.reduce((s, l) => s + l.length, 0) / sampleLines.length;
  const chunkSize   = calculateOptimalChunkSize(lines.length, avgLineSize);
  const totalChunks = Math.ceil(lines.length / chunkSize);

  self.postMessage({
    type: 'progress',
    phase: 'start',
    totalLines: lines.length,
    processed: 0,
    estimatedChunkSize: chunkSize
  });

  let processedLines = 0;

  for (let i = 0; i < totalChunks; i++) {
    const chunkStart = i * chunkSize;
    const chunkEnd   = (i + 1) * chunkSize;
    const chunkData  = lines.slice(chunkStart, chunkEnd).join('\n');

    const cacheKey = simpleHash(chunkData);
    const parsed   = await getCachedParse(cacheKey, chunkData);

    allEntries.push(...parsed);   

    const json    = JSON.stringify(parsed);
    const encoded = encoder.encode(json);
    const buffer  = bufferPool.ensureCapacity(encoded.byteLength);
    buffer.set(encoded, 0);
    const bufferToSend = buffer.slice(0, encoded.byteLength);

    self.postMessage(
      {
        type: 'batch',
        data: bufferToSend.buffer,
        chunk: i + 1,
        totalChunks,
        isPartial: i < totalChunks - 1,
        processingTime: performance.now() - startTime
      },
      [bufferToSend.buffer]
    );

    bufferPool.swapBuffers();
    processedLines = chunkEnd;

    if (i % 10 === 0 || i === totalChunks - 1) {
      self.postMessage({
        type: 'progress',
        phase: 'processing',
        processed: processedLines,
        totalLines: lines.length,
        chunksProcessed: i + 1,
        totalChunks,
        processingRate: processedLines / (performance.now() - startTime) * 1000
      });
    }

    if (i % 50 === 0) await new Promise(r => setTimeout(r, 0));
  }
  flagSectionsAndParents(allEntries);

  const collapseMap   = buildCollapseMap(allEntries);
  const finalSections = buildFinalSections(allEntries);
  const failuresIndex = buildFailuresIndex(allEntries);
  const subEntries = buildSubEntriesByTcIdx(allEntries);
  self.postMessage({
    type: 'meta',
    collapseMap,
    finalSections,
    failuresIndex,
    subEntriesByTcIdx: JSON.parse(JSON.stringify(subEntries)) 
  });

  const totalTime = performance.now() - startTime;
  self.postMessage({
    type: 'complete',
    totalProcessingTime: totalTime,
    linesPerSecond: lines.length / (totalTime / 1000),
    cacheHitRate: parseCache.size / totalChunks
  });
};