"""Servidor de pruebas local: solo sirve public/, en un origen independiente."""
import argparse
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
metadata = json.loads((ROOT / 'recovery/production-manifest.json').read_text())


class StagingHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'text/javascript',
                      '.webmanifest': 'application/manifest+json'}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def send_head(self):
        path = Path(self.translate_path(self.path))
        if (not path.resolve().is_relative_to(PUBLIC.resolve())
                or any(part.startswith('.') for part in path.relative_to(PUBLIC).parts)):
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header('X-Senda-Environment', 'staging-local')
        self.send_header('X-Robots-Tag', 'noindex, nofollow, noarchive')
        self.send_header('Cache-Control', 'no-store')
        for key, value in metadata['response_headers'].items():
            if key.lower() not in ('etag', 'strict-transport-security'):
                self.send_header(key, value)
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4173)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), StagingHandler)
    print(f'Pruebas locales: http://127.0.0.1:{server.server_port}', flush=True)
    print('Datos separados del dominio de producción. Ctrl+C para terminar.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
