

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

export default function Modal({ title, onClose, children, wide = false }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-surface border border-border rounded ${wide ? 'max-w-3xl' : 'max-w-md'} w-full max-h-[80vh] overflow-auto glow-cyan-box relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <h3 className="font-pixel text-xs text-primary glow-cyan">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-danger transition-colors font-pixel text-xs">[X]</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
