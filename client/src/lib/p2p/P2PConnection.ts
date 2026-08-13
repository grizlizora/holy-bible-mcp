"use client";

import { CryptoEngine } from './CryptoEngine';

export class P2PConnection {
  private peerConnection: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  private crypto: CryptoEngine;

  constructor() {
    this.crypto = new CryptoEngine();
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
  }

  async initEncryption() {
    await this.crypto.generateKey();
  }

  async getPublicKey() {
    return await this.crypto.exportKey();
  }

  async setPeerPublicKey(key: string) {
    // In a real scenario, Diffie-Hellman would be used to establish a shared secret.
    // For simplicity of this demo, we'll just import the shared AES key.
    await this.crypto.importKey(key);
  }

  createOffer() {
    this.dataChannel = this.peerConnection.createDataChannel('liquid-ai-p2p');
    this.setupDataChannel(this.dataChannel);

    return new Promise<RTCSessionDescriptionInit>((resolve) => {
      this.peerConnection.onicecandidate = (event) => {
        if (!event.candidate) {
          resolve(this.peerConnection.localDescription!);
        }
      };
      this.peerConnection.createOffer().then(offer => {
        this.peerConnection.setLocalDescription(offer);
      });
    });
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async sendEncryptedMessage(text: string) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error("Data channel is not open");
    }
    const { ciphertext, iv } = await this.crypto.encrypt(text);
    this.dataChannel.send(JSON.stringify({ ciphertext, iv }));
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => console.log("P2P Data Channel Opened");
    channel.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const decrypted = await this.crypto.decrypt(data.ciphertext, data.iv);
        console.log("Decrypted P2P Message:", decrypted);
      } catch (err) {
        console.error("Failed to decrypt message:", err);
      }
    };
  }
}
