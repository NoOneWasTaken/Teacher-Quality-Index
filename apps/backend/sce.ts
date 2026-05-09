import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import forge from 'node-forge';

type VerificationStatus = 'SUCCESS' | 'TAMPERED' | 'ERROR';

type VerificationResult = {
  status: VerificationStatus;
  confidence: number;
  reason: string;
  checks: string[];
  issuer: string;
  digestAlgorithm: string;
  signedDataSha256: string;
  fullFileSha256: string;
};

type ParsedByteRange = {
  values: [number, number, number, number];
  signedData: Buffer;
  contentsRegion: Buffer;
};

type ForgeSignedDataWithVerify = forge.pkcs7.Captured<forge.pkcs7.PkcsSignedData> & {
  verify: (options?: { content?: forge.util.ByteBuffer | string }) => boolean;
};

const DIGEST_OID_TO_NAME: Record<string, string> = {
  [forge.pki.oids.sha1]: 'sha1',
  [forge.pki.oids.sha256]: 'sha256',
  [forge.pki.oids.sha384]: 'sha384',
  [forge.pki.oids.sha512]: 'sha512',
  [forge.pki.oids.md5]: 'md5'
};

function parseByteRange(pdfBuffer: Buffer): ParsedByteRange {
  const pdfText = pdfBuffer.toString('latin1');
  const byteRangeMatch = pdfText.match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*]/);
  if (!byteRangeMatch) {
    throw new Error('No /ByteRange found. PDF may be unsigned.');
  }

  const values: [number, number, number, number] = [
    Number(byteRangeMatch[1]),
    Number(byteRangeMatch[2]),
    Number(byteRangeMatch[3]),
    Number(byteRangeMatch[4])
  ];

  const [start1, len1, start2, len2] = values;
  if (
    Number.isNaN(start1) ||
    Number.isNaN(len1) ||
    Number.isNaN(start2) ||
    Number.isNaN(len2) ||
    start1 < 0 ||
    len1 < 0 ||
    start2 < 0 ||
    len2 < 0
  ) {
    throw new Error('Invalid /ByteRange values.');
  }

  if (start1 + len1 > start2) {
    throw new Error('Invalid /ByteRange: signed blocks overlap.');
  }

  if (start2 + len2 > pdfBuffer.length) {
    throw new Error('Invalid /ByteRange: out of file bounds.');
  }

  const part1 = pdfBuffer.subarray(start1, start1 + len1);
  const part2 = pdfBuffer.subarray(start2, start2 + len2);
  const signedData = Buffer.concat([part1, part2]);
  const contentsRegion = pdfBuffer.subarray(start1 + len1, start2);

  return { values, signedData, contentsRegion };
}

function extractSignatureDer(contentsRegion: Buffer): Buffer {
  const regionText = contentsRegion.toString('latin1');
  const markerIndex = regionText.indexOf('/Contents');

  const searchStart = markerIndex >= 0 ? markerIndex : 0;
  const hexStart = regionText.indexOf('<', searchStart);
  const hexEnd = regionText.indexOf('>', hexStart + 1);
  if (hexStart < 0 || hexEnd < 0 || hexEnd <= hexStart + 1) {
    throw new Error('No signature hex blob found in /ByteRange gap.');
  }

  let hex = regionText
    .slice(hexStart + 1, hexEnd)
    .replace(/[^0-9A-Fa-f]/g, '');
  if (hex.length < 2 || hex.length % 2 !== 0) {
    throw new Error('Malformed PKCS#7 signature hex.');
  }

  // Handle DER structure to trim padding zeros
  // DER SEQUENCE: tag=30, then length encoding
  if (hex.slice(0, 2) === '30') {
    const lengthType = hex.slice(2, 4);
    let derContentLength: number;

    if (lengthType === '81') {
      // Single byte length follows
      derContentLength = parseInt(hex.slice(4, 6), 16);
      const totalLength = 4 + derContentLength * 2;
      hex = hex.slice(0, totalLength);
    } else if (lengthType === '82') {
      // Two byte length follows
      derContentLength = parseInt(hex.slice(4, 8), 16);
      const totalLength = 8 + derContentLength * 2;
      hex = hex.slice(0, totalLength);
    } else if (lengthType === '83') {
      // Three byte length follows
      derContentLength = parseInt(hex.slice(4, 10), 16);
      const totalLength = 10 + derContentLength * 2;
      hex = hex.slice(0, totalLength);
    }
    // else: single-byte length encoded directly in lengthType
  }

  return Buffer.from(hex, 'hex');
}

function getDigestAlgorithmName(message: ForgeSignedDataWithVerify): string {
  const digestAlgorithmDer = message.rawCapture?.digestAlgorithm as string | undefined;
  if (!digestAlgorithmDer) return 'unknown';

  const oid = forge.asn1.derToOid(digestAlgorithmDer);
  return DIGEST_OID_TO_NAME[oid] ?? oid;
}

function extractMessageDigestAttributeHex(message: ForgeSignedDataWithVerify): string | null {
  const attributes = message.rawCapture?.authenticatedAttributes as forge.asn1.Asn1[] | undefined;
  if (!attributes || attributes.length === 0) {
    return null;
  }

  for (const attribute of attributes) {
    if (!Array.isArray(attribute.value) || attribute.value.length < 2) continue;

    const oidNode = attribute.value[0];
    const valueSet = attribute.value[1];
    if (typeof oidNode.value !== 'string' || !Array.isArray(valueSet.value) || valueSet.value.length === 0) {
      continue;
    }

    const oid = forge.asn1.derToOid(oidNode.value);
    if (oid !== forge.pki.oids.messageDigest) continue;

    const digestNode = valueSet.value[0];
    if (digestNode.type !== forge.asn1.Type.OCTETSTRING || typeof digestNode.value !== 'string') {
      return null;
    }

    return forge.util.bytesToHex(digestNode.value).toLowerCase();
  }

  return null;
}

function verifyCmsSignature(message: ForgeSignedDataWithVerify): boolean {
  const signerCert = message.certificates?.[0];
  if (!signerCert || !message.rawCapture) {
    return false;
  }
  v
  const digestAlgorithmDer = message.rawCapture.digestAlgorithm as string | undefined;
  const signature = message.rawCapture.signature as string | undefined;
  const authenticatedAttributes = message.rawCapture.authenticatedAttributes as forge.asn1.Asn1[] | undefined;
  if (!digestAlgorithmDer || !signature || !authenticatedAttributes || authenticatedAttributes.length === 0) {
    return false;
  }

  const digestOid = forge.asn1.derToOid(digestAlgorithmDer);
  const digestName = forge.pki.oids[digestOid];
  const digestFactory = (forge.md as unknown as Record<string, { create: () => forge.md.MessageDigest }>)[digestName];
  if (!digestFactory) {
    return false;
  }

  const attrsSet = forge.asn1.create(
    forge.asn1.Class.UNIVERSAL,
    forge.asn1.Type.SET,
    true,
    authenticatedAttributes
  );
  const md = digestFactory.create();
  md.update(forge.asn1.toDer(attrsSet).getBytes());

  const rsaPublicKey = signerCert.publicKey as forge.pki.rsa.PublicKey;
  return rsaPublicKey.verify(md.digest().getBytes(), signature, 'RSASSA-PKCS1-V1_5');
}

function calculateConfidence(parts: {
  byteRangeOk: boolean;
  signatureOk: boolean;
  certPresent: boolean;
  certTimeValid: boolean;
  strongDigest: boolean;
  likelyGovIssuer: boolean;
}): number {
  let score = 0;
  if (parts.byteRangeOk) score += 25;
  if (parts.signatureOk) score += 45;
  if (parts.certPresent) score += 10;
  if (parts.certTimeValid) score += 10;
  if (parts.strongDigest) score += 5;
  if (parts.likelyGovIssuer) score += 5;
  return Math.min(score, 100);
}

function extractSigningTimeAttribute(message: ForgeSignedDataWithVerify): Date | null {
  const attributes = message.rawCapture?.authenticatedAttributes as forge.asn1.Asn1[] | undefined;
  if (!attributes || attributes.length === 0) {
    return null;
  }

  for (const attribute of attributes) {
    if (!Array.isArray(attribute.value) || attribute.value.length < 2) continue;

    const oidNode = attribute.value[0];
    const valueSet = attribute.value[1];
    if (typeof oidNode.value !== 'string' || !Array.isArray(valueSet.value) || valueSet.value.length === 0) {
      continue;
    }

    const oid = forge.asn1.derToOid(oidNode.value);
    if (oid !== forge.pki.oids.signingTime) continue;

    const dateNode = valueSet.value[0];
    try {
      if (dateNode.type === forge.asn1.Type.UTCTIME) {
        return forge.asn1.utcTimeToDate(dateNode.value as string);
      } else if (dateNode.type === forge.asn1.Type.GENERALIZEDTIME) {
        return forge.asn1.generalizedTimeToDate(dateNode.value as string);
      }
    } catch {
      return null;
    }
  }

  return null;
}

async function verifyDigilockerPdf(filePath: string): Promise<VerificationResult> {
  const pdfBuffer = fs.readFileSync(filePath);
  const fullFileSha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

  try {
    const { values, signedData, contentsRegion } = parseByteRange(pdfBuffer);
    const signatureDer = extractSignatureDer(contentsRegion);
    const signedDataSha256 = crypto.createHash('sha256').update(signedData).digest('hex');

    const p7Asn1 = forge.asn1.fromDer(forge.util.createBuffer(signatureDer.toString('binary')));
    const message = forge.pkcs7.messageFromAsn1(p7Asn1) as ForgeSignedDataWithVerify;

    const signerCert = message.certificates?.[0];
    const issuerO = signerCert?.issuer.getField('O')?.value || '';
    const issuerCN = signerCert?.issuer.getField('CN')?.value || '';
    const issuerFull = `${issuerO} ${issuerCN}`.trim();
    const issuer = issuerFull || 'Unknown';

    const signingTime = extractSigningTimeAttribute(message);
    let certTimeValid = false;
    let signingTimeCheck = 'signing_time_missing';
    if (signingTime && signerCert) {
      certTimeValid = signerCert.validity.notBefore <= signingTime && signerCert.validity.notAfter >= signingTime;
      signingTimeCheck = `certificate valid at signing time (${signingTime.toISOString()}): ${certTimeValid}`;
    }

    const digestAlgorithm = getDigestAlgorithmName(message);
    const strongDigest = ['sha256', 'sha384', 'sha512'].includes(digestAlgorithm.toLowerCase());
    const likelyGovIssuer = /national informatics centre|\bnic\b/i.test(issuerFull);
    const messageDigestFromCms = extractMessageDigestAttributeHex(message);
    const signedContentDigestMatches = messageDigestFromCms === signedDataSha256;
    const signatureOk = verifyCmsSignature(message);

    const checks: string[] = [
      `ByteRange parsed: [${values.join(', ')}]`,
      `Signed data SHA-256: ${signedDataSha256}`,
      `Full file SHA-256: ${fullFileSha256}`,
      `Digest algorithm: ${digestAlgorithm}`,
      `CMS messageDigest attribute: ${messageDigestFromCms ?? 'missing'}`,
      `Signed content digest matches CMS attribute: ${signedContentDigestMatches}`,
      `Certificate present: ${Boolean(signerCert)}`,
      `${signingTimeCheck}`,
      `Issuer organization: ${issuer}`,
      `Cryptographic signature valid over signer attributes: ${signatureOk}`
    ];

    const confidence = calculateConfidence({
      byteRangeOk: true,
      signatureOk,
      certPresent: Boolean(signerCert),
      certTimeValid,
      strongDigest,
      likelyGovIssuer
    });

    return {
      status: signatureOk ? 'SUCCESS' : 'TAMPERED',
      confidence,
      reason: signatureOk
        ? 'PDF signature is cryptographically valid for the signed byte ranges.'
        : 'Signature check failed, or signed byte ranges were modified after signing.',
      checks,
      issuer,
      digestAlgorithm,
      signedDataSha256,
      fullFileSha256
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'ERROR',
      confidence: 0,
      reason: `Verification failed: ${message}`,
      checks: [`Full file SHA-256: ${fullFileSha256}`],
      issuer: 'Unknown',
      digestAlgorithm: 'unknown',
      signedDataSha256: '',
      fullFileSha256
    };
  }
}

const cliArg = process.argv.slice(2).find((arg) => arg !== '--');
const inputPath = cliArg ?? path.resolve('download.pdf');

verifyDigilockerPdf(inputPath)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
