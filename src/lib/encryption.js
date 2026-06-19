import crypto from "crypto";

// Derived key from the NEXTAUTH_SECRET environment variable
const getEncryptionKey = () => {
  const secret = process.env.NEXTAUTH_SECRET || "MedERP_DevSamp_Default_Secret_Key_Secure_123!";
  return crypto.createHash("sha256").update(secret).digest();
};

const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a text string using AES-256-CBC
 * @param {string} text Plain text content
 * @returns {string} Encrypted format: 'iv_in_hex:encrypted_text_in_hex'
 */
export function encrypt(text) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to secure backup data.");
  }
}

/**
 * Decrypts an encrypted hex string using AES-256-CBC
 * @param {string} text Encrypted format: 'iv_in_hex:encrypted_text_in_hex'
 * @returns {string} Decrypted plain text content
 */
export function decrypt(text) {
  try {
    // If it is not in the encrypted format (no colon), treat it as plain text for legacy fallback
    if (!text || !text.includes(":")) {
      return text;
    }

    const [ivHex, encryptedHex] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt secure backup. The decryption key may be invalid.");
  }
}
