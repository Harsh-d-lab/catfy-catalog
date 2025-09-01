interface Product {
  name: string;
  tag?: 'Bestseller' | 'Trending' | 'Seasonal' | 'New';
}

export function smartSort(products: Product[]) {
  const priority: Record<string, number> = { Bestseller: 1, Trending: 2, Seasonal: 3, New: 4 };

  return products.sort((a, b) => {
    const priorityA = a.tag ? priority[a.tag] || 5 : 5;
    const priorityB = b.tag ? priority[b.tag] || 5 : 5;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return a.name.localeCompare(b.name);
  });
}
