import { PrismaClient, CabinetStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始播种演示数据...');

  await prisma.borrowRecord.deleteMany();
  await prisma.cleanupRecord.deleteMany();
  await prisma.cabinet.deleteMany();

  const cabinets = await prisma.cabinet.createMany({
    data: [
      { code: 'A01', capacity: 5, currentCount: 2, status: CabinetStatus.partial },
      { code: 'A02', capacity: 5, currentCount: 0, status: CabinetStatus.available },
      { code: 'A03', capacity: 5, currentCount: 5, status: CabinetStatus.full },
      { code: 'A04', capacity: 5, currentCount: 1, status: CabinetStatus.partial },
      { code: 'B01', capacity: 5, currentCount: 3, status: CabinetStatus.partial },
      { code: 'B02', capacity: 5, currentCount: 0, status: CabinetStatus.available },
      { code: 'B03', capacity: 5, currentCount: 2, status: CabinetStatus.partial },
      { code: 'B04', capacity: 5, currentCount: 4, status: CabinetStatus.partial },
      { code: 'C01', capacity: 5, currentCount: 0, status: CabinetStatus.available },
      { code: 'C02', capacity: 5, currentCount: 1, status: CabinetStatus.pending_cleanup },
      { code: 'C03', capacity: 5, currentCount: 2, status: CabinetStatus.partial },
      { code: 'C04', capacity: 5, currentCount: 0, status: CabinetStatus.available },
    ],
  });

  console.log(`创建了 ${cabinets.count} 个柜格`);

  const cabinetList = await prisma.cabinet.findMany({ orderBy: { code: 'asc' } });
  const cabinetMap = new Map(cabinetList.map(c => [c.code, c.id]));

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysLater = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.borrowRecord.createMany({
    data: [
      { cabinetId: cabinetMap.get('A01')!, residentName: '张三', bookTitle: '活着', borrowDate: daysAgo(2), expectedReturnDate: daysLater(12) },
      { cabinetId: cabinetMap.get('A01')!, residentName: '李四', bookTitle: '平凡的世界', borrowDate: daysAgo(1), expectedReturnDate: daysLater(13) },
      { cabinetId: cabinetMap.get('A01')!, residentName: '王五', bookTitle: '三体', borrowDate: daysAgo(20), expectedReturnDate: daysAgo(6), actualReturnDate: daysAgo(7), wearLevel: 2 },
      { cabinetId: cabinetMap.get('A03')!, residentName: '赵六', bookTitle: '百年孤独', borrowDate: daysAgo(5), expectedReturnDate: daysLater(9) },
      { cabinetId: cabinetMap.get('A03')!, residentName: '孙七', bookTitle: '红楼梦', borrowDate: daysAgo(4), expectedReturnDate: daysLater(10) },
      { cabinetId: cabinetMap.get('A03')!, residentName: '周八', bookTitle: '西游记', borrowDate: daysAgo(3), expectedReturnDate: daysLater(11) },
      { cabinetId: cabinetMap.get('A03')!, residentName: '吴九', bookTitle: '水浒传', borrowDate: daysAgo(2), expectedReturnDate: daysLater(12) },
      { cabinetId: cabinetMap.get('A03')!, residentName: '郑十', bookTitle: '三国演义', borrowDate: daysAgo(1), expectedReturnDate: daysLater(13) },
      { cabinetId: cabinetMap.get('C02')!, residentName: '陈一', bookTitle: '追风筝的人', borrowDate: daysAgo(18), expectedReturnDate: daysAgo(5) },
      { cabinetId: cabinetMap.get('B04')!, residentName: '刘二', bookTitle: '小王子', borrowDate: daysAgo(17), expectedReturnDate: daysAgo(3) },
      { cabinetId: cabinetMap.get('B04')!, residentName: '杨三', bookTitle: '围城', borrowDate: daysAgo(1), expectedReturnDate: daysLater(13) },
      { cabinetId: cabinetMap.get('B04')!, residentName: '黄四', bookTitle: '边城', borrowDate: daysAgo(2), expectedReturnDate: daysLater(12) },
      { cabinetId: cabinetMap.get('B04')!, residentName: '朱五', bookTitle: '骆驼祥子', borrowDate: daysAgo(3), expectedReturnDate: daysLater(11) },
    ],
  });

  console.log('演示数据播种完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
