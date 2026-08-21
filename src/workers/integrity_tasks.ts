/**
 * 🔒 Dedicated Integrity Tasks for Worker Threads
 * 
 * Standalone, thread-safe hash computation and Merkle tree verification tasks.
 */

import fs from 'fs';
import crypto from 'crypto';

export interface MerkleVerificationResult {
  matches: boolean;
  merkleRoot: string;
  elapsedMs: number;
}

export function computeFileSha256Task(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath, { highWaterMark: 4 * 1024 * 1024 });

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

export function verifyMerkleRootTask(filePath: string, expectedRoot?: string): MerkleVerificationResult {
  const startTime = performance.now();
  const chunkSize = 4 * 1024 * 1024;
  const chunkHashes: string[] = [];
  const stat = fs.statSync(filePath);
  const totalChunks = Math.ceil((stat.size || 1) / chunkSize);
  const buffer = Buffer.alloc(chunkSize);
  const fd = fs.openSync(filePath, 'r');

  try {
    for (let i = 0; i < totalChunks; i++) {
      const bytesRead = fs.readSync(fd, buffer, 0, chunkSize, i * chunkSize);
      const chunkData = bytesRead === chunkSize ? buffer : buffer.subarray(0, bytesRead);
      const chunkHash = crypto.createHash('sha256').update(chunkData).digest('hex');
      chunkHashes.push(chunkHash);
    }
  } finally {
    fs.closeSync(fd);
  }

  let currentLevel = chunkHashes;
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const combined = crypto.createHash('sha256').update(currentLevel[i] + currentLevel[i + 1]).digest('hex');
        nextLevel.push(combined);
      } else {
        nextLevel.push(currentLevel[i]);
      }
    }
    currentLevel = nextLevel;
  }

  const calculatedMerkleRoot = currentLevel[0] || '';
  const elapsedMs = Math.round(performance.now() - startTime);

  return {
    matches: expectedRoot ? calculatedMerkleRoot.toLowerCase() === expectedRoot.toLowerCase() : true,
    merkleRoot: calculatedMerkleRoot,
    elapsedMs
  };
}
