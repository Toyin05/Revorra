import { Link } from "react-router-dom";

const posts = [
  { id: 1, title: "How to Maximize Your Earnings on Revorra", date: "Mar 5, 2026", excerpt: "Learn the best strategies to earn more rewards every day." },
  { id: 2, title: "Top 5 Tips for Successful Referrals", date: "Mar 3, 2026", excerpt: "Boost your referral income with these proven techniques." },
  { id: 3, title: "Introducing OneHub: Play & Earn", date: "Feb 28, 2026", excerpt: "Discover our new mini-game hub where fun meets earnings." },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="text-xl font-display font-bold text-gradient">Revorra</Link>
          <Link to="/login" className="px-4 py-2 text-sm font-medium gradient-primary text-primary-foreground rounded-xl cursor-pointer">Login</Link>
        </div>
      </header>
      <div className="container py-12 max-w-2xl">
        <h1 className="text-3xl font-display font-bold mb-8">Blog</h1>
        <div className="space-y-6">
          {posts.map(p => (
            <article key={p.id} className="border rounded-2xl p-5 shadow-card hover:shadow-elevated transition cursor-pointer">
              <p className="text-xs text-muted-foreground mb-2">{p.date}</p>
              <h2 className="font-display font-bold text-lg mb-2">{p.title}</h2>
              <p className="text-sm text-muted-foreground">{p.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
