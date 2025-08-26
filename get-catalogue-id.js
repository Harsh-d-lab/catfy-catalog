const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getCatalogueId() {
  try {
    const catalogue = await prisma.catalogue.findFirst({
      where: {
        isPublic: true
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    })
    
    if (catalogue) {
      console.log('Catalogue found:')
      console.log('ID:', catalogue.id)
      console.log('Name:', catalogue.name)
      console.log('Slug:', catalogue.slug)
      console.log('Preview URL: http://localhost:3000/preview/' + catalogue.id)
    } else {
      console.log('No public catalogue found')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getCatalogueId()