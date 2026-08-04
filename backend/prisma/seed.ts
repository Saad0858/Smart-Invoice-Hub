import { PrismaClient, UserRole, GSTRate, ProductUnit, CustomerType, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // 1. Create Admin User
  // ============================================
  const hashedPassword = await bcrypt.hash('admin123', env.BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@billflow.com' },
    update: {},
    create: {
      fullName: 'System Administrator',
      email: 'admin@billflow.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);
  const adminId = admin.id;

  // ============================================
  // 2. Create Categories
  // ============================================
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Pipes & Fittings' },
      update: {},
      create: { name: 'Pipes & Fittings', description: 'Steel, PVC, CPVC pipes and fittings', isActive: true, createdBy: adminId },
    }),
    prisma.category.upsert({
      where: { name: 'Construction Materials' },
      update: {},
      create: { name: 'Construction Materials', description: 'Cement, steel, aggregates', isActive: true, createdBy: adminId },
    }),
    prisma.category.upsert({
      where: { name: 'Electrical' },
      update: {},
      create: { name: 'Electrical', description: 'Wires, cables, switches', isActive: true, createdBy: adminId },
    }),
    prisma.category.upsert({
      where: { name: 'Paints & Coatings' },
      update: {},
      create: { name: 'Paints & Coatings', description: 'Industrial and decorative paints', isActive: true, createdBy: adminId },
    }),
  ]);

  console.log('✅ Created categories:', categories.length);
  const pipeCategory = categories.find(c => c.name === 'Pipes & Fittings')!;
  const constructionCategory = categories.find(c => c.name === 'Construction Materials')!;
  const electricalCategory = categories.find(c => c.name === 'Electrical')!;
  const paintsCategory = categories.find(c => c.name === 'Paints & Coatings')!;

  // ============================================
  // 3. Create Brands
  // ============================================
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { name: 'Tata Steel' },
      update: {},
      create: { name: 'Tata Steel', description: 'Leading steel manufacturer', isActive: true, createdBy: adminId },
    }),
    prisma.brand.upsert({
      where: { name: 'Finolex' },
      update: {},
      create: { name: 'Finolex', description: 'Pipes and cables manufacturer', isActive: true, createdBy: adminId },
    }),
    prisma.brand.upsert({
      where: { name: 'UltraTech' },
      update: {},
      create: { name: 'UltraTech', description: 'Cement and construction materials', isActive: true, createdBy: adminId },
    }),
    prisma.brand.upsert({
      where: { name: 'Asian Paints' },
      update: {},
      create: { name: 'Asian Paints', description: 'Leading paint manufacturer', isActive: true, createdBy: adminId },
    }),
    prisma.brand.upsert({
      where: { name: 'Polycab' },
      update: {},
      create: { name: 'Polycab', description: 'Wires and cables', isActive: true, createdBy: adminId },
    }),
  ]);

  console.log('✅ Created brands:', brands.length);
  const tataSteel = brands.find(b => b.name === 'Tata Steel')!;
  const finolex = brands.find(b => b.name === 'Finolex')!;
  const ultraTech = brands.find(b => b.name === 'UltraTech')!;
  const asianPaints = brands.find(b => b.name === 'Asian Paints')!;
  const polycab = brands.find(b => b.name === 'Polycab')!;

  // ============================================
  // 4. Create 10 Products with realistic manufacturing data
  // ============================================
  const products = [
    {
      sku: 'PIPE-MS-02-SCH40',
      barcode: '8901234567890',
      name: 'MS Steel Pipe 2" Schedule 40',
      description: 'Mild Steel Pipe 2 inch Schedule 40, 6 meter length',
      categoryId: pipeCategory.id,
      brandId: tataSteel.id,
      hsnCode: '7304',
      gstRate: GSTRate.EIGHTEEN,
      unit: ProductUnit.MTR,
      sellingPrice: 285.00,
      openingStock: 500,
      currentStock: 485,
      minStock: 50,
      isActive: true,
      imageUrl: null,
      searchKeywords: 'ms pipe, steel pipe, schedule 40, mild steel, 2 inch',
      createdBy: adminId,
    },
    {
      sku: 'PIPE-PVC-01-SCH80',
      barcode: '8901234567891',
      name: 'PVC Pipe 1" Schedule 80',
      description: 'PVC Pressure Pipe 1 inch Schedule 80, 6 meter length',
      categoryId: pipeCategory.id,
      brandId: finolex.id,
      hsnCode: '3917',
      gstRate: GSTRate.EIGHTEEN,
      unit: ProductUnit.MTR,
      sellingPrice: 95.00,
      openingStock: 1000,
      currentStock: 980,
      minStock: 100,
      isActive: true,
      imageUrl: null,
      searchKeywords: 'pvc pipe, pressure pipe, schedule 80, 1 inch',
      createdBy: adminId,
    },
    {
      sku: 'PIPE-CPVC-34-SCH80',
      barcode: '8901234567892',
      name: 'CPVC Pipe 3/4" Schedule 80',
      description: 'CPVC Hot/Cold Water Pipe 3/4 inch, 3 meter length',
      categoryId: pipeCategory.id,
      brandId: finolex.id,
      hsnCode: '3917',
      gstRate: GSTRate.EIGHTEEN,
      unit: ProductUnit.MTR,
      sellingPrice: 145.00,
      openingStock: 800,
      currentStock: 790,
      minStock: 80,
      isActive: true,
      imageUrl: null,
      searchKeywords: 'cpvc pipe, hot water pipe, cold water pipe, 3/4 inch',
      createdBy: adminId,
    },
    {
      sku: 'CEMENT-OPC53-50KG',
      barcode: '8901234567893',
      name: 'OPC 53 Grade Cement 50kg Bag',
      description: 'Ordinary Portland Cement 53 Grade, 50kg bag',
      categoryId: constructionCategory.id,
      brandId: ultraTech.id,
      hsnCode: '2523',
      gstRate: GSTRate.TWENTY_EIGHT,
      unit: ProductUnit.BAG,
      sellingPrice: 385.00,
      openingStock: 1000,
      currentStock: 950,
      minStock: 200,
      isActive: true,
      imageUrl: null,
      searchKeywords: 'cement, opc 53, 50kg, bag, ultraTech',
      createdBy: adminId,
    },
    {
      sku: 'TMT-FE500-12MM',
      barcode: '8901234567894',
      name: 'TMT Bar Fe500 12mm',
      description: 'Thermo-Mechanically Treated Bar Fe500 Grade, 12mm diameter',
      categoryId: constructionCategory.id,
      brandId: tataSteel.id,
      hsnCode: '7214',
      gstRate: GSTRate.EIGHTEEN,
      unit: ProductUnit.KG,
      sellingPrice: 68.50,
      openingStock: 10000,
      currentStock: 9850,
      minStock: 1000,
      isActive: true,
      imageUrl: null,
      searchKeywords: 'tmt bar, fe500, 12mm, steel bar, reinforcement',
      createdBy: adminId,
    },
    {
      sku: 'TMT-FE500-16MM',
      barcode: '8901234567895',
      name: 'TMT Bar Fe500 16mm',
      description: 'Thermo-Mechanically Treated Bar Fe500 Grade, 16mm diameter',
      categoryId: constructionCategory.id,
      brandId: tataSteel.id,
      hsnCode: '7214',
      gstRate: GSTRate.EIGHTEEN,
      unit: ProductUnit.KG,
      sellingPrice: 67.00,
      openingStock: 8000,
      currentStock: 7920,
      minStock: 800,
      isActive: true,
      imageUrl: null,
      searchKeywords: 'tmt bar, fe500, 16mm, steel bar, reinforcement',
      createdBy: adminId,
    },
    {
      sku: 'WIRE-FRLS-2.5SQMM',
      barcode: '8901234567896',
      name: 'FRLS Copper Wire 2.5 sq mm',
      description: 'Fire Retardant Low Smoke Copper Wire 2.5 sq mm, 90 meter coil',
      categoryId: electricalCategory.id,
      brandId: polycab.id,
      hsnCode: '8544',
      gstRate: GSTRate.EIGHTEEN,
      unit: ProductUnit.ROLL,
      sellingPrice: 1850.00,
      openingStock: 200,
      currentStock: 195,
      minStock: 20,
      isActive: true,
      imageUrl: null,
      searchKeywords: 'frLs wire, copper wire, 2.5 sqmm, electrical, polycab',
      createdBy: adminId,
    },
    {
      sku: 'WIRE-FRLS-4SQMM',
      barcode: '8901234567897',
      name: 'FRLS Copper Wire 4 sq mm',
      description: 'Fire Retardant Low Smoke Copper Wire 4 sq mm, 90 meter coil',
      categoryId: electricalCategory.id,
      brandId: polycab.id,
      hsnCode: '8544',
      gstRate: GSTRate.EIGHTEEN,
      unit: ProductUnit.ROLL,
      sellingPrice: 2850.00,
      openingStock: 150,
      currentStock: 148,
      minStock: 15,
      isActive: true,
      imageUrl: null,
      searchKeywords: 'frLs wire, copper wire, 4 sqmm, electrical, polycab',
      createdBy: adminId,
    },
    {
      sku: 'PAINT-EMULSION-20L',
      barcode: '8901234567898',
      name: 'Premium Interior Emulsion 20L',
      description: 'Washable Premium Interior Emulsion Paint White, 20 liter',
      categoryId: paintsCategory.id,
      brandId: asianPaints.id,
      hsnCode: '3209',
      gstRate: GSTRate.EIGHTEEN,
      unit: ProductUnit.PCS,
      sellingPrice: 3200.00,
      openingStock: 100,
      currentStock: 98,
      minStock: 10,
      isActive: true,
      imageUrl: null,
      searchKeywords: 'emulsion paint, interior paint, 20 liter, asian paints',
      createdBy: adminId,
    },
    {
      sku: 'PAINT-ENAMEL-4L',
      barcode: '8901234567899',
      name: 'Synthetic Enamel Paint 4L',
      description: 'High Gloss Synthetic Enamel Paint White, 4 liter',
      categoryId: paintsCategory.id,
      brandId: asianPaints.id,
      hsnCode: '3208',
      gstRate: GSTRate.EIGHTEEN,
      unit: ProductUnit.PCS,
      sellingPrice: 850.00,
      openingStock: 200,
      currentStock: 195,
      minStock: 20,
      isActive: true,
      imageUrl: null,
      searchKeywords: 'enamel paint, synthetic enamel, 4 liter, gloss paint',
      createdBy: adminId,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log('✅ Created products:', products.length);

  // ============================================
  // 5. Create 5 Customers (B2B manufacturing clients)
  // ============================================
  const customers = [
    {
      customerCode: 'CUST-001',
      companyName: 'Shree Ganesh Construction Pvt Ltd',
      contactPerson: 'Rajesh Kumar Sharma',
      gstNumber: '27AAECS1234F1Z5',
      panNumber: 'AAECS1234F',
      phone: '+91-22-25678901',
      email: 'rajesh.sharma@ganeshconstruction.com',
      address: 'Plot No. 45, MIDC Industrial Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      postalCode: '400093',
      country: 'India',
      customerType: CustomerType.BUSINESS,
      creditLimit: 500000.00,
      openingBalance: 0.00,
      currentBalance: 0.00,
      isActive: true,
      createdBy: adminId,
    },
    {
      customerCode: 'CUST-002',
      companyName: 'Maharashtra Infra Projects Ltd',
      contactPerson: 'Priya Deshmukh',
      gstNumber: '27AABCM5678K1Z2',
      panNumber: 'AABCM5678K',
      phone: '+91-20-25436789',
      email: 'priya.deshmukh@mahainfra.com',
      address: 'Survey No. 112, Hinjewadi Phase 2',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      postalCode: '411057',
      country: 'India',
      customerType: CustomerType.BUSINESS,
      creditLimit: 750000.00,
      openingBalance: 0.00,
      currentBalance: 0.00,
      isActive: true,
      createdBy: adminId,
    },
    {
      customerCode: 'CUST-003',
      companyName: 'Vidyut Electricals',
      contactPerson: 'Amit Patil',
      gstNumber: '27AAAFV9012P1Z8',
      panNumber: 'AAAFV9012P',
      phone: '+91-253-2345678',
      email: 'amit.patil@vidyutelectricals.com',
      address: 'Gala No. 15, Ambad Industrial Estate',
      city: 'Nashik',
      state: 'Maharashtra',
      stateCode: '27',
      postalCode: '422010',
      country: 'India',
      customerType: CustomerType.BUSINESS,
      creditLimit: 300000.00,
      openingBalance: 0.00,
      currentBalance: 0.00,
      isActive: true,
      createdBy: adminId,
    },
    {
      customerCode: 'CUST-004',
      companyName: 'Coastal Builders & Developers',
      contactPerson: 'Sunita Nair',
      gstNumber: '29AACCC3456R1Z4',
      panNumber: 'AACCC3456R',
      phone: '+91-80-23456789',
      email: 'sunita.nair@coastalbuilders.com',
      address: 'No. 78, Peenya Industrial Area',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      postalCode: '560058',
      country: 'India',
      customerType: CustomerType.BUSINESS,
      creditLimit: 1000000.00,
      openingBalance: 0.00,
      currentBalance: 0.00,
      isActive: true,
      createdBy: adminId,
    },
    {
      customerCode: 'CUST-005',
      companyName: 'Rajesh Kumar (Individual Contractor)',
      contactPerson: 'Rajesh Kumar',
      gstNumber: null,
      panNumber: 'ABCPK1234Q',
      phone: '+91-9876543210',
      email: 'rajesh.kumar.contractor@gmail.com',
      address: 'House No. 123, Sector 15',
      city: 'Gurugram',
      state: 'Haryana',
      stateCode: '06',
      postalCode: '122001',
      country: 'India',
      customerType: CustomerType.INDIVIDUAL,
      creditLimit: 100000.00,
      openingBalance: 0.00,
      currentBalance: 0.00,
      isActive: true,
      createdBy: adminId,
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { customerCode: customer.customerCode },
      update: {},
      create: customer,
    });
  }

  console.log('✅ Created customers:', customers.length);

  // ============================================
  // 6. Create Company Settings
  // ============================================
  const currentYear = new Date().getFullYear();

  const companySettings = await prisma.companySettings.upsert({
    where: { id: 'singleton' }, // Will fail on new schema, handle gracefully
    update: {},
    create: {
      companyName: 'BillFlow Manufacturing Pvt Ltd',
      gstNumber: '27AAACB1234F1Z5',
      panNumber: 'AAACB1234F',
      cinNumber: 'U29100MH2020PTC123456',
      phone: '+91-22-25671234',
      email: 'info@billflowmanufacturing.com',
      website: 'https://billflowmanufacturing.com',
      address: 'Plot No. 100, MIDC Industrial Area, Kupwad',
      city: 'Sangli',
      state: 'Maharashtra',
      stateCode: '27',
      postalCode: '416436',
      country: 'India',
      logoUrl: null,
      bankName: 'HDFC Bank Ltd',
      branch: 'Sangli MIDC Branch',
      accountHolder: 'BillFlow Manufacturing Pvt Ltd',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0001234',
      upiId: 'billflow.mfg@hdfcbank',
      digitalSignature: null,
      invoicePrefix: 'SIH',
      invoiceSuffix: null,
      nextInvoiceNumber: 1,
      invoiceFooter: 'Thank you for your business! | Subject to Sangli Jurisdiction | E.&O.E.',
      primaryColor: '#2563EB',
      createdBy: adminId,
    },
  });

  console.log('✅ Created company settings:', companySettings.companyName);

  // ============================================
  // 7. Create Invoice Sequence for current year
  // ============================================
  const invoiceSequence = await prisma.invoiceSequence.upsert({
    where: { year: currentYear },
    update: {},
    create: {
      year: currentYear,
      prefix: 'SIH',
      current: 0,
    },
  });

  console.log('✅ Created invoice sequence for year:', invoiceSequence.year);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });