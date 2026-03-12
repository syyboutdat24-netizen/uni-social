// app/messages/[id]/layout.tsx
// Removes any parent layout padding/margin for the full-screen messages page
export default function MessageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0" style={{ zIndex: 50 }}>
      {children}
    </div>
  )
}
