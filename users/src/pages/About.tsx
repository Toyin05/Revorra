import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="text-xl font-display font-bold text-gradient">Revorra</Link>
          <Link to="/login" className="px-4 py-2 text-sm font-medium gradient-primary text-primary-foreground rounded-xl cursor-pointer">Login</Link>
        </div>
      </header>
      <div className="container py-12 max-w-2xl">
        <h1 className="text-3xl font-display font-bold mb-6">About Revorra</h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>Revorra is a rewards platform where users earn real money by completing simple tasks, sharing sponsored content, playing mini games, and inviting friends.</p>
          <p>Our mission is to help people upgrade their lifestyle by turning everyday digital activities into income. Whether you're waiting for the bus, on a break, or relaxing at home — Revorra lets you earn on the go.</p>
          <p>We believe everyone deserves an opportunity to earn. That's why we've made Revorra free to join with an instant welcome bonus.</p>
        </div>
      </div>
    </div>
  );
}
