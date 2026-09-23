/* ─── Marca ─────────────────────────────────────────────────────
   Porte do Logo do Sistema de Orçamentos. Tudo sai de
   public/logo-wishbone.webp, o lockup HORIZONTAL (1808x431):
   símbolo teal à esquerda, "wishbone" em cinza (#4D4C4F) e
   "CUSTOM CAPS" em teal embaixo da palavra.

   O cinza da palavra some em fundo escuro, então a imagem é
   desenhada em três camadas recortadas no CSS (.logo-layer-*):
   - símbolo e "CUSTOM CAPS": a própria imagem (teal serve nos
     dois temas);
   - palavra: a imagem vira MÁSCARA e a cor vem de currentColor
     (--logo-word: cinza da marca no claro, texto claro no escuro).

   `size` é a altura do lockup. `showName={false}` mostra só o
   símbolo (barra recolhida). `tone="light"` deixa a palavra
   branca fixa, para fundos sempre escuros (painel do login).
─────────────────────────────────────────────────────────────── */

const LOCKUP_RATIO = 1808 / 431;
const MARK_RATIO = 624 / 431;

interface LogoProps {
  size?: number;
  tone?: 'auto' | 'light';
  showName?: boolean;
}

export function Logo({ size = 30, tone = 'auto', showName = true }: LogoProps) {
  const width = size * (showName ? LOCKUP_RATIO : MARK_RATIO);
  const full = size * LOCKUP_RATIO;

  return (
    <span
      role="img"
      aria-label="Wishbone Custom Caps"
      className="logo-lockup"
      style={{ width, height: size }}
    >
      {/* As camadas têm sempre o tamanho do lockup inteiro;
          recolhido, o contêiner estreito corta o resto. */}
      <span aria-hidden="true" className="logo-layer logo-layer-mark" style={{ width: full }} />

      {showName && (
        <>
          <span
            aria-hidden="true"
            className={`logo-layer logo-layer-word${tone === 'light' ? ' tone-light' : ''}`}
            style={{ width: full }}
          />
          <span aria-hidden="true" className="logo-layer logo-layer-caps" style={{ width: full }} />
        </>
      )}
    </span>
  );
}
