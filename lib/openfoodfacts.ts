export interface OFFProduct {
  code: string;
  product: {
    product_name?: string;
    brands?: string;
    image_url?: string;
    categories?: string;
    nutriscore_grade?: string;
    ecoscore_grade?: string;
  };
  status: number;
}

export async function fetchProductByBarcode(barcode: string): Promise<OFFProduct | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: {
        'User-Agent': 'FrigoIntelligent/1.0',
      },
    });
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    if (data.status === 1) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Open Food Facts data:', error);
    return null;
  }
}
