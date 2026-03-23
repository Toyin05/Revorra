import { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationPopup() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const shown = sessionStorage.getItem("revorra_popup_shown");
    if (!shown) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("revorra_popup_shown", "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          onClick={dismiss}
        >
          <div
            className="bg-card rounded-2xl shadow-elevated max-w-sm w-full p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center justify-center w-14 h-14 rounded-full gradient-primary mx-auto mb-4">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-display font-bold text-center">Start Earning Today!</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Complete tasks, play games, and invite friends to earn real rewards.
            </p>
            <button
              onClick={() => { dismiss(); navigate("/tasks"); }}
              className="w-full mt-5 gradient-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              View Today's Tasks
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
