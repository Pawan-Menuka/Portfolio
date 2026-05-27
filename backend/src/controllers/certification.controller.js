import { asyncHandler } from '../utils/asyncHandler.js';
import * as certService from '../services/certification.service.js';

export const getCertifications = asyncHandler(async (req, res) => {
  const certs = await certService.getAll(req.query);
  res.json({ success: true, data: certs });
});

export const createCertification = asyncHandler(async (req, res) => {
  const cert = await certService.create(req.body);
  res.status(201).json({ success: true, data: cert });
});

export const updateCertification = asyncHandler(async (req, res) => {
  const cert = await certService.update(req.params.id, req.body);
  res.json({ success: true, data: cert });
});

export const deleteCertification = asyncHandler(async (req, res) => {
  await certService.remove(req.params.id);
  res.json({ success: true, message: 'Certification deleted' });
});
