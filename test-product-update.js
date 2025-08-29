// Using built-in fetch (Node.js 18+)

// Test product update API
async function testProductUpdate() {
  try {
    // First, let's try to get a catalogue ID from the database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const catalogue = await prisma.catalogue.findFirst({
      include: {
        products: true
      }
    });
    
    if (!catalogue || catalogue.products.length === 0) {
      console.log('No catalogue or products found');
      return;
    }
    
    const product = catalogue.products[0];
    console.log('Testing update for product:', product.name);
    console.log('Product ID:', product.id);
    console.log('Catalogue ID:', catalogue.id);
    
    // Test data to update
    const updateData = {
      name: product.name + ' (Updated)',
      description: 'Updated description',
      price: 99.99,
      priceDisplay: 'show',
      isActive: true,
      imageUrl: 'https://example.com/image.jpg',
      tags: ['test', 'updated']
    };
    
    console.log('Update data:', updateData);
    
    // Make API call
    const response = await fetch(`http://localhost:3001/api/catalogues/${catalogue.id}/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Note: This won't work without proper authentication, but we can see the logs
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('Response status:', response.status);
    const responseData = await response.text();
    console.log('Response:', responseData);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test error:', error);
  }
}

testProductUpdate();