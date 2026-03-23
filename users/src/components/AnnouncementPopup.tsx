import { useState, useEffect } from "react";
import { getActiveAnnouncements } from "@/api/announcementsApi";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

interface Announcement {
  id: string;
  title: string;
  message: string;
  image: string;
  ctaLink: string;
}

export function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await getActiveAnnouncements();
        const announcements = res.data.data;
        
        if (announcements && announcements.length > 0) {
          // Check if user has already seen any of the announcements
          const seenAnnouncements = JSON.parse(localStorage.getItem("seen_announcements") || "[]");
          
          // Find first unseen announcement
          const unseen = announcements.find((a: Announcement) => !seenAnnouncements.includes(a.id));
          
          if (unseen) {
            setAnnouncement(unseen);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      }
    };

    fetchAnnouncements();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Mark as seen
    if (announcement) {
      const seenAnnouncements = JSON.parse(localStorage.getItem("seen_announcements") || "[]");
      if (!seenAnnouncements.includes(announcement.id)) {
        seenAnnouncements.push(announcement.id);
        localStorage.setItem("seen_announcements", JSON.stringify(seenAnnouncements));
      }
    }
  };

  const handleCtaClick = () => {
    handleClose();
  };

  if (!isOpen || !announcement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* Image */}
        {announcement.image && (
          <div className="w-full">
            <img 
              src={announcement.image} 
              alt={announcement.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-display font-bold mb-2">{announcement.title}</h2>
          <p className="text-sm text-muted-foreground mb-4">{announcement.message}</p>
          
          {announcement.ctaLink && (
            <Link
              to={announcement.ctaLink}
              onClick={handleCtaClick}
              className="block w-full gradient-primary text-primary-foreground text-center py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Learn More
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
