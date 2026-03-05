import Link from "next/link";
import { Navbar, Footer } from "@/components";
import { 
  CategoryMenu, 
  ProductCard,
  ProductCatalog,
  HelpCenter,
  HomepageHeroSectionClient,
  HomepageBannersClient
} from "@/components/home";

interface ProductFromAPI {
  id: string;
  title: string;
  price: number;
  price_striked?: number | null;
  primary_image?: string;
  seller_name?: string;
  seller_username?: string;
  seller_role?: string;
  stock: number;
  condition: string;
  is_preorder?: boolean;
  preorder_days?: number;
  avg_rating?: number;
}

// Server-side data fetching
async function getHomepageData() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  
  try {
    const [bannersRes, announcementsRes, newProductsRes, ukmProductsRes] = await Promise.all([
      fetch(`${API_URL}/homepage/banners?active_only=true`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${API_URL}/homepage/announcements?active_only=true`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${API_URL}/products?limit=10&sort=newest`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${API_URL}/products?limit=12&seller_type=ukm`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      }),
    ]);

    const bannersData = bannersRes.ok ? await bannersRes.json() : { data: [] };
    const announcementsData = announcementsRes.ok ? await announcementsRes.json() : { data: [] };
    const newProductsData = newProductsRes.ok ? await newProductsRes.json() : { data: [] };
    const ukmProductsData = ukmProductsRes.ok ? await ukmProductsRes.json() : { data: [] };

    // Transform products to match ProductCard expectations
    const transformProduct = (p: ProductFromAPI) => ({
      id: p.id,
      title: p.title,
      price: Number(p.price),
      price_striked: p.price_striked != null ? Number(p.price_striked) : null,
      image: p.primary_image || '/images/placeholder-product.png',
      seller: p.seller_username || p.seller_name || 'Seller',
      condition: p.condition,
      seller_role: p.seller_role,
      is_ukm_official: p.seller_role === 'UKM_OFFICIAL',
      rating: Number(p.avg_rating) || 0,
      stock: p.stock,
      is_preorder: p.is_preorder,
      preorder_days: p.preorder_days,
    });

    return {
      banners: bannersData.data || [],
      announcements: announcementsData.data || [],
      newProducts: (newProductsData.data || []).map(transformProduct),
      ukmProducts: (ukmProductsData.data || []).map(transformProduct),
    };
  } catch (error) {
    console.error('Failed to fetch homepage data:', error);
    return {
      banners: [],
      announcements: [],
      newProducts: [],
      ukmProducts: [],
    };
  }
}

const recommendedProducts: any[] = [];

export default async function HomePage() {
	// Fetch data on server
	const { banners, announcements, newProducts, ukmProducts } = await getHomepageData();

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<Navbar />

			<main className="flex-grow">
				{/* Hero Section with Announcements and Carousel */}
				<HomepageHeroSectionClient banners={banners} announcements={announcements} />

				{/* Category Menu Section */}
				<section className="py-8 bg-white border-b border-gray-200">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<CategoryMenu />
					</div>
				</section>

				{/* New Products Section - Horizontal Scroll */}
				<section className="py-8 bg-white">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-gray-900">Baru Diposting</h2>
							<Link 
								href="/products?filter=new" 
								className="text-blue-400 hover:text-blue-500 font-medium text-sm flex items-center gap-1"
							>
								Lihat Semua
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</Link>
						</div>

						{newProducts.length > 0 ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
							{newProducts.map((product: any) => (
								<ProductCard key={product.id} product={product} />
							))}
							</div>
						) : (
							<div className="text-center py-16 bg-white rounded-2xl">
								<div className="text-6xl mb-4">📦</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Produk Baru</h3>
								<p className="text-gray-600">Produk baru akan ditampilkan di sini.</p>
							</div>
						)}
					</div>
				</section>

				{/* UKM Products Section */}
				<section className="py-8 bg-white">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-gray-900">Diposting UKM</h2>
							<Link 
								href="/products?seller=ukm" 
								className="text-blue-400 hover:text-blue-500 font-medium text-sm flex items-center gap-1"
							>
								Lihat Semua
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</Link>
						</div>
						{ukmProducts.length > 0 ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
								{ukmProducts.map((product: any) => (
									<ProductCard key={product.id} product={product} />
								))}
							</div>
						) : (
							<div className="text-center py-16 bg-gray-50 rounded-2xl">
								<div className="text-6xl mb-4">📦</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Produk UKM</h3>
								<p className="text-gray-600">Produk UKM akan ditampilkan di sini.</p>
							</div>
						)}
					</div>
				</section>

				{/* Promo Banners Section - Dynamic from Database */}
				<HomepageBannersClient banners={banners} />

				{/* Product Catalog Section with Tabs */}
				<section className="py-8 bg-white">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<ProductCatalog title="" products={recommendedProducts} showTabs={true} />
					</div>
				</section>

				{/* Help Center Section */}
				<section className="py-12 bg-gray-50">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<HelpCenter />
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
}
