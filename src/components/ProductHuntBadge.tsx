import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export const ProductHuntBadge = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show badge after a short delay so it doesn't distract from initial page load
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-6 right-6 z-[100] flex flex-col items-end"
        >
          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="mb-2 p-1.5 bg-white/90 hover:bg-white rounded-full text-stone-500 shadow-sm transition-colors border border-stone-200"
            aria-label="Close Product Hunt Badge"
          >
            <X className="w-4 h-4" />
          </button>
          
          {/* PH Embed Code (Slightly adjusted for floating widget sizing) */}
          <div
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              border: '1px solid rgb(224, 224, 224)',
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '340px',
              background: 'rgb(255, 255, 255)',
              boxShadow: 'rgba(0, 0, 0, 0.12) 0px 8px 32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <img
                alt="Harry The Blaze"
                src="https://ph-files.imgix.net/3e0364db-1857-47e8-b87b-b8006e87367a.svg?auto=compress,format&codec=mozjpeg&cs=strip&fit=crop&h=80&w=80"
                style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: '1 1 0%', minWidth: '0px' }}>
                <h3
                  style={{
                    margin: '0px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'rgb(26, 26, 26)',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Harry The Blaze
                </h3>
                <p
                  style={{
                    margin: '4px 0px 0px',
                    fontSize: '13px',
                    color: 'rgb(102, 102, 102)',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  Crack MNC cognitive games & book 1:1s with seniors.
                </p>
              </div>
            </div>
            <a
              href="https://www.producthunt.com/products/harry-the-blaze?embed=true&utm_source=embed&utm_medium=post_embed"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
                marginTop: '12px',
                padding: '8px 16px',
                background: 'rgb(255, 97, 84)',
                color: 'rgb(255, 255, 255)',
                textDecoration: 'none',
                borderRadius: '9999px',
                fontSize: '15px',
                fontWeight: 600,
                lineHeight: 1.5,
                transition: 'transform 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Support us on Product Hunt →
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
