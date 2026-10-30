import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const site = loadEnv(mode, process.cwd(), 'VITE_').VITE_GOATCOUNTER_SITE?.trim() ?? '';
  if (site && !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(site)) {
    throw new Error('VITE_GOATCOUNTER_SITE debe ser únicamente el código de GoatCounter, sin URL ni dominio.');
  }

  return {
    base: './',
    plugins: site ? [{
      name: 'goatcounter-csp',
      transformIndexHtml(html: string) {
        const origin = `https://${site}.goatcounter.com`;
        let updated = false;
        const result = html.replace(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>/i, tag =>
          tag.replace(/content="([^"]*)"/, (_attribute, policy: string) => {
            const additions: Record<string, string> = {
              'script-src': 'https://gc.zgo.at',
              'connect-src': origin,
              'img-src': origin,
            };
            const directives = policy.split(';').map(directive => {
              const parts = directive.trim().split(/\s+/);
              const source = additions[parts[0]];
              if (source && !parts.includes(source)) parts.push(source);
              return parts.join(' ');
            });
            updated = true;
            return `content="${directives.join('; ')}"`;
          }),
        );
        if (!updated) throw new Error('No se encontró la política CSP para configurar GoatCounter.');
        return result;
      },
    }] : [],
    build: {
      target: 'es2022',
      rollupOptions: { output: { manualChunks: { animation: ['gsap', 'gsap/ScrollTrigger'] } } },
    },
  };
});
