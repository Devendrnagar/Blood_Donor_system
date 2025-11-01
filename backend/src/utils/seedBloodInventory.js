import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BloodInventory from '../models/BloodInventory.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const locations = [
  {
    name: 'AIIMS Delhi',
    type: 'Hospital',
    address: {
      street: 'Ansari Nagar',
      city: 'New Delhi',
      state: 'Delhi',
      zipCode: '110029',
      country: 'India'
    },
    coordinates: {
      type: 'Point',
      coordinates: [77.2090, 28.5672] // [longitude, latitude]
    },
    phone: '+91-11-26588500',
    email: 'bloodbank@aiims.edu'
  },
  {
    name: 'Fortis Hospital Jaipur',
    type: 'Hospital',
    address: {
      street: 'Jawahar Lal Nehru Marg',
      city: 'Jaipur',
      state: 'Rajasthan',
      zipCode: '302017',
      country: 'India'
    },
    coordinates: {
      type: 'Point',
      coordinates: [75.7873, 26.9124]
    },
    phone: '+91-141-2547000',
    email: 'bloodbank@fortis.in'
  },
  {
    name: 'SMS Hospital Jaipur',
    type: 'Hospital',
    address: {
      street: 'JLN Marg',
      city: 'Jaipur',
      state: 'Rajasthan',
      zipCode: '302004',
      country: 'India'
    },
    coordinates: {
      type: 'Point',
      coordinates: [75.8067, 26.9196]
    },
    phone: '+91-141-2518121',
    email: 'bloodbank@sms.rajasthan.gov.in'
  },
  {
    name: 'Apollo Hospital Mumbai',
    type: 'Hospital',
    address: {
      street: 'Plot No 13, Parsik Hill Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400701',
      country: 'India'
    },
    coordinates: {
      type: 'Point',
      coordinates: [72.8777, 19.0760]
    },
    phone: '+91-22-30741000',
    email: 'bloodbank@apollo.com'
  },
  {
    name: 'Red Cross Blood Bank',
    type: 'Blood Bank',
    address: {
      street: '1, Red Cross Road',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
      country: 'India'
    },
    coordinates: {
      type: 'Point',
      coordinates: [77.5946, 12.9716]
    },
    phone: '+91-80-22942000',
    email: 'bloodbank@redcross.org.in'
  },
  {
    name: 'Mobile Blood Collection Unit - Delhi',
    type: 'Mobile Unit',
    address: {
      street: 'Various Locations',
      city: 'New Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India'
    },
    coordinates: {
      type: 'Point',
      coordinates: [77.2090, 28.6139]
    },
    phone: '+91-11-26588600',
    email: 'mobile@bloodbank.gov.in'
  }
];

const seedBloodInventory = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    // Clear existing inventory
    console.log('Clearing existing blood inventory...');
    await BloodInventory.deleteMany({});

    // Find an admin user to use as creator
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('Creating default admin user...');
      adminUser = await User.create({
        fullName: 'System Administrator',
        email: 'admin@bloodbank.com',
        password: 'admin123', // In production, this should be properly hashed
        phone: '+91-9999999999',
        role: 'admin',
        isVerified: true
      });
    }

    console.log('Seeding blood inventory data...');
    
    const inventoryData = [];
    
    // Create inventory entries for each location and blood type
    for (const location of locations) {
      for (const bloodType of bloodTypes) {
        // Randomize units available (0-50 units)
        const unitsAvailable = Math.floor(Math.random() * 51);
        const reserved = Math.floor(Math.random() * Math.min(5, unitsAvailable));
        const minimumThreshold = Math.floor(Math.random() * 10) + 3; // 3-12 units
        const maxCapacity = 100;
        
        // Random expiry date (1-45 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + Math.floor(Math.random() * 45) + 1);
        
        // Random collection date (1-30 days ago)
        const collectionDate = new Date();
        collectionDate.setDate(collectionDate.getDate() - Math.floor(Math.random() * 30) - 1);

        const inventoryEntry = {
          location: location,
          bloodType: bloodType,
          unitsAvailable: unitsAvailable,
          unitsReserved: reserved,
          minimumThreshold: minimumThreshold,
          maxCapacity: maxCapacity,
          expiryDate: expiryDate,
          collectionDate: collectionDate,
          qualityCheck: {
            tested: Math.random() > 0.1, // 90% chance of being tested
            testResults: {
              hiv: Math.random() > 0.02 ? 'Negative' : 'Pending', // 98% negative
              hepatitisB: Math.random() > 0.01 ? 'Negative' : 'Pending',
              hepatitisC: Math.random() > 0.01 ? 'Negative' : 'Pending',
              syphilis: Math.random() > 0.005 ? 'Negative' : 'Pending',
              malaria: Math.random() > 0.003 ? 'Negative' : 'Pending'
            },
            testDate: new Date(collectionDate.getTime() + 24 * 60 * 60 * 1000), // Next day
            technician: 'Lab Technician ' + Math.floor(Math.random() * 10 + 1)
          },
          storageConditions: {
            temperature: 2 + Math.random() * 4, // 2-6°C
            refrigeratorId: 'REF-' + Math.floor(Math.random() * 20 + 1),
            lastTemperatureCheck: new Date()
          },
          createdBy: adminUser._id,
          lastUpdatedBy: adminUser._id
        };

        inventoryData.push(inventoryEntry);
      }
    }

    // Insert all inventory data
    await BloodInventory.insertMany(inventoryData);

    console.log(`Successfully seeded ${inventoryData.length} blood inventory entries!`);
    console.log(`- ${locations.length} locations`);
    console.log(`- ${bloodTypes.length} blood types per location`);
    
    // Show summary statistics
    const summary = await BloodInventory.getInventorySummary();
    console.log('\nInventory Summary:');
    summary.forEach(item => {
      console.log(`${item.bloodType}: ${item.availableUnits} units available at ${item.locationCount} locations`);
    });

  } catch (error) {
    console.error('Error seeding blood inventory:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedBloodInventory();
}

export default seedBloodInventory;
