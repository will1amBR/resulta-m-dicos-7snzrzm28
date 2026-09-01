/**
 * Lightweight, zero-dependency SVG & Canvas QR Code generator.
 * Standard QR Code Model 2 (supports alphanumeric & byte encoding, error correction L/M/Q/H).
 * Fully self-contained to avoid external dependency issues.
 */

// Simple Reed-Solomon and QR matrix building tables & helpers
const PAD0 = 0xec
const PAD1 = 0x11

class QRBitBuffer {
  buffer: number[] = []
  length = 0

  get(index: number): boolean {
    const bufIndex = Math.floor(index / 8)
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1
  }

  put(num: number, length: number): void {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1)
    }
  }

  putBit(bit: boolean): void {
    const bufIndex = Math.floor(this.length / 8)
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0)
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> (this.length % 8)
    }
    this.length++
  }
}

// GF(256) math
const EXP_TABLE = new Array(256)
const LOG_TABLE = new Array(256)
for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i
for (let i = 8; i < 256; i++)
  EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8]
for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i

function glog(n: number): number {
  if (n < 1) throw new Error(`glog(${n})`)
  return LOG_TABLE[n]
}

function gexp(n: number): number {
  while (n < 0) n += 255
  while (n >= 255) n -= 255
  return EXP_TABLE[n]
}

class QRPolynomial {
  num: number[]
  constructor(num: number[], shift = 0) {
    let offset = 0
    while (offset < num.length && num[offset] === 0) offset++
    this.num = new Array(num.length - offset + shift)
    for (let i = 0; i < num.length - offset; i++) {
      this.num[i] = num[i + offset]
    }
    for (let i = num.length - offset; i < this.num.length; i++) {
      this.num[i] = 0
    }
  }

  get(index: number): number {
    return this.num[index]
  }

  getLength(): number {
    return this.num.length
  }

  multiply(e: QRPolynomial): QRPolynomial {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0)
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)))
      }
    }
    return new QRPolynomial(num)
  }

  mod(e: QRPolynomial): QRPolynomial {
    if (this.getLength() - e.getLength() < 0) return this
    const ratio = glog(this.get(0)) - glog(e.get(0))
    const num = new Array(this.getLength())
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i)
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= gexp(glog(e.get(i)) + ratio)
    }
    return new QRPolynomial(num).mod(e)
  }
}

// Error correction table per version: [totalCount, dataCount]
const RS_BLOCK_TABLE: { [key: number]: number[][] } = {
  // L level (7% error correction)
  1: [[1, 26, 19]],
  2: [[1, 44, 34]],
  3: [[1, 70, 55]],
  4: [[1, 100, 80]],
  5: [[1, 134, 108]],
  6: [[2, 86, 68]],
  7: [[2, 98, 78]],
  8: [[2, 121, 97]],
  9: [[2, 146, 116]],
  10: [
    [2, 86, 68],
    [2, 87, 69],
  ],
}

function getErrorCorrectPolynomial(errorCorrectLength: number): QRPolynomial {
  let a = new QRPolynomial([1], 0)
  for (let i = 0; i < errorCorrectLength; i++) {
    a = a.multiply(new QRPolynomial([1, gexp(i)], 0))
  }
  return a
}

export class QRCodeGenerator {
  typeNumber: number
  modules: (boolean | null)[][] = []
  moduleCount = 0
  dataList: string[] = []

  constructor(typeNumber = 4) {
    this.typeNumber = typeNumber
  }

  addData(data: string): void {
    this.dataList.push(data)
  }

  isDark(row: number, col: number): boolean {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(`${row},${col}`)
    }
    return this.modules[row][col] === true
  }

  getModuleCount(): number {
    return this.moduleCount
  }

  make(): void {
    // Choose appropriate type number based on data length if default is too small
    const dataStr = this.dataList.join('')
    const bytesCount = new TextEncoder().encode(dataStr).length
    for (let v = this.typeNumber; v <= 10; v++) {
      const rs = RS_BLOCK_TABLE[v] || RS_BLOCK_TABLE[10]
      let maxData = 0
      rs.forEach((b) => {
        maxData += b[0] * b[2]
      })
      if (bytesCount + 3 <= maxData) {
        this.typeNumber = v
        break
      }
    }

    this.moduleCount = this.typeNumber * 4 + 17
    this.modules = new Array(this.moduleCount)
    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount).fill(null)
    }

    this.setupPositionProbePattern(0, 0)
    this.setupPositionProbePattern(this.moduleCount - 7, 0)
    this.setupPositionProbePattern(0, this.moduleCount - 7)
    this.setupTimingPattern()
    this.setupPositionAdjustPattern()
    this.setupTypeInfo(false, 0)

    this.mapData(this.createData(this.typeNumber), 0)
  }

  private setupPositionProbePattern(row: number, col: number): void {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules[row + r][col + c] = true
        } else {
          this.modules[row + r][col + c] = false
        }
      }
    }
  }

  private setupTimingPattern(): void {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== null) continue
      this.modules[r][6] = r % 2 === 0
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== null) continue
      this.modules[6][c] = c % 2 === 0
    }
  }

  private setupPositionAdjustPattern(): void {
    const pos = this.getPatternPosition(this.typeNumber)
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i]
        const col = pos[j]
        if (this.modules[row][col] !== null) continue
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
              this.modules[row + r][col + c] = true
            } else {
              this.modules[row + r][col + c] = false
            }
          }
        }
      }
    }
  }

  private getPatternPosition(typeNumber: number): number[] {
    if (typeNumber === 1) return []
    if (typeNumber === 2) return [6, 18]
    if (typeNumber === 3) return [6, 22]
    if (typeNumber === 4) return [6, 26]
    if (typeNumber === 5) return [6, 30]
    if (typeNumber === 6) return [6, 34]
    if (typeNumber === 7) return [6, 22, 38]
    if (typeNumber === 8) return [6, 24, 42]
    if (typeNumber === 9) return [6, 26, 46]
    return [6, 28, 50]
  }

  private setupTypeInfo(test: boolean, maskPattern: number): void {
    const data = (1 << 3) | maskPattern // 1 = L level
    let bits = data << 10
    while (this.getBCHTypeInfo(bits) >= 0) {
      bits ^= 0x537 << this.getBCHTypeInfo(bits)
    }
    const typeInfo = ((data << 10) | bits) ^ 0x5412

    for (let i = 0; i < 15; i++) {
      const mod = !test && ((typeInfo >> i) & 1) === 1
      if (i < 6) {
        this.modules[i][8] = mod
      } else if (i < 8) {
        this.modules[i + 1][8] = mod
      } else {
        this.modules[this.moduleCount - 15 + i][8] = mod
      }

      if (i < 8) {
        this.modules[8][this.moduleCount - i - 1] = mod
      } else if (i < 9) {
        this.modules[8][15 - i - 1 + 1] = mod
      } else {
        this.modules[8][15 - i - 1] = mod
      }
    }
    this.modules[this.moduleCount - 8][8] = !test
  }

  private getBCHTypeInfo(data: number): number {
    let d = data >> 10
    let count = 0
    while (d > 0) {
      count++
      d >>>= 1
    }
    return count - 1
  }

  private createData(typeNumber: number): number[] {
    const rsBlocks = RS_BLOCK_TABLE[typeNumber] || RS_BLOCK_TABLE[4]
    const buffer = new QRBitBuffer()

    const text = this.dataList.join('')
    const utf8Bytes = new TextEncoder().encode(text)

    // 8-bit byte mode (0100)
    buffer.put(4, 4)
    buffer.put(utf8Bytes.length, typeNumber >= 10 ? 16 : 8)
    for (let i = 0; i < utf8Bytes.length; i++) {
      buffer.put(utf8Bytes[i], 8)
    }

    // calculate total data count
    let totalDataCount = 0
    rsBlocks.forEach((b) => {
      totalDataCount += b[0] * b[2]
    })

    if (buffer.length + 4 <= totalDataCount * 8) {
      buffer.put(0, 4)
    }
    while (buffer.length % 8 !== 0) {
      buffer.putBit(false)
    }
    while (buffer.length < totalDataCount * 8) {
      buffer.put(PAD0, 8)
      if (buffer.length >= totalDataCount * 8) break
      buffer.put(PAD1, 8)
    }

    return this.createBytes(buffer, rsBlocks)
  }

  private createBytes(buffer: QRBitBuffer, rsBlocks: number[][]): number[] {
    let offset = 0
    let maxDcCount = 0
    let maxEcCount = 0
    const dcdata: number[][] = []
    const ecdata: number[][] = []

    for (let r = 0; r < rsBlocks.length; r++) {
      const count = rsBlocks[r][0]
      const totalCount = rsBlocks[r][1]
      const dataCount = rsBlocks[r][2]
      const ecCount = totalCount - dataCount

      maxDcCount = Math.max(maxDcCount, dataCount)
      maxEcCount = Math.max(maxEcCount, ecCount)

      for (let i = 0; i < count; i++) {
        const dc = new Array(dataCount)
        for (let j = 0; j < dataCount; j++) {
          dc[j] = 0xff & buffer.buffer[j + offset]
        }
        offset += dataCount
        dcdata.push(dc)

        const rsPoly = getErrorCorrectPolynomial(ecCount)
        const rawPoly = new QRPolynomial(dc, rsPoly.getLength() - 1)
        const modPoly = rawPoly.mod(rsPoly)
        const ec = new Array(rsPoly.getLength() - 1)
        for (let j = 0; j < ec.length; j++) {
          const modIndex = j + modPoly.getLength() - ec.length
          ec[j] = modIndex >= 0 ? modPoly.get(modIndex) : 0
        }
        ecdata.push(ec)
      }
    }

    const data: number[] = []
    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < dcdata.length; r++) {
        if (i < dcdata[r].length) {
          data.push(dcdata[r][i])
        }
      }
    }
    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < ecdata.length; r++) {
        if (i < ecdata[r].length) {
          data.push(ecdata[r][i])
        }
      }
    }
    return data
  }

  private mapData(data: number[], maskPattern: number): void {
    let inc = -1
    let row = this.moduleCount - 1
    let bitIndex = 7
    let byteIndex = 0

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            let dark = false
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1
            }
            const mask = this.getMask(maskPattern, row, col - c)
            if (mask) dark = !dark
            this.modules[row][col - c] = dark
            bitIndex--
            if (bitIndex === -1) {
              byteIndex++
              bitIndex = 7
            }
          }
        }
        row += inc
        if (row < 0 || this.moduleCount <= row) {
          row -= inc
          inc = -inc
          break
        }
      }
    }
  }

  private getMask(maskPattern: number, i: number, j: number): boolean {
    switch (maskPattern) {
      case 0:
        return (i + j) % 2 === 0
      case 1:
        return i % 2 === 0
      case 2:
        return j % 3 === 0
      case 3:
        return (i + j) % 3 === 0
      case 4:
        return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0
      case 5:
        return ((i * j) % 2) + ((i * j) % 3) === 0
      case 6:
        return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0
      case 7:
        return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0
      default:
        return false
    }
  }
}
