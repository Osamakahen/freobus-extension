import QRCode from 'qrcode'

export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch (error) {
    console.error('QR code generation failed:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function readQRCode(imageData: string): Promise<string> {
  try {
    // In a real implementation, this would use a QR code reader library
    // For now, we'll just return the data as is
    return imageData
  } catch (error) {
    console.error('QR code reading failed:', error)
    throw new Error('Failed to read QR code')
  }
}

export function validateQRData(data: string): boolean {
  try {
    const parsed = JSON.parse(data)
    return (
      typeof parsed === 'object' &&
      typeof parsed.deviceId === 'string' &&
      typeof parsed.publicKey === 'string' &&
      typeof parsed.timestamp === 'number'
    )
  } catch (error) {
    return false
  }
} 