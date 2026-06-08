import { PrismaClient, CabinetStatus } from '@prisma/client';
import type { Cabinet, BorrowRecord } from '@prisma/client';
import type { CreateBorrowRequest, ReturnBookRequest, CleanupRequest, WearLevel } from '../types';
import { shouldTriggerCleanup } from '../utils/dateUtils';
import { transformBorrowRecord } from '../utils/transform';

const prisma = new PrismaClient();

export function determineCabinetStatus(currentCount: number, capacity: number, hasOverdueBeyondThreshold: boolean): CabinetStatus {
  if (hasOverdueBeyondThreshold) return CabinetStatus.pending_cleanup;
  if (currentCount === 0) return CabinetStatus.available;
  if (currentCount >= capacity) return CabinetStatus.full;
  return CabinetStatus.partial;
}

export async function getAllCabinets() {
  const cabinets = await prisma.cabinet.findMany({
    include: {
      records: {
        where: { actualReturnDate: null },
      },
    },
    orderBy: { code: 'asc' },
  });

  return cabinets.map(cabinet => {
    const hasOverdueBeyondThreshold = cabinet.records.some(r =>
      shouldTriggerCleanup(r.expectedReturnDate, r.actualReturnDate)
    );
    const status = determineCabinetStatus(cabinet.currentCount, cabinet.capacity, hasOverdueBeyondThreshold);

    return {
      id: cabinet.id,
      code: cabinet.code,
      capacity: cabinet.capacity,
      currentCount: cabinet.currentCount,
      status,
      createdAt: cabinet.createdAt,
    };
  });
}

export async function getCabinetById(id: number) {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id },
    include: {
      records: {
        orderBy: { borrowDate: 'desc' },
      },
    },
  });

  if (!cabinet) return null;

  const hasOverdueBeyondThreshold = cabinet.records
    .filter(r => !r.actualReturnDate)
    .some(r => shouldTriggerCleanup(r.expectedReturnDate, r.actualReturnDate));

  const status = determineCabinetStatus(cabinet.currentCount, cabinet.capacity, hasOverdueBeyondThreshold);

  return {
    id: cabinet.id,
    code: cabinet.code,
    capacity: cabinet.capacity,
    currentCount: cabinet.currentCount,
    status,
    createdAt: cabinet.createdAt,
    records: cabinet.records.map(transformBorrowRecord),
  };
}

export async function getCabinetRecords(cabinetId: number) {
  const records = await prisma.borrowRecord.findMany({
    where: { cabinetId },
    orderBy: { borrowDate: 'desc' },
  });
  return records.map(transformBorrowRecord);
}

export async function createBorrowRecord(data: CreateBorrowRequest) {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: data.cabinetId },
    include: {
      records: {
        where: { actualReturnDate: null },
      },
    },
  });

  if (!cabinet) {
    throw new Error('柜格不存在');
  }

  const hasOverdueBeyondThreshold = cabinet.records.some(r =>
    shouldTriggerCleanup(r.expectedReturnDate, r.actualReturnDate)
  );
  const computedStatus = determineCabinetStatus(cabinet.currentCount, cabinet.capacity, hasOverdueBeyondThreshold);

  if (computedStatus === CabinetStatus.pending_cleanup) {
    throw new Error('该柜格处于待清柜状态，禁止借书，请先完成清柜');
  }

  if (cabinet.currentCount >= cabinet.capacity) {
    throw new Error('柜格容量已满，无法借书');
  }

  const record = await prisma.borrowRecord.create({
    data: {
      cabinetId: data.cabinetId,
      residentName: data.residentName,
      bookTitle: data.bookTitle,
      borrowDate: new Date(data.borrowDate),
      expectedReturnDate: new Date(data.expectedReturnDate),
    },
  });

  const newCount = cabinet.currentCount + 1;
  const allRecords = [...cabinet.records, record];
  const hasOverdue = allRecords
    .filter(r => !r.actualReturnDate)
    .some(r => shouldTriggerCleanup(r.expectedReturnDate, r.actualReturnDate));

  const newStatus = determineCabinetStatus(newCount, cabinet.capacity, hasOverdue);

  await prisma.cabinet.update({
    where: { id: data.cabinetId },
    data: {
      currentCount: newCount,
      status: newStatus,
    },
  });

  return transformBorrowRecord(record);
}

export async function returnBook(recordId: number, data: ReturnBookRequest) {
  const record = await prisma.borrowRecord.findUnique({
    where: { id: recordId },
    include: {
      cabinet: {
        include: {
          records: {
            where: { actualReturnDate: null },
          },
        },
      },
    },
  });

  if (!record) {
    throw new Error('借阅记录不存在');
  }

  if (record.actualReturnDate) {
    throw new Error('该书已归还');
  }

  const updatedRecord = await prisma.borrowRecord.update({
    where: { id: recordId },
    data: {
      actualReturnDate: new Date(data.actualReturnDate),
      wearLevel: data.wearLevel,
    },
  });

  const cabinet = record.cabinet;
  const newCount = Math.max(0, cabinet.currentCount - 1);
  const remainingRecords = cabinet.records.filter(r => r.id !== recordId);
  const hasOverdue = remainingRecords
    .filter(r => !r.actualReturnDate)
    .some(r => shouldTriggerCleanup(r.expectedReturnDate, r.actualReturnDate));

  const newStatus = determineCabinetStatus(newCount, cabinet.capacity, hasOverdue);

  await prisma.cabinet.update({
    where: { id: cabinet.id },
    data: {
      currentCount: newCount,
      status: newStatus,
    },
  });

  return transformBorrowRecord(updatedRecord);
}

export async function cleanupCabinet(cabinetId: number, data: CleanupRequest) {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
  });

  if (!cabinet) {
    throw new Error('柜格不存在');
  }

  await prisma.cleanupRecord.create({
    data: {
      cabinetId,
      reason: data.reason,
      operator: data.operator,
    },
  });

  const activeRecords = await prisma.borrowRecord.findMany({
    where: { cabinetId, actualReturnDate: null },
  });

  const hasOverdue = activeRecords.some(r =>
    shouldTriggerCleanup(r.expectedReturnDate, r.actualReturnDate)
  );

  const newStatus = determineCabinetStatus(cabinet.currentCount, cabinet.capacity, hasOverdue);

  const updatedCabinet = await prisma.cabinet.update({
    where: { id: cabinetId },
    data: {
      status: newStatus,
    },
  });

  return {
    id: updatedCabinet.id,
    code: updatedCabinet.code,
    capacity: updatedCabinet.capacity,
    currentCount: updatedCabinet.currentCount,
    status: newStatus,
    createdAt: updatedCabinet.createdAt,
  };
}

export async function getAllActiveRecords() {
  const records = await prisma.borrowRecord.findMany({
    where: {
      actualReturnDate: null,
    },
    include: {
      cabinet: true,
    },
    orderBy: { borrowDate: 'desc' },
  });

  return records.map(transformBorrowRecord);
}

export async function getOverdueRecords() {
  const records = await prisma.borrowRecord.findMany({
    where: {
      actualReturnDate: null,
    },
    include: {
      cabinet: true,
    },
    orderBy: { expectedReturnDate: 'asc' },
  });

  return records
    .map(transformBorrowRecord)
    .filter(r => r.isOverdue)
    .sort((a, b) => b.overdueDays - a.overdueDays);
}

export async function getPendingCleanupCabinets() {
  const cabinets = await getAllCabinets();
  return cabinets.filter(c => c.status === CabinetStatus.pending_cleanup);
}

export async function getStats() {
  const cabinets = await getAllCabinets();
  const total = cabinets.length;
  const available = cabinets.filter(c => c.status === CabinetStatus.available).length;
  const borrowed = cabinets.filter(c =>
    c.status === CabinetStatus.partial || c.status === CabinetStatus.full
  ).length;
  const pendingCleanup = cabinets.filter(c => c.status === CabinetStatus.pending_cleanup).length;

  return { total, available, borrowed, pendingCleanup };
}
