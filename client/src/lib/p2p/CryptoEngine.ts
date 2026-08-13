// AES-256-GCM Encryption wrapper using Web Crypto API

export class CryptoEngine {
  private key: CryptoKey | null = null;

  async generateKey() {
    this.key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  async exportKey(): Promise<string> {
    if (!this.key) throw new Error("Key not generated");
    const exported = await window.crypto.subtle.exportKey("raw", this.key);
    const exportedKeyBuffer = new Uint8Array(exported);
    return btoa(String.fromCharCode(...exportedKeyBuffer));
  }

  async importKey(base64Key: string) {
    const binaryDerString = atob(base64Key);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }
    this.key = await window.crypto.subtle.importKey(
      "raw",
      binaryDer,
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );
  }

  async encrypt(text: string): Promise<{ ciphertext: string, iv: string }> {
    if (!this.key) throw new Error("Key not initialized");
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);
    
    const ciphertextBuf = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      this.key,
      encoded
    );

    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertextBuf))),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  async decrypt(ciphertextBase64: string, ivBase64: string): Promise<string> {
    if (!this.key) throw new Error("Key not initialized");
    const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(ciphertextBase64).split('').map(c => c.charCodeAt(0)));

    const decryptedBuf = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      this.key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuf);
  }
}
