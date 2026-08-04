import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', env.BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@billflow.com' },
    update: {},
    create: {
      fullName: 'System Administrator',
      email: 'admin@billflow.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create default company settings
  const companySettings = await prisma.companySettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      companyName: 'BillFlow Manufacturing Pvt Ltd',
      gstNumber: '27AAAAA0000A1Z5',
      address: '123 Industrial Area, MIDC',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91-22-12345678',
      email: 'info@billflow.com',
      website: 'https://billflow.com',
      bankName: 'HDFC Bank',
      accountNumber: '12345678901234',
      ifscCode: 'HDFC0001234',
      branch: 'Mumbai Main',
      footerText: 'Thank you for your business!',
    },
  });

  console.log('✅ Created company settings:', companySettings.companyName);

  // Create sample products
  const products = [
    {
      name: 'Steel Pipe 2 inch',
      hsnCode: '7304',
      gstRate: 18.00,
      unit: 'MTR',
      sellingPrice: 250.00,
      stock: 1000,
      description: 'MS Steel Pipe 2 inch Schedule 40',
    },
    {
      name: 'PVC Pipe 1 inch',
      hsnCode: '3917',
      gstRate: 18.00,
      unit: 'MTR',
      sellingPrice: 85.00,
      stock: 500,
      description: 'PVC Pressure Pipe 1 inch',
    },
    {
      name: 'Cement Bag 50kg',
      hsnCode: '2523',
      gstRate: 28.00,
      unit: 'BAG',
      sellingPrice: 380.00,
      stock: 200,
      description: 'OPC 53 Grade Cement',
    },
    {
      name: 'TMT Bar 12mm',
      hsnCode: '7214',
      gstRate: 18.00,
      unit: 'KG',
      sellingPrice: 65.00,
      stock: 5000,
      description: 'Fe500 TMT Bar 12mm',
    },
    {
      name: 'Wall Paint 20L',
      hsnCode: '3209',
      gstRate: 18.00,
      unit: 'CAN',
      sellingPrice: 2800.00,
      stock: 50,
      description: 'Premium Emulsion Paint White 20L',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
  }

  console.log('✅ Created sample products:', products.length);

  // Create sample customers
  const customers = [
    {
      companyName: 'ABC Construction Ltd',
      gstNumber: '27ABCDE1234F1Z5',
      contactPerson: 'Rajesh Kumar',
      phone: '+91-9876543210',
      email: 'rajesh@abcconstruction.com',
      address: '456 Builder Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
    },
    {
      companyName: 'XYZ Infra Projects',
      gstNumber: '27XYZAB5678C1Z2',
      contactPerson: 'Priya Sharma',
      phone: '+91-9876543211',
      email: 'priya@xyzinfra.com',
      address: '789 Project Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
    },
    {
      companyName: 'Metro Builders',
      gstNumber: '27METRO9012D1Z8',
      contactPerson: 'Amit Patel',
      phone: '+91-9876543212',
      email: 'amit@metrobuilders.com',
      address: '321 Construction Ave',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422001',
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { companyName: customer.companyName },
      update: {},
      create: customer,
    });
  }

  console.log('✅ Created sample customers:', customers.length);

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