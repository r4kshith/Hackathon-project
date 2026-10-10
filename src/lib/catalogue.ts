export const categorySeed = [
  { name: "Home & Living", prefix: "home", names: ["Linen Table Runner", "Stoneware Pour-Over Set", "Sunday Market Candle", "Woven Catchall Basket", "Soft Cotton Throw", "Ribbed Glass Vase", "Oak Serving Board", "Hand-turned Salt Cellar"], price: 38 },
  { name: "Apparel", prefix: "wear", names: ["Everyday Cotton Tee", "Weekend Linen Shirt", "Relaxed Canvas Tote", "Ribbed Lounge Socks", "Studio Crewneck", "Easy Drawstring Short", "Boxy Pocket Tank", "Classic Baseball Cap"], price: 32 },
  { name: "Beauty", prefix: "glow", names: ["Daily Dew Face Oil", "Cloud Cream Cleanser", "Rosewater Mist", "Soft Reset Balm", "Golden Hour Body Oil", "Calm Skin Mask", "Botanical Hand Cream", "Gentle Clay Polish"], price: 24 },
  { name: "Pantry", prefix: "taste", names: ["Small-batch Wildflower Honey", "Sunday Granola", "Citrus Olive Oil", "Dark Chocolate Sea Salt Bar", "Spiced Chai Blend", "Heritage Tomato Jam", "Smoky Chili Crisp", "Lemon Shortbread Tin"], price: 16 },
  { name: "Stationery", prefix: "paper", names: ["Daily Notes Journal", "Slow Morning Notepad", "Garden Day Planner", "Field Notes Set", "Celebration Card Bundle", "Softcover Recipe Book", "Pocket Sketch Pad", "Weekly Desk Calendar"], price: 18 },
  { name: "Plants & Garden", prefix: "grow", names: ["Golden Pothos Starter", "Terracotta Herb Pot", "Pocket Pruner", "Seed-to-Salad Kit", "Mossy Ceramic Planter", "Garden Twine Set", "Propagation Glass Trio", "Wildflower Seed Pack"], price: 22 },
  { name: "Jewelry", prefix: "shine", names: ["Tiny Sun Studs", "Everyday Gold Hoops", "Riverstone Pendant", "Dainty Chain Bracelet", "Pearl Drop Earrings", "Signet Ring in Brass", "Layering Chain Necklace", "Little Moon Charm"], price: 34 },
  { name: "Wellness", prefix: "rest", names: ["Evening Wind-down Tea", "Soft Stretch Band", "Sandalwood Bath Soak", "Breathwork Card Deck", "Rest Day Eye Pillow", "Calm Focus Roller", "Mindful Morning Journal", "Cedarwood Massage Bar"], price: 20 },
];

const photos = ["photo-1603006905003-be475563bc59", "photo-1490481651871-ab68de25d43d", "photo-1608248543803-ba4f8c70ae0b", "photo-1547592180-85f173990554", "photo-1455390582262-044cdead277a", "photo-1485955900006-10f4d324d411", "photo-1611652022419-a9419f74343d", "photo-1544367567-0f2fcb009e0b"];

export function productsForCategory(categoryIndex: number) {
  const category = categorySeed[categoryIndex];
  if (!category) return [];
  return category.names.map((name, index) => ({
    name,
    slug: `${category.prefix}-${index + 1}`,
    sku: `${category.prefix.toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
    description: `${name}, thoughtfully made in small batches with quality materials and the little details that make everyday rituals feel special.`,
    price: category.price + index * 3,
    compareAt: index === 2 || index === 5 ? category.price + index * 3 + 8 : null,
    stock: 6 + ((index * 7 + categoryIndex * 3) % 24),
    imageUrl: `https://images.unsplash.com/${photos[(index + categoryIndex) % photos.length]}?auto=format&fit=crop&w=900&q=85`,
  }));
}
