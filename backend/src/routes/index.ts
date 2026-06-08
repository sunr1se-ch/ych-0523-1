import { Router } from 'express';
import {
  getAllCabinets,
  getCabinetById,
  getCabinetRecords,
  createBorrowRecord,
  returnBook,
  cleanupCabinet,
  getOverdueRecords,
  getPendingCleanupCabinets,
  getStats,
} from '../services/cabinetService';
import type { CreateBorrowRequest, ReturnBookRequest, CleanupRequest } from '../types';

const router = Router();

router.get('/stats', async (_req, res, next) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get('/cabinets', async (_req, res, next) => {
  try {
    const cabinets = await getAllCabinets();
    res.json(cabinets);
  } catch (err) {
    next(err);
  }
});

router.get('/cabinets/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const cabinet = await getCabinetById(id);
    if (!cabinet) {
      res.status(404).json({ error: '柜格不存在' });
      return;
    }
    res.json(cabinet);
  } catch (err) {
    next(err);
  }
});

router.get('/cabinets/:id/records', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const records = await getCabinetRecords(id);
    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.post('/borrow', async (req, res, next) => {
  try {
    const data = req.body as CreateBorrowRequest;
    if (!data.cabinetId || !data.residentName || !data.bookTitle || !data.borrowDate || !data.expectedReturnDate) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }
    const record = await createBorrowRecord(data);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

router.post('/return/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body as ReturnBookRequest;
    if (!data.actualReturnDate || !data.wearLevel) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }
    if (data.wearLevel < 1 || data.wearLevel > 5) {
      res.status(400).json({ error: '磨损等级必须在1-5之间' });
      return;
    }
    const record = await returnBook(id, data);
    res.json(record);
  } catch (err) {
    next(err);
  }
});

router.post('/cleanup/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body as CleanupRequest;
    if (!data.reason || !data.operator) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }
    const cabinet = await cleanupCabinet(id, data);
    res.json(cabinet);
  } catch (err) {
    next(err);
  }
});

router.get('/overdue', async (_req, res, next) => {
  try {
    const records = await getOverdueRecords();
    res.json(records);
  } catch (err) {
    next(err);
  }
});

router.get('/pending-cleanup', async (_req, res, next) => {
  try {
    const cabinets = await getPendingCleanupCabinets();
    res.json(cabinets);
  } catch (err) {
    next(err);
  }
});

export default router;
