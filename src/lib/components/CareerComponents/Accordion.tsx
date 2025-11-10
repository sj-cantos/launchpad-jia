import { useState } from "react";

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  isOpen?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export default function Accordion({ items, allowMultiple = false, className = "" }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(
    items.filter(item => item.isOpen).map(item => item.id)
  );

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenItems(prev => 
        prev.includes(id) 
          ? prev.filter(itemId => itemId !== id)
          : [...prev, id]
      );
    } else {
      setOpenItems(prev => 
        prev.includes(id) ? [] : [id]
      );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }} className={className}>
      {items.map((item) => (
        <div key={item.id} className="layered-card-outer">
          <div className="layered-card-middle">
            <div 
              style={{ 
                display: "flex", 
                flexDirection: "row", 
                alignItems: "center", 
                justifyContent: "space-between",
                marginBottom: openItems.includes(item.id) ? 5 : 0,
                cursor: "pointer",
                padding: "10px"
              }}
              onClick={() => toggleItem(item.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <i 
                  className={`la la-angle-${openItems.includes(item.id) ? 'up' : 'down'}`} 
                  style={{ 
                    fontSize: 16, 
                    color: "#6B7280",
                    transition: "transform 0.2s ease"
                  }}
                />
                <span style={{ 
                  fontSize: 16, 
                  color: "#1F2937", 
                  fontWeight: 600,
                  lineHeight: "1.5"
                }}>
                  {item.title}
                </span>
              </div>
              
              <button
                style={{
                  background: "transparent",
                  color: "#6B7280",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#E5E7EB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <i className="la la-edit" style={{ fontSize: 18 }}></i>
              </button>
            </div>

            {openItems.includes(item.id) && (
              <div className="layered-card-content">
                {item.content}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}