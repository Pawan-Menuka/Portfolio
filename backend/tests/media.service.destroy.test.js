import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import cloudinary from '../src/config/cloudinary.js';
import * as mediaService from '../src/services/media.service.js';

// B3: Cloudinary's destroy() resolves (does not throw) with
// { result: 'not found' } when the asset isn't found under the given
// resource_type — so the old try/catch's catch block never ran, and raw
// assets (3D models, etc.) were never actually deleted by the fallback.
describe('mediaService.destroy retries as raw when the image attempt does not actually delete anything', () => {
  const originalDestroy = cloudinary.uploader.destroy;
  after(() => {
    cloudinary.uploader.destroy = originalDestroy;
  });

  test('retries with resource_type raw when the image destroy resolves "not found"', async () => {
    const calls = [];
    cloudinary.uploader.destroy = async (publicId, options) => {
      calls.push(options.resource_type);
      if (options.resource_type === 'image') return { result: 'not found' };
      return { result: 'ok' };
    };

    await mediaService.destroy('portfolio/models/some-glb-asset');

    assert.deepEqual(calls, ['image', 'raw']);
  });

  test('does not retry when the image destroy actually succeeds', async () => {
    const calls = [];
    cloudinary.uploader.destroy = async (publicId, options) => {
      calls.push(options.resource_type);
      return { result: 'ok' };
    };

    await mediaService.destroy('portfolio/general/some-image');

    assert.deepEqual(calls, ['image']);
  });

  test('retries as raw when the image destroy throws', async () => {
    const calls = [];
    cloudinary.uploader.destroy = async (publicId, options) => {
      calls.push(options.resource_type);
      if (options.resource_type === 'image') throw new Error('network error');
      return { result: 'ok' };
    };

    await mediaService.destroy('portfolio/models/some-glb-asset');

    assert.deepEqual(calls, ['image', 'raw']);
  });
});
