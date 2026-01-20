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

// Server-side data fetching
async function getHomepageData() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  
  try {
    const [bannersRes, announcementsRes] = await Promise.all([
      fetch(`${API_URL}/homepage/banners?active_only=true`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${API_URL}/homepage/announcements?active_only=true`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      }),
    ]);

    const bannersData = bannersRes.ok ? await bannersRes.json() : { data: [] };
    const announcementsData = announcementsRes.ok ? await announcementsRes.json() : { data: [] };

    return {
      banners: bannersData.data || [],
      announcements: announcementsData.data || [],
    };
  } catch (error) {
    console.error('Failed to fetch homepage data:', error);
    return {
      banners: [],
      announcements: [],
    };
  }
}

// Dummy data for products - will be fetched from API later
const newProducts = [
  {
    id: "1",
    title: "Laptop ASUS ROG Strix G15",
    price: 15000000,
    image: "https://placehold.co/300x300/3b82f6/ffffff?text=Laptop",
    seller: "Tech Store STIKOM",
    rating: 4.8,
    sold: 15,
    location: "Yogyakarta",
  },
];

const ukmProducts = [
  {
    id: "2",
    title: "Kaos Angkatan 2025 STIKOM",
    price: 85000,
    image: "https://placehold.co/300x300/8b5cf6/ffffff?text=Kaos",
    seller: "UKM Merchandise",
    rating: 4.9,
    sold: 250,
    location: "Yogyakarta",
  },
];

const recommendedProducts: any[] = [];

export default async function HomePage() {
	// Fetch data on server
	const { banners, announcements } = await getHomepageData();

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
				<section className="py-8 bg-gray-50">
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
							<div className="overflow-x-auto pb-4 -mx-4 px-4">
								<div className="flex gap-4 min-w-max">
									{newProducts.map((product) => (
										<div key={product.id} className="w-52">
											<ProductCard product={product} />
										</div>
									))}
								</div>
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
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
								{ukmProducts.map((product) => (
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
