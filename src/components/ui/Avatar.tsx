/* ─── Avatar de iniciais ────────────────────────────────────────
   Mesmo do orçamento: a cor sai do próprio nome, então cada
   pessoa tem sempre a mesma.
─────────────────────────────────────────────────────────────── */

const TONES = ['avatar-wish', 'avatar-sky', 'avatar-amber', 'avatar-rose', 'avatar-violet', 'avatar-emerald'];

export function getInitials(name: string | null | undefined): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toneFor(name: string | null | undefined): string {
  const text = String(name || '');
  let sum = 0;
  for (let i = 0; i < text.length; i += 1) sum += text.charCodeAt(i);
  return TONES[sum % TONES.length];
}

export function Avatar({ name, url, size = 36 }: { name: string | null | undefined; url?: string | null; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        aria-hidden="true"
        className="avatar avatar-img"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`avatar ${toneFor(name)}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {getInitials(name)}
    </span>
  );
}
