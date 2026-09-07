import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db.js';
import { adminHeaders, authCookieFor, createAdminUser, createNonAdminUser } from './helpers/auth.js';
import app from '../src/app.js';
import cloudinary from '../src/config/cloudinary.js';
import { Profile } from '../src/models/Profile.js';

before(connectTestDb);
after(closeTestDb);
beforeEach(clearTestDb);

const VALID_PDF = Buffer.from('%PDF-1.4\nFake but correctly-signed PDF content for tests.\n', 'latin1');
const FAKE_PDF = Buffer.from('this file claims to be a PDF but does not start with the signature', 'latin1');

let uploadCounter = 0;
let uploadCalls;
let destroyCalls;
const originalUploadStream = cloudinary.uploader.upload_stream;
const originalDestroy = cloudinary.uploader.destroy;

function stubCloudinarySuccess() {
  uploadCalls = [];
  destroyCalls = [];
  cloudinary.uploader.upload_stream = (options, callback) => {
    uploadCounter += 1;
    const publicId = `portfolio/resume/test-${uploadCounter}`;
    const url = `https://example.com/${publicId}.pdf`;
    uploadCalls.push({ options, publicId, url });
    return { end: () => callback(null, { secure_url: url, public_id: publicId }) };
  };
  cloudinary.uploader.destroy = async (publicId) => {
    destroyCalls.push(publicId);
    return { result: 'ok' };
  };
}

function restoreCloudinary() {
  cloudinary.uploader.upload_stream = originalUploadStream;
  cloudinary.uploader.destroy = originalDestroy;
}

describe('POST /profile/resume requires an authenticated admin', () => {
  beforeEach(stubCloudinarySuccess);
  after(restoreCloudinary);

  test('401 without a cookie', async () => {
    const res = await request(app)
      .post('/api/v1/profile/resume')
      .attach('file', VALID_PDF, { filename: 'resume.pdf', contentType: 'application/pdf' });
    assert.equal(res.status, 401);
  });

  test('403 for a non-admin user', async () => {
    const nonAdmin = await createNonAdminUser();
    const res = await request(app)
      .post('/api/v1/profile/resume')
      .set('Cookie', authCookieFor(nonAdmin._id))
      .attach('file', VALID_PDF, { filename: 'resume.pdf', contentType: 'application/pdf' });
    assert.equal(res.status, 403);
  });
});

describe('POST /profile/resume validates the upload before touching Cloudinary', () => {
  beforeEach(stubCloudinarySuccess);
  after(restoreCloudinary);

  test('rejects a non-PDF mimetype', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .post('/api/v1/profile/resume')
      .set(adminHeaders(admin._id))
      .attach('file', Buffer.from('plain text'), { filename: 'notes.txt', contentType: 'text/plain' });

    assert.equal(res.status, 400);
    assert.equal(uploadCalls.length, 0);
  });

  test('rejects a file whose bytes do not start with the PDF signature, even with the right mimetype', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .post('/api/v1/profile/resume')
      .set(adminHeaders(admin._id))
      .attach('file', FAKE_PDF, { filename: 'fake.pdf', contentType: 'application/pdf' });

    assert.equal(res.status, 400);
    assert.equal(uploadCalls.length, 0);
  });
});

describe('POST /profile/resume happy path', () => {
  beforeEach(stubCloudinarySuccess);
  after(restoreCloudinary);

  test('uploads as a raw asset and stores the reference on the profile', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .post('/api/v1/profile/resume')
      .set(adminHeaders(admin._id))
      .attach('file', VALID_PDF, { filename: 'pawan-resume.pdf', contentType: 'application/pdf' });

    assert.equal(res.status, 201);
    assert.equal(uploadCalls.length, 1);
    assert.equal(uploadCalls[0].options.resource_type, 'raw');
    assert.equal(uploadCalls[0].options.format, undefined);
    assert.equal(res.body.data.resume.fileName, 'pawan-resume.pdf');
    assert.equal(res.body.data.resume.url, uploadCalls[0].url);
    assert.equal(res.body.data.resume.publicId, uploadCalls[0].publicId);
    assert.ok(res.body.data.resume.updatedAt);
  });

  test('a second upload deletes the previous resume asset from Cloudinary', async () => {
    const admin = await createAdminUser();
    const headers = adminHeaders(admin._id);

    const first = await request(app)
      .post('/api/v1/profile/resume')
      .set(headers)
      .attach('file', VALID_PDF, { filename: 'v1.pdf', contentType: 'application/pdf' });

    await request(app)
      .post('/api/v1/profile/resume')
      .set(headers)
      .attach('file', VALID_PDF, { filename: 'v2.pdf', contentType: 'application/pdf' });

    assert.deepEqual(destroyCalls, [first.body.data.resume.publicId]);
  });
});

describe('POST /profile/resume failure compensation', () => {
  beforeEach(stubCloudinarySuccess);
  after(restoreCloudinary);

  test('a DB failure after a successful upload deletes the orphaned Cloudinary asset', async () => {
    const admin = await createAdminUser();
    const original = Profile.findOneAndUpdate;
    Profile.findOneAndUpdate = () => {
      throw new Error('simulated database failure');
    };

    try {
      const res = await request(app)
        .post('/api/v1/profile/resume')
        .set(adminHeaders(admin._id))
        .attach('file', VALID_PDF, { filename: 'resume.pdf', contentType: 'application/pdf' });

      assert.equal(res.status, 500);
      assert.equal(uploadCalls.length, 1);
      assert.deepEqual(destroyCalls, [uploadCalls[0].publicId]);
    } finally {
      Profile.findOneAndUpdate = original;
    }
  });
});
