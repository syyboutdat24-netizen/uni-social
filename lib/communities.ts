// lib/communities.ts
// All public communities available to every student

export interface PublicCommunity {
  slug: string
  name: string
  emoji: string
  category: string
  description: string
}

export const PUBLIC_COMMUNITIES: PublicCommunity[] = [
  // Sports
  { slug: "football-soccer", name: "Football / Soccer", emoji: "⚽", category: "Sports", description: "For football and soccer fans at Sunway" },
  { slug: "basketball", name: "Basketball", emoji: "🏀", category: "Sports", description: "Basketball players and fans" },
  { slug: "badminton", name: "Badminton", emoji: "🏸", category: "Sports", description: "Badminton community" },
  { slug: "tennis", name: "Tennis", emoji: "🎾", category: "Sports", description: "Tennis players at Sunway" },
  { slug: "volleyball", name: "Volleyball", emoji: "🏐", category: "Sports", description: "Volleyball community" },
  { slug: "swimming", name: "Swimming", emoji: "🏊", category: "Sports", description: "Swimming enthusiasts" },
  { slug: "running-club", name: "Running Club", emoji: "🏃", category: "Sports", description: "Running and jogging community" },
  { slug: "gym-bodybuilding", name: "Gym & Bodybuilding", emoji: "💪", category: "Sports", description: "Fitness and bodybuilding" },
  { slug: "martial-arts", name: "Martial Arts", emoji: "🥋", category: "Sports", description: "Martial arts community" },
  { slug: "boxing", name: "Boxing", emoji: "🥊", category: "Sports", description: "Boxing enthusiasts" },
  { slug: "table-tennis", name: "Table Tennis", emoji: "🏓", category: "Sports", description: "Table tennis players" },
  { slug: "cycling", name: "Cycling", emoji: "🚴", category: "Sports", description: "Cycling community" },
  { slug: "hiking-outdoor", name: "Hiking & Outdoor", emoji: "🥾", category: "Sports", description: "Outdoor adventures and hiking" },
  { slug: "yoga-pilates", name: "Yoga & Pilates", emoji: "🧘", category: "Sports", description: "Yoga and pilates community" },
  { slug: "cricket", name: "Cricket", emoji: "🏏", category: "Sports", description: "Cricket players and fans" },
  { slug: "rugby", name: "Rugby", emoji: "🏉", category: "Sports", description: "Rugby community" },
  { slug: "esports", name: "E-Sports Teams", emoji: "🎮", category: "Sports", description: "Competitive gaming and e-sports" },

  // Country / Culture
  { slug: "japanese-students", name: "Japanese Students", emoji: "🇯🇵", category: "Country & Culture", description: "Community for Japanese students" },
  { slug: "korean-students", name: "Korean Students", emoji: "🇰🇷", category: "Country & Culture", description: "Community for Korean students" },
  { slug: "chinese-students", name: "Chinese Students", emoji: "🇨🇳", category: "Country & Culture", description: "Community for Chinese students" },
  { slug: "malaysian-students", name: "Malaysian Students", emoji: "🇲🇾", category: "Country & Culture", description: "Community for Malaysian students" },
  { slug: "indonesian-students", name: "Indonesian Students", emoji: "🇮🇩", category: "Country & Culture", description: "Community for Indonesian students" },
  { slug: "singaporean-students", name: "Singaporean Students", emoji: "🇸🇬", category: "Country & Culture", description: "Community for Singaporean students" },
  { slug: "indian-students", name: "Indian Students", emoji: "🇮🇳", category: "Country & Culture", description: "Community for Indian students" },
  { slug: "thai-students", name: "Thai Students", emoji: "🇹🇭", category: "Country & Culture", description: "Community for Thai students" },
  { slug: "vietnamese-students", name: "Vietnamese Students", emoji: "🇻🇳", category: "Country & Culture", description: "Community for Vietnamese students" },
  { slug: "middle-eastern-students", name: "Middle Eastern Students", emoji: "🌙", category: "Country & Culture", description: "Community for Middle Eastern students" },
  { slug: "european-students", name: "European Students", emoji: "🇪🇺", category: "Country & Culture", description: "Community for European students" },
  { slug: "african-students", name: "African Students", emoji: "🌍", category: "Country & Culture", description: "Community for African students" },
  { slug: "latin-american-students", name: "Latin American Students", emoji: "🌎", category: "Country & Culture", description: "Community for Latin American students" },
  { slug: "language-exchange", name: "Language Exchange", emoji: "💬", category: "Country & Culture", description: "Practice and learn languages" },
  { slug: "international-students", name: "International Students", emoji: "✈️", category: "Country & Culture", description: "All international students welcome" },

  // Hobbies
  { slug: "gaming", name: "Gaming", emoji: "🎮", category: "Hobbies & Passions", description: "Gaming community" },
  { slug: "anime-manga", name: "Anime & Manga", emoji: "🍜", category: "Hobbies & Passions", description: "Anime and manga fans" },
  { slug: "photography", name: "Photography", emoji: "📸", category: "Hobbies & Passions", description: "Photography enthusiasts" },
  { slug: "videography", name: "Videography", emoji: "🎬", category: "Hobbies & Passions", description: "Video creators" },
  { slug: "music-production", name: "Music Production", emoji: "🎧", category: "Hobbies & Passions", description: "Music producers and beatmakers" },
  { slug: "guitar-instruments", name: "Guitar / Instruments", emoji: "🎸", category: "Hobbies & Passions", description: "Musicians and instrument players" },
  { slug: "film-movies", name: "Film & Movies", emoji: "🎥", category: "Hobbies & Passions", description: "Film lovers and critics" },
  { slug: "reading-book-club", name: "Reading / Book Club", emoji: "📚", category: "Hobbies & Passions", description: "Book lovers and readers" },
  { slug: "writing-poetry", name: "Writing & Poetry", emoji: "✍️", category: "Hobbies & Passions", description: "Writers and poets" },
  { slug: "cooking", name: "Cooking", emoji: "🍳", category: "Hobbies & Passions", description: "Cooking enthusiasts" },
  { slug: "coffee-lovers", name: "Coffee Lovers", emoji: "☕", category: "Hobbies & Passions", description: "Coffee enthusiasts" },
  { slug: "cars-automotive", name: "Cars & Automotive", emoji: "🚗", category: "Hobbies & Passions", description: "Car enthusiasts" },
  { slug: "fashion-style", name: "Fashion & Style", emoji: "👗", category: "Hobbies & Passions", description: "Fashion and style community" },
  { slug: "art-drawing", name: "Art & Drawing", emoji: "🎨", category: "Hobbies & Passions", description: "Artists and illustrators" },
  { slug: "graphic-design", name: "Graphic Design", emoji: "🖥️", category: "Hobbies & Passions", description: "Graphic designers" },
  { slug: "skateboarding", name: "Skateboarding", emoji: "🛹", category: "Hobbies & Passions", description: "Skaters community" },
  { slug: "chess", name: "Chess", emoji: "♟️", category: "Hobbies & Passions", description: "Chess players" },

  // Career
  { slug: "startups-entrepreneurship", name: "Startups & Entrepreneurship", emoji: "🚀", category: "Career & Professional", description: "Entrepreneurs and startup founders" },
  { slug: "internship-opportunities", name: "Internship Opportunities", emoji: "💼", category: "Career & Professional", description: "Share and find internship opportunities" },
  { slug: "resume-cv-help", name: "Resume & CV Help", emoji: "📄", category: "Career & Professional", description: "Get help with your resume and CV" },
  { slug: "tech-networking", name: "Tech Networking", emoji: "🔗", category: "Career & Professional", description: "Network with tech professionals" },
  { slug: "finance-careers", name: "Finance Careers", emoji: "💰", category: "Career & Professional", description: "Finance and accounting careers" },
  { slug: "consulting-careers", name: "Consulting Careers", emoji: "📊", category: "Career & Professional", description: "Consulting industry discussions" },
  { slug: "investment-trading", name: "Investment & Trading", emoji: "📈", category: "Career & Professional", description: "Investing and trading community" },
  { slug: "marketing-careers", name: "Marketing Careers", emoji: "📣", category: "Career & Professional", description: "Marketing and advertising careers" },
  { slug: "freelancing", name: "Freelancing", emoji: "💻", category: "Career & Professional", description: "Freelancers and independent workers" },

  // Tech
  { slug: "programming", name: "Programming", emoji: "👨‍💻", category: "Tech", description: "Programmers and developers" },
  { slug: "cybersecurity", name: "Cybersecurity", emoji: "🔒", category: "Tech", description: "Cybersecurity enthusiasts" },
  { slug: "ethical-hacking", name: "Ethical Hacking", emoji: "🕵️", category: "Tech", description: "White hat hackers and pen testers" },
  { slug: "ai-machine-learning", name: "AI & Machine Learning", emoji: "🤖", category: "Tech", description: "AI and ML enthusiasts" },
  { slug: "web-development", name: "Web Development", emoji: "🌐", category: "Tech", description: "Web developers" },
  { slug: "app-development", name: "App Development", emoji: "📱", category: "Tech", description: "Mobile app developers" },
  { slug: "blockchain-crypto", name: "Blockchain / Crypto", emoji: "⛓️", category: "Tech", description: "Blockchain and crypto community" },
  { slug: "tech-startups", name: "Tech Startups", emoji: "💡", category: "Tech", description: "Tech startup founders and enthusiasts" },
]

export const PUBLIC_COMMUNITY_CATEGORIES = [
  "Sports",
  "Country & Culture",
  "Hobbies & Passions",
  "Career & Professional",
  "Tech",
]

export function getPublicCommunity(slug: string): PublicCommunity | undefined {
  return PUBLIC_COMMUNITIES.find(c => c.slug === slug)
}

export function isPublicCommunity(slug: string): boolean {
  return PUBLIC_COMMUNITIES.some(c => c.slug === slug)
}
