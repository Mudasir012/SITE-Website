import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Automatically exposes every image inside public/Slideshow Images as virtual:slideshow-images.
function slideshowImagesPlugin() {
  const virtualId = 'virtual:slideshow-images';
  const resolvedId = '\0' + virtualId;
  const dir = path.resolve(process.cwd(), 'public', 'Slideshow Images');

  const getImages = () => {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((file) => /\.(png|jpe?g|webp|avif|gif)$/i.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((file) => encodeURI(`/Slideshow Images/${file}`));
  };

  return {
    name: 'slideshow-images-plugin',
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) {
        return `export default ${JSON.stringify(getImages())};`;
      }
    },
    configureServer(server) {
      server.watcher.add(dir);
      const reload = (filePath) => {
        if (filePath.startsWith(dir)) {
          const mod = server.moduleGraph.getModuleById(resolvedId);
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), slideshowImagesPlugin()],
    server: {
      // Local API requests go to the Express email backend.
      proxy: {
        '/api': {
          target: `http://localhost:${env.PORT || 3001}`,
          changeOrigin: true,
        },
      },
    },
    // Supabase config is injected at build time from server-side env vars.
    // These are public-by-design values (anon key, not service role); RLS is
    // the real access boundary.
    define: {
      __SUPABASE_URL__: JSON.stringify(env.SUPABASE_URL || ''),
      __SUPABASE_ANON_KEY__: JSON.stringify(env.SUPABASE_ANON_KEY || ''),
    },
    build: {
      target: 'es2019',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'motion-vendor': ['framer-motion'],
          },
        },
      },
    },
  };
});
