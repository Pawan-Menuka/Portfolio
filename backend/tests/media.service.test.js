import { after, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import cloudinary from '../src/config/cloudinary.js';
import * as mediaService from '../src/services/media.service.js';

// media.service.upload picks Cloudinary's resource_type from the file's
// mimetype. It must be a positive allowlist (B5): before this fix, anything
// not explicitly recognized as a 3D-model type fell through to the image
// branch and got transcoded to webp — which would silently corrupt a PDF if
// one were ever routed through this function.
describe('mediaService.upload uses a positive mimetype allowlist', () => {
  let capturedOptions;
  const originalUploadStream = cloudinary.uploader.upload_stream;

  beforeEach(() => {
    capturedOptions = null;
    cloudinary.uploader.upload_stream = (options, callback) => {
      capturedOptions = options;
      return { end: () => callback(null, { secure_url: 'https://example.com/x', public_id: 'x' }) };
    };
  });

  after(() => {
    cloudinary.uploader.upload_stream = originalUploadStream;
  });

  test('rejects an unrecognized mimetype without ever calling Cloudinary', async () => {
    await assert.rejects(
      () => mediaService.upload(Buffer.from('data'), 'application/pdf', 'portfolio/general'),
      /Unsupported media type/
    );
    assert.equal(capturedOptions, null);
  });

  test('routes a known image mimetype to resource_type "image" with a webp transform', async () => {
    await mediaService.upload(Buffer.from('data'), 'image/png', 'portfolio/general');
    assert.equal(capturedOptions.resource_type, 'image');
    assert.equal(capturedOptions.format, 'webp');
  });

  test('routes model/gltf-binary to resource_type "raw" with no transform', async () => {
    await mediaService.upload(Buffer.from('data'), 'model/gltf-binary', 'portfolio/models');
    assert.equal(capturedOptions.resource_type, 'raw');
    assert.equal(capturedOptions.format, undefined);
  });
});

describe('mediaService.uploadRaw always uploads untransformed, regardless of mimetype', () => {
  let capturedOptions;
  const originalUploadStream = cloudinary.uploader.upload_stream;

  beforeEach(() => {
    capturedOptions = null;
    cloudinary.uploader.upload_stream = (options, callback) => {
      capturedOptions = options;
      return { end: () => callback(null, { secure_url: 'https://example.com/x', public_id: 'x' }) };
    };
  });

  after(() => {
    cloudinary.uploader.upload_stream = originalUploadStream;
  });

  test('uploads with resource_type "raw" and no format transform', async () => {
    await mediaService.uploadRaw(Buffer.from('%PDF-...'), 'portfolio/resume');
    assert.equal(capturedOptions.resource_type, 'raw');
    assert.equal(capturedOptions.format, undefined);
    assert.equal(capturedOptions.folder, 'portfolio/resume');
  });
});
