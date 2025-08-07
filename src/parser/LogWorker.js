/*import { LogParser } from 'C:\\Users\\RACEM\\Desktop\\log-parser-app\\src\\parser\\LogParser.js'; 

self.onmessage = async (e) => {
    const rawText = e.data;
    if (typeof rawText !== 'string') {
    self.postMessage({
      success: false,
      error: 'Le worker attend une chaîne de caractères, reçu: ' + typeof rawText,
    });
    return;
  }
  try{
    const logParser = new LogParser();
    const parsed = await logParser.parse(rawText);
    self.postMessage({ success: true, data: parsed });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};*/
import { LogParser } from './LogParser.js';

const parser = new LogParser();
const encoder = new TextEncoder();

// Configuration adaptative des buffers
const INITIAL_BUFFER_SIZE = 2 * 1024 * 1024; // 2MB au lieu de 1MB
const MAX_BUFFER_SIZE = 16 * 1024 * 1024; // 16MB max
const GROWTH_FACTOR = 1.5;

// Pool de buffers réutilisables
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

// Cache pour éviter les re-calculs
const parseCache = new Map();
const MAX_CACHE_SIZE = 1000;

function getCachedParse(key, data) {
  if (parseCache.has(key)) {
    return parseCache.get(key);
  }
  
  const result = parser.parse(data);
  
  // Limiter la taille du cache
  if (parseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = parseCache.keys().next().value;
    parseCache.delete(firstKey);
  }
  
  parseCache.set(key, result);
  return result;
}

// Optimisation du chunking adaptatif
function calculateOptimalChunkSize(totalLines, estimatedLineSize) {
  const targetChunkMemory = 512 * 1024; // 512KB par chunk
  const estimatedChunkSize = Math.max(
    100, // minimum
    Math.min(
      5000, // maximum
      Math.floor(targetChunkMemory / estimatedLineSize)
    )
  );
  return estimatedChunkSize;
}

// Fonction de hachage rapide pour le cache
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

self.onmessage = async (e) => {
  const { type, data } = e.data;

  if (type === 'process') {
    const startTime = performance.now();
    const lines = data.split('\n');
    
    // Estimation adaptative de la taille
    const sampleLines = lines.slice(0, Math.min(100, lines.length));
    const avgLineSize = sampleLines.reduce((sum, line) => sum + line.length, 0) / sampleLines.length;
    const chunkSize = calculateOptimalChunkSize(lines.length, avgLineSize);
    
    const totalChunks = Math.ceil(lines.length / chunkSize);

    self.postMessage({
      type: 'progress',
      phase: 'start',
      totalLines: lines.length,
      processed: 0,
      estimatedChunkSize: chunkSize
    });

    // Traitement par batch avec optimisations
    
    let processedLines = 0;

    for (let i = 0; i < totalChunks; i++) {
      const chunkStart = i * chunkSize;
      const chunkEnd = Math.min((i + 1) * chunkSize, lines.length);
      const chunkLines = lines.slice(chunkStart, chunkEnd);
      const chunkData = chunkLines.join('\n');
      
      // Utiliser le cache si possible
      const cacheKey = simpleHash(chunkData);
      const parsed = await getCachedParse(cacheKey, chunkData);

      // Sérialisation optimisée
      const json = JSON.stringify(parsed);
      const encoded = encoder.encode(json);

      // Gestion intelligente des buffers
      const buffer = bufferPool.ensureCapacity(encoded.byteLength);
      buffer.set(encoded, 0);

      const bufferToSend = buffer.slice(0, encoded.byteLength);

      // Envoi avec transfert de propriété
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

      // Rapport de progression moins fréquent
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

      // Yield moins fréquent pour améliorer les performances
      if (i % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    const totalTime = performance.now() - startTime;
    
    self.postMessage({ 
      type: 'complete',
      totalProcessingTime: totalTime,
      linesPerSecond: lines.length / (totalTime / 1000),
      cacheHitRate: parseCache.size / totalChunks
    });
  } else if (type === 'clearCache') {
    // Permettre de nettoyer le cache depuis Vue.js
    parseCache.clear();
    self.postMessage({ type: 'cacheCleared' });
  }
};