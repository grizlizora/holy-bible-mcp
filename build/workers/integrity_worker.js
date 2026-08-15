import { parentPort } from 'worker_threads';
import fs from 'fs';
import crypto from 'crypto';
if (parentPort) {
    parentPort.on('message', async (task) => {
        const startTime = performance.now();
        try {
            if (task.type === 'CALCULATE_SHA256') {
                const hash = crypto.createHash('sha256');
                const stat = fs.statSync(task.filePath);
                const totalBytes = stat.size || 1;
                let bytesProcessed = 0;
                let lastReportedPercent = 0;
                const stream = fs.createReadStream(task.filePath, { highWaterMark: 4 * 1024 * 1024 });
                stream.on('data', (chunk) => {
                    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
                    hash.update(buf);
                    bytesProcessed += buf.length;
                    const percent = Math.floor((bytesProcessed / totalBytes) * 100);
                    if (percent >= lastReportedPercent + 5) {
                        lastReportedPercent = percent;
                        const elapsedSeconds = Math.max(0.001, (performance.now() - startTime) / 1000);
                        parentPort?.postMessage({
                            taskId: task.id,
                            type: 'PROGRESS',
                            bytesProcessed,
                            totalBytes,
                            percent,
                            mbPerSec: Math.round((bytesProcessed / (1024 * 1024)) / elapsedSeconds)
                        });
                    }
                });
                stream.on('end', () => {
                    const finalSha256 = hash.digest('hex');
                    parentPort?.postMessage({
                        taskId: task.id,
                        type: 'RESULT',
                        success: true,
                        sha256: finalSha256,
                        matches: task.expectedHash ? finalSha256.toLowerCase() === task.expectedHash.toLowerCase() : true,
                        elapsedMs: Math.round(performance.now() - startTime)
                    });
                });
                stream.on('error', (err) => {
                    parentPort?.postMessage({
                        taskId: task.id,
                        type: 'RESULT',
                        success: false,
                        error: err.message,
                        elapsedMs: Math.round(performance.now() - startTime)
                    });
                });
            }
            if (task.type === 'VERIFY_MERKLE') {
                const chunkSize = task.chunkSizeBytes || (4 * 1024 * 1024);
                const chunkHashes = [];
                const stat = fs.statSync(task.filePath);
                const totalChunks = Math.ceil((stat.size || 1) / chunkSize);
                const buffer = Buffer.alloc(chunkSize);
                const fd = fs.openSync(task.filePath, 'r');
                try {
                    for (let i = 0; i < totalChunks; i++) {
                        const bytesRead = fs.readSync(fd, buffer, 0, chunkSize, i * chunkSize);
                        const chunkData = bytesRead === chunkSize ? buffer : buffer.subarray(0, bytesRead);
                        const chunkHash = crypto.createHash('sha256').update(chunkData).digest('hex');
                        chunkHashes.push(chunkHash);
                    }
                }
                finally {
                    fs.closeSync(fd);
                }
                let currentLevel = chunkHashes;
                while (currentLevel.length > 1) {
                    const nextLevel = [];
                    for (let i = 0; i < currentLevel.length; i += 2) {
                        if (i + 1 < currentLevel.length) {
                            const combined = crypto.createHash('sha256').update(currentLevel[i] + currentLevel[i + 1]).digest('hex');
                            nextLevel.push(combined);
                        }
                        else {
                            nextLevel.push(currentLevel[i]);
                        }
                    }
                    currentLevel = nextLevel;
                }
                const calculatedMerkleRoot = currentLevel[0] || '';
                parentPort?.postMessage({
                    taskId: task.id,
                    type: 'RESULT',
                    success: true,
                    merkleRoot: calculatedMerkleRoot,
                    matches: task.expectedHash ? calculatedMerkleRoot.toLowerCase() === task.expectedHash.toLowerCase() : true,
                    elapsedMs: Math.round(performance.now() - startTime)
                });
            }
        }
        catch (err) {
            parentPort?.postMessage({
                taskId: task.id,
                type: 'RESULT',
                success: false,
                error: err.message,
                elapsedMs: Math.round(performance.now() - startTime)
            });
        }
    });
}
