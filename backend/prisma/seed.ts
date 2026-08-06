import { PrismaClient, UserRole, GSTRate, ProductUnit, CustomerType, PaymentStatus, PaymentMethod, InvoiceStatus } from '@prisma/client';
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

  // ============================================
  // 8. Create 10 Invoices for AR Testing
  // ============================================
  const customer1 = await prisma.customer.findUnique({ where: { customerCode: 'CUST-001' } });
  const customer2 = await prisma.customer.findUnique({ where: { customerCode: 'CUST-002' } });
  const customer3 = await prisma.customer.findUnique({ where: { customerCode: 'CUST-003' } });
  const customer4 = await prisma.customer.findUnique({ where: { customerCode: 'CUST-004' } });
  const customer5 = await prisma.customer.findUnique({ where: { customerCode: 'CUST-005' } });

  const product1 = await prisma.product.findUnique({ where: { sku: 'PIPE-MS-02-SCH40' } });
  const product2 = await prisma.product.findUnique({ where: { sku: 'PIPE-PVC-01-SCH80' } });
  const product3 = await prisma.product.findUnique({ where: { sku: 'PIPE-CPVC-34-SCH80' } });
  const product4 = await prisma.product.findUnique({ where: { sku: 'CEMENT-OPC53-50KG' } });
  const product5 = await prisma.product.findUnique({ where: { sku: 'TMT-FE500-12MM' } });
  const product6 = await prisma.product.findUnique({ where: { sku: 'TMT-FE500-16MM' } });
  const product7 = await prisma.product.findUnique({ where: { sku: 'WIRE-FRLS-2.5SQMM' } });
  const product8 = await prisma.product.findUnique({ where: { sku: 'WIRE-FRLS-4SQMM' } });
  const product9 = await prisma.product.findUnique({ where: { sku: 'PAINT-EMULSION-20L' } });
  const product10 = await prisma.product.findUnique({ where: { sku: 'PAINT-ENAMEL-4L' } });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Create invoices with various payment statuses
  const invoicesData = [
    // Invoice 1 - FULLY PAID (CASH)
    {
      invoiceNumber: 'SIH-2024-00001',
      invoiceDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      creditDays: 30,
      customerId: customer1!.id,
      subtotal: 28500.00,
      taxableAmount: 28500.00,
      discountAmount: 0,
      transportCharges: 500.00,
      otherCharges: 0,
      cgstAmount: 2610.00,
      sgstAmount: 2610.00,
      igstAmount: 0,
      totalGstAmount: 5220.00,
      roundOff: 0,
      grandTotal: 34220.00,
      status: InvoiceStatus.GENERATED,
      paymentStatus: PaymentStatus.PAID,
      paidAmount: 34220.00,
      balanceAmount: 0,
      lastPaymentDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      paymentCount: 1,
      notes: 'Full payment received via cash',
      terms: 'Payment due within 30 days',
      createdBy: adminId,
      items: [
        { productId: product1!.id, sku: product1!.sku, productName: product1!.name, hsnCode: product1!.hsnCode, unit: product1!.unit, gstRate: product1!.gstRate, quantity: 100, unitPrice: 285.00, discount: 0, taxableAmount: 28500.00, cgstAmount: 2565.00, sgstAmount: 2565.00, igstAmount: 0, lineTotal: 33630.00 },
      ],
    },
    // Invoice 2 - PARTIALLY PAID (UPI + Bank Transfer)
    {
      invoiceNumber: 'SIH-2024-00002',
      invoiceDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      creditDays: 45,
      customerId: customer2!.id,
      subtotal: 95000.00,
      taxableAmount: 95000.00,
      discountAmount: 0,
      transportCharges: 1000.00,
      otherCharges: 0,
      cgstAmount: 8640.00,
      sgstAmount: 8640.00,
      igstAmount: 0,
      totalGstAmount: 17280.00,
      roundOff: 0,
      grandTotal: 113280.00,
      status: InvoiceStatus.GENERATED,
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
      paidAmount: 50000.00,
      balanceAmount: 63280.00,
      lastPaymentDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      paymentCount: 2,
      notes: 'Partial payment received',
      terms: 'Payment due within 45 days',
      createdBy: adminId,
      items: [
        { productId: product2!.id, sku: product2!.sku, productName: product2!.name, hsnCode: product2!.hsnCode, unit: product2!.unit, gstRate: product2!.gstRate, quantity: 1000, unitPrice: 95.00, discount: 0, taxableAmount: 95000.00, cgstAmount: 8550.00, sgstAmount: 8550.00, igstAmount: 0, lineTotal: 112100.00 },
      ],
    },
    // Invoice 3 - UNPAID (Overdue)
    {
      invoiceNumber: 'SIH-2024-00003',
      invoiceDate: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      creditDays: 60,
      customerId: customer3!.id,
      subtotal: 10875.00,
      taxableAmount: 10875.00,
      discountAmount: 0,
      transportCharges: 300.00,
      otherCharges: 0,
      cgstAmount: 1005.75,
      sgstAmount: 1005.75,
      igstAmount: 0,
      totalGstAmount: 2011.50,
      roundOff: -0.50,
      grandTotal: 13186.00,
      status: InvoiceStatus.GENERATED,
      paymentStatus: PaymentStatus.OVERDUE,
      paidAmount: 0,
      balanceAmount: 13186.00,
      lastPaymentDate: null,
      paymentCount: 0,
      notes: 'Payment overdue - follow up required',
      terms: 'Payment due within 60 days',
      createdBy: adminId,
      items: [
        { productId: product3!.id, sku: product3!.sku, productName: product3!.name, hsnCode: product3!.hsnCode, unit: product3!.unit, gstRate: product3!.gstRate, quantity: 75, unitPrice: 145.00, discount: 0, taxableAmount: 10875.00, cgstAmount: 978.75, sgstAmount: 978.75, igstAmount: 0, lineTotal: 12832.50 },
      ],
    },
    // Invoice 4 - FULLY PAID (Cheque)
    {
      invoiceNumber: 'SIH-2024-00004',
      invoiceDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      creditDays: 30,
      customerId: customer4!.id,
      subtotal: 192500.00,
      taxableAmount: 192500.00,
      discountAmount: 0,
      transportCharges: 2000.00,
      otherCharges: 0,
      cgstAmount: 27030.00,
      sgstAmount: 27030.00,
      igstAmount: 0,
      totalGstAmount: 54060.00,
      roundOff: 0,
      grandTotal: 248560.00,
      status: InvoiceStatus.GENERATED,
      paymentStatus: PaymentStatus.PAID,
      paidAmount: 248560.00,
      balanceAmount: 0,
      lastPaymentDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      paymentCount: 1,
      notes: 'Full payment received via cheque',
      terms: 'Payment due within 30 days',
      createdBy: adminId,
      items: [
        { productId: product4!.id, sku: product4!.sku, productName: product4!.name, hsnCode: product4!.hsnCode, unit: product4!.unit, gstRate: product4!.gstRate, quantity: 500, unitPrice: 385.00, discount: 0, taxableAmount: 192500.00, cgstAmount: 26950.00, sgstAmount: 26950.00, igstAmount: 0, lineTotal: 246400.00 },
      ],
    },
    // Invoice 5 - PARTIALLY PAID (Multiple payments)
    {
      invoiceNumber: 'SIH-2024-00005',
      invoiceDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
      creditDays: 60,
      customerId: customer1!.id,
      subtotal: 67450.00,
      taxableAmount: 67450.00,
      discountAmount: 0,
      transportCharges: 500.00,
      otherCharges: 0,
      cgstAmount: 6115.50,
      sgstAmount: 6115.50,
      igstAmount: 0,
      totalGstAmount: 12231.00,
      roundOff: 0,
      grandTotal: 80181.00,
      status: InvoiceStatus.GENERATED,
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
      paidAmount: 30000.00,
      balanceAmount: 50181.00,
      lastPaymentDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      paymentCount: 1,
      notes: 'First installment received',
      terms: 'Payment due within 60 days',
      createdBy: adminId,
      items: [
        { productId: product5!.id, sku: product5!.sku, productName: product5!.name, hsnCode: product5!.hsnCode, unit: product5!.unit, gstRate: product5!.gstRate, quantity: 1000, unitPrice: 67.45, discount: 0, taxableAmount: 67450.00, cgstAmount: 6070.50, sgstAmount: 6070.50, igstAmount: 0, lineTotal: 79591.00 },
      ],
    },
    // Invoice 6 - UNPAID (Not yet due)
    {
      invoiceNumber: 'SIH-2024-00006',
      invoiceDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000),
      creditDays: 60,
      customerId: customer2!.id,
      subtotal: 53600.00,
      taxableAmount: 53600.00,
      discountAmount: 0,
      transportCharges: 500.00,
      otherCharges: 0,
      cgstAmount: 4869.00,
      sgstAmount: 4869.00,
      igstAmount: 0,
      totalGstAmount: 9738.00,
      roundOff: 0,
      grandTotal: 63838.00,
      status: InvoiceStatus.GENERATED,
      paymentStatus: PaymentStatus.UNPAID,
      paidAmount: 0,
      balanceAmount: 63838.00,
      lastPaymentDate: null,
      paymentCount: 0,
      notes: 'New invoice - payment not yet due',
      terms: 'Payment due within 60 days',
      createdBy: adminId,
      items: [
        { productId: product6!.id, sku: product6!.sku, productName: product6!.name, hsnCode: product6!.hsnCode, unit: product6!.unit, gstRate: product6!.gstRate, quantity: 800, unitPrice: 67.00, discount: 0, taxableAmount: 53600.00, cgstAmount: 4824.00, sgstAmount: 4824.00, igstAmount: 0, lineTotal: 63248.00 },
      ],
    },
    // Invoice 7 - UNPAID (Overdue - individual customer)
    {
      invoiceNumber: 'SIH-2024-00007',
      invoiceDate: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      creditDays: 90,
      customerId: customer5!.id,
      subtotal: 185000.00,
      taxableAmount: 185000.00,
      discountAmount: 0,
      transportCharges: 1000.00,
      otherCharges: 0,
      cgstAmount: 16740.00,
      sgstAmount: 16740.00,
      igstAmount: 0,
      totalGstAmount: 33480.00,
      roundOff: 0,
      grandTotal: 219480.00,
      status: InvoiceStatus.GENERATED,
      paymentStatus: PaymentStatus.OVERDUE,
      paidAmount: 0,
      balanceAmount: 219480.00,
      lastPaymentDate: null,
      paymentCount: 0,
      notes: 'Significantly overdue - legal notice pending',
      terms: 'Payment due within 90 days',
      createdBy: adminId,
      items: [
        { productId: product7!.id, sku: product7!.sku, productName: product7!.name, hsnCode: product7!.hsnCode, unit: product7!.unit, gstRate: product7!.gstRate, quantity: 100, unitPrice: 1850.00, discount: 0, taxableAmount: 185000.00, cgstAmount: 16650.00, sgstAmount: 16650.00, igstAmount: 0, lineTotal: 218300.00 },
      ],
    },
    // Invoice 8 - FULLY PAID (Card)
    {
      invoiceNumber: 'SIH-2024-00008',
      invoiceDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
      creditDays: 30,
      customerId: customer3!.id,
      subtotal: 28500.00,
      taxableAmount: 28500.00,
      discountAmount: 0,
      transportCharges: 500.00,
      otherCharges: 0,
      cgstAmount: 2610.00,
      sgstAmount: 2610.00,
      igstAmount: 0,
      totalGstAmount: 5220.00,
      roundOff: 0,
      grandTotal: 34220.00,
      status: InvoiceStatus.GENERATED,
      paymentStatus: PaymentStatus.PAID,
      paidAmount: 34220.00,
      balanceAmount: 0,
      lastPaymentDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      paymentCount: 1,
      notes: 'Full payment received via card',
      terms: 'Payment due within 30 days',
      createdBy: adminId,
      items: [
        { productId: product8!.id, sku: product8!.sku, productName: product8!.name, hsnCode: product8!.hsnCode, unit: product8!.unit, gstRate: product8!.gstRate, quantity: 10, unitPrice: 2850.00, discount: 0, taxableAmount: 28500.00, cgstAmount: 2565.00, sgstAmount: 2565.00, igstAmount: 0, lineTotal: 33630.00 },
      ],
    },
    // Invoice 9 - PARTIALLY PAID (Bank Transfer)
    {
      invoiceNumber: 'SIH-2024-00009',
      invoiceDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      creditDays: 45,
      customerId: customer4!.id,
      subtotal: 64000.00,
      taxableAmount: 64000.00,
      discountAmount: 0,
      transportCharges: 800.00,
      otherCharges: 0,
      cgstAmount: 5832.00,
      sgstAmount: 5832.00,
      igstAmount: 0,
      totalGstAmount: 11664.00,
      roundOff: 0,
      grandTotal: 76464.00,
      status: InvoiceStatus.GENERATED,
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
      paidAmount: 40000.00,
      balanceAmount: 36464.00,
      lastPaymentDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      paymentCount: 1,
      notes: 'Advance payment received',
      terms: 'Payment due within 45 days',
      createdBy: adminId,
      items: [
        { productId: product9!.id, sku: product9!.sku, productName: product9!.name, hsnCode: product9!.hsnCode, unit: product9!.unit, gstRate: product9!.gstRate, quantity: 20, unitPrice: 3200.00, discount: 0, taxableAmount: 64000.00, cgstAmount: 5760.00, sgstAmount: 5760.00, igstAmount: 0, lineTotal: 75520.00 },
      ],
    },
    // Invoice 10 - UNPAID (Recent)
    {
      invoiceNumber: 'SIH-2024-00010',
      invoiceDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 55 * 24 * 60 * 60 * 1000),
      creditDays: 30,
      customerId: customer5!.id,
      subtotal: 8500.00,
      taxableAmount: 8500.00,
      discountAmount: 0,
      transportCharges: 200.00,
      otherCharges: 0,
      cgstAmount: 783.00,
      sgstAmount: 783.00,
      igstAmount: 0,
      totalGstAmount: 1566.00,
      roundOff: 0,
      grandTotal: 10266.00,
      status: InvoiceStatus.GENERATED,
      paymentStatus: PaymentStatus.UNPAID,
      paidAmount: 0,
      balanceAmount: 10266.00,
      lastPaymentDate: null,
      paymentCount: 0,
      notes: 'Recent invoice',
      terms: 'Payment due within 30 days',
      createdBy: adminId,
      items: [
        { productId: product10!.id, sku: product10!.sku, productName: product10!.name, hsnCode: product10!.hsnCode, unit: product10!.unit, gstRate: product10!.gstRate, quantity: 10, unitPrice: 850.00, discount: 0, taxableAmount: 8500.00, cgstAmount: 765.00, sgstAmount: 765.00, igstAmount: 0, lineTotal: 10030.00 },
      ],
    },
  ];

  // Create invoices with items
  for (const invData of invoicesData) {
    const { items, ...invoiceData } = invData;
    await prisma.invoice.upsert({
      where: { invoiceNumber: invoiceData.invoiceNumber },
      update: {},
      create: {
        ...invoiceData,
        items: { create: items },
      },
    });
  }

  console.log('✅ Created invoices:', invoicesData.length);

  // ============================================
  // 9. Create 15 Payments for AR Testing
  // ============================================
  const invoice1 = await prisma.invoice.findUnique({ where: { invoiceNumber: 'SIH-2024-00001' } });
  const invoice2 = await prisma.invoice.findUnique({ where: { invoiceNumber: 'SIH-2024-00002' } });
  const invoice4 = await prisma.invoice.findUnique({ where: { invoiceNumber: 'SIH-2024-00004' } });
  const invoice5 = await prisma.invoice.findUnique({ where: { invoiceNumber: 'SIH-2024-00005' } });
  const invoice7 = await prisma.invoice.findUnique({ where: { invoiceNumber: 'SIH-2024-00007' } });
  const invoice8 = await prisma.invoice.findUnique({ where: { invoiceNumber: 'SIH-2024-00008' } });
  const invoice9 = await prisma.invoice.findUnique({ where: { invoiceNumber: 'SIH-2024-00009' } });

  const paymentsData = [
    // Payment 1 - Full payment for Invoice 1 (CASH)
    {
      paymentNumber: 'PAY-2024-000001',
      invoiceId: invoice1!.id,
      customerId: customer1!.id,
      paymentDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      amount: 34220.00,
      paymentMethod: PaymentMethod.CASH,
      referenceNumber: null,
      remarks: 'Full payment received in cash at office',
      receivedBy: 'Rajesh Kumar (Admin)',
      createdBy: adminId,
    },
    // Payment 2 - First partial for Invoice 2 (UPI)
    {
      paymentNumber: 'PAY-2024-000002',
      invoiceId: invoice2!.id,
      customerId: customer2!.id,
      paymentDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      amount: 30000.00,
      paymentMethod: PaymentMethod.UPI,
      referenceNumber: 'UPI1234567890',
      remarks: 'First installment via UPI',
      receivedBy: 'Priya Deshmukh (Accountant)',
      createdBy: adminId,
    },
    // Payment 3 - Second partial for Invoice 2 (BANK_TRANSFER)
    {
      paymentNumber: 'PAY-2024-000003',
      invoiceId: invoice2!.id,
      customerId: customer2!.id,
      paymentDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      amount: 20000.00,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNumber: 'NEFT202400123456',
      remarks: 'Second installment via NEFT',
      receivedBy: 'Priya Deshmukh (Accountant)',
      createdBy: adminId,
    },
    // Payment 4 - Full payment for Invoice 4 (CHEQUE)
    {
      paymentNumber: 'PAY-2024-000004',
      invoiceId: invoice4!.id,
      customerId: customer4!.id,
      paymentDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      amount: 248560.00,
      paymentMethod: PaymentMethod.CHEQUE,
      referenceNumber: 'CHQ9876543210',
      remarks: 'Cheque no. 9876543210 dated 2024-01-15',
      receivedBy: 'Sunita Nair (Finance)',
      createdBy: adminId,
    },
    // Payment 5 - Partial payment for Invoice 5 (UPI)
    {
      paymentNumber: 'PAY-2024-000005',
      invoiceId: invoice5!.id,
      customerId: customer1!.id,
      paymentDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      amount: 30000.00,
      paymentMethod: PaymentMethod.UPI,
      referenceNumber: 'UPI202400111222',
      remarks: 'First installment',
      receivedBy: 'Rajesh Kumar (Admin)',
      createdBy: adminId,
    },
    // Payment 6 - Full payment for Invoice 8 (CARD)
    {
      paymentNumber: 'PAY-2024-000006',
      invoiceId: invoice8!.id,
      customerId: customer3!.id,
      paymentDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      amount: 34220.00,
      paymentMethod: PaymentMethod.CARD,
      referenceNumber: 'CARD2024001555',
      remarks: 'Card payment at POS',
      receivedBy: 'Amit Patil (Sales)',
      createdBy: adminId,
    },
    // Payment 7 - Partial payment for Invoice 9 (BANK_TRANSFER)
    {
      paymentNumber: 'PAY-2024-000007',
      invoiceId: invoice9!.id,
      customerId: customer4!.id,
      paymentDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      amount: 40000.00,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNumber: 'RTGS202400222333',
      remarks: 'Advance payment via RTGS',
      receivedBy: 'Sunita Nair (Finance)',
      createdBy: adminId,
    },
    // Payment 8 - Additional payment for Invoice 2 (CASH)
    {
      paymentNumber: 'PAY-2024-000008',
      invoiceId: invoice2!.id,
      customerId: customer2!.id,
      paymentDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      amount: 15000.00,
      paymentMethod: PaymentMethod.CASH,
      referenceNumber: null,
      remarks: 'Third partial payment in cash',
      receivedBy: 'Rajesh Kumar (Admin)',
      createdBy: adminId,
    },
    // Payment 9 - Second partial for Invoice 5 (BANK_TRANSFER)
    {
      paymentNumber: 'PAY-2024-000009',
      invoiceId: invoice5!.id,
      customerId: customer1!.id,
      paymentDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      amount: 20000.00,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNumber: 'IMPS202400333444',
      remarks: 'Second installment via IMPS',
      receivedBy: 'Rajesh Kumar (Admin)',
      createdBy: adminId,
    },
    // Payment 10 - Additional for Invoice 9 (CHEQUE)
    {
      paymentNumber: 'PAY-2024-000010',
      invoiceId: invoice9!.id,
      customerId: customer4!.id,
      paymentDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      amount: 25000.00,
      paymentMethod: PaymentMethod.CHEQUE,
      referenceNumber: 'CHQ202400555666',
      remarks: 'Second installment cheque',
      receivedBy: 'Sunita Nair (Finance)',
      createdBy: adminId,
    },
    // Payment 11 - Another invoice payment (CASH)
    {
      paymentNumber: 'PAY-2024-000011',
      invoiceId: invoice1!.id,
      customerId: customer1!.id,
      paymentDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      amount: 5000.00,
      paymentMethod: PaymentMethod.CASH,
      referenceNumber: null,
      remarks: 'Advance payment received earlier',
      receivedBy: 'Rajesh Kumar (Admin)',
      createdBy: adminId,
    },
    // Payment 12 - Cancelled payment (for testing cancellation)
    {
      paymentNumber: 'PAY-2024-000012',
      invoiceId: invoice2!.id,
      customerId: customer2!.id,
      paymentDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      amount: 10000.00,
      paymentMethod: PaymentMethod.UPI,
      referenceNumber: 'UPI202400444555',
      remarks: 'Wrong amount - cancelled',
      receivedBy: 'Priya Deshmukh (Accountant)',
      createdBy: adminId,
      isCancelled: true,
      cancelledReason: 'Wrong amount entered - should have been 5000',
    },
    // Payment 13 - Additional payment for customer 3
    {
      paymentNumber: 'PAY-2024-000013',
      invoiceId: invoice8!.id,
      customerId: customer3!.id,
      paymentDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      amount: 10000.00,
      paymentMethod: PaymentMethod.UPI,
      referenceNumber: 'UPI202400555666',
      remarks: 'Additional advance',
      receivedBy: 'Amit Patil (Sales)',
      createdBy: adminId,
    },
    // Payment 14 - Payment for customer 5
    {
      paymentNumber: 'PAY-2024-000014',
      invoiceId: invoice7!.id,
      customerId: customer5!.id,
      paymentDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      amount: 50000.00,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNumber: 'NEFT202400666777',
      remarks: 'Partial payment towards overdue amount',
      receivedBy: 'Rajesh Kumar (Admin)',
      createdBy: adminId,
    },
    // Payment 15 - Another recent payment
    {
      paymentNumber: 'PAY-2024-000015',
      invoiceId: invoice1!.id,
      customerId: customer1!.id,
      paymentDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      amount: 15000.00,
      paymentMethod: PaymentMethod.CASH,
      referenceNumber: null,
      remarks: 'Additional cash payment',
      receivedBy: 'Rajesh Kumar (Admin)',
      createdBy: adminId,
    },
  ];

  for (const paymentData of paymentsData) {
    const { isCancelled, cancelledReason, ...paymentCreate } = paymentData;
    const payment = await prisma.payment.upsert({
      where: { paymentNumber: paymentCreate.paymentNumber },
      update: {},
      create: paymentCreate,
    });

    // Handle cancelled payment
    if (isCancelled) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          isCancelled: true,
          cancelledReason: cancelledReason,
        },
      });
    }
  }

  console.log('✅ Created payments:', paymentsData.length);

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